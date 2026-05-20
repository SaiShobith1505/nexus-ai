from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token, hash_password, verify_password
from app.db.session import get_db
from app.dependencies import current_user
from app.models import User
from app.schemas import AuthToken, ForgotPasswordRequest, LoginRequest, SignupRequest, UserRead

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup", response_model=AuthToken)
async def signup(payload: SignupRequest, db: AsyncSession = Depends(get_db)) -> AuthToken:
    exists = await db.scalar(select(User).where(User.email == payload.email.lower()))
    if exists:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")
    user = User(email=payload.email.lower(), name=payload.name, hashed_password=hash_password(payload.password))
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return AuthToken(access_token=create_access_token(user.id, user.role), user=user)


@router.post("/login", response_model=AuthToken)
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)) -> AuthToken:
    user = await db.scalar(select(User).where(User.email == payload.email.lower(), User.is_active.is_(True)))
    if user is None or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    return AuthToken(access_token=create_access_token(user.id, user.role), user=user)


@router.post("/forgot-password")
async def forgot_password(payload: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)) -> dict:
    user = await db.scalar(select(User).where(User.email == payload.email.lower()))
    if user:
        token = create_access_token(user.id, user.role)
        return {"message": "Password reset token generated for configured email provider.", "reset_token": token}
    return {"message": "If the account exists, a password reset email will be sent."}


@router.get("/me", response_model=UserRead)
async def me(user: User = Depends(current_user)) -> User:
    return user


@router.get("/oauth/{provider}/start")
async def oauth_start(provider: str) -> dict:
    if provider not in {"google", "github"}:
        raise HTTPException(status_code=404, detail="OAuth provider not configured")
    return {"provider": provider, "message": "Configure provider credentials and redirect URI for production OAuth."}
