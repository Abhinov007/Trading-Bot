from src.db import db
from src.models import User, Transaction
from src.utils import verify_password

# Create user
async def create_user(user: User):
    # Exclude the optional 'id' field so MongoDB can assign its own _id
    return await db.users.insert_one(user.dict(exclude={"id"}))

# Get user by email
async def get_user_by_email(email: str):
    return await db.users.find_one({"email": email})

# Record transaction
async def record_transaction(transaction: Transaction):
    # Exclude 'id' for the same reason as user creation
    return await db.transactions.insert_one(transaction.dict(exclude={"id"}))

# Get all transactions (not filtered by user)
async def get_all_transactions():
    cursor = db.transactions.find({})
    return await cursor.to_list(length=100)


async def authenticate_user(email: str, password: str):
    user = await db.users.find_one({"email": email})
    if user and verify_password(password, user.get("password")):
        user.pop("password", None)
        return user
    return None