from alpaca_trade_api.rest import REST
from config import ALPACA_API_KEY, ALPACA_SECRET_KEY, ALPACA_BASE_URL

# Initialize Alpaca API
api = REST(ALPACA_API_KEY, ALPACA_SECRET_KEY, base_url=ALPACA_BASE_URL)

def get_account_status():
    try:
        account = api.get_account()
        return {
            "status": "success",
            "account_status": account.status,
            "buying_power": account.buying_power,
            "equity": account.equity,
            "cash": account.cash
        }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }

def execute_trade(signal: str, ticker: str, qty: int = 1):
    """
    Executes a real trade via Alpaca API if signal is 'Buy' or 'Sell'.
    Returns message for 'Hold' signal.
    """
    if signal == "Hold":
        return {
            "status": "skipped",
            "message": f"No trade executed. Signal is '{signal}'.",
            "ticker": ticker,
            "action": signal,
            "qty": 0
        }

    if signal not in ["Buy", "Sell"]:
        raise ValueError("Signal must be 'Buy' or 'Sell' or 'Hold'.")

    try:
        order = api.submit_order(
            symbol=ticker,
            qty=qty,
            side=signal.lower(),
            type='market',
            time_in_force='gtc'
        )

        return {
            "status": "success",
            "action": signal,
            "ticker": ticker,
            "qty": qty,
            "message": f"{signal} order submitted for {ticker}",
            "order_id": order.id
        }

    except Exception as e:
        return {
            "status": "error",
            "message": f"Trade execution failed: {str(e)}",
            "ticker": ticker,
            "action": signal,
            "qty": qty
        }
    

