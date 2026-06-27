from fastapi import HTTPException, status

from app.models import User, UserPrivilege


def assert_org_access(user: User, priv: UserPrivilege, org_id: int) -> None:
    if priv.uall == 1:
        return
    if user.organization_id != org_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="ไม่มีสิทธิ์เข้าถึงองค์กรนี้",
        )


def require_admin(priv: UserPrivilege) -> None:
    if priv.uall != 1:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="ต้องเป็นผู้ดูแลระบบ",
        )
