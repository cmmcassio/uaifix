import io
from datetime import datetime

import cloudinary.uploader
import app.core.cloudinary_config  # noqa: F401

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from app.database import get_db
from app.routes.auth import get_current_technician, upload_to_cloudinary
from app.schemas.technician import PricingResponse, UpdatePricingRequest

router = APIRouter(prefix="/technician", tags=["technician"])


@router.put("/profile-photo")
async def update_profile_photo(
    photo: UploadFile = File(...),
    technician=Depends(get_current_technician),
    db=Depends(get_db),
):
    url = await upload_to_cloudinary(photo, folder="uaifix/profiles")
    await db.technicians.update_one(
        {"_id": technician["_id"]},
        {"$set": {"profile_photo_url": url, "updated_at": datetime.utcnow()}},
    )
    return {"profile_photo_url": url}


@router.get("/pricing", response_model=PricingResponse)
async def get_pricing(
    technician=Depends(get_current_technician),
    db=Depends(get_db),
):
    tech = await db.technicians.find_one({"_id": technician["_id"]})
    pricing = tech.get("pricing") or {}
    return PricingResponse(
        diagnostic_fee=pricing.get("diagnostic_fee"),
        repair_refrigerator=pricing.get("repair_refrigerator"),
        repair_washing_machine=pricing.get("repair_washing_machine"),
    )


@router.put("/pricing", response_model=PricingResponse)
async def update_pricing(
    body: UpdatePricingRequest,
    technician=Depends(get_current_technician),
    db=Depends(get_db),
):
    pricing_dict = {}
    if body.diagnostic_fee:
        pricing_dict["diagnostic_fee"] = body.diagnostic_fee.model_dump()
    if body.repair_refrigerator:
        pricing_dict["repair_refrigerator"] = body.repair_refrigerator.model_dump()
    if body.repair_washing_machine:
        pricing_dict["repair_washing_machine"] = body.repair_washing_machine.model_dump()

    await db.technicians.update_one(
        {"_id": technician["_id"]},
        {"$set": {"pricing": pricing_dict, "updated_at": datetime.utcnow()}},
    )
    return PricingResponse(**pricing_dict)
