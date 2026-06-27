from sqlalchemy import func, or_, select, update
from sqlmodel import Session

from app.models import User, UserPrivilege


def find_user_with_privilege_by_login(session: Session, identifier: str) -> tuple[User, UserPrivilege] | None:
    q = identifier.strip()
    if not q:
        return None
    key = q.lower()
    st = (
        select(User, UserPrivilege)
        .join(UserPrivilege, UserPrivilege.user_id == User.user_id)
        .where(
            or_(
                func.lower(UserPrivilege.uname) == key,
                func.lower(User.email) == key,
            )
        )
    )
    row = session.exec(st).first()
    if row is None:
        return None
    user, priv = row
    return user, priv


def privilege_by_uname_lower_exists(session: Session, email: str) -> bool:
    key = email.strip().lower()
    st = select(UserPrivilege).where(func.lower(UserPrivilege.uname) == key)
    return session.exec(st).first() is not None


def find_user_with_privilege_by_email(session: Session, email: str) -> tuple[User, UserPrivilege] | None:
    key = email.strip().lower()
    if not key:
        return None
    st = (
        select(User, UserPrivilege)
        .join(UserPrivilege, UserPrivilege.user_id == User.user_id)
        .where(func.lower(User.email) == key)
    )
    row = session.exec(st).first()
    if row is None:
        return None
    user, priv = row
    return user, priv


def find_user_with_privilege_by_user_id(session: Session, user_id: int) -> tuple[User, UserPrivilege] | None:
    st = (
        select(User, UserPrivilege)
        .join(UserPrivilege, UserPrivilege.user_id == User.user_id)
        .where(User.user_id == user_id)
    )
    row = session.exec(st).first()
    if row is None:
        return None
    user, priv = row
    return user, priv


def update_password_hash_by_user_id(session: Session, user_id: int, password_hash: str) -> bool:
    result = session.exec(
        update(UserPrivilege)
        .where(UserPrivilege.user_id == user_id)
        .values(password_hash=password_hash)
    )
    return result.rowcount > 0
