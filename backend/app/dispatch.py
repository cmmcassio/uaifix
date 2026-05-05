import re
from datetime import datetime, timedelta

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

OFFER_DURATION_SECONDS = 120


def _is_eligible(tech: dict, now: datetime) -> bool:
    """Verifica se o técnico pode receber ofertas (trial válido ou assinatura ativa)."""
    suspended_until = tech.get("suspended_until")
    if suspended_until and now < suspended_until:
        return False

    trial_started = tech.get("trial_started_at")
    trial_calls = tech.get("trial_calls_accepted", 0)

    if trial_started:
        trial_end = trial_started + timedelta(days=30)
        if now < trial_end and trial_calls < 10:
            return True

    sub_expires = tech.get("subscription_expires_at")
    if sub_expires and now < sub_expires:
        return True

    return False


async def _assign_offer(db: AsyncIOMotorDatabase, call: dict, now: datetime):
    """Encontra o próximo técnico elegível via round-robin e atribui a oferta."""
    city = (call.get("address") or {}).get("city", "")
    if not city:
        return

    declined_by = call.get("declined_by", [])
    city_pattern = re.compile(f"^{re.escape(city)}$", re.IGNORECASE)

    declined_oids = []
    for tid in declined_by:
        try:
            declined_oids.append(ObjectId(tid))
        except Exception:
            pass

    cursor = db.technicians.find({
        "status": "approved",
        "address.city": {"$regex": city_pattern},
        "_id": {"$nin": declined_oids},
    }).sort("last_offered_at", 1)

    techs = await cursor.to_list(length=20)

    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

    for tech in techs:
        if not _is_eligible(tech, now):
            continue

        calls_today = await db.calls.count_documents({
            "technician_id": str(tech["_id"]),
            "accepted_at": {"$gte": today_start},
        })
        if calls_today >= 3:
            continue

        expires_at = now + timedelta(seconds=OFFER_DURATION_SECONDS)
        result = await db.calls.update_one(
            {"_id": call["_id"], "status": "open", "offered_to": None},
            {"$set": {
                "offered_to": str(tech["_id"]),
                "offer_expires_at": expires_at,
                "updated_at": now,
            }},
        )
        if result.modified_count > 0:
            await db.technicians.update_one(
                {"_id": tech["_id"]},
                {"$set": {"last_offered_at": now}},
            )
        return

    # Nenhum técnico elegível encontrado — marca se já recusaram o suficiente
    if len(declined_by) >= 3:
        await db.calls.update_one(
            {"_id": call["_id"], "status": "open"},
            {"$set": {
                "status": "no_technician_available",
                "no_technician_at": now,
                "updated_at": now,
            }},
        )


async def _expire_stale_offers(db: AsyncIOMotorDatabase, now: datetime):
    """Expira ofertas vencidas e devolve os chamados para a fila."""
    stale_calls = await db.calls.find({
        "status": "open",
        "offered_to": {"$ne": None},
        "offer_expires_at": {"$lt": now},
    }).to_list(length=100)

    for call in stale_calls:
        await db.calls.update_one(
            {"_id": call["_id"], "status": "open", "offered_to": call["offered_to"]},
            {
                "$push": {"declined_by": call["offered_to"]},
                "$set": {
                    "offered_to": None,
                    "offer_expires_at": None,
                    "updated_at": now,
                },
            },
        )


async def _auto_rate_completed_calls(db: AsyncIOMotorDatabase, now: datetime):
    """Avalia automaticamente com 3 estrelas chamados concluídos há mais de 24h sem avaliação."""
    cutoff = now - timedelta(hours=24)

    pending = await db.calls.find({
        "status": "completed",
        "rated_by_client": {"$ne": True},
        "completed_at": {"$lt": cutoff},
    }).to_list(length=100)

    for call in pending:
        existing = await db.ratings.find_one({"call_id": str(call["_id"])})
        if existing:
            await db.calls.update_one(
                {"_id": call["_id"]},
                {"$set": {"rated_by_client": True}},
            )
            continue

        tech_id = call.get("technician_id", "")
        if not tech_id:
            continue

        await db.ratings.insert_one({
            "call_id": str(call["_id"]),
            "client_id": call["client_id"],
            "technician_id": tech_id,
            "stars": 3,
            "comment": None,
            "is_auto": True,
            "created_at": now,
        })
        await db.calls.update_one(
            {"_id": call["_id"]},
            {"$set": {"rated_by_client": True}},
        )
        await _update_tech_avg_rating(db, tech_id)


async def _update_tech_avg_rating(db: AsyncIOMotorDatabase, technician_id: str):
    """Recalcula a média de avaliações do técnico."""
    ratings = await db.ratings.find({"technician_id": technician_id}).to_list(length=5000)
    if not ratings:
        return
    avg = sum(r["stars"] for r in ratings) / len(ratings)
    try:
        await db.technicians.update_one(
            {"_id": ObjectId(technician_id)},
            {"$set": {"avg_rating": round(avg, 2), "ratings_count": len(ratings)}},
        )
    except Exception:
        pass


async def _warn_technician(db: AsyncIOMotorDatabase, technician_id: str, now: datetime):
    """Adiciona advertência ao técnico e suspende por 48h ao atingir 3."""
    try:
        oid = ObjectId(technician_id)
    except Exception:
        return
    await db.technicians.update_one(
        {"_id": oid},
        {"$inc": {"warnings_count": 1}, "$set": {"updated_at": now}},
    )
    tech = await db.technicians.find_one({"_id": oid}, {"warnings_count": 1})
    if tech and tech.get("warnings_count", 0) >= 3:
        await db.technicians.update_one(
            {"_id": oid},
            {"$set": {"suspended_until": now + timedelta(hours=48), "updated_at": now}},
        )


async def _handle_abandoned_calls(db: AsyncIOMotorDatabase, now: datetime):
    """Detecta chamados em 'accepted' há mais de 60min sem progresso e penaliza o técnico."""
    cutoff = now - timedelta(minutes=60)
    abandoned = await db.calls.find({
        "status": "accepted",
        "accepted_at": {"$lt": cutoff},
    }).to_list(length=100)

    for call in abandoned:
        tech_id = call.get("technician_id", "")
        result = await db.calls.update_one(
            {"_id": call["_id"], "status": "accepted"},
            {
                "$set": {
                    "status": "open",
                    "technician_id": None,
                    "technician_name": None,
                    "accepted_at": None,
                    "offered_to": None,
                    "offer_expires_at": None,
                    "updated_at": now,
                },
                "$push": {"declined_by": tech_id},
            },
        )
        if result.modified_count > 0 and tech_id:
            await _warn_technician(db, tech_id, now)
            call_updated = await db.calls.find_one({"_id": call["_id"], "status": "open"})
            if call_updated:
                await _assign_offer(db, call_updated, now)


async def expire_and_dispatch(db: AsyncIOMotorDatabase):
    """Ciclo principal: expira ofertas vencidas, atribui novas e auto-avalia chamados antigos."""
    now = datetime.utcnow()
    await _handle_abandoned_calls(db, now)
    await _expire_stale_offers(db, now)

    unassigned = await db.calls.find({
        "status": "open",
        "offered_to": None,
    }).to_list(length=50)

    for call in unassigned:
        await _assign_offer(db, call, now)

    await _auto_rate_completed_calls(db, now)


async def trigger_dispatch_for_call(db: AsyncIOMotorDatabase, call_id: str):
    """Dispara o despacho imediatamente para um chamado recém-criado."""
    try:
        oid = ObjectId(call_id)
    except Exception:
        return
    call = await db.calls.find_one({"_id": oid, "status": "open", "offered_to": None})
    if call:
        await _assign_offer(db, call, datetime.utcnow())
