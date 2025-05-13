# src/config.py

# Ticker and time window settings
TICKER = "AAPL"
INTERVAL = "5m"
PERIOD = "5d"
TIME_STEP = 50

# Date range settings
START_DATE = "2010-01-01"
END_DATE = "2025-01-01"

# Model settings
EPOCHS = 10
BATCH_SIZE = 32
MODEL_PATH = "models/lstm_model.h5"