import matplotlib
matplotlib.use("Agg")  # Prevent Tkinter-related thread issues
import matplotlib.pyplot as plt
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import os
import io
import base64
import matplotlib.pyplot as plt
from src.trader import execute_trade
from src.stock_summary import get_stock_summary
import yfinance as yf
from src.feature_engineering import add_technical_indicators
from src.preprocessing import scale_data, create_sequences
from src.model import load_model
from src.signal_generator import generate_signal
from config import INTERVAL, PERIOD, TIME_STEP, MODEL_PATH, START_DATE, END_DATE
from src.stock_stats import get_daily_return, calculate_var

app = FastAPI(
    title="Stock Trading Bot API",
    description="Predict stock prices and generate trading signals using an LSTM model.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific frontend origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def fetch_data(ticker: str) -> pd.DataFrame:
    print(f"[INFO] Fetching data for {ticker}...")
    data = yf.download(ticker, start=START_DATE, end=END_DATE)
    os.makedirs("data", exist_ok=True)
    filepath = f"data/{ticker}_stock_data.csv"
    data.to_csv(filepath)
    print(f"[INFO] Saved data to {filepath}")
    return data

def preprocess_and_predict(ticker: str):
    ticker_lower = ticker.lower()
    df = fetch_data(ticker)

    if isinstance(df.columns, pd.MultiIndex):
        print("[INFO] MultiIndex detected. Flattening columns...")
        df.columns = ['_'.join(col).strip() for col in df.columns.values]

    close_candidates = [col for col in df.columns if "close" in col.lower() and ticker_lower in col.lower()]
    if close_candidates:
        df = df.rename(columns={close_candidates[0]: f"close_{ticker_lower}"})
    elif "Close" in df.columns:
        df = df.rename(columns={"Close": f"close_{ticker_lower}"})
    elif "close" in df.columns:
        df = df.rename(columns={"close": f"close_{ticker_lower}"})
    else:
        raise KeyError("No appropriate 'Close' column found in the data.")

    df = add_technical_indicators(df)
    scaler, scaled_df = scale_data(df)

    column_name = f"close_{ticker_lower}"
    X, y = create_sequences(scaled_df[column_name].values, time_step=TIME_STEP)

    model = load_model(MODEL_PATH)
    predictions = model.predict(X)

    return y, predictions

@app.get("/stock-summary")
def stock_summary(limit: int = 100):
    return get_stock_summary(limit)

@app.get("/predict")
def predict_with_plot(
    ticker: str = Query(..., description="Stock ticker symbol (e.g., AAPL, GOOG)"),
    confidence_level: float = Query(0.95, description="Confidence level for VaR calculation")
):
    y, predictions = preprocess_and_predict(ticker)

    last_prediction = float(predictions[-1][0])
    last_actual = float(y[-1])
    signal = generate_signal(last_prediction, last_actual)

    # Plotting
    plt.figure(figsize=(10, 5))
    plt.plot(y, label="Actual")
    plt.plot(predictions, label="Predicted")
    plt.legend()
    plt.title(f"{ticker.upper()} - Predicted vs Actual")
    plt.grid(True)

    # Save plot to bytes buffer
    buf = io.BytesIO()
    plt.savefig(buf, format='png')
    plt.close()
    buf.seek(0)
    img_base64 = base64.b64encode(buf.read()).decode('utf-8')

    # Execute trade
    trade_result = execute_trade(signal, ticker.upper())

    # Calculate VaR
    try:
        var = calculate_var(ticker, START_DATE, END_DATE, confidence_level)
    except Exception as e:
        var = None

    return {
        "ticker": ticker.upper(),
        "current_price": last_actual,
        "predicted_price": last_prediction,
        "signal": signal,
        "trade_result": trade_result,
        "plot_base64": img_base64,
        "VaR_95_percent": var
    }

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
