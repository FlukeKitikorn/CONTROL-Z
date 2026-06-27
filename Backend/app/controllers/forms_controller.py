from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.core.access import assert_org_access
from app.core.database import get_session
from app.core.deps import get_current_privilege, get_current_user
from app.controllers.resource_utils import get_form_in_org
from app.models import EditForm, FormDetail, GhgtForm, User, UserPrivilege
from app.schemas.rest import (
    FormDetailCreate,
    FormDetailRead,
    FormDetailUpdate,
    GhgtFormCreate,
    GhgtFormRead,
    GhgtFormUpdate,
)
from app.services.cascade_helpers import delete_form_cascade

router = APIRouter(prefix="/organizations/{org_id}/forms", tags=["forms"])


@router.get("", response_model=list[GhgtFormRead])
def list_forms(
    org_id: int,
    session: Annotated[Session, Depends(get_session)],
    user: Annotated[User, Depends(get_current_user)],
    priv: Annotated[UserPrivilege, Depends(get_current_privilege)],
) -> list[GhgtForm]:
    assert_org_access(user, priv, org_id)
    st = select(GhgtForm).where(GhgtForm.organization_id == org_id)
    return list(session.exec(st).all())


@router.post("", response_model=GhgtFormRead, status_code=201)
def create_form(
    org_id: int,
    body: GhgtFormCreate,
    session: Annotated[Session, Depends(get_session)],
    user: Annotated[User, Depends(get_current_user)],
    priv: Annotated[UserPrivilege, Depends(get_current_privilege)],
) -> GhgtForm:
    assert_org_access(user, priv, org_id)
    row = GhgtForm(organization_id=org_id, **body.model_dump())
    session.add(row)
    session.commit()
    session.refresh(row)
    return row


@router.get("/{fid}", response_model=GhgtFormRead)
def get_form(
    org_id: int,
    fid: int,
    session: Annotated[Session, Depends(get_session)],
    user: Annotated[User, Depends(get_current_user)],
    priv: Annotated[UserPrivilege, Depends(get_current_privilege)],
) -> GhgtForm:
    assert_org_access(user, priv, org_id)
    return get_form_in_org(session, org_id, fid)


@router.put("/{fid}", response_model=GhgtFormRead)
def put_form(
    org_id: int,
    fid: int,
    body: GhgtFormUpdate,
    session: Annotated[Session, Depends(get_session)],
    user: Annotated[User, Depends(get_current_user)],
    priv: Annotated[UserPrivilege, Depends(get_current_privilege)],
) -> GhgtForm:
    return patch_form(org_id, fid, body, session, user, priv)


@router.patch("/{fid}", response_model=GhgtFormRead)
def patch_form(
    org_id: int,
    fid: int,
    body: GhgtFormUpdate,
    session: Annotated[Session, Depends(get_session)],
    user: Annotated[User, Depends(get_current_user)],
    priv: Annotated[UserPrivilege, Depends(get_current_privilege)],
) -> GhgtForm:
    assert_org_access(user, priv, org_id)
    f = get_form_in_org(session, org_id, fid)
    for key, val in body.model_dump(exclude_unset=True).items():
        if val is not None:
            setattr(f, key, val)
    session.add(f)
    session.commit()
    session.refresh(f)
    edit = EditForm(
        fid=fid,
        user_id=user.user_id,
        edit_date=datetime.now().strftime("%Y-%m-%d %H:%M"),
    )
    session.add(edit)
    session.commit()
    session.refresh(f)
    return f


@router.delete("/{fid}", status_code=status.HTTP_204_NO_CONTENT)
def delete_form(
    org_id: int,
    fid: int,
    session: Annotated[Session, Depends(get_session)],
    user: Annotated[User, Depends(get_current_user)],
    priv: Annotated[UserPrivilege, Depends(get_current_privilege)],
) -> None:
    assert_org_access(user, priv, org_id)
    get_form_in_org(session, org_id, fid)
    delete_form_cascade(session, fid)
    session.commit()


@router.get("/{fid}/details", response_model=list[FormDetailRead])
def list_form_details(
    org_id: int,
    fid: int,
    session: Annotated[Session, Depends(get_session)],
    user: Annotated[User, Depends(get_current_user)],
    priv: Annotated[UserPrivilege, Depends(get_current_privilege)],
) -> list[FormDetail]:
    assert_org_access(user, priv, org_id)
    get_form_in_org(session, org_id, fid)
    st = select(FormDetail).where(FormDetail.fid == fid)
    return list(session.exec(st).all())


@router.get("/{fid}/details/{fdid}", response_model=FormDetailRead)
def get_form_detail(
    org_id: int,
    fid: int,
    fdid: int,
    session: Annotated[Session, Depends(get_session)],
    user: Annotated[User, Depends(get_current_user)],
    priv: Annotated[UserPrivilege, Depends(get_current_privilege)],
) -> FormDetail:
    assert_org_access(user, priv, org_id)
    get_form_in_org(session, org_id, fid)
    row = session.get(FormDetail, fdid)
    if row is None or row.fid != fid:
        raise HTTPException(status_code=404, detail="ไม่พบรายละเอียด")
    return row


@router.patch("/{fid}/details/{fdid}", response_model=FormDetailRead)
def patch_form_detail(
    org_id: int,
    fid: int,
    fdid: int,
    body: FormDetailUpdate,
    session: Annotated[Session, Depends(get_session)],
    user: Annotated[User, Depends(get_current_user)],
    priv: Annotated[UserPrivilege, Depends(get_current_privilege)],
) -> FormDetail:
    assert_org_access(user, priv, org_id)
    get_form_in_org(session, org_id, fid)
    row = session.get(FormDetail, fdid)
    if row is None or row.fid != fid:
        raise HTTPException(status_code=404, detail="ไม่พบรายละเอียด")
    for key, val in body.model_dump(exclude_unset=True).items():
        if val is not None:
            setattr(row, key, val)
    session.add(row)
    session.commit()
    session.refresh(row)
    return row


@router.delete("/{fid}/details/{fdid}", status_code=status.HTTP_204_NO_CONTENT)
def delete_form_detail(
    org_id: int,
    fid: int,
    fdid: int,
    session: Annotated[Session, Depends(get_session)],
    user: Annotated[User, Depends(get_current_user)],
    priv: Annotated[UserPrivilege, Depends(get_current_privilege)],
) -> None:
    assert_org_access(user, priv, org_id)
    get_form_in_org(session, org_id, fid)
    row = session.get(FormDetail, fdid)
    if row is None or row.fid != fid:
        raise HTTPException(status_code=404, detail="ไม่พบรายละเอียด")
    session.delete(row)
    session.commit()


@router.post("/{fid}/details", response_model=FormDetailRead, status_code=201)
def add_form_detail(
    org_id: int,
    fid: int,
    body: FormDetailCreate,
    session: Annotated[Session, Depends(get_session)],
    user: Annotated[User, Depends(get_current_user)],
    priv: Annotated[UserPrivilege, Depends(get_current_privilege)],
) -> FormDetail:
    assert_org_access(user, priv, org_id)
    get_form_in_org(session, org_id, fid)
    row = FormDetail(fid=fid, subject=body.subject, description=body.description)
    session.add(row)
    session.commit()
    session.refresh(row)
    return row
