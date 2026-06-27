from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Session, col, select

from app.core.database import get_session
from app.core.deps import get_admin_privilege, get_current_privilege, get_current_user
from app.models import Gwp, Scope, User, UserPrivilege
from app.schemas.rest import (
    EfResolveRow,
    EfUiOptionRead,
    GwpCreate,
    GwpRead,
    GwpUpdate,
    Scope3EfCatalogRead,
    ScopeCreate,
    ScopeRead,
    ScopeUpdate,
)
from app.services.ef_resolver import list_scope3_catalog, list_ui_options, resolve_ui_ef_rows

router = APIRouter(prefix="/reference", tags=["reference"])


@router.get("/scopes", response_model=list[ScopeRead])
def list_scopes(session: Annotated[Session, Depends(get_session)]) -> list[Scope]:
    st = select(Scope)
    return list(session.exec(st).all())


@router.get("/scopes/{scid}", response_model=ScopeRead)
def get_scope(scid: int, session: Annotated[Session, Depends(get_session)]) -> Scope:
    row = session.get(Scope, scid)
    if row is None:
        raise HTTPException(status_code=404, detail="ไม่พบ scope")
    return row


@router.post("/scopes", response_model=ScopeRead, status_code=201)
def create_scope(
    body: ScopeCreate,
    session: Annotated[Session, Depends(get_session)],
    admin: Annotated[UserPrivilege, Depends(get_admin_privilege)],
) -> Scope:
    _ = admin
    row = Scope(description=body.description[:100])
    session.add(row)
    session.commit()
    session.refresh(row)
    return row


@router.patch("/scopes/{scid}", response_model=ScopeRead)
def patch_scope(
    scid: int,
    body: ScopeUpdate,
    session: Annotated[Session, Depends(get_session)],
    admin: Annotated[UserPrivilege, Depends(get_admin_privilege)],
) -> Scope:
    _ = admin
    row = session.get(Scope, scid)
    if row is None:
        raise HTTPException(status_code=404, detail="ไม่พบ scope")
    if body.description is not None:
        row.description = body.description[:100]
    session.add(row)
    session.commit()
    session.refresh(row)
    return row


@router.delete("/scopes/{scid}", status_code=status.HTTP_204_NO_CONTENT)
def delete_scope(
    scid: int,
    session: Annotated[Session, Depends(get_session)],
    admin: Annotated[UserPrivilege, Depends(get_admin_privilege)],
) -> None:
    _ = admin
    row = session.get(Scope, scid)
    if row is None:
        raise HTTPException(status_code=404, detail="ไม่พบ scope")
    session.delete(row)
    session.commit()


@router.get("/gwp", response_model=list[GwpRead])
def list_gwp(
    session: Annotated[Session, Depends(get_session)],
    q: str | None = Query(default=None, max_length=100),
) -> list[Gwp]:
    st = select(Gwp)
    if q:
        st = st.where(col(Gwp.subject).contains(q))
    return list(session.exec(st).all())


@router.get("/gwp/{gwpid}", response_model=GwpRead)
def get_gwp(gwpid: int, session: Annotated[Session, Depends(get_session)]) -> Gwp:
    row = session.get(Gwp, gwpid)
    if row is None:
        raise HTTPException(status_code=404, detail="ไม่พบ GWP")
    return row


@router.post("/gwp", response_model=GwpRead, status_code=201)
def create_gwp_reference(
    body: GwpCreate,
    session: Annotated[Session, Depends(get_session)],
    admin: Annotated[UserPrivilege, Depends(get_admin_privilege)],
) -> Gwp:
    _ = admin
    row = Gwp(subject=body.subject[:100], value=body.value[:100])
    session.add(row)
    session.commit()
    session.refresh(row)
    return row


@router.patch("/gwp/{gwpid}", response_model=GwpRead)
def patch_gwp_reference(
    gwpid: int,
    body: GwpUpdate,
    session: Annotated[Session, Depends(get_session)],
    admin: Annotated[UserPrivilege, Depends(get_admin_privilege)],
) -> Gwp:
    _ = admin
    row = session.get(Gwp, gwpid)
    if row is None:
        raise HTTPException(status_code=404, detail="ไม่พบ GWP")
    if body.subject is not None:
        row.subject = body.subject[:100]
    if body.value is not None:
        row.value = body.value[:100]
    session.add(row)
    session.commit()
    session.refresh(row)
    return row


@router.delete("/gwp/{gwpid}", status_code=status.HTTP_204_NO_CONTENT)
def delete_gwp_reference(
    gwpid: int,
    session: Annotated[Session, Depends(get_session)],
    admin: Annotated[UserPrivilege, Depends(get_admin_privilege)],
) -> None:
    _ = admin
    row = session.get(Gwp, gwpid)
    if row is None:
        raise HTTPException(status_code=404, detail="ไม่พบ GWP")
    session.delete(row)
    session.commit()


@router.get("/emission-factors", response_model=list[dict])
def list_emission_factors_public(
    session: Annotated[Session, Depends(get_session)],
    user: Annotated[User, Depends(get_current_user)],
    priv: Annotated[UserPrivilege, Depends(get_current_privilege)],
) -> list[dict]:
    """Legacy endpoint — คืน GWP เก่า; ใช้ /ef-resolve สำหรับ EF จริง"""
    _ = user, priv
    rows = list(session.exec(select(Gwp)).all())
    out = []
    for r in rows:
        try:
            fv = float(r.value)
        except ValueError:
            fv = 0.0
        out.append(
            {
                "id": r.gwpid,
                "source": r.subject,
                "factor": fv,
                "version": "gwp",
            }
        )
    return out


@router.get("/ef-ui-options", response_model=list[EfUiOptionRead])
def list_ef_ui_options(
    session: Annotated[Session, Depends(get_session)],
    user: Annotated[User, Depends(get_current_user)],
    priv: Annotated[UserPrivilege, Depends(get_current_privilege)],
    scope_scid: int | None = Query(default=None, ge=1, le=3),
    ui_context: str | None = Query(default=None, max_length=80),
) -> list[EfUiOptionRead]:
    _ = user, priv
    try:
        rows = list_ui_options(session, scope_scid=scope_scid, ui_context=ui_context)
    except Exception as exc:
        raise HTTPException(status_code=503, detail="ยังไม่มีตาราง EF bridge — รัน docs/sql/01–04") from exc
    return [EfUiOptionRead(**r) for r in rows]


@router.get("/ef-resolve", response_model=list[EfResolveRow])
def resolve_ef_for_ui(
    session: Annotated[Session, Depends(get_session)],
    user: Annotated[User, Depends(get_current_user)],
    priv: Annotated[UserPrivilege, Depends(get_current_privilege)],
    scope_scid: int = Query(ge=1, le=3),
    ui_context: str = Query(max_length=80),
    option_key: str = Query(max_length=80),
    activity_subtype: str | None = Query(default=None, max_length=100),
) -> list[EfResolveRow]:
    """Resolve EF ตามคีย์ Frontend (ดู ef_ui_options + ef_resolve_by_ui)."""
    _ = user, priv
    try:
        rows = resolve_ui_ef_rows(
            session,
            scope_scid=scope_scid,
            ui_context=ui_context,
            option_key=option_key,
            activity_subtype=activity_subtype,
        )
    except Exception as exc:
        raise HTTPException(status_code=503, detail="ยังไม่มี view ef_resolve_by_ui") from exc
    if not rows:
        raise HTTPException(status_code=404, detail="ไม่พบ EF สำหรับ option นี้")
    return [EfResolveRow(**r) for r in rows]


@router.get("/scope3-ef-catalog", response_model=list[Scope3EfCatalogRead])
def list_scope3_ef_catalog(
    session: Annotated[Session, Depends(get_session)],
    user: Annotated[User, Depends(get_current_user)],
    priv: Annotated[UserPrivilege, Depends(get_current_privilege)],
    scope3_category_code: str | None = Query(default=None, max_length=80),
) -> list[Scope3EfCatalogRead]:
    """แมปบรรทัด Scope 3 ในฟอร์ม → ef_category_code."""
    _ = user, priv
    try:
        rows = list_scope3_catalog(session, scope3_category_code=scope3_category_code)
    except Exception as exc:
        raise HTTPException(status_code=503, detail="ยังไม่มีตาราง scope3_ef_catalog") from exc
    return [Scope3EfCatalogRead(**r) for r in rows]
