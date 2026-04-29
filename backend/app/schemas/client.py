from typing import Optional

from pydantic import BaseModel


class ClientRegisterRequest(BaseModel):
    name: str
    email: str
    phone: str
    password: str
    zip_code: str
    street: str
    number: str
    complement: Optional[str] = None
    neighborhood: str
    city: str
    state: str
