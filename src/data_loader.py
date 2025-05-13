# src/data_loader.py

import yfinance as yf
import pandas as pd
import os

def load_data(ticker="AAPL", interval="5m", period="5d", save_csv=True):
    """
    Fetch historical stock data using yfinance.
    Optionally save to CSV.
    """
    print(f"[INFO] Fetching data for {ticker}...")
    df = yf.download(ticker, interval=interval, period=period)
    df = df[['Close']]  # Use only Close prices
    df.dropna(inplace=True)
    df.reset_index(inplace=True)

    if save_csv:
        # Ensure the data directory exists
        data_dir = "data"
        os.makedirs(data_dir, exist_ok=True)

        filepath = os.path.join(data_dir, "stock_data.csv")
        df.to_csv(filepath, index=False)

        print(f"[INFO] Saved data to {filepath}")
        print(f"[DEBUG] Absolute path: {os.path.abspath(filepath)}")

    return df
