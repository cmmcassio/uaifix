from datetime import datetime
from typing import Optional

from pydantic import BaseModel

from app.models.technician import Address, CommercialReference


class TechnicianResponse(BaseModel):
    id: str
    name: str
    cpf: str
    email: str
    phone: str
    status: str
    city: str
    created_at: datetime


class TechnicianDetailResponse(BaseModel):
    id: str
    name: str
    cpf: str
    email: str
    phone: str
    address: Address
    commercial_reference: Optional[CommercialReference] = None
    selfie_url: Optional[str]
    proof_of_address_url: Optional[str]
    terms_accepted_at: datetime
    status: str
    rejection_reason: Optional[str]
    approved_at: Optional[datetime]
    rejected_at: Optional[datetime]
    created_at: datetime


class LoginRequest(BaseModel):
    email: str
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    name: str
    status: Optional[str] = None


class AdminRejectRequest(BaseModel):
    reason: str
