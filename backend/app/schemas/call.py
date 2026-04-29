from datetime import datetime
from typing import Optional

from pydantic import BaseModel

VALID_APPLIANCE_TYPES = {"refrigerator", "washing_machine"}


class CreateCallRequest(BaseModel):
    appliance_type: str
    brand: str
    symptom: str
    description: Optional[str] = None


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
    accepted_at: Optional[datetime]
    completed_at: Optional[datetime]
    created_at: datetime
