from typing import Annotated, Literal

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
    from app.services.image_storage import ImageAssetKind, delete_stored_file, store_image

    assert_org_access(user, priv, org_id)
    org = session.get(Organization, org_id)
    if org is None:
        raise HTTPException(status_code=404, detail="ไม่พบองค์กร")
    kind_map = {
        "logo": ImageAssetKind.LOGO,
        "map": ImageAssetKind.MAP,
        "structure": ImageAssetKind.STRUCTURE,
        "image": ImageAssetKind.IMAGE,
    }
    asset_kind = kind_map[kind]
    prev_url: str | None = None
    if kind == "logo":
        prev_url = org.logo
    elif kind == "map":
        prev_url = org.organization_map
    elif kind == "structure":
        prev_url = org.organ_structure
    else:
        prev_url = org.organization_image
    content = await file.read()
    delete_stored_file(prev_url)
    url = store_image(
        content,
        org_id=org_id,
        user_id=None,
        kind=asset_kind,
        owner_id=org_id,
    )
    if kind == "logo":
        org.logo = url[:100]
    elif kind == "map":
        org.organization_map = url[:50]
    elif kind == "structure":
        org.organ_structure = url[:50]
    else:
        org.organization_image = url[:50]
    session.add(org)
    session.commit()
    session.refresh(org)
    return org
