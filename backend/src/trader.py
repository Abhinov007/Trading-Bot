from alpaca_trade_api.rest import REST
from config import ALPACA_API_KEY, ALPACA_SECRET_KEY, ALPACA_BASE_URL

# Initialize Alpaca API
api = REST(ALPACA_API_KEY, ALPACA_SECRET_KEY, base_url=ALPACA_BASE_URL)

def get_positions() -> dict:
    """
    Return all open positions from Alpaca with cost basis and unrealised P&L.
    unrealized_plpc is returned as a decimal by Alpaca (0.05 = 5%), so we
    multiply by 100 to store it as a percentage.
    """
    try:
        positions = api.list_positions()
        holdings = []
        total_value = 0.0
        total_cost  = 0.0
        total_pnl   = 0.0

        for pos in positions:
            qty          = float(pos.qty)
            avg_cost     = float(pos.avg_entry_price)
            cur_price    = float(pos.current_price)
            mkt_value    = float(pos.market_value)
            pnl          = float(pos.unrealized_pl)
            pnl_pct      = float(pos.unrealized_plpc) * 100

            holdings.append({
                "ticker":        pos.symbol,
                "quantity":      qty,
                "avg_cost":      round(avg_cost, 2),
                "current_price": round(cur_price, 2),
                "market_value":  round(mkt_value, 2),
                "pnl":           round(pnl, 2),
                "pnl_pct":       round(pnl_pct, 2),
                "side":          pos.side,
            })
            total_value += mkt_value
            total_cost  += qty * avg_cost
            total_pnl   += pnl

        total_pnl_pct = (total_pnl / total_cost * 100) if total_cost > 0 else 0

        return {
            "status": "success",
            "holdings": holdings,
            "summary": {
                "total_value":   round(total_value, 2),
                "total_cost":    round(total_cost, 2),
                "total_pnl":     round(total_pnl, 2),
                "total_pnl_pct": round(total_pnl_pct, 2),
            },
        }
    except Exception as e:
        return {"status": "error", "message": str(e), "holdings": [], "summary": {}}


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
    

