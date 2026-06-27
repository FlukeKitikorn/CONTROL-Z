from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy import and_, desc
from sqlmodel import Session, select

from app.core.database import get_session
from app.core.deps import get_admin_privilege, get_current_user
from app.core.cache import invalidate_announcements_cache, invalidate_ef_reference_cache
from app.core.security import hash_password
from app.models import (
    EditForm,
    GhgtForm,
    Gwp,
    Organization,
    User,
    UserPrivilege,
)
from app.schemas.rest import (
    AdminAuditEntryRead,
    AdminOrganizationCreate,
    AdminPrivilegesPatch,
    AdminUserCreate,
    AdminUserListItem,
    AdminUserPatch,
    AnnouncementCreate,
    AnnouncementRead,
    AnnouncementUpdate,
    GwpCreate,
    GwpRead,
    GwpUpdate,
    MonitoringOrgRow,
    MonitorCommandRead,
    OrganizationRead,
    OrganizationUpdate,
    PaginatedUsers,
)
from app.services import runtime_announcements as ann_store
from app.services.monitor_playbook import monitor_commands
from app.services.cascade_helpers import delete_organization_cascade

router = APIRouter(prefix="/admin", tags=["admin"])


def _purge_user_graph(session: Session, user_id: int) -> None:
    for ef in list(session.exec(select(EditForm).where(EditForm.user_id == user_id)).all()):
        session.delete(ef)
    p = session.exec(select(UserPrivilege).where(UserPrivilege.user_id == user_id)).first()
    if p:
        session.delete(p)
    u = session.get(User, user_id)
    if u is not None:
        session.delete(u)


@router.get("/users", response_model=PaginatedUsers)
def admin_list_users(
    session: Annotated[Session, Depends(get_session)],
    admin: Annotated[UserPrivilege, Depends(get_admin_privilege)],
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
) -> PaginatedUsers:
    _ = admin
    _tc = session.exec(select(func.count()).select_from(User)).first()
    total = int(_tc) if _tc is not None else 0
    st = select(User, UserPrivilege).join(UserPrivilege, User.user_id == UserPrivilege.user_id)
    rows = list(session.exec(st.offset(skip).limit(limit)).all())
    items = [
        AdminUserListItem(
            user_id=u.user_id,
            organization_id=u.organization_id,
            firstname=u.firstname,
            lastname=u.lastname,
            email=u.email,
            uname=p.uname,
            uall=p.uall,
        )
        for u, p in rows
    ]
    return PaginatedUsers(items=items, total=total or 0, skip=skip, limit=limit)


@router.post("/users", response_model=AdminUserListItem, status_code=201)
def admin_create_user(
    body: AdminUserCreate,
    session: Annotated[Session, Depends(get_session)],
    admin: Annotated[UserPrivilege, Depends(get_admin_privilege)],
) -> AdminUserListItem:
    _ = admin
    org = session.get(Organization, body.organization_id)
    if org is None:
        raise HTTPException(status_code=404, detail="ไม่พบองค์กร")
    email_norm = str(body.email).strip().lower()[:50]
    if session.exec(select(UserPrivilege).where(UserPrivilege.uname == email_norm)).first():
        raise HTTPException(status_code=409, detail="อีเมลนี้ถูกใช้แล้ว")
    user = User(
        organization_id=body.organization_id,
        prefix=body.prefix,
        firstname=body.firstname,
        lastname=body.lastname,
        address=body.address,
        subdistrict=body.subdistrict,
        district=body.district,
        province=body.province,
        postal_code=body.postal_code,
        phone=body.phone,
        email=email_norm,
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
        uall=body.uall,
    )
    session.add(priv)
    session.commit()
    session.refresh(user)
    session.refresh(priv)
    return AdminUserListItem(
        user_id=user.user_id,
        organization_id=user.organization_id,
        firstname=user.firstname,
        lastname=user.lastname,
        email=user.email,
        uname=priv.uname,
        uall=priv.uall,
    )


@router.get("/users/{user_id}", response_model=AdminUserListItem)
def admin_get_user(
    user_id: int,
    session: Annotated[Session, Depends(get_session)],
    admin: Annotated[UserPrivilege, Depends(get_admin_privilege)],
) -> AdminUserListItem:
    _ = admin
    u = session.get(User, user_id)
    if u is None:
        raise HTTPException(status_code=404, detail="ไม่พบผู้ใช้")
    p = session.exec(select(UserPrivilege).where(UserPrivilege.user_id == user_id)).first()
    if p is None:
        raise HTTPException(status_code=404, detail="ไม่พบสิทธิ์")
    return AdminUserListItem(
        user_id=u.user_id,
        organization_id=u.organization_id,
        firstname=u.firstname,
        lastname=u.lastname,
        email=u.email,
        uname=p.uname,
        uall=p.uall,
    )


@router.patch("/users/{user_id}", response_model=AdminUserListItem)
def admin_patch_user(
    user_id: int,
    body: AdminUserPatch,
    session: Annotated[Session, Depends(get_session)],
    admin: Annotated[UserPrivilege, Depends(get_admin_privilege)],
) -> AdminUserListItem:
    _ = admin
    u = session.get(User, user_id)
    if u is None:
        raise HTTPException(status_code=404, detail="ไม่พบผู้ใช้")
    p = session.exec(select(UserPrivilege).where(UserPrivilege.user_id == user_id)).first()
    if p is None:
        raise HTTPException(status_code=404, detail="ไม่พบสิทธิ์")
    if body.organization_id is not None:
        if session.get(Organization, body.organization_id) is None:
            raise HTTPException(status_code=404, detail="ไม่พบองค์กร")
        u.organization_id = body.organization_id
    if body.email is not None:
        new_e = str(body.email).strip().lower()[:50]
        dup = session.exec(
            select(UserPrivilege).where(
                and_(
                    UserPrivilege.uname == new_e,
                    UserPrivilege.user_id != user_id,
                )
            )
        ).first()
        if dup:
            raise HTTPException(status_code=409, detail="อีเมลนี้ถูกใช้แล้ว")
        p.uname = new_e
        u.email = new_e
        session.add(p)
    for key in ("prefix", "firstname", "lastname", "address", "subdistrict", "district", "province", "postal_code", "phone"):
        val = getattr(body, key)
        if val is not None:
            setattr(u, key, val)
    session.add(u)
    session.commit()
    session.refresh(u)
    session.refresh(p)
    return AdminUserListItem(
        user_id=u.user_id,
        organization_id=u.organization_id,
        firstname=u.firstname,
        lastname=u.lastname,
        email=u.email,
        uname=p.uname,
        uall=p.uall,
    )


@router.patch("/users/{user_id}/privileges", response_model=AdminUserListItem)
def admin_patch_privileges(
    user_id: int,
    body: AdminPrivilegesPatch,
    session: Annotated[Session, Depends(get_session)],
    admin: Annotated[UserPrivilege, Depends(get_admin_privilege)],
    current: Annotated[User, Depends(get_current_user)],
) -> AdminUserListItem:
    if user_id == current.user_id:
        raise HTTPException(status_code=400, detail="ไม่สามารถแก้สิทธิ์ตนเองผ่านเส้นนี้")
    u = session.get(User, user_id)
    if u is None:
        raise HTTPException(status_code=404, detail="ไม่พบผู้ใช้")
    p = session.exec(select(UserPrivilege).where(UserPrivilege.user_id == user_id)).first()
    if p is None:
        raise HTTPException(status_code=404, detail="ไม่พบสิทธิ์")
    for key in ("uread", "uwrite", "uedit", "uall"):
        val = getattr(body, key)
        if val is not None:
            setattr(p, key, val)
    session.add(p)
    session.commit()
    session.refresh(p)
    session.refresh(u)
    _ = admin
    return AdminUserListItem(
        user_id=u.user_id,
        organization_id=u.organization_id,
        firstname=u.firstname,
        lastname=u.lastname,
        email=u.email,
        uname=p.uname,
        uall=p.uall,
    )


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def admin_delete_user(
    user_id: int,
    session: Annotated[Session, Depends(get_session)],
    admin: Annotated[UserPrivilege, Depends(get_admin_privilege)],
    current: Annotated[User, Depends(get_current_user)],
) -> None:
    _ = admin
    if user_id == current.user_id:
        raise HTTPException(status_code=400, detail="ไม่สามารถลบบัญชีตนเอง")
    u = session.get(User, user_id)
    if u is None:
        raise HTTPException(status_code=404, detail="ไม่พบผู้ใช้")
    _purge_user_graph(session, user_id)
    session.commit()


@router.get("/organizations", response_model=list[OrganizationRead])
def admin_list_organizations(
    session: Annotated[Session, Depends(get_session)],
    admin: Annotated[UserPrivilege, Depends(get_admin_privilege)],
) -> list[Organization]:
    _ = admin
    return list(session.exec(select(Organization)).all())


@router.post("/organizations", response_model=OrganizationRead, status_code=201)
def admin_create_organization(
    body: AdminOrganizationCreate,
    session: Annotated[Session, Depends(get_session)],
    admin: Annotated[UserPrivilege, Depends(get_admin_privilege)],
) -> Organization:
    _ = admin
    row = Organization(**body.model_dump())
    session.add(row)
    session.commit()
    session.refresh(row)
    return row


@router.get("/organizations/{org_id}", response_model=OrganizationRead)
def admin_get_organization(
    org_id: int,
    session: Annotated[Session, Depends(get_session)],
    admin: Annotated[UserPrivilege, Depends(get_admin_privilege)],
) -> Organization:
    _ = admin
    org = session.get(Organization, org_id)
    if org is None:
        raise HTTPException(status_code=404, detail="ไม่พบองค์กร")
    return org


@router.patch("/organizations/{org_id}", response_model=OrganizationRead)
def admin_patch_organization(
    org_id: int,
    body: OrganizationUpdate,
    session: Annotated[Session, Depends(get_session)],
    admin: Annotated[UserPrivilege, Depends(get_admin_privilege)],
) -> Organization:
    _ = admin
    org = session.get(Organization, org_id)
    if org is None:
        raise HTTPException(status_code=404, detail="ไม่พบองค์กร")
    for key, val in body.model_dump(exclude_unset=True).items():
        if val is None or not hasattr(org, key):
            continue
        if key == "email":
            setattr(org, key, str(val)[:50])
        else:
            setattr(org, key, val)
    session.add(org)
    session.commit()
    session.refresh(org)
    return org


@router.delete("/organizations/{org_id}", status_code=status.HTTP_204_NO_CONTENT)
def admin_delete_organization(
    org_id: int,
    session: Annotated[Session, Depends(get_session)],
    admin: Annotated[UserPrivilege, Depends(get_admin_privilege)],
    current: Annotated[User, Depends(get_current_user)],
) -> None:
    _ = admin
    org = session.get(Organization, org_id)
    if org is None:
        raise HTTPException(status_code=404, detail="ไม่พบองค์กร")
    if current.organization_id == org_id:
        raise HTTPException(status_code=400, detail="ไม่สามารถลบองค์กรที่บัญชีผู้ดูแลสังกัดอยู่")
    for u in list(session.exec(select(User).where(User.organization_id == org_id)).all()):
        _purge_user_graph(session, u.user_id)
    delete_organization_cascade(session, org_id)
    session.delete(org)
    session.commit()


@router.get("/monitoring/submissions", response_model=list[MonitoringOrgRow])
def admin_monitoring(
    session: Annotated[Session, Depends(get_session)],
    admin: Annotated[UserPrivilege, Depends(get_admin_privilege)],
) -> list[MonitoringOrgRow]:
    _ = admin
    orgs = list(session.exec(select(Organization)).all())
    out: list[MonitoringOrgRow] = []
    for org in orgs:
        oid = org.organization_id
        fc = (
            session.exec(
                select(func.count()).select_from(GhgtForm).where(GhgtForm.organization_id == oid)
            ).first()
            or 0
        )
        st_last = (
            select(EditForm.edit_date)
            .join(GhgtForm, EditForm.fid == GhgtForm.fid)
            .where(GhgtForm.organization_id == oid)
            .order_by(desc(EditForm.efid))
            .limit(1)
        )
        last_row = session.exec(st_last).first()
        last_edit = last_row if isinstance(last_row, str) else None
        out.append(
            MonitoringOrgRow(
                organization_id=oid,
                organization_name=org.organization_name,
                forms_count=int(fc),
                last_edit_date=last_edit,
            )
        )
    return out


@router.get("/emission-factors", response_model=list[GwpRead])
def admin_list_gwp(
    session: Annotated[Session, Depends(get_session)],
    admin: Annotated[UserPrivilege, Depends(get_admin_privilege)],
) -> list[Gwp]:
    _ = admin
    return list(session.exec(select(Gwp)).all())


@router.post("/emission-factors", response_model=GwpRead, status_code=201)
def admin_create_gwp(
    body: GwpCreate,
    session: Annotated[Session, Depends(get_session)],
    admin: Annotated[UserPrivilege, Depends(get_admin_privilege)],
) -> Gwp:
    _ = admin
    row = Gwp(subject=body.subject[:100], value=body.value[:100])
    session.add(row)
    session.commit()
    session.refresh(row)
    invalidate_ef_reference_cache()
    return row


@router.patch("/emission-factors/{gwpid}", response_model=GwpRead)
def admin_patch_gwp(
    gwpid: int,
    body: GwpUpdate,
    session: Annotated[Session, Depends(get_session)],
    admin: Annotated[UserPrivilege, Depends(get_admin_privilege)],
) -> Gwp:
    _ = admin
    row = session.get(Gwp, gwpid)
    if row is None:
        raise HTTPException(status_code=404, detail="ไม่พบรายการ")
    if body.subject is not None:
        row.subject = body.subject[:100]
    if body.value is not None:
        row.value = body.value[:100]
    session.add(row)
    session.commit()
    session.refresh(row)
    invalidate_ef_reference_cache()
    return row


@router.delete("/emission-factors/{gwpid}", status_code=status.HTTP_204_NO_CONTENT)
def admin_delete_gwp(
    gwpid: int,
    session: Annotated[Session, Depends(get_session)],
    admin: Annotated[UserPrivilege, Depends(get_admin_privilege)],
) -> None:
    _ = admin
    row = session.get(Gwp, gwpid)
    if row is None:
        raise HTTPException(status_code=404, detail="ไม่พบรายการ")
    session.delete(row)
    session.commit()
    invalidate_ef_reference_cache()


@router.get("/announcements", response_model=list[AnnouncementRead])
def admin_list_announcements(
    admin: Annotated[UserPrivilege, Depends(get_admin_privilege)],
) -> list[AnnouncementRead]:
    _ = admin
    rows = ann_store.list_announcements(active_only=False)
    return [AnnouncementRead.model_validate(r) for r in rows]


@router.post("/announcements", response_model=AnnouncementRead, status_code=status.HTTP_201_CREATED)
def admin_create_announcement(
    body: AnnouncementCreate,
    admin: Annotated[UserPrivilege, Depends(get_admin_privilege)],
    current: Annotated[User, Depends(get_current_user)],
) -> AnnouncementRead:
    _ = admin
    row = ann_store.create_announcement(
        title=body.title,
        body=body.body,
        active=body.active,
        priority=body.priority,
        created_by_email=current.email,
    )
    invalidate_announcements_cache()
    return AnnouncementRead.model_validate(row)


@router.patch("/announcements/{announcement_id}", response_model=AnnouncementRead)
def admin_patch_announcement(
    announcement_id: str,
    body: AnnouncementUpdate,
    admin: Annotated[UserPrivilege, Depends(get_admin_privilege)],
    current: Annotated[User, Depends(get_current_user)],
) -> AnnouncementRead:
    _ = admin
    row = ann_store.update_announcement(
        announcement_id,
        title=body.title,
        body=body.body,
        active=body.active,
        priority=body.priority,
        actor_email=current.email,
    )
    if row is None:
        raise HTTPException(status_code=404, detail="ไม่พบประกาศ")
    invalidate_announcements_cache()
    return AnnouncementRead.model_validate(row)


@router.delete("/announcements/{announcement_id}", status_code=status.HTTP_204_NO_CONTENT)
def admin_delete_announcement(
    announcement_id: str,
    admin: Annotated[UserPrivilege, Depends(get_admin_privilege)],
    current: Annotated[User, Depends(get_current_user)],
) -> None:
    _ = admin
    ok = ann_store.delete_announcement(announcement_id, actor_email=current.email)
    if not ok:
        raise HTTPException(status_code=404, detail="ไม่พบประกาศ")
    invalidate_announcements_cache()


@router.get("/audit-log", response_model=list[AdminAuditEntryRead])
def admin_audit_log(
    admin: Annotated[UserPrivilege, Depends(get_admin_privilege)],
    limit: int = Query(default=100, ge=1, le=500),
) -> list[AdminAuditEntryRead]:
    _ = admin
    raw = ann_store.read_audit_entries(limit=limit)
    out: list[AdminAuditEntryRead] = []
    for r in raw:
        try:
            out.append(AdminAuditEntryRead.model_validate(r))
        except Exception:
            continue
    return out


@router.get("/diagnostics/monitor-commands", response_model=list[MonitorCommandRead])
def admin_monitor_commands(
    admin: Annotated[UserPrivilege, Depends(get_admin_privilege)],
) -> list[MonitorCommandRead]:
    _ = admin
    return [MonitorCommandRead.model_validate(x) for x in monitor_commands()]
