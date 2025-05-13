import argparse
import pandas as pd
import os
import yfinance as yf
from src.feature_engineering import add_technical_indicators
from src.preprocessing import scale_data, create_sequences
from src.model import load_model
import matplotlib.pyplot as plt
from src.signal_generator import generate_signal
from config import TICKER, INTERVAL, PERIOD, TIME_STEP, MODEL_PATH, START_DATE, END_DATE

def fetch_data(ticker):
    """
    Fetch stock data from Yahoo Finance.
    """
    print(f"[INFO] Fetching data for {ticker}...")
    # Download data from start date to end date
    data = yf.download(ticker, start=START_DATE, end=END_DATE)
    # Save the data to CSV (ensure 'data' directory exists)
    os.makedirs("data", exist_ok=True)
    filepath = f"data/{ticker}_stock_data.csv"
    data.to_csv(filepath)
    print(f"[INFO] Saved data to {filepath}")
    return data

def plot_predictions(y_true, y_pred, title="Predicted vs Actual"):
    """
    Plots actual vs predicted values.
    """
    plt.figure(figsize=(12, 6))
    plt.plot(y_true, label='Actual')
    plt.plot(y_pred, label='Predicted')
    plt.title(title)
    plt.xlabel("Time")
    plt.ylabel("Scaled Price")
    plt.legend()
    plt.grid(True)
    plt.tight_layout()
    plt.show()

def main():
    # Parse ticker symbol from command line
    parser = argparse.ArgumentParser(description='Stock Price Prediction')
    parser.add_argument('--ticker', type=str, required=True, help='Stock ticker symbol (e.g., AAPL, GOOG)')
    args = parser.parse_args()

    ticker = args.ticker
    ticker_lower = ticker.lower()

    # Fetch the data
    df = fetch_data(ticker)

    # Flatten MultiIndex columns if needed
    if isinstance(df.columns, pd.MultiIndex):
        print("[INFO] MultiIndex detected. Flattening columns...")
        df.columns = ['_'.join(col).strip() for col in df.columns.values]

    print(f"[INFO] Loaded data: {df.shape}")

    # Dynamically identify and rename the 'Close' column
    close_candidates = [col for col in df.columns if "close" in col.lower() and ticker_lower in col.lower()]
    if close_candidates:
        original_close_col = close_candidates[0]
        df = df.rename(columns={original_close_col: f"close_{ticker_lower}"})
    elif "Close" in df.columns:
        df = df.rename(columns={"Close": f"close_{ticker_lower}"})
    elif "close" in df.columns:
        df = df.rename(columns={"close": f"close_{ticker_lower}"})
    else:
        raise KeyError("No appropriate 'Close' column found in the data.")

    print(f"[INFO] Columns after renaming: {df.columns}")

    # Add technical indicators
    df = add_technical_indicators(df)
    print(f"[INFO] Added technical indicators: {df.columns}")

    # Scale the data
    scaler, scaled_df = scale_data(df)
    print(f"[INFO] Scaled data: {scaled_df.shape}")

    # Create sequences
    column_name = f"close_{ticker_lower}"
    X, y = create_sequences(scaled_df[column_name].values, time_step=TIME_STEP)
    print(f"[INFO] Sequences created: X shape = {X.shape}, y shape = {y.shape}")

    # Load model and predict
    model = load_model(MODEL_PATH)
    predictions = model.predict(X)
    print("[INFO] Predictions made.")

    signal = generate_signal(predictions[-1][0], y[-1])
    print(f"[INFO] Generated trading signal: {signal}")
    # Plot predictions
    plot_predictions(y, predictions, title=f"Predicted vs Actual for {ticker}")


if __name__ == '__main__':
    main()
