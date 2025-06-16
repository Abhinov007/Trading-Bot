import matplotlib
matplotlib.use("Agg")  # Prevent Tkinter-related thread issues
import matplotlib.pyplot as plt
from fastapi import FastAPI, Query,HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import os
import io
import base64
import math
from src.trader import execute_trade
from src.stock_summary import get_stock_summary
from src.data_loader import load_data
from src.feature_engineering import add_technical_indicators
from src.preprocessing import scale_data, create_sequences
from src.model import load_model
from src.signal_generator import generate_signal
from config import INTERVAL, PERIOD, TIME_STEP, MODEL_PATH, START_DATE, END_DATE
from src.stock_stats import get_daily_return, calculate_var
from src.trader import get_account_status
from src.models import User, Transaction
from src.models import UserCreate, User  # make sure UserCreate is imported
from bson import ObjectId
from src.mongo_crud import create_user
from fastapi import FastAPI, Body
from fastapi import APIRouter, HTTPException
from src.models import Transaction
from fastapi import Request
from src.mongo_crud import record_transaction
from fastapi.responses import JSONResponse
from src.mongo_crud import get_all_transactions,get_user_by_email
from src.auth import hash_password
from src.db import db
from src.models import LoginRequest
from src.mongo_crud import authenticate_user
from bson import ObjectId

app = FastAPI(
    title="Stock Trading Bot API",
    description="Predict stock prices and generate trading signals using an LSTM model.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ 1. Fetch data from source
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

# ✅ 2. Preprocess + Predict using the LSTM model
def preprocess_and_predict(ticker: str):
    df = fetch_data(ticker)

    if isinstance(df.columns, pd.MultiIndex):
        print("[INFO] MultiIndex detected. Flattening columns...")
        df.columns = ['_'.join(col).strip() for col in df.columns.values]

    if "Close" not in df.columns:
        raise KeyError("Expected 'Close' column not found in data.")

    # Add indicators
    df = df.rename(columns={"Close": f"close_{ticker.lower()}"})  # Required for feature_engineering
    df = add_technical_indicators(df)

    # Scale data
    scaler, scaled_df = scale_data(df, column_name=f"close_{ticker.lower()}")

    # Create sequences for LSTM
    X, y_scaled = create_sequences(scaled_df[f"close_{ticker.lower()}"].values, time_step=TIME_STEP)

    # Load model & predict
    model = load_model(MODEL_PATH)
    predictions_scaled = model.predict(X)

    # Inverse scale the predictions and actuals
    predictions_real = scaler.inverse_transform(predictions_scaled)
    y_real = scaler.inverse_transform(y_scaled.reshape(-1, 1))

    return y_real, predictions_real

# ✅ 3. Sanitize JSON to avoid NaN or Inf issues
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

# ✅ 4. Prediction Endpoint


@app.get("/predict")
async def predict_with_plot(
    ticker: str = Query(..., description="Stock ticker symbol (e.g., AAPL, GOOG)"),
    confidence_level: float = Query(0.95, description="Confidence level for VaR calculation")
):
    y_real, predictions_real = preprocess_and_predict(ticker)

    last_prediction = float(predictions_real[-1][0])
    last_actual = float(y_real[-1][0])
    signal = generate_signal(last_prediction, last_actual)

    # Plot actual vs predicted
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


    # Calculate VaR
    try:
        var = calculate_var(ticker, START_DATE, END_DATE, confidence_level)
    except Exception as e:
        var = None

    return sanitize_json({
        "ticker": ticker.upper(),
        "current_price": last_actual,
        "predicted_price": last_prediction,
        "signal": signal,
        "plot_base64": img_base64,
        "VaR_95_percent": var
    })


# ✅ 5. Stock Summary Endpoint
@app.get("/stock-summary")
def stock_summary(limit: int = 100):
    return get_stock_summary(limit)

# ✅ 6. Stock Stats (daily returns) Endpoint
@app.get("/stock-stats")
def stock_stats(
    ticker: str = Query(..., description="Stock ticker symbol"),
    start: str = Query(..., description="Start date in YYYY-MM-DD format"),
    end: str = Query(..., description="End date in YYYY-MM-DD format")
):
    try:
        df = get_daily_return(ticker, start, end)
        return {
            "ticker": ticker.upper(),
            "daily_returns": df['Daily Return'].tolist(),
            "dates": df.index.strftime('%Y-%m-%d').tolist()
        }
    except Exception as e:
        return {"error": str(e)}

@app.get("/account-status")
def check_account():
    return get_account_status()

@app.post("/execute-trade")
async def execute_trade_endpoint(
    signal: str = Query(..., description="Trade action signal, e.g., Buy or Sell"),
    ticker: str = Query(..., description="Stock ticker symbol, e.g., AAPL")
):
    try:
        trade_result = execute_trade(signal, ticker.upper())
        print(f"[ALPACA] Executing {signal} for {ticker.upper()}")
        print(f"Trade result: {trade_result}")
        return {
            "message": f"Trade {signal} executed for {ticker.upper()}",
            "trade_result": trade_result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Trade execution failed: {str(e)}")
    
@app.post("/record-transaction")
async def record_transaction_endpoint(trade_response: dict = Body(...)):
    try:
        trade_result = trade_response.get("trade_result", trade_response)  # support direct trade_result or wrapped in "trade_result"
        
        transaction = Transaction(
            action=trade_result.get("action"),
            ticker=trade_result.get("ticker"),
            quantity=trade_result.get("qty"),
            status=trade_result.get("status"),
            message=trade_result.get("message"),
            order_id=trade_result.get("order_id")
        )

        result = await record_transaction(transaction)
        return {"message": "Transaction recorded successfully", "transaction_id": str(result.inserted_id)}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to record transaction: {str(e)}")
    


from src.mongo_crud import get_all_transactions

@app.get("/transactions")
async def get_transactions():
    try:
        transactions = await get_all_transactions()
        for tx in transactions:
            tx["_id"] = str(tx["_id"])
            if "time" in tx:
                tx["time"] = tx["time"].isoformat()
        return {"status": "success", "data": transactions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch transactions: {str(e)}")

@app.post("/register")
async def register(user: UserCreate):
    # Check if email already exists
    existing_user = await get_user_by_email(user.email)
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Hash the password
    hashed_pw = hash_password(user.password)

    # Prepare user data to insert into DB
    user_data = {
        "username": user.username,
        "email": user.email,
        "password": hashed_pw,
        "full_name": user.full_name,
    }

    await db.users.insert_one(user_data)
    return {"message": "User registered successfully"}

@app.post("/login")
async def login(credentials: LoginRequest):
    user = await authenticate_user(credentials.email, credentials.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    # Convert ObjectId to string
    user["_id"] = str(user["_id"])
    return {"message": "Login successful", "user": user}