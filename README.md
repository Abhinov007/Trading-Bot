# TradingBot — AI-Powered Stock Trading Dashboard

An intelligent full-stack stock trading application that uses an **LSTM neural network** to predict stock prices, generate Buy/Sell/Hold signals, and execute real trades via the Alpaca brokerage API.

---

## Overview

TradingBot analyzes historical stock data, computes technical indicators, runs a pre-trained deep learning model, and surfaces actionable trading signals through a clean, minimal dark-themed dashboard. Users can register, log in, search any ticker, view AI predictions on an interactive chart, and execute trades — all from one interface.

---

## Features

- **LSTM Price Prediction** — Pre-trained Keras model forecasts next-period closing prices
- **Trading Signals** — Generates Buy / Sell / Hold based on predicted vs current price with a configurable threshold
- **Technical Indicators** — RSI, SMA, and MACD computed via the `ta` library
- **Risk Metrics** — RMSE, F1 Score (directional accuracy), and 95% Value at Risk (VaR)
- **Live Trade Execution** — Connects to Alpaca paper/live trading API to place market orders
- **Interactive Chart** — Actual vs predicted price overlay using Recharts
- **User Authentication** — Register / Login with bcrypt password hashing and JWT tokens
- **Transaction History** — All executed trades stored in MongoDB and displayed in a table
- **Responsive Dark UI** — Built with Next.js 15, Tailwind CSS, and shadcn/ui components

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
| **python-jose** | JWT token creation and validation |
| **Polygon.io API** | Historical stock OHLCV data |
| **Alpaca API** | Brokerage — paper and live trade execution |
| **yfinance** | VaR / daily returns fallback |

### Frontend
| Tool | Purpose |
|------|---------|
| **Next.js 15** | React framework (App Router) |
| **TypeScript 5** | Static typing |
| **Tailwind CSS 4** | Utility-first styling |
| **shadcn/ui + Radix** | Accessible component primitives |
| **Recharts** | Interactive stock chart |
| **Lucide React** | Icon set |

### Database
| Tool | Purpose |
|------|---------|
| **MongoDB Atlas** | Cloud database for users and transactions |

---

## Project Structure

```
Trading-Bot/
│
├── backend/
│   ├── src/
│   │   ├── auth.py                # JWT token creation and password hashing
│   │   ├── data_loader.py         # Polygon.io API — fetch historical OHLCV data
│   │   ├── db.py                  # MongoDB async connection (Motor)
│   │   ├── feature_engineering.py # Add RSI, SMA, MACD to DataFrame
│   │   ├── model.py               # Load pre-trained Keras LSTM model
│   │   ├── models.py              # Pydantic schemas (User, Transaction, LoginRequest)
│   │   ├── mongo_crud.py          # DB operations — users and transactions
│   │   ├── preprocessing.py       # MinMaxScaler + LSTM sequence creation
│   │   ├── signal_generator.py    # Buy / Sell / Hold signal logic
│   │   ├── stock_stats.py         # Daily returns and VaR calculation
│   │   ├── stock_summary.py       # Stock summary endpoint helper
│   │   ├── trader.py              # Alpaca API — execute and fetch trades
│   │   └── utils.py               # Password utility helpers
│   │
│   ├── models/
│   │   └── lstm_model.h5          # Pre-trained LSTM model weights
│   │
│   ├── data/                      # Auto-generated CSVs from Polygon fetches
│   ├── notebooks/                 # Jupyter notebooks (model training)
│   ├── config.py                  # Environment config and constants
│   ├── main.py                    # FastAPI app — all routes
│   └── requirements.txt           # Python dependencies
│
├── frontend/
│   └── src/
│       └── app/
│           ├── components/
│           │   ├── Header.tsx          # Top nav — search bar + auth button
│           │   ├── StockChart.tsx      # Actual vs predicted price chart
│           │   ├── PredictionPanel.tsx # Signal, RMSE, F1, VaR display
│           │   ├── TransactionTable.tsx# Trade history table
│           │   ├── AuthDialog.tsx      # Login / Register modal
│           │   └── TradeAction.tsx     # Execute trade button
│           ├── page.tsx               # Dashboard layout
│           ├── layout.tsx             # Root layout
│           └── globals.css            # Tailwind base styles
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

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/Trading-Bot.git
cd Trading-Bot
```

---

### 2. Backend Setup

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate

pip install -r requirements.txt
```

Create your environment file:

```bash
cp .env.example .env
```

Fill in your credentials in `.env`:

```env
POLYGON_API_KEY=your_polygon_api_key_here
ALPACA_API_KEY=your_alpaca_api_key_here
ALPACA_SECRET_KEY=your_alpaca_secret_key_here
ALPACA_BASE_URL=https://paper-api.alpaca.markets
MONGO_USERNAME=your_mongodb_username
MONGO_PASSWORD=your_mongodb_password
SECRET_KEY=your_jwt_secret_key_min_32_characters
```

Start the backend server:

```bash
uvicorn main:app --reload
```

API will be available at: `http://127.0.0.1:8000`  
Interactive API docs: `http://127.0.0.1:8000/docs`

---

### 3. Frontend Setup

```bash
cd frontend
npm install
```

Create your environment file:

```bash
# frontend/.env.local
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

Start the development server:

```bash
npm run dev
```

App will be available at: `http://localhost:3000`

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Required |
|----------|-------------|----------|
| `POLYGON_API_KEY` | Polygon.io API key for stock data | Yes |
| `ALPACA_API_KEY` | Alpaca brokerage API key | Yes |
| `ALPACA_SECRET_KEY` | Alpaca brokerage secret key | Yes |
| `ALPACA_BASE_URL` | `https://paper-api.alpaca.markets` for paper trading | Yes |
| `MONGO_USERNAME` | MongoDB Atlas username | Yes |
| `MONGO_PASSWORD` | MongoDB Atlas password | Yes |
| `SECRET_KEY` | Secret key for JWT signing (min 32 chars) | Yes |

### Frontend (`frontend/.env.local`)

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL | Yes |

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/predict?ticker=AAPL` | Run LSTM prediction, return chart data + signal |
| `GET` | `/stock-summary` | Latest stock summary data |
| `GET` | `/stock-stats?ticker=AAPL&start=...&end=...` | Daily returns for a ticker |
| `GET` | `/account-status` | Alpaca account balance and status |
| `POST` | `/execute-trade?signal=Buy&ticker=AAPL` | Place a market order via Alpaca |
| `POST` | `/record-transaction` | Save a trade to MongoDB |
| `GET` | `/transactions` | Fetch all recorded transactions |
| `GET` | `/transactions/by-email?email=...` | Fetch transactions for a specific user |
| `POST` | `/register` | Create a new user account |
| `POST` | `/login` | Authenticate and receive JWT token |

Full interactive docs available at `/docs` when the backend is running.

---

## How the Prediction Works

```
Ticker Input (e.g. "AAPL")
        │
        ▼
Polygon.io API → Historical OHLCV data (last 180 days, 5-min intervals)
        │
        ▼
Feature Engineering → RSI (14), SMA (14), MACD added to DataFrame
        │
        ▼
MinMaxScaler → Normalize closing prices to [0, 1]
        │
        ▼
Sequence Creation → Sliding window of 50 timesteps → LSTM input shape
        │
        ▼
LSTM Model (lstm_model.h5) → Predict next closing prices
        │
        ▼
Inverse Transform → Convert predictions back to real price values
        │
        ▼
Signal Generator → Compare predicted vs actual price
                   predicted > current × 1.01  →  BUY
                   predicted < current × 0.99  →  SELL
                   otherwise                   →  HOLD
        │
        ▼
Metrics → RMSE, F1 Score (directional), VaR 95%
        │
        ▼
JSON Response → Chart data + signal + metrics
```

---

## Model Details

| Property | Value |
|----------|-------|
| Architecture | LSTM (Long Short-Term Memory) |
| Input | 50 timestep sequences of normalized closing prices |
| Output | Single predicted closing price |
| File | `backend/models/lstm_model.h5` |
| Training data | Historical US stock data |
| Scaler | MinMaxScaler (0–1) |

> The model is loaded once at application startup and reused across all requests for performance.

---

## Screenshots

> Dashboard with stock prediction chart, AI analysis panel, and trade history

| Feature | Preview |
|---------|---------|
| Price Chart | Actual vs Predicted overlay with Buy/Sell signal |
| AI Panel | Signal, RMSE, F1 Score, VaR (95%) |
| Trade History | Timestamped table of all executed orders |
| Auth Modal | Login / Register with tabbed interface |

---

## Known Limitations

- The LSTM model was trained on a fixed dataset. Prediction quality will vary across tickers and market conditions.
- Alpaca paper trading is used by default. Switch `ALPACA_BASE_URL` to the live URL only with real funds and at your own risk.
- Polygon.io free tier has rate limits. High-frequency requests may be throttled.

---

## Future Improvements

- [ ] Add user portfolio tracking (P&L over time)
- [ ] Real-time price updates via WebSocket
- [ ] Retrain model on recent data automatically
- [ ] Add stop-loss and take-profit configuration
- [ ] Multi-ticker watchlist
- [ ] Docker + CI/CD pipeline for deployment
- [ ] Unit and integration test suite

---

## License

This project is for educational and portfolio purposes. Not financial advice. Always paper-trade before using real capital.
