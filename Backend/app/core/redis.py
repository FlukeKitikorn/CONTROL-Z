"""Redis connection pool — ปิดได้ด้วยการไม่ตั้ง REDIS_URL."""

from __future__ import annotations

import logging
from typing import TYPE_CHECKING

from app.core.config import settings

if TYPE_CHECKING:
    from redis import Redis

logger = logging.getLogger(__name__)

_redis: Redis | None = None
_redis_checked = False


def init_redis() -> None:
    global _redis, _redis_checked
    _redis_checked = True
    if not settings.redis_url:
        logger.info("Redis: disabled (REDIS_URL not set)")
        return
    try:
        from redis import Redis

        client = Redis.from_url(
            settings.redis_url,
            decode_responses=True,
            socket_connect_timeout=settings.redis_socket_timeout_seconds,
            socket_timeout=settings.redis_socket_timeout_seconds,
        )
        client.ping()
        _redis = client
        logger.info("Redis: connected")
    except Exception as exc:
        _redis = None
        logger.warning("Redis: connection failed — running without Redis (%s)", exc)


def close_redis() -> None:
    global _redis
    if _redis is not None:
        try:
            _redis.close()
        except Exception:
            pass
    _redis = None


def get_redis() -> Redis | None:
    return _redis


def redis_available() -> bool:
    return _redis is not None


def redis_ping() -> bool:
    client = get_redis()
    if client is None:
        return False
    try:
        return bool(client.ping())
    except Exception:
        return False
