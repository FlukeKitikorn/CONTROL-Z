from pathlib import Path
from typing import Annotated, Literal
from uuid import uuid4

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlmodel import Session, select

from app.core.access import assert_org_access
from app.core.database import get_session
from app.core.deps import get_current_privilege, get_current_user
from app.models import (
    CollectInformation,
    Organization,
    OrganizationInformation,
    User,
    UserPrivilege,
)
from app.schemas.rest import (
    CollectInformationCreate,
    CollectInformationRead,
    CollectInformationUpdate,
    OrganizationInformationCreate,
    OrganizationInformationRead,
    OrganizationInformationUpdate,
    OrganizationPut,
    OrganizationRead,
    OrganizationUpdate,
)

router = APIRouter(prefix="/organizations", tags=["organizations"])


@router.get("/{org_id}", response_model=OrganizationRead)
def get_organization(
    org_id: int,
    session: Annotated[Session, Depends(get_session)],
    user: Annotated[User, Depends(get_current_user)],
    priv: Annotated[UserPrivilege, Depends(get_current_privilege)],
) -> Organization:
    assert_org_access(user, priv, org_id)
    org = session.get(Organization, org_id)
    if org is None:
        raise HTTPException(status_code=404, detail="ไม่พบองค์กร")
    return org


@router.put("/{org_id}", response_model=OrganizationRead)
def put_organization(
    org_id: int,
    body: OrganizationPut,
    session: Annotated[Session, Depends(get_session)],
    user: Annotated[User, Depends(get_current_user)],
    priv: Annotated[UserPrivilege, Depends(get_current_privilege)],
) -> Organization:
    assert_org_access(user, priv, org_id)
    org = session.get(Organization, org_id)
    if org is None:
        raise HTTPException(status_code=404, detail="ไม่พบองค์กร")
    for key, val in body.model_dump().items():
        if key == "email":
            setattr(org, key, str(val)[:50])
        else:
            setattr(org, key, val)
    session.add(org)
    session.commit()
    session.refresh(org)
    return org


@router.patch("/{org_id}", response_model=OrganizationRead)
def patch_organization(
    org_id: int,
    body: OrganizationUpdate,
    session: Annotated[Session, Depends(get_session)],
    user: Annotated[User, Depends(get_current_user)],
    priv: Annotated[UserPrivilege, Depends(get_current_privilege)],
) -> Organization:
    assert_org_access(user, priv, org_id)
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


@router.get("/{org_id}/information", response_model=list[OrganizationInformationRead])
def list_org_information(
    org_id: int,
    session: Annotated[Session, Depends(get_session)],
    user: Annotated[User, Depends(get_current_user)],
    priv: Annotated[UserPrivilege, Depends(get_current_privilege)],
) -> list[OrganizationInformation]:
    assert_org_access(user, priv, org_id)
    st = select(OrganizationInformation).where(OrganizationInformation.organization_id == org_id)
    return list(session.exec(st).all())


@router.get("/{org_id}/information/{ogid}", response_model=OrganizationInformationRead)
def get_org_information_row(
    org_id: int,
    ogid: int,
    session: Annotated[Session, Depends(get_session)],
    user: Annotated[User, Depends(get_current_user)],
    priv: Annotated[UserPrivilege, Depends(get_current_privilege)],
) -> OrganizationInformation:
    assert_org_access(user, priv, org_id)
    row = session.get(OrganizationInformation, ogid)
    if row is None or row.organization_id != org_id:
        raise HTTPException(status_code=404, detail="ไม่พบข้อมูล")
    return row


@router.patch("/{org_id}/information/{ogid}", response_model=OrganizationInformationRead)
def patch_org_information_row(
    org_id: int,
    ogid: int,
    body: OrganizationInformationUpdate,
    session: Annotated[Session, Depends(get_session)],
    user: Annotated[User, Depends(get_current_user)],
    priv: Annotated[UserPrivilege, Depends(get_current_privilege)],
) -> OrganizationInformation:
    assert_org_access(user, priv, org_id)
    row = session.get(OrganizationInformation, ogid)
    if row is None or row.organization_id != org_id:
        raise HTTPException(status_code=404, detail="ไม่พบข้อมูล")
    row.description = body.description
    session.add(row)
    session.commit()
    session.refresh(row)
    return row


@router.delete("/{org_id}/information/{ogid}", status_code=status.HTTP_204_NO_CONTENT)
def delete_org_information_row(
    org_id: int,
    ogid: int,
    session: Annotated[Session, Depends(get_session)],
    user: Annotated[User, Depends(get_current_user)],
    priv: Annotated[UserPrivilege, Depends(get_current_privilege)],
) -> None:
    assert_org_access(user, priv, org_id)
    row = session.get(OrganizationInformation, ogid)
    if row is None or row.organization_id != org_id:
        raise HTTPException(status_code=404, detail="ไม่พบข้อมูล")
    session.delete(row)
    session.commit()


@router.post("/{org_id}/information", response_model=OrganizationInformationRead, status_code=201)
def add_org_information(
    org_id: int,
    body: OrganizationInformationCreate,
    session: Annotated[Session, Depends(get_session)],
    user: Annotated[User, Depends(get_current_user)],
    priv: Annotated[UserPrivilege, Depends(get_current_privilege)],
) -> OrganizationInformation:
    assert_org_access(user, priv, org_id)
    row = OrganizationInformation(organization_id=org_id, description=body.description)
    session.add(row)
    session.commit()
    session.refresh(row)
    return row


@router.get("/{org_id}/collect-information", response_model=list[CollectInformationRead])
def list_collect_information(
    org_id: int,
    session: Annotated[Session, Depends(get_session)],
    user: Annotated[User, Depends(get_current_user)],
    priv: Annotated[UserPrivilege, Depends(get_current_privilege)],
) -> list[CollectInformation]:
    assert_org_access(user, priv, org_id)
    st = select(CollectInformation).where(CollectInformation.organization_id == org_id)
    return list(session.exec(st).all())


@router.get("/{org_id}/collect-information/{ciid}", response_model=CollectInformationRead)
def get_collect_information_row(
    org_id: int,
    ciid: int,
    session: Annotated[Session, Depends(get_session)],
    user: Annotated[User, Depends(get_current_user)],
    priv: Annotated[UserPrivilege, Depends(get_current_privilege)],
) -> CollectInformation:
    assert_org_access(user, priv, org_id)
    row = session.get(CollectInformation, ciid)
    if row is None or row.organization_id != org_id:
        raise HTTPException(status_code=404, detail="ไม่พบข้อมูล")
    return row


@router.delete("/{org_id}/collect-information/{ciid}", status_code=status.HTTP_204_NO_CONTENT)
def delete_collect_information_row(
    org_id: int,
    ciid: int,
    session: Annotated[Session, Depends(get_session)],
    user: Annotated[User, Depends(get_current_user)],
    priv: Annotated[UserPrivilege, Depends(get_current_privilege)],
) -> None:
    assert_org_access(user, priv, org_id)
    row = session.get(CollectInformation, ciid)
    if row is None or row.organization_id != org_id:
        raise HTTPException(status_code=404, detail="ไม่พบข้อมูล")
    session.delete(row)
    session.commit()


@router.post("/{org_id}/collect-information", response_model=CollectInformationRead, status_code=201)
def create_collect_information(
    org_id: int,
    body: CollectInformationCreate,
    session: Annotated[Session, Depends(get_session)],
    user: Annotated[User, Depends(get_current_user)],
    priv: Annotated[UserPrivilege, Depends(get_current_privilege)],
) -> CollectInformation:
    assert_org_access(user, priv, org_id)
    row = CollectInformation(organization_id=org_id, **body.model_dump())
    session.add(row)
    session.commit()
    session.refresh(row)
    return row


@router.patch("/{org_id}/collect-information/{ciid}", response_model=CollectInformationRead)
def patch_collect_information(
    org_id: int,
    ciid: int,
    body: CollectInformationUpdate,
    session: Annotated[Session, Depends(get_session)],
    user: Annotated[User, Depends(get_current_user)],
    priv: Annotated[UserPrivilege, Depends(get_current_privilege)],
) -> CollectInformation:
    assert_org_access(user, priv, org_id)
    row = session.get(CollectInformation, ciid)
    if row is None or row.organization_id != org_id:
        raise HTTPException(status_code=404, detail="ไม่พบข้อมูล")
    for key, val in body.model_dump(exclude_unset=True).items():
        if val is not None:
            setattr(row, key, val)
    session.add(row)
    session.commit()
    session.refresh(row)
    return row


@router.post("/{org_id}/assets", response_model=OrganizationRead)
async def upload_org_asset(
    org_id: int,
    session: Annotated[Session, Depends(get_session)],
    user: Annotated[User, Depends(get_current_user)],
    priv: Annotated[UserPrivilege, Depends(get_current_privilege)],
    kind: Annotated[Literal["logo", "map", "structure", "image"], Form()],
    file: UploadFile = File(...),
) -> Organization:
    assert_org_access(user, priv, org_id)
    org = session.get(Organization, org_id)
    if org is None:
        raise HTTPException(status_code=404, detail="ไม่พบองค์กร")
    base = Path(__file__).resolve().parent.parent.parent / "uploads"
    base.mkdir(parents=True, exist_ok=True)
    org_dir = base / str(org_id) / "assets"
    org_dir.mkdir(parents=True, exist_ok=True)
    ext = Path(file.filename or "file").suffix[:8] or ".bin"
    name = f"{kind}_{uuid4().hex[:10]}{ext}"
    dest = org_dir / name
    content = await file.read()
    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="ไฟล์ใหญ่เกิน 5MB")
    dest.write_bytes(content)
    rel = f"/static/{org_id}/assets/{name}"
    if kind == "logo":
        org.logo = rel[:100]
    elif kind == "map":
        org.organization_map = rel[:50]
    elif kind == "structure":
        org.organ_structure = rel[:50]
    else:
        org.organization_image = rel[:50]
    session.add(org)
    session.commit()
    session.refresh(org)
    return org
