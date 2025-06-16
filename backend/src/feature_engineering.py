import pandas as pd
from ta.momentum import RSIIndicator
from ta.trend import SMAIndicator, MACD

def add_technical_indicators(df):
    """
    Adds RSI, SMA, and MACD indicators to the DataFrame.
    """
    # Identify 'close' column dynamically (e.g., 'close_aapl', 'close_goog', etc.)
    close_col = [col for col in df.columns if col.startswith('close_')]
    if not close_col:
        raise KeyError("No 'close_' column found in the DataFrame.")
    
    close_col = close_col[0]

    # Compute indicators using ta (Bukosabino)
    rsi = RSIIndicator(close=df[close_col], window=14).rsi()
    sma = SMAIndicator(close=df[close_col], window=14).sma_indicator()
    macd = MACD(close=df[close_col])

    # Add indicators to DataFrame
    df['rsi'] = rsi
    df['sma'] = sma
    df['macd'] = macd.macd()
    df['macd_signal'] = macd.macd_signal()

    print(f"[INFO] Added technical indicators: {df.columns}")
    return df
