from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel

VALID_APPLIANCE_TYPES = {"refrigerator", "washing_machine"}


class CreateCallRequest(BaseModel):
    appliance_type: str
    brand: str
    symptom: str
    description: Optional[str] = None
    zip_code: str
    street: str
    number: str
    complement: Optional[str] = None
    neighborhood: str
    city: str
    state: str


class CallSummaryResponse(BaseModel):
    """Visão resumida para técnicos — sem dados de contato do cliente."""
    id: str
    appliance_type: str
    brand: str
    symptom: str
    description: Optional[str]
    status: str
    neighborhood: str
    city: str
    technician_name: Optional[str]
    accepted_at: Optional[datetime]
    offer_expires_at: Optional[datetime]
    created_at: datetime


class CallDetailResponse(BaseModel):
    """Visão completa — para cliente (chamados próprios) e técnico (chamados aceitos)."""
    id: str
    appliance_type: str
    brand: str
    symptom: str
    description: Optional[str]
    status: str
    neighborhood: str
    city: str
    street: str
    number: str
    complement: Optional[str]
    client_name: str
    client_phone: str
    technician_name: Optional[str]
    technician_photo_url: Optional[str] = None
    technician_avg_rating: Optional[float] = None
    technician_ratings_count: int = 0
    technician_calls_completed: int = 0
    technician_phone: Optional[str] = None
    technician_payment_methods: List[str] = []
    pending_confirmation_expires_at: Optional[datetime] = None
    accepted_at: Optional[datetime]
    on_the_way_at: Optional[datetime] = None
    arrived_at: Optional[datetime] = None
    completed_at: Optional[datetime]
    rated_by_client: bool
    created_at: datetime
