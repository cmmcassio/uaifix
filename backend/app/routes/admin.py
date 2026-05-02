from datetime import datetime
from typing import List, Optional

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query

from app.database import get_db
from app.routes.auth import get_current_admin
from app.schemas.technician import AdminRejectRequest, TechnicianDetailResponse, TechnicianResponse
from app.core.config import settings

router = APIRouter(prefix="/admin", tags=["admin"])


def _tech_response(t: dict) -> TechnicianResponse:
    return TechnicianResponse(
        id=str(t["_id"]),
        name=t["name"],
        cpf=t["cpf"],
        email=t["email"],
        phone=t["phone"],
        status=t["status"],
        city=t["address"]["city"],
        created_at=t["created_at"],
    )


def _tech_detail_response(t: dict, base_url: str) -> TechnicianDetailResponse:
    def upload_url(filename: Optional[str]) -> Optional[str]:
        if not filename:
            return None
        if filename.startswith("http"):
            return filename
        return f"{base_url}/uploads/{filename}"

    return TechnicianDetailResponse(
        id=str(t["_id"]),
        name=t["name"],
        cpf=t["cpf"],
        email=t["email"],
        phone=t["phone"],
        address=t["address"],
        commercial_reference=t["commercial_reference"],
        selfie_url=upload_url(t.get("selfie_filename")),
        proof_of_address_url=upload_url(t.get("proof_of_address_filename")),
        terms_accepted_at=t["terms_accepted_at"],
        status=t["status"],
        rejection_reason=t.get("rejection_reason"),
        approved_at=t.get("approved_at"),
        rejected_at=t.get("rejected_at"),
        created_at=t["created_at"],
    )


@router.get("/technicians", response_model=List[TechnicianResponse])
async def list_technicians(
    status: Optional[str] = Query(None, description="pending | approved | rejected"),
    _admin=Depends(get_current_admin),
    db=Depends(get_db),
):
    query = {}
    if status:
        query["status"] = status
    cursor = db.technicians.find(query).sort("created_at", -1)
    techs = await cursor.to_list(length=200)
    return [_tech_response(t) for t in techs]


@router.get("/technicians/{tech_id}", response_model=TechnicianDetailResponse)
async def get_technician(
    tech_id: str,
    _admin=Depends(get_current_admin),
    db=Depends(get_db),
):
    try:
        oid = ObjectId(tech_id)
    except Exception:
        raise HTTPException(400, "ID inválido")

    tech = await db.technicians.find_one({"_id": oid})
    if not tech:
        raise HTTPException(404, "Técnico não encontrado")

    return _tech_detail_response(tech, settings.backend_url.rstrip("/"))


@router.post("/technicians/{tech_id}/approve")
async def approve_technician(
    tech_id: str,
    _admin=Depends(get_current_admin),
    db=Depends(get_db),
):
    try:
        oid = ObjectId(tech_id)
    except Exception:
        raise HTTPException(400, "ID inválido")

    result = await db.technicians.update_one(
        {"_id": oid, "status": "pending"},
        {
            "$set": {
                "status": "approved",
                "approved_at": datetime.utcnow(),
                "reviewed_by": "admin",
                "trial_started_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
            }
        },
    )
    if result.matched_count == 0:
        raise HTTPException(404, "Técnico pendente não encontrado")
    return {"message": "Técnico aprovado com sucesso"}


@router.post("/technicians/{tech_id}/reject")
async def reject_technician(
    tech_id: str,
    body: AdminRejectRequest,
    _admin=Depends(get_current_admin),
    db=Depends(get_db),
):
    try:
        oid = ObjectId(tech_id)
    except Exception:
        raise HTTPException(400, "ID inválido")

    result = await db.technicians.update_one(
        {"_id": oid, "status": "pending"},
        {
            "$set": {
                "status": "rejected",
                "rejection_reason": body.reason,
                "rejected_at": datetime.utcnow(),
                "reviewed_by": "admin",
                "updated_at": datetime.utcnow(),
            }
        },
    )
    if result.matched_count == 0:
        raise HTTPException(404, "Técnico pendente não encontrado")
    return {"message": "Técnico reprovado"}
