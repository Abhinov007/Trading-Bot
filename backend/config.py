from dotenv import load_dotenv
import os

load_dotenv()

POLYGON_API_KEY = os.getenv("POLYGON_API_KEY")
ALPACA_API_KEY = os.getenv("ALPACA_API_KEY")
ALPACA_SECRET_KEY = os.getenv("ALPACA_SECRET_KEY")
ALPACA_BASE_URL = os.getenv("ALPACA_BASE_URL")

# Optional if you want fixed params
INTERVAL = "5"
PERIOD = "5d"
TIME_STEP = 50
MODEL_PATH = "models/lstm_model.h5"
START_DATE = "2024-05-01"
END_DATE = "2024-05-10"
