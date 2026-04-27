from src.db import db
from src.models import User, Transaction, WatchlistItem, PriceAlert
from src.utils import verify_password

# ── Users ──────────────────────────────────────────────────────────────────────

async def create_user(user: User):
    return await db.users.insert_one(user.dict(exclude={"id"}))

async def get_user_by_email(email: str):
    return await db.users.find_one({"email": email})

async def authenticate_user(email: str, password: str):
    user = await db.users.find_one({"email": email})
    if user and verify_password(password, user.get("password")):
        user.pop("password", None)
        return user
    return None

# ── Transactions ───────────────────────────────────────────────────────────────

async def record_transaction(transaction: Transaction):
    return await db.transactions.insert_one(transaction.dict(exclude={"id"}))

async def get_user_transactions(user_email: str) -> list:
    """Return only transactions that belong to the given user."""
    cursor = db.transactions.find({"user_email": user_email})
    return await cursor.to_list(length=100)

# ── Watchlist ──────────────────────────────────────────────────────────────────

async def get_watchlist(user_email: str) -> list:
    cursor = db.watchlist.find({"user_email": user_email})
    items = await cursor.to_list(length=100)
    for item in items:
        item["_id"] = str(item["_id"])
    return items

async def add_to_watchlist(ticker: str, user_email: str) -> bool:
    existing = await db.watchlist.find_one({"ticker": ticker, "user_email": user_email})
    if existing:
        return False
    item = WatchlistItem(ticker=ticker)
    await db.watchlist.insert_one({**item.dict(), "user_email": user_email})
    return True

async def remove_from_watchlist(ticker: str, user_email: str) -> bool:
    result = await db.watchlist.delete_one({"ticker": ticker, "user_email": user_email})
    return result.deleted_count > 0

# ── Price Alerts ───────────────────────────────────────────────────────────────

async def get_alerts(user_email: str) -> list:
    cursor = db.alerts.find({"user_email": user_email, "triggered": False})
    items = await cursor.to_list(length=100)
    for item in items:
        item["_id"] = str(item["_id"])
    return items

async def create_alert(alert: PriceAlert) -> str:
    result = await db.alerts.insert_one(alert.dict())
    return str(result.inserted_id)

async def delete_alert(alert_id: str, user_email: str) -> bool:
    from bson import ObjectId
    result = await db.alerts.delete_one({"_id": ObjectId(alert_id), "user_email": user_email})
    return result.deleted_count > 0

async def mark_alert_triggered(alert_id: str) -> None:
    from bson import ObjectId
    await db.alerts.update_one({"_id": ObjectId(alert_id)}, {"$set": {"triggered": True}})
