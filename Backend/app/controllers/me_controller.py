from typing import Annotated

from fastapi import APIRouter, Body, Depends, File, HTTPException, UploadFile, status
from sqlmodel import Session, and_, select

from app.core.database import get_session
from app.core.deps import get_current_privilege, get_current_user
from app.core.security import hash_password, verify_password
from app.models import EditForm, User, UserPrivilege
from app.schemas.auth import UserPublic
from app.schemas.rest import MeDeleteConfirm, MeUpdate, PasswordChangeRequest
from app.services import auth_service
from app.services.session_store import revoke_all_user_sessions

router = APIRouter(tags=["me"])


@router.get("/me", response_model=UserPublic)
def get_me(
    user: Annotated[User, Depends(get_current_user)],
    priv: Annotated[UserPrivilege, Depends(get_current_privilege)],
) -> UserPublic:
    return auth_service.user_to_public(user, priv)


@router.patch("/me", response_model=UserPublic)
def patch_me(
    body: MeUpdate,
    session: Annotated[Session, Depends(get_session)],
    user: Annotated[User, Depends(get_current_user)],
    priv: Annotated[UserPrivilege, Depends(get_current_privilege)],
) -> UserPublic:
    data = body.model_dump(exclude_unset=True)
    if "email" in data and data["email"] is not None:
        new_email = str(data["email"])[:50]
        dup = session.exec(
            select(UserPrivilege).where(
                and_(
                    UserPrivilege.uname == new_email,
                    UserPrivilege.user_id != user.user_id,
                )
            )
        ).first()
        if dup:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="อีเมลนี้ถูกใช้แล้ว")
        priv.uname = new_email
        session.add(priv)
        user.email = new_email
    for key, val in data.items():
        if val is None or key == "email":
            continue
        if hasattr(user, key):
            setattr(user, key, val)
    session.add(user)
    session.commit()
    session.refresh(user)
    session.refresh(priv)
    return auth_service.user_to_public(user, priv)


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
def delete_me(
    body: Annotated[MeDeleteConfirm, Body(...)],
    session: Annotated[Session, Depends(get_session)],
    user: Annotated[User, Depends(get_current_user)],
    priv: Annotated[UserPrivilege, Depends(get_current_privilege)],
) -> None:
    if not verify_password(body.password, priv.password_hash):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="รหัสผ่านไม่ถูกต้อง")
    uid = user.user_id
    for ef in list(session.exec(select(EditForm).where(EditForm.user_id == uid)).all()):
        session.delete(ef)
    session.delete(priv)
    session.delete(user)
    session.commit()
    revoke_all_user_sessions(uid)


@router.patch("/me/password", response_model=UserPublic)
def patch_me_password(
    body: PasswordChangeRequest,
    session: Annotated[Session, Depends(get_session)],
    user: Annotated[User, Depends(get_current_user)],
    priv: Annotated[UserPrivilege, Depends(get_current_privilege)],
) -> UserPublic:
    if not verify_password(body.current_password, priv.password_hash):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="รหัสผ่านปัจจุบันไม่ถูกต้อง")
    priv.password_hash = hash_password(body.new_password)
    session.add(priv)
    session.commit()
    session.refresh(priv)
    revoke_all_user_sessions(user.user_id)
    return auth_service.user_to_public(user, priv)


@router.post("/me/avatar", response_model=UserPublic)
async def post_me_avatar(
    session: Annotated[Session, Depends(get_session)],
    user: Annotated[User, Depends(get_current_user)],
    priv: Annotated[UserPrivilege, Depends(get_current_privilege)],
    file: UploadFile = File(...),
) -> UserPublic:
    from pathlib import Path

    import uuid

    base = Path(__file__).resolve().parent.parent.parent / "uploads"
    base.mkdir(parents=True, exist_ok=True)
    org_dir = base / str(user.organization_id)
    org_dir.mkdir(parents=True, exist_ok=True)
    ext = Path(file.filename or "avatar").suffix[:8] or ".bin"
    name = f"user_{user.user_id}_{uuid.uuid4().hex[:8]}{ext}"
    dest = org_dir / name
    content = await file.read()
    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="ไฟล์ใหญ่เกิน 5MB")
    dest.write_bytes(content)
    rel = f"/static/{user.organization_id}/{name}"
    user.image = rel[:100]
    session.add(user)
    session.commit()
    session.refresh(user)
    return auth_service.user_to_public(user, priv)
