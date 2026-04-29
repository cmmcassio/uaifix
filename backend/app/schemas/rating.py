from typing import Optional

from pydantic import BaseModel, Field


class RateCallRequest(BaseModel):
    stars: int = Field(..., ge=1, le=5)
    comment: Optional[str] = None
