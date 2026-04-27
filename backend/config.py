from dotenv import load_dotenv
from datetime import datetime, timedelta
import os

load_dotenv()

POLYGON_API_KEY = os.getenv("POLYGON_API_KEY")
ALPACA_API_KEY = os.getenv("ALPACA_API_KEY")
ALPACA_SECRET_KEY = os.getenv("ALPACA_SECRET_KEY")
ALPACA_BASE_URL = os.getenv("ALPACA_BASE_URL")
MONGO_URI       = os.getenv("MONGO_URI")
SECRET_KEY = os.getenv("SECRET_KEY", "changeme")
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:5173").split(",")

INTERVAL = "5"
PERIOD = "5d"
TIME_STEP = 50
MODEL_PATH = "models/lstm_model.h5"
END_DATE = datetime.today().strftime("%Y-%m-%d")
START_DATE = (datetime.today() - timedelta(days=90)).strftime("%Y-%m-%d")
