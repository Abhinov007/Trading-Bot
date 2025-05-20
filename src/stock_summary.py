# src/stock_summary.py

from src.data_loader import load_data
import pandas as pd

def get_stock_summary(limit: int = 100) -> dict:
    # Example: hardcoded or test ticker
    ticker = "AAPL"
    df = load_data(ticker, start="2023-01-01", end="2023-12-31", interval="1d")
    df = df.tail(limit)

    summary = {
        "ticker": ticker,
        "latest_close": df["Close"].iloc[-1],
        "average_volume": df["Volume"].mean(),
        "start_date": df.index.min().strftime('%Y-%m-%d'),
        "end_date": df.index.max().strftime('%Y-%m-%d'),
        "data_points": len(df),
    }

    return summary

