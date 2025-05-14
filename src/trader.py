# src/trader.py

def execute_trade(signal: str, ticker: str, amount: float = 1.0):
    """
    Simulates trade execution.
    
    Args:
        signal (str): 'Buy' or 'Sell'
        ticker (str): Stock ticker symbol
        amount (float): Number of shares or notional amount (mock)

    Returns:
        dict: Mock trade confirmation
    """
    if signal not in ["Buy", "Sell"]:
        raise ValueError("Invalid signal. Must be 'Buy' or 'Sell'.")

    # In a real system, connect to broker API here (e.g., Alpaca, Binance)
    print(f"[MOCK TRADE] {signal} {amount} of {ticker}")

    return {
        "status": "success",
        "action": signal,
        "ticker": ticker,
        "amount": amount,
        "message": f"Mock {signal} order executed for {ticker}"
    }
