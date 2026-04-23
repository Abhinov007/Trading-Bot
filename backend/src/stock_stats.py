import requests
import pandas as pd
from config import POLYGON_API_KEY

def get_daily_return(ticker: str, start: str, end: str) -> pd.DataFrame:
    url = f"https://api.polygon.io/v2/aggs/ticker/{ticker}/range/1/day/{start}/{end}"
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
        raise ValueError(f"No daily data returned from Polygon for {ticker}.")

    df = pd.DataFrame(data)
    df['t'] = pd.to_datetime(df['t'], unit='ms')
    df.set_index('t', inplace=True)
    df.rename(columns={"c": "Close"}, inplace=True)
    df['Daily Return'] = df['Close'].pct_change()
    return df[['Close', 'Daily Return']].dropna()

def calculate_var(ticker: str, start: str, end: str, confidence_level: float = 0.95) -> float:
    df = get_daily_return(ticker, start, end)
    return df['Daily Return'].quantile(1 - confidence_level)
