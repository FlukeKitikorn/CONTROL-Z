from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlmodel import Session, select

from app.core.database import get_session as get_db_session
from app.core.security import safe_decode_access_token
from app.models import User, UserPrivilege
from app.services.session_store import is_session_active, sessions_enabled

security = HTTPBearer(auto_error=False)


def role_from_privilege(p: UserPrivilege) -> str:
    return "ADMIN" if p.uall == 1 else "USER"


def get_current_user(
    creds: Annotated[HTTPAuthorizationCredentials | None, Depends(security)],
    session: Annotated[Session, Depends(get_db_session)],
) -> User:
    if creds is None or not creds.credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    payload = safe_decode_access_token(creds.credentials)
    if not payload or "sub" not in payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    if sessions_enabled():
        jti = payload.get("jti")
        if isinstance(jti, str) and jti and not is_session_active(jti):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session expired or revoked")
    try:
        user_id = int(payload["sub"])
    except (TypeError, ValueError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    user = session.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


def get_current_privilege(
    user: Annotated[User, Depends(get_current_user)],
    session: Annotated[Session, Depends(get_db_session)],
) -> UserPrivilege:
    st = select(UserPrivilege).where(UserPrivilege.user_id == user.user_id)
    priv = session.exec(st).first()
    if priv is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No privileges")
    return priv


def get_admin_privilege(
    priv: Annotated[UserPrivilege, Depends(get_current_privilege)],
) -> UserPrivilege:
    if priv.uall != 1:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="ต้องเป็นผู้ดูแลระบบ",
        )
    return priv
