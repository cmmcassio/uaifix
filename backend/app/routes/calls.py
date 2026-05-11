import re
from datetime import date, datetime, time as time_type, timedelta
from typing import List, Optional

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query

from app.database import get_db
from app.dispatch import (
    _auto_rate_completed_calls,
    _is_eligible,
    _assign_offer,
    _update_tech_avg_rating,
    _warn_technician,
    trigger_dispatch_for_call,
)
from app.models.call import ServiceCallDB
from app.models.rating import RatingDB
from app.models.technician import Address
from app.routes.auth import get_current_client, get_current_technician
from app.schemas.call import (
    VALID_APPLIANCE_TYPES,
    CallDetailResponse,
    CallSummaryResponse,
    CreateCallRequest,
)
from app.schemas.rating import RateCallRequest

router = APIRouter(prefix="/calls", tags=["calls"])
stats_router = APIRouter(prefix="/stats", tags=["stats"])


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
        offer_expires_at=c.get("offer_expires_at"),
        created_at=c["created_at"],
    )


def _detail(c: dict, tech_data: Optional[dict] = None) -> CallDetailResponse:
    addr = c.get("address", {})
    tech = tech_data or {}
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
        technician_photo_url=tech.get("profile_photo_url"),
        technician_avg_rating=tech.get("avg_rating"),
        technician_ratings_count=tech.get("ratings_count", 0),
        technician_calls_completed=tech.get("calls_completed", 0),
        technician_phone=tech.get("phone"),
        technician_payment_methods=tech.get("payment_methods", []),
        accepted_at=c.get("accepted_at"),
        completed_at=c.get("completed_at"),
        rated_by_client=c.get("rated_by_client", False),
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

    # Auto-avalia chamados concluídos há mais de 24h antes de verificar pendências
    await _auto_rate_completed_calls(db, datetime.utcnow())

    # Bloqueia se há chamado concluído sem avaliação (< 24h)
    pending_rating = await db.calls.find_one({
        "client_id": str(client["_id"]),
        "status": "completed",
        "rated_by_client": {"$ne": True},
    })
    if pending_rating:
        raise HTTPException(400, "Avalie o último atendimento antes de abrir um novo chamado.")

    existing = await db.calls.find_one({
        "client_id": str(client["_id"]),
        "status": {"$in": ["open", "accepted", "in_progress", "no_technician_available"]},
    })
    if existing:
        raise HTTPException(400, "Você já tem um chamado em aberto. Cancele-o antes de abrir outro.")

    doc = ServiceCallDB(
        client_id=str(client["_id"]),
        client_name=client["name"],
        client_phone=client["phone"],
        appliance_type=body.appliance_type,
        brand=body.brand.strip(),
        symptom=body.symptom.strip(),
        description=body.description.strip() if body.description else None,
        address=Address(
            zip_code=body.zip_code,
            street=body.street.strip(),
            number=body.number.strip(),
            complement=body.complement.strip() if body.complement else None,
            neighborhood=body.neighborhood.strip(),
            city=body.city.strip(),
            state=body.state.upper().strip(),
        ),
    ).model_dump()

    result = await db.calls.insert_one(doc)
    call_id = str(result.inserted_id)

    await trigger_dispatch_for_call(db, call_id)

    return {"id": call_id, "message": "Chamado aberto! Buscando técnico na sua região."}


@router.get("/my", response_model=List[CallDetailResponse])
async def my_calls(
    client=Depends(get_current_client),
    db=Depends(get_db),
):
    cursor = db.calls.find({"client_id": str(client["_id"])}).sort("created_at", -1).limit(20)
    calls = await cursor.to_list(length=20)

    tech_ids = list({c["technician_id"] for c in calls
                     if c.get("technician_id") and c.get("status") in ("accepted", "in_progress")})
    tech_data_map: dict = {}
    if tech_ids:
        techs = await db.technicians.find(
            {"_id": {"$in": [ObjectId(tid) for tid in tech_ids]}},
            {"_id": 1, "profile_photo_url": 1, "avg_rating": 1, "ratings_count": 1,
             "phone": 1, "payment_methods": 1},
        ).to_list(length=len(tech_ids))
        for t in techs:
            tech_data_map[str(t["_id"])] = dict(t)
        for tid in tech_ids:
            count = await db.calls.count_documents({"technician_id": tid, "status": "completed"})
            if tid in tech_data_map:
                tech_data_map[tid]["calls_completed"] = count

    return [_detail(c, tech_data_map.get(c.get("technician_id"))) for c in calls]


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

    blocked = await db.calls.find_one({
        "_id": oid,
        "client_id": str(client["_id"]),
        "status": {"$in": ["accepted", "on_the_way", "arrived"]},
    })
    if blocked:
        raise HTTPException(400, "Não é possível cancelar após o técnico aceitar. Entre em contato com o suporte.")

    result = await db.calls.update_one(
        {"_id": oid, "client_id": str(client["_id"]),
         "status": {"$in": ["open", "no_technician_available"]}},
        {"$set": {
            "status": "cancelled",
            "cancelled_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        }},
    )
    if result.matched_count == 0:
        raise HTTPException(400, "Chamado não pode ser cancelado.")

    return {"message": "Chamado cancelado."}


@router.post("/{call_id}/retry")
async def retry_call(
    call_id: str,
    client=Depends(get_current_client),
    db=Depends(get_db),
):
    try:
        oid = ObjectId(call_id)
    except Exception:
        raise HTTPException(400, "ID inválido.")

    now = datetime.utcnow()
    result = await db.calls.update_one(
        {"_id": oid, "client_id": str(client["_id"]), "status": "no_technician_available"},
        {"$set": {
            "status": "open",
            "declined_by": [],
            "offered_to": None,
            "offer_expires_at": None,
            "no_technician_at": None,
            "updated_at": now,
        }},
    )
    if result.matched_count == 0:
        raise HTTPException(400, "Chamado não pode ser reaberto.")

    await trigger_dispatch_for_call(db, call_id)
    return {"message": "Buscando técnicos novamente..."}


@router.post("/{call_id}/rate")
async def rate_call(
    call_id: str,
    body: RateCallRequest,
    client=Depends(get_current_client),
    db=Depends(get_db),
):
    try:
        oid = ObjectId(call_id)
    except Exception:
        raise HTTPException(400, "ID inválido.")

    call = await db.calls.find_one({
        "_id": oid,
        "client_id": str(client["_id"]),
        "status": "completed",
    })
    if not call:
        raise HTTPException(404, "Chamado concluído não encontrado.")
    if call.get("rated_by_client"):
        raise HTTPException(400, "Este chamado já foi avaliado.")
    if not call.get("technician_id"):
        raise HTTPException(400, "Chamado sem técnico para avaliar.")

    rating_doc = RatingDB(
        call_id=str(call["_id"]),
        client_id=str(client["_id"]),
        technician_id=call["technician_id"],
        stars=body.stars,
        comment=body.comment.strip() if body.comment else None,
        is_auto=False,
    ).model_dump()

    await db.ratings.insert_one(rating_doc)
    await db.calls.update_one(
        {"_id": oid},
        {"$set": {"rated_by_client": True, "updated_at": datetime.utcnow()}},
    )
    await _update_tech_avg_rating(db, call["technician_id"])

    return {"message": "Avaliação enviada. Obrigado!"}


# ── Técnico ───────────────────────────────────────────────────────────────────

@router.get("/available", response_model=List[CallSummaryResponse])
async def available_calls(
    technician=Depends(get_current_technician),
    db=Depends(get_db),
):
    if technician.get("status") != "approved":
        raise HTTPException(403, "Apenas técnicos aprovados podem ver chamados disponíveis.")

    now = datetime.utcnow()
    suspended_until = technician.get("suspended_until")
    if suspended_until and now < suspended_until:
        return []

    tech_city = (technician.get("address") or {}).get("city", "")
    if not tech_city:
        return []

    tech_id = str(technician["_id"])
    city_pattern = re.compile(f"^{re.escape(tech_city)}$", re.IGNORECASE)

    cursor = db.calls.find({
        "status": "open",
        "offered_to": "all",
        "offer_expires_at": {"$gt": now},
        "address.city": {"$regex": city_pattern},
        "declined_by": {"$nin": [tech_id]},
    }).sort("created_at", -1)
    calls = await cursor.to_list(length=10)
    return [_summary(c) for c in calls]


@router.get("/my-jobs", response_model=List[CallDetailResponse])
async def my_jobs(
    technician=Depends(get_current_technician),
    db=Depends(get_db),
):
    if technician.get("status") != "approved":
        raise HTTPException(403, "Acesso negado.")

    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    cursor = db.calls.find({
        "technician_id": str(technician["_id"]),
        "$or": [
            {"status": {"$in": ["accepted", "on_the_way", "arrived", "in_progress"]}},
            {"status": "completed", "completed_at": {"$gte": thirty_days_ago}},
        ],
    }).sort("completed_at", -1).limit(50)
    calls = await cursor.to_list(length=50)
    return [_detail(c) for c in calls]


@router.post("/{call_id}/accept")
async def accept_call(
    call_id: str,
    technician=Depends(get_current_technician),
    db=Depends(get_db),
):
    if technician.get("status") != "approved":
        raise HTTPException(403, "Apenas técnicos aprovados podem aceitar chamados.")

    if not _is_eligible(technician, datetime.utcnow()):
        raise HTTPException(403, "Seu período de trial expirou. Assine para continuar recebendo chamados.")

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

    now = datetime.utcnow()
    result = await db.calls.update_one(
        {
            "_id": oid,
            "status": "open",
            "offered_to": "all",
            "offer_expires_at": {"$gt": now},
        },
        {"$set": {
            "status": "accepted",
            "technician_id": str(technician["_id"]),
            "technician_name": technician["name"],
            "offered_to": str(technician["_id"]),
            "accepted_at": now,
            "updated_at": now,
        }},
    )
    if result.matched_count == 0:
        existing = await db.calls.find_one({"_id": oid})
        if existing and existing.get("status") == "accepted":
            raise HTTPException(400, "Chamado já foi aceito por outro técnico.")
        raise HTTPException(400, "Chamado não está mais disponível ou oferta expirou.")

    await db.technicians.update_one(
        {"_id": technician["_id"]},
        {"$inc": {"trial_calls_accepted": 1}},
    )

    return {"message": "Chamado aceito! Entre em contato com o cliente para agendar o atendimento."}


@router.post("/{call_id}/complete")
async def complete_call(
    call_id: str,
    technician=Depends(get_current_technician),
    db=Depends(get_db),
):
    try:
        oid = ObjectId(call_id)
    except Exception:
        raise HTTPException(400, "ID inválido.")

    result = await db.calls.update_one(
        {
            "_id": oid,
            "technician_id": str(technician["_id"]),
            "status": {"$in": ["accepted", "on_the_way", "arrived", "in_progress"]},
        },
        {"$set": {
            "status": "completed",
            "completed_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        }},
    )
    if result.matched_count == 0:
        raise HTTPException(400, "Chamado não encontrado ou não pode ser concluído.")

    await db.technicians.update_one(
        {"_id": technician["_id"]},
        {"$inc": {"calls_completed_count": 1}},
    )

    return {"message": "Chamado concluído com sucesso!"}


@router.post("/{call_id}/on-the-way")
async def on_the_way(
    call_id: str,
    technician=Depends(get_current_technician),
    db=Depends(get_db),
):
    try:
        oid = ObjectId(call_id)
    except Exception:
        raise HTTPException(400, "ID inválido.")

    now = datetime.utcnow()
    result = await db.calls.update_one(
        {"_id": oid, "technician_id": str(technician["_id"]), "status": "accepted"},
        {"$set": {"status": "on_the_way", "on_the_way_at": now, "updated_at": now}},
    )
    if result.matched_count == 0:
        raise HTTPException(400, "Chamado não encontrado ou status inválido.")
    return {"message": "Status atualizado: a caminho."}


@router.post("/{call_id}/arrived")
async def arrived(
    call_id: str,
    technician=Depends(get_current_technician),
    db=Depends(get_db),
):
    try:
        oid = ObjectId(call_id)
    except Exception:
        raise HTTPException(400, "ID inválido.")

    now = datetime.utcnow()
    result = await db.calls.update_one(
        {"_id": oid, "technician_id": str(technician["_id"]), "status": "on_the_way"},
        {"$set": {"status": "arrived", "arrived_at": now, "updated_at": now}},
    )
    if result.matched_count == 0:
        raise HTTPException(400, "Chamado não encontrado ou status inválido.")
    return {"message": "Status atualizado: chegou no local."}


TECHNICIAN_CANCEL_REASONS = {
    "client_no_answer",
    "part_unavailable",
    "wrong_problem",
    "cannot_go",
    "gave_up",
}
TECHNICIAN_CANCEL_PENALTY = {"cannot_go", "gave_up"}


@router.post("/{call_id}/technician-cancel")
async def technician_cancel_call(
    call_id: str,
    body: dict,
    technician=Depends(get_current_technician),
    db=Depends(get_db),
):
    reason = (body.get("reason") or "").strip()
    if reason not in TECHNICIAN_CANCEL_REASONS:
        raise HTTPException(400, "Motivo de cancelamento inválido.")

    try:
        oid = ObjectId(call_id)
    except Exception:
        raise HTTPException(400, "ID inválido.")

    now = datetime.utcnow()
    result = await db.calls.update_one(
        {
            "_id": oid,
            "technician_id": str(technician["_id"]),
            "status": {"$in": ["accepted", "on_the_way", "arrived", "in_progress"]},
        },
        {"$set": {
            "status": "open",
            "technician_id": None,
            "technician_name": None,
            "accepted_at": None,
            "on_the_way_at": None,
            "arrived_at": None,
            "offered_to": "all",
            "offer_expires_at": now + timedelta(minutes=10),
            "declined_by": [],
            "cancel_reason": reason,
            "updated_at": now,
        }},
    )
    if result.matched_count == 0:
        raise HTTPException(400, "Chamado não encontrado ou não pode ser cancelado.")

    if reason in TECHNICIAN_CANCEL_PENALTY:
        from app.dispatch import _warn_technician
        await _warn_technician(db, str(technician["_id"]), now)
        if reason == "gave_up":
            try:
                await db.technicians.update_one(
                    {"_id": technician["_id"], "$or": [
                        {"suspended_until": None},
                        {"suspended_until": {"$lt": now + timedelta(hours=24)}},
                    ]},
                    {"$set": {"suspended_until": now + timedelta(hours=24), "updated_at": now}},
                )
            except Exception:
                pass

    return {"message": "Atendimento cancelado. O chamado voltou para a fila."}


@router.post("/{call_id}/decline")
async def decline_call(
    call_id: str,
    technician=Depends(get_current_technician),
    db=Depends(get_db),
):
    try:
        oid = ObjectId(call_id)
    except Exception:
        raise HTTPException(400, "ID inválido.")

    now = datetime.utcnow()
    result = await db.calls.update_one(
        {
            "_id": oid,
            "status": "open",
            "offered_to": str(technician["_id"]),
        },
        {
            "$push": {"declined_by": str(technician["_id"])},
            "$set": {
                "offered_to": None,
                "offer_expires_at": None,
                "updated_at": now,
            },
        },
    )
    if result.matched_count == 0:
        raise HTTPException(400, "Oferta não encontrada ou já expirada.")

    # Despacha imediatamente para o próximo técnico
    call = await db.calls.find_one({"_id": oid, "status": "open"})
    if call:
        await _assign_offer(db, call, now)

    return {"message": "Chamado recusado."}


# ── Stats (público) ───────────────────────────────────────────────────────────

@stats_router.get("/technicians")
async def technician_stats(db=Depends(get_db)):
    count = await db.technicians.count_documents({"status": "approved"})
    return {"approved_technicians": count}


@stats_router.get("/pricing")
async def pricing_stats(
    appliance: str = Query(None),
    db=Depends(get_db),
):
    techs = await db.technicians.find(
        {"status": "approved", "pricing": {"$ne": None}}
    ).to_list(length=500)

    result = {"count": len(techs), "diagnostic": None, "repair": None}

    diag_values = [
        (t["pricing"]["diagnostic_fee"]["min"], t["pricing"]["diagnostic_fee"]["max"])
        for t in techs
        if (t.get("pricing") or {}).get("diagnostic_fee")
    ]
    if diag_values:
        result["diagnostic"] = {
            "min": min(v[0] for v in diag_values),
            "max": max(v[1] for v in diag_values),
        }

    if appliance in ("refrigerator", "washing_machine"):
        key = f"repair_{appliance}"
        repair_values = [
            (t["pricing"][key]["min"], t["pricing"][key]["max"])
            for t in techs
            if (t.get("pricing") or {}).get(key)
        ]
        if repair_values:
            result["repair"] = {
                "min": min(v[0] for v in repair_values),
                "max": max(v[1] for v in repair_values),
            }

    return result
