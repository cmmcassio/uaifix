from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field

from app.models.technician import Address


class ServiceCallDB(BaseModel):
    client_id: str
    client_name: str
    client_phone: str
    appliance_type: str        # refrigerator | washing_machine
    brand: str
    symptom: str
    description: Optional[str] = None
    address: Address
    status: str = "open"       # open | accepted | in_progress | completed | cancelled
    technician_id: Optional[str] = None
    technician_name: Optional[str] = None
    offered_to: Optional[str] = None
    offer_expires_at: Optional[datetime] = None
    declined_by: List[str] = Field(default_factory=list)
    rated_by_client: bool = False
    accepted_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    cancelled_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
