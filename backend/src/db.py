from motor.motor_asyncio import AsyncIOMotorClient
from config import MONGO_URI

client = AsyncIOMotorClient(
    MONGO_URI,
    maxPoolSize=10,          # keep up to 10 connections alive
    minPoolSize=1,           # always keep 1 warm connection
    serverSelectionTimeoutMS=5000,   # fail fast if Atlas unreachable
    connectTimeoutMS=5000,
    socketTimeoutMS=10000,
)

db = client["trading_bot"]
