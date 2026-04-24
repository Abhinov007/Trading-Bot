# src/data_loader.py

import os
import requests
import pandas as pd
from datetime import datetime
from config import POLYGON_API_KEY

# ── In-memory cache ────────────────────────────────────────────────────────────
_cache: dict = {}
CACHE_TTL_SECONDS = 300  # 5 minutes


def _is_cache_valid(ticker: str) -> bool:
    if ticker not in _cache:
        return False
    age = (datetime.now() - _cache[ticker]["ts"]).total_seconds()
    return age < CACHE_TTL_SECONDS


def _get_cached(ticker: str) -> pd.DataFrame | None:
    if _is_cache_valid(ticker):
        print(f"[CACHE] Returning cached data for {ticker}")
        return _cache[ticker]["df"]
    return None


def _set_cache(ticker: str, df: pd.DataFrame) -> None:
    _cache[ticker] = {"df": df, "ts": datetime.now()}


# ── Loader ─────────────────────────────────────────────────────────────────────

def load_data(ticker="AAPL", start="2025-01-01", end="2025-04-01", interval="5", save_csv=True):
    """
    Fetch historical 5-min bar data from Polygon.
    Results are cached in memory for 5 minutes to avoid redundant API calls.
    """
    cached = _get_cached(ticker)
    if cached is not None:
        return cached

    print(f"[INFO] Fetching {interval}min data for {ticker} from Polygon ({start} → {end})...")

    url = f"https://api.polygon.io/v2/aggs/ticker/{ticker}/range/{interval}/minute/{start}/{end}"
    params = {
        "adjusted": "true",
        "sort": "asc",
        "limit": 50000,
        "apiKey": POLYGON_API_KEY
    }

    response = requests.get(url, params=params, timeout=10)
    response.raise_for_status()

    data = response.json().get("results", [])
    if not data:
        raise ValueError(f"No data returned from Polygon for {ticker}.")

    df = pd.DataFrame(data)
    df['t'] = pd.to_datetime(df['t'], unit='ms')
    df.set_index('t', inplace=True)
    df.rename(columns={"c": "Close"}, inplace=True)
    df = df[['Close']]

    if save_csv:
        os.makedirs("data", exist_ok=True)
        filepath = f"data/{ticker}_polygon_data.csv"
        df.to_csv(filepath)
        print(f"[INFO] Saved data to {filepath}")

    _set_cache(ticker, df)
    print(f"[INFO] Cached data for {ticker} ({len(df)} rows)")
    return df
