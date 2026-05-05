from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.models.technician import Address


class ClientDB(BaseModel):
    name: str
    email: str
    phone: str
    password_hash: str
    address: Optional[Address] = None
    email_verified: bool = False
    email_verification_token: Optional[str] = None
    trust_level: str = "new"  # new | regular | reliable
    status: str = "active"
    calls_completed: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    role: str = "client"
