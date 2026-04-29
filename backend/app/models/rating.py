from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class RatingDB(BaseModel):
    call_id: str
    client_id: str
    technician_id: str
    stars: int  # 1-5
    comment: Optional[str] = None
    is_auto: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
