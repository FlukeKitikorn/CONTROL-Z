from fastapi import APIRouter

from app.core.config import settings
from app.core.redis import redis_available, redis_ping

router = APIRouter()


@router.get("/health", summary="สถานะบริการ")
def health() -> dict[str, object]:
    payload: dict[str, object] = {"status": "ok"}
    if settings.redis_configured:
        payload["redis"] = {
            "configured": True,
            "connected": redis_available(),
            "ping": redis_ping(),
            "cache_enabled": settings.redis_cache_enabled and redis_available(),
            "sessions_enabled": settings.redis_sessions_enabled and redis_available(),
        }
    else:
        payload["redis"] = {"configured": False}
    return payload
