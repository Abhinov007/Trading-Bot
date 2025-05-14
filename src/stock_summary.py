import yfinance as yf
import pandas as pd
import time

def get_sp500_tickers():
    # Fetches list of S&P 500 tickers from Wikipedia
    table = pd.read_html("https://en.wikipedia.org/wiki/List_of_S%26P_500_companies")
    return table[0]['Symbol'].tolist()

def get_stock_summary(limit=100):
    tickers = get_sp500_tickers()[:limit]
    tickers_str = " ".join(tickers)
    print(f"[INFO] Fetching summary for {len(tickers)} tickers...")

    # Fetch all tickers at once
    start_time = time.time()
    data = yf.Tickers(tickers_str).tickers
    print(f"[INFO] Batch fetch took {time.time() - start_time:.2f} seconds")

    summary_data = []

    for ticker in tickers:
        try:
            info = data[ticker].info
            summary_data.append({
                "ticker": ticker,
                "price": info.get("currentPrice"),
                "change_percent": info.get("regularMarketChangePercent"),
                "volume": info.get("volume"),
                "avg_volume_3m": info.get("averageVolume"),
                "market_cap": info.get("marketCap"),
                "pe_ratio_ttm": info.get("trailingPE"),
                "wk_52_change_percent": info.get("52WeekChange"),
            })
        except Exception as e:
            print(f"[WARN] Skipping {ticker}: {e}")

    return summary_data
