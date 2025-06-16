from motor.motor_asyncio import AsyncIOMotorClient
from urllib.parse import quote_plus

username = "abhinov"
password = "admin123"
encoded_password = quote_plus(password)

MONGO_URL = f"mongodb+srv://{username}:{encoded_password}@cluster0.pkuvqsa.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"

client = AsyncIOMotorClient(MONGO_URL)
db = client["your_database_name"]

