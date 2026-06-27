from datetime import datetime, timedelta, timezone

import bcrypt
from jose import JWTError, jwt

from app.core.config import settings


def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), password_hash.encode("utf-8"))
    except (ValueError, TypeError):
        return False


def create_access_token(
    *,
    user_id: int,
    role: str,
    organization_id: int,
    session_id: str | None = None,
) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_expire_minutes)
    payload = {
        "sub": str(user_id),
        "role": role,
        "org": organization_id,
        "exp": int(expire.timestamp()),
    }
    if session_id:
        payload["jti"] = session_id
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> dict:
    return jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])


def safe_decode_access_token(token: str) -> dict | None:
    try:
        return decode_access_token(token)
    except JWTError:
        return None


def create_password_reset_token(*, user_id: int) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.password_reset_expire_minutes)
    payload = {
        "sub": str(user_id),
        "type": "password_reset",
        "exp": int(expire.timestamp()),
    }
    return jwt.encode(payload, settings.password_reset_secret_key, algorithm=settings.jwt_algorithm)


def decode_password_reset_token(token: str) -> int | None:
    try:
        payload = jwt.decode(
            token,
            settings.password_reset_secret_key,
            algorithms=[settings.jwt_algorithm],
        )
    except JWTError:
        return None
    if payload.get("type") != "password_reset":
        return None
    sub = payload.get("sub")
    if sub is None:
        return None
    try:
        return int(sub)
    except (TypeError, ValueError):
        return None
