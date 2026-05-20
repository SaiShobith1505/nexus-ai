from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, Numeric, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class User(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String(320), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(160))
    hashed_password: Mapped[str | None] = mapped_column(String(255), nullable=True)
    avatar_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    role: Mapped[str] = mapped_column(String(32), default="user")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    oauth_provider: Mapped[str | None] = mapped_column(String(32), nullable=True)
    oauth_subject: Mapped[str | None] = mapped_column(String(255), nullable=True)


class Organization(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "organizations"

    name: Mapped[str] = mapped_column(String(180))
    slug: Mapped[str] = mapped_column(String(180), unique=True)
    owner_id: Mapped[str] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    plan: Mapped[str] = mapped_column(String(64), default="starter")


class Agent(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "agents"

    owner_id: Mapped[str] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    organization_id: Mapped[str | None] = mapped_column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=True)
    name: Mapped[str] = mapped_column(String(160))
    slug: Mapped[str] = mapped_column(String(180), unique=True)
    category: Mapped[str] = mapped_column(String(80))
    summary: Mapped[str] = mapped_column(Text)
    description: Mapped[str] = mapped_column(Text)
    prompt: Mapped[str] = mapped_column(Text)
    workflow: Mapped[dict] = mapped_column(JSONB, default=dict)
    tools: Mapped[list] = mapped_column(JSONB, default=list)
    pricing_model: Mapped[str] = mapped_column(String(32), default="usage")
    price_cents: Mapped[int] = mapped_column(Integer, default=0)
    rating: Mapped[float] = mapped_column(Numeric(3, 2), default=0)
    review_count: Mapped[int] = mapped_column(Integer, default=0)
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False)
    is_published: Mapped[bool] = mapped_column(Boolean, default=False)
    reviews: Mapped[list["Review"]] = relationship()


class Deployment(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "deployments"

    agent_id: Mapped[str] = mapped_column(UUID(as_uuid=True), ForeignKey("agents.id"))
    organization_id: Mapped[str] = mapped_column(UUID(as_uuid=True), ForeignKey("organizations.id"))
    created_by_id: Mapped[str] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    status: Mapped[str] = mapped_column(String(32), default="active")
    environment: Mapped[str] = mapped_column(String(32), default="production")
    endpoint_url: Mapped[str | None] = mapped_column(String(500), nullable=True)


class Workflow(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "workflows"

    agent_id: Mapped[str] = mapped_column(UUID(as_uuid=True), ForeignKey("agents.id"))
    name: Mapped[str] = mapped_column(String(160))
    definition: Mapped[dict] = mapped_column(JSONB)
    version: Mapped[int] = mapped_column(Integer, default=1)


class Subscription(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "subscriptions"

    organization_id: Mapped[str] = mapped_column(UUID(as_uuid=True), ForeignKey("organizations.id"))
    agent_id: Mapped[str | None] = mapped_column(UUID(as_uuid=True), ForeignKey("agents.id"), nullable=True)
    stripe_customer_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    stripe_subscription_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    status: Mapped[str] = mapped_column(String(32), default="active")
    current_period_end: Mapped[DateTime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class Review(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "reviews"

    agent_id: Mapped[str] = mapped_column(UUID(as_uuid=True), ForeignKey("agents.id"))
    user_id: Mapped[str] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    rating: Mapped[int] = mapped_column(Integer)
    comment: Mapped[str] = mapped_column(Text)


class ExecutionLog(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "execution_logs"

    agent_id: Mapped[str] = mapped_column(UUID(as_uuid=True), ForeignKey("agents.id"))
    deployment_id: Mapped[str | None] = mapped_column(UUID(as_uuid=True), ForeignKey("deployments.id"), nullable=True)
    user_id: Mapped[str] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    status: Mapped[str] = mapped_column(String(32))
    input: Mapped[dict] = mapped_column(JSONB)
    steps: Mapped[list] = mapped_column(JSONB, default=list)
    output: Mapped[dict] = mapped_column(JSONB, default=dict)
    tokens_used: Mapped[int] = mapped_column(Integer, default=0)
    cost_cents: Mapped[int] = mapped_column(Integer, default=0)


class AnalyticsEvent(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "analytics_events"

    organization_id: Mapped[str | None] = mapped_column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=True)
    agent_id: Mapped[str | None] = mapped_column(UUID(as_uuid=True), ForeignKey("agents.id"), nullable=True)
    event_type: Mapped[str] = mapped_column(String(80))
    properties: Mapped[dict] = mapped_column(JSONB, default=dict)
    value_cents: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class Notification(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "notifications"

    user_id: Mapped[str] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    kind: Mapped[str] = mapped_column(String(80))
    title: Mapped[str] = mapped_column(String(180))
    body: Mapped[str] = mapped_column(Text)
    data: Mapped[dict] = mapped_column(JSONB, default=dict)
    read_at: Mapped[DateTime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class Report(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "reports"

    reporter_id: Mapped[str] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    agent_id: Mapped[str | None] = mapped_column(UUID(as_uuid=True), ForeignKey("agents.id"), nullable=True)
    reason: Mapped[str] = mapped_column(String(120))
    details: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(32), default="open")
