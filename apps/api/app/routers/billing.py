from fastapi import APIRouter, Depends, Header, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db.session import get_db
from app.dependencies import current_user
from app.models import AnalyticsEvent, User

router = APIRouter(prefix="/billing", tags=["billing"])


@router.post("/checkout")
async def create_checkout(user: User = Depends(current_user)) -> dict:
    if not settings.stripe_secret_key or not settings.stripe_price_id:
        return {"mode": "configuration-required", "message": "Set STRIPE_SECRET_KEY and STRIPE_PRICE_ID to create live checkout sessions."}
    import stripe

    stripe.api_key = settings.stripe_secret_key
    session = stripe.checkout.Session.create(
        mode="subscription",
        success_url=f"{settings.frontend_url}/dashboard?checkout=success",
        cancel_url=f"{settings.frontend_url}/dashboard?checkout=cancelled",
        customer_email=user.email,
        line_items=[{"price": settings.stripe_price_id, "quantity": 1}],
    )
    return {"checkout_url": session.url}


@router.post("/webhook")
async def stripe_webhook(request: Request, stripe_signature: str | None = Header(default=None), db: AsyncSession = Depends(get_db)) -> dict:
    body = await request.body()
    if settings.stripe_webhook_secret and stripe_signature:
        import stripe

        try:
            event = stripe.Webhook.construct_event(body, stripe_signature, settings.stripe_webhook_secret)
        except Exception as exc:
            raise HTTPException(status_code=400, detail="Invalid Stripe signature") from exc
    else:
        event = {"type": "billing.unverified", "data": {}}
    db.add(AnalyticsEvent(event_type=f"stripe.{event['type']}", properties={"raw": str(event)[:2000]}))
    await db.commit()
    return {"received": True}
