"""
Simple signal-based backtester.

Given arrays of actual prices and the corresponding LSTM predictions, it
simulates trading with the same generate_signal() logic used live:
  - Buy  → enter a long position (1 share)
  - Sell → exit any open position
  - Hold → do nothing

Returns per-period equity for both the strategy and a buy-and-hold baseline
so the frontend can plot cumulative returns.
"""

import numpy as np
from src.signal_generator import generate_signal


def run_backtest(y_real: np.ndarray, predictions: np.ndarray) -> dict:
    """
    Parameters
    ----------
    y_real      : 1-D array of actual prices (length N)
    predictions : 1-D array of predicted prices (length N, same order)

    Returns
    -------
    dict with:
        dates           – sequential index labels ["1", "2", …]
        strategy_equity – cumulative equity curve for the LSTM strategy ($)
        bah_equity      – buy-and-hold equity curve ($)
        trades          – list of {index, action, price}
        metrics         – {total_return_pct, bah_return_pct, num_trades,
                           win_rate_pct, max_drawdown_pct}
    """
    y_real      = np.asarray(y_real).flatten()
    predictions = np.asarray(predictions).flatten()
    n = min(len(y_real), len(predictions))

    cash        = 10_000.0   # starting capital
    position    = 0          # shares held (0 or 1)
    entry_price = 0.0
    equity      = []
    trades      = []
    trade_pnls  = []

    for i in range(n):
        price      = float(y_real[i])
        pred_price = float(predictions[i])
        signal     = generate_signal(pred_price, price)

        if signal == "Buy" and position == 0:
            position    = 1
            entry_price = price
            cash       -= price
            trades.append({"index": i, "action": "Buy", "price": round(price, 2)})

        elif signal == "Sell" and position == 1:
            pnl  = price - entry_price
            cash += price
            position = 0
            trade_pnls.append(pnl)
            trades.append({"index": i, "action": "Sell", "price": round(price, 2)})

        # Mark-to-market equity
        equity.append(round(cash + position * price, 2))

    # Close open position at last price
    if position == 1:
        final_price = float(y_real[n - 1])
        pnl = final_price - entry_price
        trade_pnls.append(pnl)

    start_price = float(y_real[0])
    end_price   = float(y_real[n - 1])

    bah_equity = [
        round(10_000.0 / start_price * float(y_real[i]), 2)
        for i in range(n)
    ]

    total_return = (equity[-1] - 10_000.0) / 10_000.0 * 100 if equity else 0
    bah_return   = (end_price - start_price) / start_price * 100

    # Win rate
    wins = sum(1 for p in trade_pnls if p > 0)
    win_rate = (wins / len(trade_pnls) * 100) if trade_pnls else 0

    # Max drawdown on strategy equity
    peak = equity[0] if equity else 10_000.0
    max_dd = 0.0
    for v in equity:
        if v > peak:
            peak = v
        dd = (peak - v) / peak * 100
        if dd > max_dd:
            max_dd = dd

    return {
        "dates":            [str(i + 1) for i in range(n)],
        "strategy_equity":  equity,
        "bah_equity":       bah_equity,
        "trades":           trades,
        "metrics": {
            "total_return_pct": round(total_return, 2),
            "bah_return_pct":   round(bah_return, 2),
            "num_trades":       len(trades),
            "win_rate_pct":     round(win_rate, 2),
            "max_drawdown_pct": round(max_dd, 2),
        },
    }
