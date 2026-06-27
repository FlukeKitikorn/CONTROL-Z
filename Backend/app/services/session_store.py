"""Server-side sessions in Redis — ใช้คู่กับ JWT claim `jti` เพื่อ revoke / logout จริง."""

from __future__ import annotations

import json
import logging
import secrets
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from typing import Any

from app.core.cache_keys import session_key, user_sessions_key
from app.core.config import settings
from app.core.redis import get_redis, redis_available

logger = logging.getLogger(__name__)


@dataclass
class SessionRecord:
    user_id: int
    role: str
    organization_id: int
    created_at: str

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> SessionRecord | None:
        try:
            return cls(
                user_id=int(data["user_id"]),
                role=str(data["role"]),
                organization_id=int(data["organization_id"]),
                created_at=str(data.get("created_at") or ""),
            )
        except (KeyError, TypeError, ValueError):
            return None


def sessions_enabled() -> bool:
    return settings.redis_sessions_enabled and redis_available()


def new_session_id() -> str:
    return secrets.token_urlsafe(32)


def create_session(
    *,
    user_id: int,
    role: str,
    organization_id: int,
    session_id: str | None = None,
    ttl_seconds: int | None = None,
) -> str:
    sid = session_id or new_session_id()
    if not sessions_enabled():
        return sid

    client = get_redis()
    if client is None:
        return sid

    ttl = ttl_seconds if ttl_seconds is not None else settings.session_ttl_seconds
    record = SessionRecord(
        user_id=user_id,
        role=role,
        organization_id=organization_id,
        created_at=datetime.now(timezone.utc).isoformat(),
    )
    key = session_key(sid)
    user_key = user_sessions_key(user_id)
    try:
        pipe = client.pipeline()
        pipe.setex(key, ttl, json.dumps(record.to_dict()))
        pipe.sadd(user_key, sid)
        pipe.expire(user_key, ttl)
        pipe.execute()
    except Exception as exc:
        logger.warning("session create failed user_id=%s (%s)", user_id, exc)
    return sid


def get_session(session_id: str) -> SessionRecord | None:
    if not session_id or not sessions_enabled():
        return None
    client = get_redis()
    if client is None:
        return None
    try:
        raw = client.get(session_key(session_id))
        if not raw:
            return None
        data = json.loads(raw)
        if not isinstance(data, dict):
            return None
        return SessionRecord.from_dict(data)
    except Exception as exc:
        logger.debug("session get failed (%s)", exc)
        return None


def is_session_active(session_id: str) -> bool:
    if not sessions_enabled():
        return True
    if not session_id:
        return False
    return get_session(session_id) is not None


def revoke_session(session_id: str, *, user_id: int | None = None) -> None:
    if not session_id or not sessions_enabled():
        return
    client = get_redis()
    if client is None:
        return
    try:
        pipe = client.pipeline()
        pipe.delete(session_key(session_id))
        if user_id is not None:
            pipe.srem(user_sessions_key(user_id), session_id)
        pipe.execute()
    except Exception as exc:
        logger.debug("session revoke failed (%s)", exc)


def revoke_all_user_sessions(user_id: int) -> int:
    if not sessions_enabled():
        return 0
    client = get_redis()
    if client is None:
        return 0
    count = 0
    try:
        sids = client.smembers(user_sessions_key(user_id))
        if sids:
            pipe = client.pipeline()
            for sid in sids:
                pipe.delete(session_key(sid))
                count += 1
            pipe.delete(user_sessions_key(user_id))
            pipe.execute()
    except Exception as exc:
        logger.debug("revoke all sessions failed user_id=%s (%s)", user_id, exc)
    return count
