from motor.motor_asyncio import AsyncIOMotorClient
from urllib.parse import quote_plus
from src.auth import verify_password, create_access_token
import os

# MongoDB credentials (use environment variables for security)
username = os.getenv("MONGO_USERNAME", "default_user")
password = os.getenv("MONGO_PASSWORD", "default_password")
encoded_password = quote_plus(password)

# MongoDB URI
MONGO_URL = f"mongodb+srv://{username}:{encoded_password}@cluster0.pkuvqsa.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"

# MongoDB Client Setup
client = AsyncIOMotorClient(MONGO_URL)
db = client["trading_bot"]  # Use a descriptive DB name

# ========== User Helper Functions ==========

async def get_user_by_email(email: str):
    try:
        return await db.users.find_one({"email": email})
    except Exception as e:
        print(f"Error fetching user by email: {e}")
        return None

async def authenticate_user(email: str, password: str):
    user = await get_user_by_email(email)
    if not user:
        return None
    if not verify_password(password, user["password"]):
        return None
    # Generate access token for authenticated user
    token_data = {"sub": user["email"]}
    access_token = create_access_token(data=token_data)
    return {"user": user, "access_token": access_token}
