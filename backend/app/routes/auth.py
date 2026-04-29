import re
import uuid
from datetime import datetime
from pathlib import Path
from typing import Optional

import aiofiles
from bson import ObjectId
from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile, status
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
from app.models.technician import Address, CommercialReference, TechnicianDB
from app.schemas.client import ClientRegisterRequest
from app.schemas.technician import LoginRequest, LoginResponse

router = APIRouter(prefix="/auth", tags=["auth"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login/technician")

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/jpg", "image/png", "image/webp"}
MAX_FILE_SIZE_MB = 5


async def save_upload(file: UploadFile, prefix: str) -> str:
    content = await file.read()
    if len(content) > MAX_FILE_SIZE_MB * 1024 * 1024:
        raise HTTPException(400, f"Arquivo muito grande. Máximo {MAX_FILE_SIZE_MB}MB.")
    if (file.content_type or "") not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(400, "Formato inválido. Use JPG, PNG ou WebP.")
    ext = file.filename.rsplit(".", 1)[-1] if file.filename and "." in file.filename else "jpg"
    filename = f"{prefix}_{uuid.uuid4().hex}.{ext}"
    path = Path(settings.uploads_dir) / filename
    path.parent.mkdir(parents=True, exist_ok=True)
    async with aiofiles.open(path, "wb") as f:
        await f.write(content)
    return filename


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

@router.post("/register/technician", status_code=201)
async def register_technician(
    request: Request,
    name: str = Form(...),
    cpf: str = Form(...),
    email: str = Form(...),
    phone: str = Form(...),
    password: str = Form(...),
    zip_code: str = Form(...),
    street: str = Form(...),
    number: str = Form(...),
    complement: Optional[str] = Form(None),
    neighborhood: str = Form(...),
    city: str = Form(...),
    state: str = Form(...),
    ref_name: Optional[str] = Form(None),
    ref_contact: Optional[str] = Form(None),
    ref_type: Optional[str] = Form(None),
    selfie: UploadFile = File(...),
    proof_of_address: UploadFile = File(...),
    db=Depends(get_db),
):
    cpf_clean = re.sub(r"\D", "", cpf)
    if not validate_cpf(cpf_clean):
        raise HTTPException(400, "CPF inválido.")
    if len(password) < 8:
        raise HTTPException(400, "Senha deve ter no mínimo 8 caracteres.")

    existing = await db.technicians.find_one({"$or": [{"cpf": cpf_clean}, {"email": email.lower()}]})
    if existing:
        field = "CPF" if existing.get("cpf") == cpf_clean else "e-mail"
        raise HTTPException(400, f"Já existe um cadastro com este {field}.")

    selfie_filename = await save_upload(selfie, "selfie")
    proof_filename = await save_upload(proof_of_address, "prova_end")

    client_ip = request.client.host if request.client else "unknown"

    doc = TechnicianDB(
        name=name.strip(),
        cpf=cpf_clean,
        email=email.lower().strip(),
        phone=re.sub(r"\D", "", phone),
        password_hash=hash_password(password),
        address=Address(
            zip_code=re.sub(r"\D", "", zip_code),
            street=street.strip(),
            number=number.strip(),
            complement=complement.strip() if complement else None,
            neighborhood=neighborhood.strip(),
            city=city.strip(),
            state=state.upper().strip(),
        ),
        selfie_filename=selfie_filename,
        proof_of_address_filename=proof_filename,
        commercial_reference=CommercialReference(
            name=ref_name.strip(),
            contact=ref_contact.strip(),
            type=ref_type,
        ) if ref_name and ref_contact and ref_type else None,
        terms_accepted_at=datetime.utcnow(),
        terms_ip=client_ip,
    ).model_dump()

    result = await db.technicians.insert_one(doc)
    return {"id": str(result.inserted_id), "message": "Cadastro enviado para análise. Você receberá uma resposta em até 48 horas."}


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

    address = Address(
        zip_code=re.sub(r"\D", "", body.zip_code),
        street=body.street.strip(),
        number=body.number.strip(),
        complement=body.complement.strip() if body.complement else None,
        neighborhood=body.neighborhood.strip(),
        city=body.city.strip(),
        state=body.state.upper().strip(),
    )

    doc = ClientDB(
        name=body.name.strip(),
        email=email,
        phone=re.sub(r"\D", "", body.phone),
        password_hash=hash_password(body.password),
        address=address,
    ).model_dump()

    result = await db.clients.insert_one(doc)
    return {"id": str(result.inserted_id), "message": "Conta criada com sucesso!"}


@router.post("/login/client", response_model=LoginResponse)
async def login_client(body: LoginRequest, db=Depends(get_db)):
    client = await db.clients.find_one({"email": body.email.lower()})
    if not client or not verify_password(body.password, client["password_hash"]):
        raise HTTPException(400, "E-mail ou senha incorretos.")

    token = create_access_token({"sub": str(client["_id"]), "role": "client"})
    return LoginResponse(access_token=token, role="client", name=client["name"], status=client["status"])


# ── Admin ─────────────────────────────────────────────────────────────────────

@router.post("/login/admin", response_model=LoginResponse)
async def login_admin(body: LoginRequest):
    if body.email.lower() != settings.admin_email.lower() or body.password != settings.admin_password:
        raise HTTPException(400, "Credenciais inválidas.")

    token = create_access_token({"sub": "admin", "role": "admin"})
    return LoginResponse(access_token=token, role="admin", name="Admin")
