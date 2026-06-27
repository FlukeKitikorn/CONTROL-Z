from typing import Annotated

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Response, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlmodel import Session

from app.core.database import get_session
from app.core.deps import get_current_privilege, get_current_user
from app.core.security import safe_decode_access_token
from app.models import User, UserPrivilege
from app.schemas.auth import (
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    LoginRequest,
    RegisterOkResponse,
    RegisterRequest,
    ResetPasswordRequest,
    ResetPasswordResponse,
    SessionStatusResponse,
    TokenResponse,
)
from app.services import auth_service
from app.services.session_store import revoke_session, sessions_enabled

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, session: Annotated[Session, Depends(get_session)]) -> TokenResponse:
    return auth_service.login(session, email=body.email, password=body.password)


@router.post(
    "/register",
    response_model=RegisterOkResponse,
    status_code=status.HTTP_201_CREATED,
)
def register(
    body: RegisterRequest,
    session: Annotated[Session, Depends(get_session)],
) -> RegisterOkResponse:
    return auth_service.register(session, body)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(
    creds: Annotated[HTTPAuthorizationCredentials | None, Depends(HTTPBearer(auto_error=False))],
) -> Response:
    if sessions_enabled() and creds and creds.credentials:
        payload = safe_decode_access_token(creds.credentials)
        if payload:
            jti = payload.get("jti")
            if isinstance(jti, str) and jti:
                sub = payload.get("sub")
                user_id = int(sub) if sub is not None else None
                revoke_session(jti, user_id=user_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/session", response_model=SessionStatusResponse)
def session_status(
    user: Annotated[User, Depends(get_current_user)],
    priv: Annotated[UserPrivilege, Depends(get_current_privilege)],
) -> SessionStatusResponse:
    return SessionStatusResponse(
        authenticated=True,
        user=auth_service.user_to_public(user, priv),
        sessions_server_side=sessions_enabled(),
    )


@router.post("/refresh")
def refresh() -> None:
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Refresh token ยังไม่รองรับ — ล็อกอินใหม่",
    )


@router.post("/forgot-password", response_model=ForgotPasswordResponse)
def forgot_password(
    body: ForgotPasswordRequest,
    background_tasks: BackgroundTasks,
    session: Annotated[Session, Depends(get_session)],
) -> ForgotPasswordResponse:
    return auth_service.forgot_password(session, email=str(body.email), background_tasks=background_tasks)


@router.post("/reset-password", response_model=ResetPasswordResponse)
def reset_password(
    body: ResetPasswordRequest,
    session: Annotated[Session, Depends(get_session)],
) -> ResetPasswordResponse:
    return auth_service.reset_password(session, body)
