# src/data_loader.py

import os
import requests
import pandas as pd
from config import POLYGON_API_KEY

def load_data(ticker="AAPL", start="2025-05-01", end="2025-06-10", interval="1d", save_csv=True):
    """
    Fetch historical stock data from Polygon.
    """
    print(f"[INFO] Fetching {interval}min data for {ticker} from Polygon...")

    url = f"https://api.polygon.io/v2/aggs/ticker/{ticker}/range/{interval}/minute/{start}/{end}"
    params = {
        "adjusted": "true",
        "sort": "asc",
        "limit": 50000,
        "apiKey": POLYGON_API_KEY
    }

    response = requests.get(url, params=params)
    response.raise_for_status()

    data = response.json().get("results", [])
    if not data:
        raise ValueError("No data returned from Polygon.")

    df = pd.DataFrame(data)
    df['t'] = pd.to_datetime(df['t'], unit='ms')
    df.set_index('t', inplace=True)
    df.rename(columns={"c": "Close"}, inplace=True)

    if save_csv:
        os.makedirs("data", exist_ok=True)
        filepath = f"data/{ticker}_polygon_data.csv"
        df.to_csv(filepath)
        print(f"[INFO] Saved data to {filepath}")  

    return df[['Close']]
