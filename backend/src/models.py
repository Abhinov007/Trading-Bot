from pydantic import BaseModel, Field, EmailStr
from typing import Optional
from datetime import datetime

# Model for input during registration
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    full_name: str

# Model for storing user data (e.g. in DB)
class User(BaseModel):
    id: Optional[str]
    username: str
    email: EmailStr
    password: str
    full_name: str

# Transaction model
class Transaction(BaseModel):
    id: Optional[str] = Field(default=None) 
    action: str       # "Buy" or "Sell"
    ticker: str
    quantity: float
    price: Optional[float] = None  # price might not always be present
    status: Optional[str] = None   # e.g. "success"
    message: Optional[str] = None  # e.g. "Buy order submitted..."
    order_id: Optional[str] = None # order identifier
    executed_at: datetime = Field(default_factory=datetime.utcnow)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str

