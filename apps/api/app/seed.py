from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password
from app.models import Agent, Organization, User


AGENTS = [
    ("QA Testing Agent", "qa-testing-agent", "qa-testing", "Autonomous browser QA, screenshot comparison, regression reports."),
    ("DevOps Monitoring Agent", "devops-monitoring-agent", "devops-monitoring", "Log anomaly detection, deployment monitoring, and incident summaries."),
    ("Repository Understanding Agent", "repository-understanding-agent", "repository-understanding", "Architecture maps, documentation, and technical debt analysis."),
    ("Compliance Audit Agent", "compliance-audit-agent", "compliance-audit", "Secret scanning, vulnerability analysis, and compliance evidence checks."),
    ("Sales Intelligence Agent", "sales-intelligence-agent", "sales-intelligence", "Meeting insights, churn predictions, and CRM intelligence."),
    ("RFP Proposal Agent", "rfp-proposal-agent", "rfp-proposal", "PDF ingestion, requirement matrices, executive summaries, and proposal drafts."),
]


async def seed(db: AsyncSession) -> None:
    existing = await db.scalar(select(User).where(User.email == "founder@nexus.ai"))
    if existing:
        return
    user = User(email="founder@nexus.ai", name="Nexus Founder", role="admin", hashed_password=hash_password("NexusAI!2026"))
    db.add(user)
    await db.flush()
    org = Organization(name="Nexus AI", slug="nexus-ai", owner_id=user.id, plan="enterprise")
    db.add(org)
    await db.flush()
    for index, (name, slug, category, summary) in enumerate(AGENTS):
        db.add(
            Agent(
                owner_id=user.id,
                organization_id=org.id,
                name=name,
                slug=slug,
                category=category,
                summary=summary,
                description=f"{summary} Built for enterprise teams that need auditable autonomous execution.",
                prompt=f"You are {name}. Operate with precision, produce actionable reports, and cite risks clearly.",
                workflow={"steps": ["intake", "tool-selection", "analysis", "verification", "report"]},
                tools=[{"name": "web", "scope": "controlled"}, {"name": "files", "scope": "read"}, {"name": "api", "scope": "approved"}],
                pricing_model="subscription" if index % 2 else "usage",
                price_cents=4900 + index * 1500,
                rating=4.6 + index * 0.05,
                review_count=120 + index * 38,
                is_featured=index < 3,
                is_published=True,
            )
        )
    await db.commit()
