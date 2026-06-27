from typing import Annotated

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Response, status
from sqlmodel import Session

from app.core.database import get_session
from app.schemas.auth import (
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    LoginRequest,
    RegisterOkResponse,
    RegisterRequest,
    ResetPasswordRequest,
    ResetPasswordResponse,
    TokenResponse,
)
from app.services import auth_service

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
def logout() -> Response:
    return Response(status_code=status.HTTP_204_NO_CONTENT)


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
