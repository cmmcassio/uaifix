from pydantic import BaseModel


class ClientRegisterRequest(BaseModel):
    name: str
    email: str
    phone: str
    password: str
