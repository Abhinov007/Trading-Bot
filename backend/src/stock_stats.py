import yfinance as yf
import pandas as pd

def get_daily_return(ticker: str, start: str, end: str) -> pd.DataFrame:
    df = yf.download(ticker, start=start, end=end)
    df['Daily Return'] = df['Close'].pct_change()
    return df[['Close', 'Daily Return']].dropna()

def calculate_var(ticker: str, start: str, end: str, confidence_level: float = 0.95) -> float:
    df = get_daily_return(ticker, start, end)
    
    # Calculate the historical 95% VaR (5th percentile)
    var = df['Daily Return'].quantile(1 - confidence_level)
    return var
