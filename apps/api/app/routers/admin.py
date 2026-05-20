from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.dependencies import require_role
from app.models import Agent, Report, User

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/users")
async def users(_: User = Depends(require_role("admin")), db: AsyncSession = Depends(get_db)) -> list[dict]:
    rows = (await db.scalars(select(User).order_by(User.created_at.desc()).limit(100))).all()
    return [{"id": str(user.id), "email": user.email, "name": user.name, "role": user.role, "active": user.is_active} for user in rows]


@router.patch("/users/{user_id}/ban")
async def ban_user(user_id: str, _: User = Depends(require_role("admin")), db: AsyncSession = Depends(get_db)) -> dict:
    user = await db.get(User, user_id)
    if user:
        user.is_active = False
        await db.commit()
    return {"status": "ok"}


@router.get("/agents")
async def agents(_: User = Depends(require_role("admin")), db: AsyncSession = Depends(get_db)) -> list[dict]:
    rows = (await db.scalars(select(Agent).order_by(Agent.created_at.desc()).limit(100))).all()
    return [{"id": str(agent.id), "name": agent.name, "published": agent.is_published, "rating": float(agent.rating)} for agent in rows]


@router.get("/reports")
async def reports(_: User = Depends(require_role("admin")), db: AsyncSession = Depends(get_db)) -> list[dict]:
    rows = (await db.scalars(select(Report).order_by(Report.created_at.desc()).limit(100))).all()
    return [{"id": str(report.id), "reason": report.reason, "status": report.status, "details": report.details} for report in rows]
