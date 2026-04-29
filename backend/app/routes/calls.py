import re
from datetime import date, datetime, time as time_type
from typing import List

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException

from app.database import get_db
from app.models.call import ServiceCallDB
from app.models.technician import Address
from app.routes.auth import get_current_client, get_current_technician
from app.schemas.call import (
    VALID_APPLIANCE_TYPES,
    CallDetailResponse,
    CallSummaryResponse,
    CreateCallRequest,
)

router = APIRouter(prefix="/calls", tags=["calls"])


def _summary(c: dict) -> CallSummaryResponse:
    addr = c.get("address", {})
    return CallSummaryResponse(
        id=str(c["_id"]),
        appliance_type=c["appliance_type"],
        brand=c["brand"],
        symptom=c["symptom"],
        description=c.get("description"),
        status=c["status"],
        neighborhood=addr.get("neighborhood", ""),
        city=addr.get("city", ""),
        technician_name=c.get("technician_name"),
        accepted_at=c.get("accepted_at"),
        created_at=c["created_at"],
    )


def _detail(c: dict) -> CallDetailResponse:
    addr = c.get("address", {})
    return CallDetailResponse(
        id=str(c["_id"]),
        appliance_type=c["appliance_type"],
        brand=c["brand"],
        symptom=c["symptom"],
        description=c.get("description"),
        status=c["status"],
        neighborhood=addr.get("neighborhood", ""),
        city=addr.get("city", ""),
        street=addr.get("street", ""),
        number=addr.get("number", ""),
        complement=addr.get("complement"),
        client_name=c.get("client_name", ""),
        client_phone=c.get("client_phone", ""),
        technician_name=c.get("technician_name"),
        accepted_at=c.get("accepted_at"),
        completed_at=c.get("completed_at"),
        created_at=c["created_at"],
    )


# ── Cliente ───────────────────────────────────────────────────────────────────

@router.post("", status_code=201)
async def create_call(
    body: CreateCallRequest,
    client=Depends(get_current_client),
    db=Depends(get_db),
):
    if body.appliance_type not in VALID_APPLIANCE_TYPES:
        raise HTTPException(400, "Tipo de aparelho inválido.")
    if not body.brand.strip():
        raise HTTPException(400, "Informe a marca do aparelho.")
    if not body.symptom.strip():
        raise HTTPException(400, "Informe o problema do aparelho.")

    existing = await db.calls.find_one({
        "client_id": str(client["_id"]),
        "status": {"$in": ["open", "accepted", "in_progress"]},
    })
    if existing:
        raise HTTPException(400, "Você já tem um chamado em aberto. Cancele-o antes de abrir outro.")

    address_dict = client.get("address")
    if not address_dict:
        raise HTTPException(400, "Cadastre um endereço na sua conta antes de abrir um chamado.")

    doc = ServiceCallDB(
        client_id=str(client["_id"]),
        client_name=client["name"],
        client_phone=client["phone"],
        appliance_type=body.appliance_type,
        brand=body.brand.strip(),
        symptom=body.symptom.strip(),
        description=body.description.strip() if body.description else None,
        address=Address(**address_dict),
    ).model_dump()

    result = await db.calls.insert_one(doc)
    return {"id": str(result.inserted_id), "message": "Chamado aberto! Buscando técnico na sua região."}


@router.get("/my", response_model=List[CallDetailResponse])
async def my_calls(
    client=Depends(get_current_client),
    db=Depends(get_db),
):
    cursor = db.calls.find({"client_id": str(client["_id"])}).sort("created_at", -1).limit(20)
    calls = await cursor.to_list(length=20)
    return [_detail(c) for c in calls]


@router.post("/{call_id}/cancel")
async def cancel_call(
    call_id: str,
    client=Depends(get_current_client),
    db=Depends(get_db),
):
    try:
        oid = ObjectId(call_id)
    except Exception:
        raise HTTPException(400, "ID inválido.")

    result = await db.calls.update_one(
        {"_id": oid, "client_id": str(client["_id"]), "status": "open"},
        {"$set": {
            "status": "cancelled",
            "cancelled_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        }},
    )
    if result.matched_count == 0:
        raise HTTPException(400, "Chamado não pode ser cancelado.")

    return {"message": "Chamado cancelado."}


# ── Técnico ───────────────────────────────────────────────────────────────────

@router.get("/available", response_model=List[CallSummaryResponse])
async def available_calls(
    technician=Depends(get_current_technician),
    db=Depends(get_db),
):
    if technician.get("status") != "approved":
        raise HTTPException(403, "Apenas técnicos aprovados podem ver chamados disponíveis.")

    tech_city = (technician.get("address") or {}).get("city", "")
    if not tech_city:
        raise HTTPException(400, "Técnico sem cidade cadastrada.")

    city_pattern = re.compile(f"^{re.escape(tech_city)}$", re.IGNORECASE)
    cursor = db.calls.find(
        {"status": "open", "address.city": {"$regex": city_pattern}}
    ).sort("created_at", -1).limit(50)
    calls = await cursor.to_list(length=50)
    return [_summary(c) for c in calls]


@router.get("/my-jobs", response_model=List[CallDetailResponse])
async def my_jobs(
    technician=Depends(get_current_technician),
    db=Depends(get_db),
):
    if technician.get("status") != "approved":
        raise HTTPException(403, "Acesso negado.")

    cursor = db.calls.find({
        "technician_id": str(technician["_id"]),
        "status": {"$in": ["accepted", "in_progress"]},
    }).sort("accepted_at", -1).limit(20)
    calls = await cursor.to_list(length=20)
    return [_detail(c) for c in calls]


@router.post("/{call_id}/accept")
async def accept_call(
    call_id: str,
    technician=Depends(get_current_technician),
    db=Depends(get_db),
):
    if technician.get("status") != "approved":
        raise HTTPException(403, "Apenas técnicos aprovados podem aceitar chamados.")

    today_start = datetime.combine(date.today(), time_type.min)
    calls_today = await db.calls.count_documents({
        "technician_id": str(technician["_id"]),
        "accepted_at": {"$gte": today_start},
    })
    if calls_today >= 3:
        raise HTTPException(400, "Limite de 3 chamados por dia atingido. Tente novamente amanhã.")

    try:
        oid = ObjectId(call_id)
    except Exception:
        raise HTTPException(400, "ID inválido.")

    # Atualização atômica: só aceita se ainda estiver "open"
    result = await db.calls.update_one(
        {"_id": oid, "status": "open"},
        {"$set": {
            "status": "accepted",
            "technician_id": str(technician["_id"]),
            "technician_name": technician["name"],
            "accepted_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        }},
    )
    if result.matched_count == 0:
        raise HTTPException(400, "Chamado não está mais disponível.")

    return {"message": "Chamado aceito! Entre em contato com o cliente para agendar o atendimento."}
