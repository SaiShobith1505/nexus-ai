from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.dependencies import current_user
from app.models import Agent, ExecutionLog, User
from app.schemas import ExecutionRead, ExecutionRequest
from app.services.agent_engine import engine
from app.services.notifications import notify_user

router = APIRouter(prefix="/executions", tags=["executions"])


@router.post("", response_model=ExecutionRead)
async def run_execution(payload: ExecutionRequest, user: User = Depends(current_user), db: AsyncSession = Depends(get_db)) -> ExecutionLog:
    agent = await db.get(Agent, payload.agent_id)
    if agent is None:
        raise HTTPException(status_code=404, detail="Agent not found")
    result = await engine.run(agent, payload.input)
    log = ExecutionLog(
        agent_id=agent.id,
        deployment_id=payload.deployment_id,
        user_id=user.id,
        status="completed",
        input=payload.input,
        steps=result.steps,
        output=result.output,
        tokens_used=result.tokens_used,
        cost_cents=result.cost_cents,
    )
    db.add(log)
    await notify_user(
        db,
        user.id,
        kind="execution.completed",
        title=f"{agent.name} completed",
        body="Execution report is ready in the playground.",
        data={"agent_id": str(agent.id)},
    )
    await db.commit()
    await db.refresh(log)
    return log


@router.get("", response_model=list[ExecutionRead])
async def list_executions(user: User = Depends(current_user), db: AsyncSession = Depends(get_db)) -> list[ExecutionLog]:
    return list((await db.scalars(select(ExecutionLog).where(ExecutionLog.user_id == user.id).order_by(ExecutionLog.created_at.desc()).limit(50))).all())
