from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


class UserRead(BaseModel):
    id: UUID
    email: EmailStr
    name: str
    role: str
    is_active: bool

    model_config = {"from_attributes": True}


class AuthToken(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserRead


class SignupRequest(BaseModel):
    email: EmailStr
    name: str = Field(min_length=2, max_length=160)
    password: str = Field(min_length=8, max_length=128)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class AgentCreate(BaseModel):
    name: str
    slug: str
    category: str
    summary: str
    description: str
    prompt: str
    workflow: dict = Field(default_factory=dict)
    tools: list[dict] = Field(default_factory=list)
    pricing_model: str = "usage"
    price_cents: int = 0
    is_published: bool = False


class AgentRead(AgentCreate):
    id: UUID
    owner_id: UUID
    rating: float
    review_count: int
    is_featured: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class ReviewCreate(BaseModel):
    rating: int = Field(ge=1, le=5)
    comment: str = Field(min_length=4, max_length=2000)


class ExecutionRequest(BaseModel):
    agent_id: UUID
    input: dict
    deployment_id: UUID | None = None


class ExecutionRead(BaseModel):
    id: UUID
    agent_id: UUID
    status: str
    input: dict
    steps: list[dict]
    output: dict
    tokens_used: int
    cost_cents: int
    created_at: datetime

    model_config = {"from_attributes": True}


class DeploymentCreate(BaseModel):
    agent_id: UUID
    organization_id: UUID
    environment: str = "production"


class NotificationRead(BaseModel):
    id: UUID
    kind: str
    title: str
    body: str
    data: dict
    read_at: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}
