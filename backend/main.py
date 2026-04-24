import matplotlib
matplotlib.use("Agg")  # Prevent Tkinter-related thread issues
import matplotlib.pyplot as plt
import re
import pandas as pd
import os
import io
import base64
import math
import asyncio
import time
from datetime import datetime, timedelta
from fastapi import FastAPI, Query, HTTPException, Body, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.security import OAuth2PasswordBearer
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from src.trader import execute_trade, get_account_status
from src.stock_summary import get_stock_summary
from src.data_loader import load_data
from src.feature_engineering import add_technical_indicators
from src.preprocessing import scale_data, create_sequences
from src.model import load_model as _load_model
from src.signal_generator import generate_signal
from config import INTERVAL, PERIOD, TIME_STEP, MODEL_PATH, START_DATE, END_DATE, ALLOWED_ORIGINS
from contextlib import asynccontextmanager
from src.stock_stats import get_daily_return, calculate_var
from src.models import UserCreate, User, Transaction, LoginRequest
from bson import ObjectId
from src.mongo_crud import (
    create_user, record_transaction, get_user_transactions,
    get_user_by_email, authenticate_user,
    get_watchlist, add_to_watchlist, remove_from_watchlist,
)
from src.auth import hash_password, create_access_token, decode_access_token
from src.db import db

# ── Constants ──────────────────────────────────────────────────────────────────

TICKER_RE = re.compile(r'^[A-Z]{1,5}$')

TOP_TICKERS = [
    ("AAPL",  "Apple Inc."),
    ("MSFT",  "Microsoft Corp."),
    ("NVDA",  "NVIDIA Corp."),
    ("GOOGL", "Alphabet Inc."),
    ("AMZN",  "Amazon.com Inc."),
    ("META",  "Meta Platforms"),
    ("TSLA",  "Tesla Inc."),
    ("AVGO",  "Broadcom Inc."),
    ("LLY",   "Eli Lilly & Co."),
    ("JPM",   "JPMorgan Chase"),
    ("V",     "Visa Inc."),
    ("WMT",   "Walmart Inc."),
    ("XOM",   "ExxonMobil Corp."),
    ("MA",    "Mastercard Inc."),
    ("UNH",   "UnitedHealth Group"),
    ("COST",  "Costco Wholesale"),
    ("PG",    "Procter & Gamble"),
    ("HD",    "The Home Depot"),
    ("JNJ",   "Johnson & Johnson"),
    ("NFLX",  "Netflix Inc."),
]

_top_stocks_cache: dict = {}   # {"data": [...], "ts": float}
TOP_STOCKS_TTL = 300            # 5-minute server-side cache

# ── Rate limiter ───────────────────────────────────────────────────────────────

limiter = Limiter(key_func=get_remote_address)

# ── Auth helpers ───────────────────────────────────────────────────────────────

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

async def get_current_user(token: str = Depends(oauth2_scheme)) -> str:
    """Decode JWT and return the user's email. Raises 401 on failure."""
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token.")
    email: str = payload.get("sub")
    if not email:
        raise HTTPException(status_code=401, detail="Token payload missing subject.")
    return email

# ── App startup ────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.model = _load_model(MODEL_PATH)
    yield

app = FastAPI(
    title="Stock Trading Bot API",
    description="Predict stock prices and generate trading signals using an LSTM model.",
    version="1.0.0",
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Helpers ────────────────────────────────────────────────────────────────────

def fetch_data(ticker: str) -> pd.DataFrame:
    print(f"[INFO] Fetching data for {ticker}...")
    df = load_data(ticker, start=START_DATE, end=END_DATE, interval="5")
    df = df.copy()
    df.reset_index(inplace=True)
    os.makedirs("data", exist_ok=True)
    filepath = f"data/{ticker}_stock_data.csv"
    df.to_csv(filepath, index=False)
    print(f"[INFO] Saved data to {filepath}")
    return df


def preprocess_and_predict(ticker: str, model):
    df = fetch_data(ticker)

    if isinstance(df.columns, pd.MultiIndex):
        df.columns = ['_'.join(col).strip() for col in df.columns.values]

    if "Close" not in df.columns:
        raise KeyError("Expected 'Close' column not found in data.")

    df = df.rename(columns={"Close": f"close_{ticker.lower()}"})
    df = add_technical_indicators(df)

    scaler, scaled_df = scale_data(df, column_name=f"close_{ticker.lower()}")
    X, y_scaled = create_sequences(scaled_df[f"close_{ticker.lower()}"].values, time_step=TIME_STEP)

    predictions_scaled = model.predict(X)
    predictions_real = scaler.inverse_transform(predictions_scaled)
    y_real = scaler.inverse_transform(y_scaled.reshape(-1, 1))

    return y_real, predictions_real


def sanitize_json(obj):
    if isinstance(obj, float):
        if math.isnan(obj) or math.isinf(obj):
            return None
        return obj
    elif isinstance(obj, dict):
        return {k: sanitize_json(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [sanitize_json(i) for i in obj]
    else:
        return obj

# ── Public endpoints ───────────────────────────────────────────────────────────

@app.get("/predict")
@limiter.limit("10/minute")
async def predict_with_plot(
    request: Request,
    ticker: str = Query(..., description="Stock ticker symbol (e.g., AAPL, GOOG)"),
    confidence_level: float = Query(0.95, description="Confidence level for VaR calculation"),
):
    ticker = ticker.strip().upper()
    if not TICKER_RE.match(ticker):
        raise HTTPException(status_code=400, detail="Invalid ticker symbol. Use 1-5 uppercase letters (e.g. AAPL).")
    y_real, predictions_real = preprocess_and_predict(ticker, request.app.state.model)

    last_prediction = float(predictions_real[-1][0])
    last_actual = float(y_real[-1][0])
    signal = generate_signal(last_prediction, last_actual)

    plt.figure(figsize=(10, 5))
    plt.plot(y_real, label="Actual")
    plt.plot(predictions_real, label="Predicted")
    plt.legend()
    plt.title(f"{ticker.upper()} - Predicted vs Actual")
    plt.grid(True)

    buf = io.BytesIO()
    plt.savefig(buf, format='png')
    plt.close()
    buf.seek(0)
    img_base64 = base64.b64encode(buf.read()).decode('utf-8')

    try:
        var = calculate_var(ticker, START_DATE, END_DATE, confidence_level)
    except Exception:
        var = None

    return sanitize_json({
        "ticker": ticker.upper(),
        "current_price": last_actual,
        "predicted_price": last_prediction,
        "signal": signal,
        "plot_base64": img_base64,
        "VaR_95_percent": var,
    })


@app.get("/stock-summary")
def stock_summary(limit: int = 100):
    return get_stock_summary(limit)


@app.get("/stock-stats")
def stock_stats(
    ticker: str = Query(..., description="Stock ticker symbol"),
    start: str = Query(..., description="Start date in YYYY-MM-DD format"),
    end: str = Query(..., description="End date in YYYY-MM-DD format"),
):
    try:
        df = get_daily_return(ticker, start, end)
        return {
            "ticker": ticker.upper(),
            "daily_returns": df['Daily Return'].tolist(),
            "dates": df.index.strftime('%Y-%m-%d').tolist(),
        }
    except Exception as e:
        return {"error": str(e)}


@app.get("/account-status")
def check_account():
    return get_account_status()


@app.get("/price/{ticker}")
@limiter.limit("30/minute")
async def get_live_price(request: Request, ticker: str):
    ticker = ticker.strip().upper()
    if not TICKER_RE.match(ticker):
        raise HTTPException(status_code=400, detail="Invalid ticker symbol.")

    import requests as req
    from config import POLYGON_API_KEY

    price = None
    change = 0.0
    change_pct = 0.0
    volume = 0

    # ── Stage 1: real-time snapshot (15-min delayed on free plan) ─────────────
    try:
        snap_url = f"https://api.polygon.io/v2/snapshot/locale/us/markets/stocks/tickers/{ticker}"
        snap_res = req.get(snap_url, params={"apiKey": POLYGON_API_KEY}, timeout=5)
        if snap_res.ok:
            ticker_data = snap_res.json().get("ticker", {})
            day      = ticker_data.get("day", {})
            prev_day = ticker_data.get("prevDay", {})
            last_trade = ticker_data.get("lastTrade", {})
            price  = last_trade.get("p") or day.get("c") or prev_day.get("c")
            volume = day.get("v", 0)
            if prev_day.get("c") and price:
                prev_close = prev_day["c"]
                cur_close  = day.get("c") or price
                change     = cur_close - prev_close
                change_pct = (change / prev_close) * 100
        else:
            print(f"[WARN] Snapshot {ticker} HTTP {snap_res.status_code}: {snap_res.text[:120]}")
    except Exception as snap_err:
        print(f"[WARN] Snapshot failed for {ticker}: {snap_err}")

    # ── Stage 2: previous-day close fallback ──────────────────────────────────
    if price is None:
        try:
            prev_url = f"https://api.polygon.io/v2/aggs/ticker/{ticker}/prev"
            prev_res = req.get(prev_url, params={"adjusted": "true", "apiKey": POLYGON_API_KEY}, timeout=5)
            if prev_res.ok:
                results = prev_res.json().get("results", [])
                if results:
                    bar    = results[0]
                    price  = bar.get("c")
                    volume = int(bar.get("v", 0))
            else:
                print(f"[WARN] Prev-day {ticker} HTTP {prev_res.status_code}: {prev_res.text[:120]}")
        except Exception as prev_err:
            print(f"[WARN] Prev-day fallback failed for {ticker}: {prev_err}")

    if price is None:
        raise HTTPException(status_code=503, detail=f"Price data temporarily unavailable for {ticker}.")

    return {
        "ticker": ticker,
        "price": round(price, 2),
        "change": round(change, 2),
        "change_pct": round(change_pct, 2),
        "volume": volume,
    }

# ── Market overview ────────────────────────────────────────────────────────────

def _last_trading_day() -> str:
    """Return the most recent completed trading weekday as YYYY-MM-DD."""
    d = datetime.today() - timedelta(days=1)
    while d.weekday() >= 5:   # skip Saturday (5) and Sunday (6)
        d -= timedelta(days=1)
    return d.strftime("%Y-%m-%d")


@app.get("/market/top")
async def get_top_stocks():
    """Prev-day OHLCV for the top 20 US stocks — single grouped API call, cached 5 min."""
    import requests as req
    from config import POLYGON_API_KEY

    if _top_stocks_cache.get("data") and (time.time() - _top_stocks_cache.get("ts", 0)) < TOP_STOCKS_TTL:
        return {"status": "success", "data": _top_stocks_cache["data"], "cached": True}

    ticker_set  = {t for t, _ in TOP_TICKERS}
    bars_by_ticker: dict = {}

    # Try up to 5 days back to skip market holidays
    for days_back in range(1, 6):
        d = datetime.today() - timedelta(days=days_back)
        if d.weekday() >= 5:
            continue
        date_str = d.strftime("%Y-%m-%d")
        try:
            r = req.get(
                f"https://api.polygon.io/v2/aggs/grouped/locale/us/market/stocks/{date_str}",
                params={"adjusted": "true", "apiKey": POLYGON_API_KEY},
                timeout=15,
            )
            if r.ok:
                raw = r.json().get("results", [])
                bars_by_ticker = {b["T"]: b for b in raw if b["T"] in ticker_set}
                if bars_by_ticker:
                    print(f"[INFO] market/top: loaded {len(bars_by_ticker)} tickers from {date_str}")
                    break
                print(f"[WARN] market/top grouped {date_str}: no matching tickers, trying earlier date")
            else:
                print(f"[WARN] market/top grouped HTTP {r.status_code}: {r.text[:120]}")
                break   # 403 / 401 won't improve with a different date
        except Exception as e:
            print(f"[WARN] market/top grouped: {e}")
            break

    results = []
    for ticker, name in TOP_TICKERS:
        bar = bars_by_ticker.get(ticker)
        if bar:
            close = bar.get("c") or 0
            open_ = bar.get("o") or close
            chg   = round(((close - open_) / open_ * 100) if open_ else 0, 2)
            results.append({
                "ticker":     ticker,
                "name":       name,
                "price":      round(close, 2),
                "change_pct": chg,
                "high":       round(bar.get("h") or 0, 2),
                "low":        round(bar.get("l") or 0, 2),
                "volume":     int(bar.get("v") or 0),
            })
        else:
            results.append({"ticker": ticker, "name": name, "price": None,
                            "change_pct": 0, "high": None, "low": None, "volume": 0})

    _top_stocks_cache["data"] = results
    _top_stocks_cache["ts"]   = time.time()
    return {"status": "success", "data": results, "cached": False}

# ── Auth endpoints ─────────────────────────────────────────────────────────────

@app.post("/register")
async def register(user: UserCreate):
    existing_user = await get_user_by_email(user.email)
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered.")

    hashed_pw = hash_password(user.password)
    user_data = {
        "username": user.username,
        "email": user.email,
        "password": hashed_pw,
        "full_name": user.full_name,
    }
    await db.users.insert_one(user_data)
    return {"message": "User registered successfully."}


@app.post("/login")
async def login(credentials: LoginRequest):
    user = await authenticate_user(credentials.email, credentials.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    token = create_access_token({"sub": user["email"]})
    user["_id"] = str(user["_id"])
    return {"message": "Login successful", "user": user, "token": token}

# ── Protected endpoints (require valid JWT) ────────────────────────────────────

@app.post("/execute-trade")
@limiter.limit("5/minute")
async def execute_trade_endpoint(
    request: Request,
    signal: str = Query(..., description="Trade action signal, e.g., Buy or Sell"),
    ticker: str = Query(..., description="Stock ticker symbol, e.g., AAPL"),
    current_user: str = Depends(get_current_user),
):
    ticker = ticker.strip().upper()
    if not TICKER_RE.match(ticker):
        raise HTTPException(status_code=400, detail="Invalid ticker symbol.")
    if signal not in ("Buy", "Sell", "Hold"):
        raise HTTPException(status_code=400, detail="Signal must be Buy, Sell, or Hold.")
    try:
        trade_result = execute_trade(signal, ticker)
        print(f"[ALPACA] {current_user} executing {signal} for {ticker}")
        return {
            "message": f"Trade {signal} executed for {ticker}",
            "trade_result": trade_result,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Trade execution failed: {str(e)}")


@app.post("/record-transaction")
async def record_transaction_endpoint(
    trade_response: dict = Body(...),
    current_user: str = Depends(get_current_user),
):
    try:
        trade_result = trade_response.get("trade_result", trade_response)
        transaction = Transaction(
            user_email=current_user,
            action=trade_result.get("action"),
            ticker=trade_result.get("ticker"),
            quantity=trade_result.get("qty"),
            status=trade_result.get("status"),
            message=trade_result.get("message"),
            order_id=trade_result.get("order_id"),
        )
        result = await record_transaction(transaction)
        return {"message": "Transaction recorded successfully", "transaction_id": str(result.inserted_id)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to record transaction: {str(e)}")


@app.get("/transactions")
async def get_transactions(current_user: str = Depends(get_current_user)):
    try:
        transactions = await get_user_transactions(current_user)
        for tx in transactions:
            tx["_id"] = str(tx["_id"])
            if "time" in tx:
                tx["time"] = tx["time"].isoformat()
            if "executed_at" in tx:
                tx["executed_at"] = tx["executed_at"].isoformat()
        return {"status": "success", "data": transactions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch transactions: {str(e)}")


@app.get("/watchlist")
async def fetch_watchlist(current_user: str = Depends(get_current_user)):
    items = await get_watchlist(current_user)
    return {"status": "success", "data": items}


@app.post("/watchlist/{ticker}")
async def add_ticker_to_watchlist(
    ticker: str,
    current_user: str = Depends(get_current_user),
):
    ticker = ticker.strip().upper()
    if not TICKER_RE.match(ticker):
        raise HTTPException(status_code=400, detail="Invalid ticker symbol.")
    added = await add_to_watchlist(ticker, current_user)
    if not added:
        raise HTTPException(status_code=409, detail=f"{ticker} is already in your watchlist.")
    return {"message": f"{ticker} added to watchlist."}


@app.delete("/watchlist/{ticker}")
async def remove_ticker_from_watchlist(
    ticker: str,
    current_user: str = Depends(get_current_user),
):
    ticker = ticker.strip().upper()
    removed = await remove_from_watchlist(ticker, current_user)
    if not removed:
        raise HTTPException(status_code=404, detail=f"{ticker} not found in watchlist.")
    return {"message": f"{ticker} removed from watchlist."}
