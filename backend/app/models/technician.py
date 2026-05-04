from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class Address(BaseModel):
    zip_code: str
    street: str
    number: str
    complement: Optional[str] = None
    neighborhood: str
    city: str
    state: str


class CommercialReference(BaseModel):
    name: str
    contact: str
    type: str  # "supplier" | "client"


class PricingRange(BaseModel):
    min: int
    max: int


class TechnicianPricing(BaseModel):
    diagnostic_fee: Optional[PricingRange] = None
    repair_refrigerator: Optional[PricingRange] = None
    repair_washing_machine: Optional[PricingRange] = None


class TechnicianDB(BaseModel):
    name: str
    cpf: str
    email: str
    phone: str
    password_hash: str
    address: Address
    selfie_filename: Optional[str] = None
    proof_of_address_filename: Optional[str] = None
    profile_photo_url: Optional[str] = None
    commercial_reference: Optional[CommercialReference] = None
    terms_accepted_at: datetime
    terms_ip: str
    service_radius_km: int = 20
    status: str = "pending"  # pending | approved | rejected
    rejection_reason: Optional[str] = None
    approved_at: Optional[datetime] = None
    rejected_at: Optional[datetime] = None
    reviewed_by: Optional[str] = None
    trial_started_at: Optional[datetime] = None
    trial_calls_accepted: int = 0
    daily_calls_count: int = 0
    warnings_count: int = 0
    pricing: Optional[TechnicianPricing] = None
    last_offered_at: Optional[datetime] = None
    avg_rating: Optional[float] = None
    ratings_count: int = 0
    payment_methods: List[str] = Field(default_factory=list)
    subscription_expires_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    role: str = "technician"
