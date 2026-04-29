from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from app.core.config import settings

_client: AsyncIOMotorClient = None
_db: AsyncIOMotorDatabase = None


async def connect_db():
    global _client, _db
    _client = AsyncIOMotorClient(settings.mongo_url)
    _db = _client[settings.db_name]
    await _db.technicians.create_index("cpf", unique=True)
    await _db.technicians.create_index("email", unique=True)
    await _db.clients.create_index("email", unique=True)
    await _db.calls.create_index("client_id")
    await _db.calls.create_index("offered_to")
    await _db.calls.create_index([("status", 1), ("address.city", 1)])
    await _db.calls.create_index([("status", 1), ("offered_to", 1)])
    await _db.ratings.create_index("call_id")
    await _db.ratings.create_index("technician_id")


async def close_db():
    if _client:
        _client.close()


def get_db() -> AsyncIOMotorDatabase:
    return _db
