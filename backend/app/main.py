import asyncio
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.database import close_db, connect_db, get_db
from app.routes import admin, auth, calls
from app.routes.calls import stats_router
from app.routes import technician as technician_routes


async def _dispatch_background():
    from app.dispatch import expire_and_dispatch
    while True:
        await asyncio.sleep(10)
        try:
            db = get_db()
            if db is not None:
                await expire_and_dispatch(db)
        except Exception:
            pass


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_db()
    task = asyncio.create_task(_dispatch_background())
    yield
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        pass
    await close_db()


app = FastAPI(title="UaiFix API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url, "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

uploads_path = Path(settings.uploads_dir)
uploads_path.mkdir(exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(uploads_path)), name="uploads")

app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(calls.router)
app.include_router(stats_router)
app.include_router(technician_routes.router)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "uaifix-api"}
