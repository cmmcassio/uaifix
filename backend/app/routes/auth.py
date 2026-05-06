import io
import re
from datetime import datetime
from typing import Optional
from uuid import uuid4

import cloudinary.uploader
import app.core.cloudinary_config  # noqa: F401 — configura cloudinary ao importar
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query, Request, UploadFile, status
from pydantic import BaseModel
from fastapi.security import OAuth2PasswordBearer

from app.core.config import settings
from app.core.security import (
    create_access_token,
    decode_token,
    hash_password,
    validate_cpf,
    verify_password,
)
from app.database import get_db
from app.models.client import ClientDB
from app.models.technician import Address, TechnicianDB
from app.schemas.client import ClientRegisterRequest
from app.schemas.technician import LoginRequest, LoginResponse

router = APIRouter(prefix="/auth", tags=["auth"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login/technician")

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/jpg", "image/png", "image/webp"}
MAX_FILE_SIZE_MB = 5


async def upload_to_cloudinary(file: UploadFile, folder: str = "uaifix/technicians") -> str:
    if (file.content_type or "") not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(400, "Formato inválido. Use JPG, PNG ou WebP.")
    content = await file.read()
    if len(content) > MAX_FILE_SIZE_MB * 1024 * 1024:
        raise HTTPException(400, f"Arquivo muito grande. Máximo {MAX_FILE_SIZE_MB}MB.")
    result = cloudinary.uploader.upload(io.BytesIO(content), folder=folder)
    return result["secure_url"]


async def get_current_technician(token: str = Depends(oauth2_scheme), db=Depends(get_db)):
    payload = decode_token(token)
    if not payload or payload.get("role") != "technician":
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token inválido")
    try:
        oid = ObjectId(payload["sub"])
    except Exception:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token inválido")
    technician = await db.technicians.find_one({"_id": oid})
    if not technician:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Técnico não encontrado")
    return technician


async def get_current_client(token: str = Depends(oauth2_scheme), db=Depends(get_db)):
    payload = decode_token(token)
    if not payload or payload.get("role") != "client":
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token inválido")
    try:
        oid = ObjectId(payload["sub"])
    except Exception:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token inválido")
    client = await db.clients.find_one({"_id": oid})
    if not client:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Cliente não encontrado")
    return client


async def get_current_admin(token: str = Depends(oauth2_scheme)):
    payload = decode_token(token)
    if not payload or payload.get("role") != "admin":
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Acesso restrito ao Admin")
    return payload


# ── Técnico ───────────────────────────────────────────────────────────────────

class TechnicianRegisterRequest(BaseModel):
    name: str
    cpf: str
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


@router.post("/register/technician", status_code=201)
async def register_technician(
    request: Request,
    body: TechnicianRegisterRequest,
    db=Depends(get_db),
):
    cpf_clean = re.sub(r"\D", "", body.cpf)
    if not validate_cpf(cpf_clean):
        raise HTTPException(400, "CPF inválido.")
    if len(body.password) < 8:
        raise HTTPException(400, "Senha deve ter no mínimo 8 caracteres.")

    existing = await db.technicians.find_one({"$or": [{"cpf": cpf_clean}, {"email": body.email.lower()}]})
    if existing:
        field = "CPF" if existing.get("cpf") == cpf_clean else "e-mail"
        raise HTTPException(400, f"Já existe um cadastro com este {field}.")

    client_ip = request.client.host if request.client else "unknown"
    now = datetime.utcnow()

    doc = TechnicianDB(
        name=body.name.strip(),
        cpf=cpf_clean,
        email=body.email.lower().strip(),
        phone=re.sub(r"\D", "", body.phone),
        password_hash=hash_password(body.password),
        address=Address(
            zip_code=re.sub(r"\D", "", body.zip_code),
            street=body.street.strip(),
            number=body.number.strip(),
            complement=body.complement.strip() if body.complement else None,
            neighborhood=body.neighborhood.strip(),
            city=body.city.strip(),
            state=body.state.upper().strip(),
        ),
        status="approved",
        approved_at=now,
        trial_started_at=now,
        subscription_status="trial",
        terms_accepted_at=now,
        terms_ip=client_ip,
    ).model_dump()

    result = await db.technicians.insert_one(doc)
    return {"id": str(result.inserted_id), "message": "Cadastro realizado com sucesso!"}


@router.post("/login/technician", response_model=LoginResponse)
async def login_technician(body: LoginRequest, db=Depends(get_db)):
    tech = await db.technicians.find_one({"email": body.email.lower()})
    if not tech or not verify_password(body.password, tech["password_hash"]):
        raise HTTPException(400, "E-mail ou senha incorretos.")

    token = create_access_token({"sub": str(tech["_id"]), "role": "technician"})
    return LoginResponse(access_token=token, role="technician", name=tech["name"], status=tech["status"])


# ── Cliente ───────────────────────────────────────────────────────────────────

@router.post("/register/client", status_code=201)
async def register_client(body: ClientRegisterRequest, db=Depends(get_db)):
    email = body.email.lower().strip()
    if len(body.password) < 8:
        raise HTTPException(400, "Senha deve ter no mínimo 8 caracteres.")

    existing = await db.clients.find_one({"email": email})
    if existing:
        raise HTTPException(400, "Já existe uma conta com este e-mail.")

    verification_token = str(uuid4())
    doc = ClientDB(
        name=body.name.strip(),
        email=email,
        phone=re.sub(r"\D", "", body.phone),
        password_hash=hash_password(body.password),
        email_verified=False,
        email_verification_token=verification_token,
    ).model_dump()

    result = await db.clients.insert_one(doc)
    return {
        "id": str(result.inserted_id),
        "message": "Conta criada! Verifique seu e-mail para ativar a conta.",
        "verification_token": verification_token,
    }


@router.get("/verify-email")
async def verify_email(token: str = Query(...), db=Depends(get_db)):
    client = await db.clients.find_one({"email_verification_token": token})
    if not client:
        raise HTTPException(400, "Token inválido ou expirado.")
    await db.clients.update_one(
        {"_id": client["_id"]},
        {"$set": {"email_verified": True, "email_verification_token": None}},
    )
    return {"ok": True, "message": "E-mail verificado com sucesso"}


@router.post("/login/client", response_model=LoginResponse)
async def login_client(body: LoginRequest, db=Depends(get_db)):
    client = await db.clients.find_one({"email": body.email.lower()})
    if not client or not verify_password(body.password, client["password_hash"]):
        raise HTTPException(400, "E-mail ou senha incorretos.")

    token = create_access_token({"sub": str(client["_id"]), "role": "client"})
    return LoginResponse(access_token=token, role="client", name=client["name"], status=client["status"])


# ── Reset de senha ────────────────────────────────────────────────────────────

class ResetPasswordRequest(BaseModel):
    email: str
    new_password: str
    reset_key: str

@router.post("/reset-password")
async def reset_password(body: ResetPasswordRequest, db=Depends(get_db)):
    if body.reset_key != "uaifix-reset-2024":
        raise HTTPException(403, "Chave inválida.")
    if len(body.new_password) < 8:
        raise HTTPException(400, "Senha deve ter no mínimo 8 caracteres.")

    new_hash = hash_password(body.new_password)
    email = body.email.lower().strip()

    result = await db.technicians.update_one(
        {"email": email},
        {"$set": {"password_hash": new_hash, "updated_at": datetime.utcnow()}},
    )
    if result.matched_count:
        return {"ok": True, "role": "technician"}

    result = await db.clients.update_one(
        {"email": email},
        {"$set": {"password_hash": new_hash, "updated_at": datetime.utcnow()}},
    )
    if result.matched_count:
        return {"ok": True, "role": "client"}

    raise HTTPException(404, "E-mail não encontrado.")


# ── Admin ─────────────────────────────────────────────────────────────────────

@router.post("/login/admin", response_model=LoginResponse)
async def login_admin(body: LoginRequest):
    if body.email.lower() != settings.admin_email.lower() or body.password != settings.admin_password:
        raise HTTPException(400, "Credenciais inválidas.")

    token = create_access_token({"sub": "admin", "role": "admin"})
    return LoginResponse(access_token=token, role="admin", name="Admin")
