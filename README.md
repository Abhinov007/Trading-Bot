# AlphaBot — AI-Powered Stock Trading Dashboard

A full-stack stock trading application powered by an **LSTM neural network** that predicts stock prices, generates Buy/Sell/Hold signals, and executes real trades via the Alpaca brokerage API.

---

## Overview

AlphaBot fetches historical OHLCV data, computes technical indicators, runs a pre-trained deep learning model, and surfaces actionable signals through a clean dark-themed dashboard. Users can register, log in, search any ticker, view AI predictions on an interactive chart, trade manually or follow the AI signal, track their portfolio P&L, set price alerts, and read sentiment-scored news — all from one interface.

---

## Features

| Feature | Description |
|---------|-------------|
| **LSTM Price Prediction** | Pre-trained Keras model forecasts the next closing price from 50-step sequences |
| **AI Trading Signals** | Buy / Sell / Hold based on predicted vs current price (±1% threshold) |
| **Manual Trading** | Dedicated Buy and Sell buttons — trade independently of the AI signal |
| **Technical Indicators** | RSI (14), SMA (14), MACD added to every prediction |
| **Risk Metrics** | RMSE, F1 Score (directional accuracy), 95% Value at Risk |
| **Live Trade Execution** | Alpaca paper/live API — market orders, 1 share per signal |
| **Portfolio P&L** | Dedicated `/portfolio` page — live positions, unrealised P&L, cost basis from Alpaca |
| **Price Alerts** | Set above/below thresholds per ticker; toast notification fires when price is crossed |
| **News Sentiment** | Latest articles scored Bullish / Bearish / Neutral via VADER + financial keyword boosting |
| **Market Overview** | Sidebar showing top 20 US stocks with live prices (single Polygon grouped-daily call) |
| **Watchlist** | Per-user watchlist with live price polling (staggered to respect Polygon rate limits) |
| **Transaction History** | All executed trades stored in MongoDB, scoped per user |
| **JWT Authentication** | Register / Login with bcrypt hashing; all protected routes require a Bearer token |
| **Backtesting Engine** | Signal-based backtester on historical data — equity curve, win rate, max drawdown (API only) |

---

## Tech Stack

### Backend
| Tool | Purpose |
|------|---------|
| **FastAPI** | REST API framework |
| **TensorFlow / Keras** | LSTM model loading and inference |
| **scikit-learn** | MinMaxScaler, RMSE, F1 Score |
| **pandas / NumPy** | Data manipulation |
| **ta** | RSI, SMA, MACD indicators |
| **Motor (async)** | MongoDB async driver |
| **passlib + bcrypt** | Password hashing |
| **python-jose** | JWT creation and validation |
| **vaderSentiment** | News sentiment scoring |
| **slowapi** | Per-endpoint rate limiting |
| **Polygon.io API** | Historical OHLCV + news + market snapshot data |
| **Alpaca API** | Brokerage — paper and live trade execution, position tracking |

### Frontend
| Tool | Purpose |
|------|---------|
| **React 19** | UI framework |
| **Vite** | Build tool and dev server |
| **React Router DOM v7** | Client-side routing (`/`, `/portfolio`) |
| **Tailwind CSS v4** | Utility-first styling |
| **Recharts** | Interactive stock chart |
| **Lucide React** | Icon set |

### Database
| Tool | Purpose |
|------|---------|
| **MongoDB Atlas** | Cloud database — users, transactions, watchlist, alerts |

---

## Project Structure

```
Trading-Bot/
│
├── backend/
│   ├── src/
│   │   ├── auth.py              # JWT creation, password hashing
│   │   ├── backtester.py        # Signal-based backtest engine
│   │   ├── data_loader.py       # Polygon.io — fetch historical OHLCV
│   │   ├── db.py                # MongoDB async connection (Motor)
│   │   ├── feature_engineering.py  # RSI, SMA, MACD
│   │   ├── model.py             # Load Keras LSTM model
│   │   ├── models.py            # Pydantic schemas
│   │   ├── mongo_crud.py        # DB operations — users, transactions, watchlist, alerts
│   │   ├── news_sentiment.py    # Polygon news + VADER sentiment scoring
│   │   ├── preprocessing.py     # MinMaxScaler + sequence creation
│   │   ├── signal_generator.py  # Buy / Sell / Hold logic
│   │   ├── stock_stats.py       # Daily returns and VaR
│   │   ├── stock_summary.py     # Stock summary helper
│   │   ├── trader.py            # Alpaca — execute trades, get positions
│   │   └── utils.py             # Password helpers
│   │
│   ├── models/
│   │   └── lstm_model.h5        # Pre-trained LSTM weights
│   │
│   ├── tests/
│   │   └── test_routes.py       # Pytest route tests
│   │
│   ├── data/                    # Auto-generated CSVs from Polygon fetches
│   ├── notebooks/               # Jupyter notebooks (model training)
│   ├── config.py                # Env config and constants
│   ├── main.py                  # FastAPI app — all routes
│   └── requirements.txt
│
├── frontend/
│   └── src/
│       ├── pages/
│       │   ├── Dashboard.jsx    # Main trading dashboard (/)
│       │   └── Portfolio.jsx    # Portfolio P&L page (/portfolio)
│       ├── components/
│       │   ├── LoginForm.jsx
│       │   ├── RegisterForm.jsx
│       │   └── Transaction.jsx
│       ├── App.jsx              # BrowserRouter + routes
│       └── main.jsx
│
└── README.md
```

---

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- MongoDB Atlas account (free tier works)
- [Polygon.io](https://polygon.io/) API key (free tier)
- [Alpaca](https://alpaca.markets/) account + API keys (paper trading is free)

---

### 1. Clone the repository

```bash
git clone https://github.com/your-username/Trading-Bot.git
cd Trading-Bot
```

---

### 2. Backend setup

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate

pip install -r requirements.txt
```

Create `backend/.env`:

```env
POLYGON_API_KEY=your_polygon_api_key
ALPACA_API_KEY=your_alpaca_api_key
ALPACA_SECRET_KEY=your_alpaca_secret_key
ALPACA_BASE_URL=https://paper-api.alpaca.markets
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/?retryWrites=true&w=majority
SECRET_KEY=your_jwt_secret_32_chars_minimum
ALLOWED_ORIGINS=http://localhost:5173
```

Start the server:

```bash
uvicorn main:app --reload
```

API: `http://127.0.0.1:8000`  
Interactive docs: `http://127.0.0.1:8000/docs`

---

### 3. Frontend setup

```bash
cd frontend
npm install
```

Create `frontend/.env`:

```env
VITE_API_URL=http://127.0.0.1:8000
```

Start the dev server:

```bash
npm run dev
```

App: `http://localhost:5173`

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Required |
|----------|-------------|----------|
| `POLYGON_API_KEY` | Polygon.io API key for stock data and news | Yes |
| `ALPACA_API_KEY` | Alpaca brokerage API key | Yes |
| `ALPACA_SECRET_KEY` | Alpaca brokerage secret key | Yes |
| `ALPACA_BASE_URL` | `https://paper-api.alpaca.markets` for paper trading | Yes |
| `MONGO_URI` | MongoDB Atlas connection string | Yes |
| `SECRET_KEY` | Secret for JWT signing (min 32 chars) | Yes |
| `ALLOWED_ORIGINS` | Comma-separated CORS origins | No (default: localhost:3000,5173) |

### Frontend (`frontend/.env`)

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_API_URL` | Backend API base URL | Yes |

---

## API Endpoints

### Public
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/register` | Create a new user account |
| `POST` | `/login` | Authenticate, receive JWT token |
| `GET` | `/predict?ticker=AAPL` | Run LSTM prediction, returns chart + signal + metrics |
| `GET` | `/stock-summary` | Latest stock summary |
| `GET` | `/stock-stats?ticker=AAPL&start=&end=` | Daily returns for VaR |
| `GET` | `/account-status` | Alpaca account balance |
| `GET` | `/price/{ticker}` | Current price (Polygon snapshot → prev-day fallback) |
| `GET` | `/market/top` | Top 20 stocks with prices (single grouped-daily call) |

### Protected (JWT required)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/execute-trade?signal=Buy&ticker=AAPL` | Place a market order via Alpaca |
| `POST` | `/record-transaction` | Save a trade to MongoDB |
| `GET` | `/transactions` | Fetch your trade history |
| `GET` | `/watchlist` | Get your watchlist |
| `POST` | `/watchlist/{ticker}` | Add ticker to watchlist |
| `DELETE` | `/watchlist/{ticker}` | Remove ticker from watchlist |
| `GET` | `/portfolio` | Live positions + unrealised P&L from Alpaca |
| `GET` | `/alerts` | List active price alerts |
| `POST` | `/alerts` | Create a price alert |
| `DELETE` | `/alerts/{id}` | Delete an alert |
| `POST` | `/alerts/{id}/check` | Mark alert as triggered |
| `GET` | `/news/{ticker}` | Sentiment-scored news articles |
| `GET` | `/backtest?ticker=AAPL` | Run signal backtest on historical data |

---

## How the Prediction Works

```
Ticker Input
      │
      ▼
Polygon.io → Historical OHLCV (last 90 days, 5-min candles)
      │
      ▼
Feature Engineering → RSI (14), SMA (14), MACD
      │
      ▼
MinMaxScaler → Normalize closing prices to [0, 1]
      │
      ▼
Sequence Creation → Sliding window of 50 timesteps
      │
      ▼
LSTM Model (lstm_model.h5) → Predict next closing prices
      │
      ▼
Inverse Transform → Back to real price values
      │
      ▼
Signal Generator:
  predicted > current × 1.01  →  BUY
  predicted < current × 0.99  →  SELL
  otherwise                   →  HOLD
      │
      ▼
Metrics → RMSE, F1 Score (directional), VaR 95%
```

---

## How Portfolio P&L Works

Portfolio data comes directly from **Alpaca's paper account** — not from MongoDB transaction history. Alpaca tracks every open position with accurate cost basis and real-time unrealised P&L.

```
GET /portfolio  →  api.list_positions()  →  per-position P&L + portfolio summary
```

The `/portfolio` page auto-refreshes every 60 seconds and shows:
- Summary cards: Total Value, Total Cost, Unrealised P&L, Open Positions
- Holdings table: Ticker, Side, Qty, Avg Cost, Current Price, Market Value, P&L, P&L %

---

## How Price Alerts Work

1. Set a target price and condition (above / below) for any ticker
2. Frontend polls `GET /price/{ticker}` every 30 seconds for each active alert
3. When the threshold is crossed → toast notification fires + alert marked as triggered in MongoDB
4. Triggered alerts are removed from the active list automatically

> Note: Alerts only fire while the browser tab is open. A server-side scheduler would be needed for background monitoring.

---

## Model Details

| Property | Value |
|----------|-------|
| Architecture | LSTM (Long Short-Term Memory) |
| Input | 50-timestep sequences of normalized closing prices |
| Output | Single predicted closing price |
| File | `backend/models/lstm_model.h5` |
| Scaler | MinMaxScaler (0–1 range) |

The model is loaded once at startup and reused across all requests.

---

## Known Limitations

- The LSTM model was trained on a fixed dataset. Accuracy varies across tickers and market conditions.
- Polygon.io free tier rate-limits individual ticker requests. The market overview uses a single grouped-daily call to avoid this.
- Price alerts only check while the page is open — no server-side background job.
- Trade quantity is fixed at 1 share per order.
- Alpaca paper trading is the default. Switch `ALPACA_BASE_URL` to the live endpoint only with real capital and full understanding of the risks.

---

## License

Educational and portfolio purposes only. Not financial advice. Always paper-trade before using real capital.
