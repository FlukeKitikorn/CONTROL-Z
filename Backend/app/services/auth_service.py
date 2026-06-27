from datetime import date

from fastapi import BackgroundTasks, HTTPException, status
from sqlmodel import Session

from app.core.config import settings
from app.core.deps import role_from_privilege
from app.core.security import (
    create_access_token,
    create_password_reset_token,
    decode_password_reset_token,
    hash_password,
    verify_password,
)
from app.models import Organization, User, UserPrivilege
from app.repositories import auth_repository
from app.schemas.auth import (
    ForgotPasswordResponse,
    RegisterOkResponse,
    RegisterRequest,
    ResetPasswordRequest,
    ResetPasswordResponse,
    TokenResponse,
    UserPublic,
)
from app.services import email_service
from app.services.session_store import create_session, sessions_enabled

# ตรงกับ Frontend userProfileComplete — ผู้ใช้ต้องแทนที่หลังล็อกอิน
_REGISTER_PLACEHOLDER = "—"
_FORGOT_PASSWORD_MESSAGE = "หากมีบัญชีนี้ในระบบ เราได้ส่งลิงก์รีเซ็ตรหัสผ่านไปยังอีเมลแล้ว"


def user_to_public(user: User, priv: UserPrivilege) -> UserPublic:
    role = role_from_privilege(priv)
    display_email = (user.email or "").strip() or priv.uname
    return UserPublic(
        user_id=user.user_id,
        fname=user.firstname,
        lname=user.lastname,
        prefix=user.prefix or None,
        email=display_email,
        username=priv.uname,
        role=role,
        organization_id=user.organization_id,
        address=user.address or None,
        subdistrict=user.subdistrict or None,
        district=user.district or None,
        province=user.province or None,
        postal_code=user.postal_code or None,
        phone=user.phone or None,
        imageprofile=user.image or None,
    )


def login(session: Session, *, email: str, password: str) -> TokenResponse:
    row = auth_repository.find_user_with_privilege_by_login(session, email)
    if row is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="อีเมลหรือรหัสผ่านไม่ถูกต้อง",
        )
    user, priv = row
    if not verify_password(password, priv.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="อีเมลหรือรหัสผ่านไม่ถูกต้อง",
        )
    role = role_from_privilege(priv)
    session_id = create_session(
        user_id=user.user_id,
        role=role,
        organization_id=user.organization_id,
        ttl_seconds=settings.session_ttl_seconds,
    )
    token = create_access_token(
        user_id=user.user_id,
        role=role,
        organization_id=user.organization_id,
        session_id=session_id if sessions_enabled() else None,
    )
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        expires_in=settings.access_token_expire_minutes * 60,
        user=user_to_public(user, priv),
        session_id=session_id if sessions_enabled() else None,
    )


def register(session: Session, body: RegisterRequest) -> RegisterOkResponse:
    email_norm = str(body.email).strip().lower()
    if auth_repository.privilege_by_uname_lower_exists(session, email_norm):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="อีเมลนี้ลงทะเบียนแล้ว",
        )

    reg_date = date.today().isoformat()
    org_contact_email = email_norm[:50]

    org = Organization(
        name_of_agency=_REGISTER_PLACEHOLDER,
        organization_name=_REGISTER_PLACEHOLDER,
        address1=_REGISTER_PLACEHOLDER,
        subdistrict=_REGISTER_PLACEHOLDER,
        district=_REGISTER_PLACEHOLDER,
        province=_REGISTER_PLACEHOLDER,
        postal_code=_REGISTER_PLACEHOLDER,
        phone=_REGISTER_PLACEHOLDER,
        email=org_contact_email,
        registration_date=reg_date,
    )
    session.add(org)
    session.flush()

    user = User(
        organization_id=org.organization_id,
        prefix=_REGISTER_PLACEHOLDER,
        firstname="",
        lastname="",
        address=_REGISTER_PLACEHOLDER,
        subdistrict=_REGISTER_PLACEHOLDER,
        district=_REGISTER_PLACEHOLDER,
        province=_REGISTER_PLACEHOLDER,
        postal_code=_REGISTER_PLACEHOLDER,
        phone=None,
        email=str(body.email),
        image=None,
    )
    session.add(user)
    session.flush()

    priv = UserPrivilege(
        user_id=user.user_id,
        uname=email_norm,
        password_hash=hash_password(body.password),
        uread=1,
        uwrite=1,
        uedit=1,
        uall=0,
    )
    session.add(priv)
    session.commit()

    return RegisterOkResponse(
        message="ลงทะเบียนสำเร็จ — เข้าสู่ระบบด้วยอีเมลและรหัสผ่านของคุณ แล้วกรอกข้อมูลส่วนตัวให้ครบที่หน้าตั้งค่า",
    )


def forgot_password(
    session: Session,
    *,
    email: str,
    background_tasks: BackgroundTasks,
) -> ForgotPasswordResponse:
    row = auth_repository.find_user_with_privilege_by_email(session, email)
    if row is not None:
        user, _priv = row
        token = create_password_reset_token(user_id=user.user_id)
        reset_link = f"{settings.frontend_base_url.rstrip('/')}/auth/reset-password?token={token}"
        recipient = (user.email or "").strip() or email.strip()
        background_tasks.add_task(
            email_service.send_password_reset_email,
            to=recipient,
            reset_link=reset_link,
            expire_minutes=settings.password_reset_expire_minutes,
        )
    return ForgotPasswordResponse(message=_FORGOT_PASSWORD_MESSAGE)


def reset_password(session: Session, body: ResetPasswordRequest) -> ResetPasswordResponse:
    user_id = decode_password_reset_token(body.token)
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ลิงก์รีเซ็ตไม่ถูกต้องหรือหมดอายุแล้ว",
        )
    if body.new_password != body.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="รหัสผ่านใหม่และยืนยันรหัสผ่านไม่ตรงกัน",
        )
    row = auth_repository.find_user_with_privilege_by_user_id(session, user_id)
    if row is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ลิงก์รีเซ็ตไม่ถูกต้องหรือหมดอายุแล้ว",
        )
    password_hash = hash_password(body.new_password)
    if not auth_repository.update_password_hash_by_user_id(session, user_id, password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ไม่พบบัญชีผู้ใช้",
        )
    session.commit()
    return ResetPasswordResponse(message="ตั้งรหัสผ่านใหม่สำเร็จ — กรุณาเข้าสู่ระบบด้วยรหัสผ่านใหม่")
