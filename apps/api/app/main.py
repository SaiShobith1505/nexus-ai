import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from slowapi.util import get_remote_address
from sqlalchemy.exc import SQLAlchemyError

from app.core.config import settings
from app.core.logging import configure_logging
from app.db.session import AsyncSessionLocal
from app.routers import admin, agents, auth, billing, dashboard, executions, notifications
from app.seed import seed

limiter = Limiter(key_func=get_remote_address, default_limits=["120/minute"])


@asynccontextmanager
async def lifespan(_: FastAPI):
    configure_logging()
    async with AsyncSessionLocal() as db:
        try:
            await asyncio.wait_for(seed(db), timeout=3)
        except (SQLAlchemyError, TimeoutError, OSError):
            await db.rollback()
    yield


app = FastAPI(title=settings.app_name, version="1.0.0", lifespan=lifespan)
app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[str(settings.frontend_url), "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(_: Request, exc: RateLimitExceeded) -> JSONResponse:
    return JSONResponse(status_code=429, content={"detail": f"Rate limit exceeded: {exc.detail}"})


@app.exception_handler(SQLAlchemyError)
async def database_error_handler(_: Request, __: SQLAlchemyError) -> JSONResponse:
    return JSONResponse(status_code=500, content={"detail": "Database operation failed"})


@app.get("/health")
async def health() -> dict:
    return {"status": "healthy", "service": settings.app_name, "environment": settings.environment}


app.include_router(auth.router, prefix="/v1")
app.include_router(agents.router, prefix="/v1")
app.include_router(executions.router, prefix="/v1")
app.include_router(dashboard.router, prefix="/v1")
app.include_router(admin.router, prefix="/v1")
app.include_router(billing.router, prefix="/v1")
app.include_router(notifications.router, prefix="/v1")
