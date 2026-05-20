from datetime import UTC, datetime
from uuid import UUID

from fastapi import WebSocket
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Notification


class ConnectionManager:
    def __init__(self) -> None:
        self._connections: dict[str, set[WebSocket]] = {}

    async def connect(self, user_id: str, websocket: WebSocket) -> None:
        await websocket.accept()
        self._connections.setdefault(user_id, set()).add(websocket)

    def disconnect(self, user_id: str, websocket: WebSocket) -> None:
        self._connections.get(user_id, set()).discard(websocket)

    async def send(self, user_id: str, payload: dict) -> None:
        for websocket in list(self._connections.get(user_id, set())):
            try:
                await websocket.send_json(payload)
            except RuntimeError:
                self.disconnect(user_id, websocket)


manager = ConnectionManager()


async def notify_user(
    db: AsyncSession,
    user_id: UUID | str,
    *,
    kind: str,
    title: str,
    body: str,
    data: dict | None = None,
) -> Notification:
    notification = Notification(
        user_id=user_id,
        kind=kind,
        title=title,
        body=body,
        data=data or {},
        created_at=datetime.now(UTC),
    )
    db.add(notification)
    await db.flush()
    await manager.send(
        str(user_id),
        {
            "id": str(notification.id),
            "kind": kind,
            "title": title,
            "body": body,
            "data": data or {},
        },
    )
    return notification
