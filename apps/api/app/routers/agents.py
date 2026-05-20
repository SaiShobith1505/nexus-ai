from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.dependencies import current_user
from app.models import Agent, AnalyticsEvent, Deployment, Review, User
from app.schemas import AgentCreate, AgentRead, DeploymentCreate, ReviewCreate

router = APIRouter(prefix="/agents", tags=["agents"])


@router.get("", response_model=list[AgentRead])
async def list_agents(
    db: AsyncSession = Depends(get_db),
    q: str | None = None,
    category: str | None = None,
    featured: bool | None = None,
    limit: int = Query(24, ge=1, le=100),
    offset: int = Query(0, ge=0),
) -> list[Agent]:
    stmt = select(Agent).where(Agent.is_published.is_(True))
    if q:
        stmt = stmt.where(Agent.name.ilike(f"%{q}%") | Agent.summary.ilike(f"%{q}%"))
    if category:
        stmt = stmt.where(Agent.category == category)
    if featured is not None:
        stmt = stmt.where(Agent.is_featured.is_(featured))
    stmt = stmt.order_by(Agent.is_featured.desc(), Agent.rating.desc(), Agent.created_at.desc()).limit(limit).offset(offset)
    return list((await db.scalars(stmt)).all())


@router.post("", response_model=AgentRead)
async def create_agent(payload: AgentCreate, user: User = Depends(current_user), db: AsyncSession = Depends(get_db)) -> Agent:
    agent = Agent(owner_id=user.id, **payload.model_dump())
    db.add(agent)
    await db.commit()
    await db.refresh(agent)
    return agent


@router.get("/{agent_id}", response_model=AgentRead)
async def get_agent(agent_id: UUID, db: AsyncSession = Depends(get_db)) -> Agent:
    agent = await db.get(Agent, agent_id)
    if agent is None or not agent.is_published:
        raise HTTPException(status_code=404, detail="Agent not found")
    return agent


@router.post("/{agent_id}/reviews")
async def review_agent(agent_id: UUID, payload: ReviewCreate, user: User = Depends(current_user), db: AsyncSession = Depends(get_db)) -> dict:
    agent = await db.get(Agent, agent_id)
    if agent is None:
        raise HTTPException(status_code=404, detail="Agent not found")
    db.add(Review(agent_id=agent.id, user_id=user.id, rating=payload.rating, comment=payload.comment))
    await db.flush()
    avg = await db.scalar(select(func.avg(Review.rating)).where(Review.agent_id == agent.id))
    count = await db.scalar(select(func.count(Review.id)).where(Review.agent_id == agent.id))
    agent.rating = round(float(avg or 0), 2)
    agent.review_count = int(count or 0)
    await db.commit()
    return {"rating": agent.rating, "review_count": agent.review_count}


@router.post("/deploy")
async def deploy_agent(payload: DeploymentCreate, user: User = Depends(current_user), db: AsyncSession = Depends(get_db)) -> dict:
    agent = await db.get(Agent, payload.agent_id)
    if agent is None or not agent.is_published:
        raise HTTPException(status_code=404, detail="Agent not found")
    deployment = Deployment(
        agent_id=agent.id,
        organization_id=payload.organization_id,
        created_by_id=user.id,
        environment=payload.environment,
        endpoint_url=f"/v1/execute/{agent.slug}",
    )
    db.add(deployment)
    db.add(AnalyticsEvent(agent_id=agent.id, organization_id=payload.organization_id, event_type="agent_deployed", properties={"environment": payload.environment}))
    await db.commit()
    await db.refresh(deployment)
    return {"deployment_id": deployment.id, "endpoint_url": deployment.endpoint_url, "status": deployment.status}
