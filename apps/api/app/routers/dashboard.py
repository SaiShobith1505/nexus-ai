from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.dependencies import current_user
from app.models import Agent, AnalyticsEvent, ExecutionLog, User

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary")
async def dashboard_summary(user: User = Depends(current_user), db: AsyncSession = Depends(get_db)) -> dict:
    agents = await db.scalar(select(func.count(Agent.id)).where(Agent.owner_id == user.id))
    executions = await db.scalar(select(func.count(ExecutionLog.id)).where(ExecutionLog.user_id == user.id))
    tokens = await db.scalar(select(func.coalesce(func.sum(ExecutionLog.tokens_used), 0)).where(ExecutionLog.user_id == user.id))
    revenue = await db.scalar(select(func.coalesce(func.sum(AnalyticsEvent.value_cents), 0)))
    recent = (await db.scalars(select(ExecutionLog).where(ExecutionLog.user_id == user.id).order_by(ExecutionLog.created_at.desc()).limit(8))).all()
    return {
        "agents": agents or 0,
        "executions": executions or 0,
        "tokens": tokens or 0,
        "revenue_cents": revenue or 0,
        "activity": [
            {"id": str(item.id), "status": item.status, "tokens": item.tokens_used, "created_at": item.created_at.isoformat()}
            for item in recent
        ],
    }
