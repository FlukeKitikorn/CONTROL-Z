from typing import Annotated, Any

import json

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import text
from sqlmodel import Session, select

from app.controllers.resource_utils import get_form_in_org
from app.core.access import assert_org_access
from app.core.database import get_session
from app.core.deps import get_current_privilege, get_current_user
from app.models import (
    Category,
    CategoryAnswer,
    DetailsScope,
    Fr041Detail,
    GhgtForm,
    PointsConsider,
    Scope,
    SubjectScope,
    User,
    UserPrivilege,
)
from app.schemas.rest import (
    ActivityEntryRead,
    CategoryAnswerCreate,
    CategoryAnswerRead,
    CategoryAnswerUpsert,
    CategoryCreate,
    CategoryRead,
    CategoryUpdate,
    DetailsScopeCreate,
    DetailsScopeRead,
    DetailsScopeReplaceBody,
    DetailsScopeUpdate,
    Fr04DetailPatch,
    Fr04DetailRead,
    Fr04DetailsPutBody,
    Fr04DetailUpsert,
    PointsConsiderCreate,
    PointsConsiderRead,
    PointsConsiderUpdate,
    SubjectScopeCreate,
    SubjectScopeRead,
    SubjectScopeUpdate,
)
from app.services.cascade_helpers import delete_subject_scope_tree

router = APIRouter(tags=["ghg"])


def _get_subject_scope(session: Session, subid: int) -> SubjectScope:
    s = session.get(SubjectScope, subid)
    if s is None:
        raise HTTPException(status_code=404, detail="ไม่พบหัวข้อ scope")
    return s


def _subject_scope_in_form(session: Session, org_id: int, fid: int, subid: int) -> SubjectScope:
    sub = session.get(SubjectScope, subid)
    if sub is None or sub.organization_id != org_id or sub.fid != fid:
        raise HTTPException(status_code=404, detail="ไม่พบหัวข้อ scope")
    return sub


def _category_in_org(session: Session, cid: int, org_id: int) -> Category:
    c = session.get(Category, cid)
    if c is None:
        raise HTTPException(status_code=404, detail="ไม่พบ category")
    f = session.get(GhgtForm, c.fid)
    if f is None or f.organization_id != org_id:
        raise HTTPException(status_code=404, detail="ไม่พบ category")
    return c


# --- Subject scopes (under form) ---
@router.get(
    "/organizations/{org_id}/forms/{fid}/subject-scopes",
    response_model=list[SubjectScopeRead],
)
def list_subject_scopes(
    org_id: int,
    fid: int,
    session: Annotated[Session, Depends(get_session)],
    user: Annotated[User, Depends(get_current_user)],
    priv: Annotated[UserPrivilege, Depends(get_current_privilege)],
) -> list[SubjectScope]:
    assert_org_access(user, priv, org_id)
    get_form_in_org(session, org_id, fid)
    st = select(SubjectScope).where(SubjectScope.fid == fid, SubjectScope.organization_id == org_id)
    return list(session.exec(st).all())


@router.post(
    "/organizations/{org_id}/forms/{fid}/subject-scopes",
    response_model=SubjectScopeRead,
    status_code=201,
)
def create_subject_scope(
    org_id: int,
    fid: int,
    body: SubjectScopeCreate,
    session: Annotated[Session, Depends(get_session)],
    user: Annotated[User, Depends(get_current_user)],
    priv: Annotated[UserPrivilege, Depends(get_current_privilege)],
) -> SubjectScope:
    assert_org_access(user, priv, org_id)
    get_form_in_org(session, org_id, fid)
    row = SubjectScope(
        scid=body.scid,
        organization_id=org_id,
        fid=fid,
        description=body.description,
    )
    session.add(row)
    session.commit()
    session.refresh(row)
    return row


@router.get(
    "/organizations/{org_id}/forms/{fid}/subject-scopes/{subid}",
    response_model=SubjectScopeRead,
)
def get_subject_scope(
    org_id: int,
    fid: int,
    subid: int,
    session: Annotated[Session, Depends(get_session)],
    user: Annotated[User, Depends(get_current_user)],
    priv: Annotated[UserPrivilege, Depends(get_current_privilege)],
) -> SubjectScope:
    assert_org_access(user, priv, org_id)
    get_form_in_org(session, org_id, fid)
    return _subject_scope_in_form(session, org_id, fid, subid)


@router.patch(
    "/organizations/{org_id}/forms/{fid}/subject-scopes/{subid}",
    response_model=SubjectScopeRead,
)
def patch_subject_scope(
    org_id: int,
    fid: int,
    subid: int,
    body: SubjectScopeUpdate,
    session: Annotated[Session, Depends(get_session)],
    user: Annotated[User, Depends(get_current_user)],
    priv: Annotated[UserPrivilege, Depends(get_current_privilege)],
) -> SubjectScope:
    assert_org_access(user, priv, org_id)
    get_form_in_org(session, org_id, fid)
    row = _subject_scope_in_form(session, org_id, fid, subid)
    data = body.model_dump(exclude_unset=True)
    if "scid" in data and data["scid"] is not None:
        if session.get(Scope, data["scid"]) is None:
            raise HTTPException(status_code=404, detail="ไม่พบ master scope")
        row.scid = data["scid"]
    if "description" in data and data["description"] is not None:
        row.description = data["description"][:100]
    session.add(row)
    session.commit()
    session.refresh(row)
    return row


@router.delete(
    "/organizations/{org_id}/forms/{fid}/subject-scopes/{subid}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_subject_scope(
    org_id: int,
    fid: int,
    subid: int,
    session: Annotated[Session, Depends(get_session)],
    user: Annotated[User, Depends(get_current_user)],
    priv: Annotated[UserPrivilege, Depends(get_current_privilege)],
) -> None:
    assert_org_access(user, priv, org_id)
    get_form_in_org(session, org_id, fid)
    _subject_scope_in_form(session, org_id, fid, subid)
    delete_subject_scope_tree(session, subid)
    session.commit()


# --- Details scope ---
@router.get("/subject-scopes/{subid}/details", response_model=list[DetailsScopeRead])
def list_details_scope(
    subid: int,
    session: Annotated[Session, Depends(get_session)],
    user: Annotated[User, Depends(get_current_user)],
    priv: Annotated[UserPrivilege, Depends(get_current_privilege)],
) -> list[DetailsScope]:
    sub = _get_subject_scope(session, subid)
    assert_org_access(user, priv, sub.organization_id)
    st = select(DetailsScope).where(DetailsScope.subid == subid)
    return list(session.exec(st).all())


@router.put("/subject-scopes/{subid}/details", response_model=list[DetailsScopeRead])
def replace_details_scope(
    subid: int,
    body: DetailsScopeReplaceBody,
    session: Annotated[Session, Depends(get_session)],
    user: Annotated[User, Depends(get_current_user)],
    priv: Annotated[UserPrivilege, Depends(get_current_privilege)],
) -> list[DetailsScope]:
    sub = _get_subject_scope(session, subid)
    assert_org_access(user, priv, sub.organization_id)
    for old in session.exec(select(DetailsScope).where(DetailsScope.subid == subid)).all():
        session.delete(old)
    session.commit()
    out: list[DetailsScope] = []
    for desc in body.descriptions:
        row = DetailsScope(subid=subid, description=desc[:300])
        session.add(row)
        out.append(row)
    session.commit()
    for r in out:
        session.refresh(r)
    return out


@router.post("/subject-scopes/{subid}/details", response_model=DetailsScopeRead, status_code=201)
def create_details_scope_row(
    subid: int,
    body: DetailsScopeCreate,
    session: Annotated[Session, Depends(get_session)],
    user: Annotated[User, Depends(get_current_user)],
    priv: Annotated[UserPrivilege, Depends(get_current_privilege)],
) -> DetailsScope:
    sub = _get_subject_scope(session, subid)
    assert_org_access(user, priv, sub.organization_id)
    row = DetailsScope(subid=subid, description=body.description[:300])
    session.add(row)
    session.commit()
    session.refresh(row)
    return row


@router.get("/subject-scopes/{subid}/details/{osid}", response_model=DetailsScopeRead)
def get_details_scope_row(
    subid: int,
    osid: int,
    session: Annotated[Session, Depends(get_session)],
    user: Annotated[User, Depends(get_current_user)],
    priv: Annotated[UserPrivilege, Depends(get_current_privilege)],
) -> DetailsScope:
    sub = _get_subject_scope(session, subid)
    assert_org_access(user, priv, sub.organization_id)
    row = session.get(DetailsScope, osid)
    if row is None or row.subid != subid:
        raise HTTPException(status_code=404, detail="ไม่พบรายละเอียด")
    return row


@router.patch("/subject-scopes/{subid}/details/{osid}", response_model=DetailsScopeRead)
def patch_details_scope_row(
    subid: int,
    osid: int,
    body: DetailsScopeUpdate,
    session: Annotated[Session, Depends(get_session)],
    user: Annotated[User, Depends(get_current_user)],
    priv: Annotated[UserPrivilege, Depends(get_current_privilege)],
) -> DetailsScope:
    sub = _get_subject_scope(session, subid)
    assert_org_access(user, priv, sub.organization_id)
    row = session.get(DetailsScope, osid)
    if row is None or row.subid != subid:
        raise HTTPException(status_code=404, detail="ไม่พบรายละเอียด")
    if body.description is not None:
        row.description = body.description[:300]
    session.add(row)
    session.commit()
    session.refresh(row)
    return row


@router.delete("/subject-scopes/{subid}/details/{osid}", status_code=status.HTTP_204_NO_CONTENT)
def delete_details_scope_row(
    subid: int,
    osid: int,
    session: Annotated[Session, Depends(get_session)],
    user: Annotated[User, Depends(get_current_user)],
    priv: Annotated[UserPrivilege, Depends(get_current_privilege)],
) -> None:
    sub = _get_subject_scope(session, subid)
    assert_org_access(user, priv, sub.organization_id)
    row = session.get(DetailsScope, osid)
    if row is None or row.subid != subid:
        raise HTTPException(status_code=404, detail="ไม่พบรายละเอียด")
    session.delete(row)
    session.commit()


# --- Points consider ---
@router.get(
    "/organizations/{org_id}/forms/{fid}/points-consider",
    response_model=list[PointsConsiderRead],
)
def list_points_consider(
    org_id: int,
    fid: int,
    session: Annotated[Session, Depends(get_session)],
    user: Annotated[User, Depends(get_current_user)],
    priv: Annotated[UserPrivilege, Depends(get_current_privilege)],
) -> list[PointsConsider]:
    assert_org_access(user, priv, org_id)
    get_form_in_org(session, org_id, fid)
    st = select(PointsConsider).where(
        PointsConsider.organization_id == org_id,
        PointsConsider.fid == fid,
    )
    return list(session.exec(st).all())


@router.get(
    "/organizations/{org_id}/forms/{fid}/points-consider/{pid}",
    response_model=PointsConsiderRead,
)
def get_points_consider(
    org_id: int,
    fid: int,
    pid: int,
    session: Annotated[Session, Depends(get_session)],
    user: Annotated[User, Depends(get_current_user)],
    priv: Annotated[UserPrivilege, Depends(get_current_privilege)],
) -> PointsConsider:
    assert_org_access(user, priv, org_id)
    get_form_in_org(session, org_id, fid)
    row = session.get(PointsConsider, pid)
    if row is None or row.organization_id != org_id or row.fid != fid:
        raise HTTPException(status_code=404, detail="ไม่พบประเด็น")
    return row


@router.post(
    "/organizations/{org_id}/forms/{fid}/points-consider",
    response_model=PointsConsiderRead,
    status_code=201,
)
def create_points_consider(
    org_id: int,
    fid: int,
    body: PointsConsiderCreate,
    session: Annotated[Session, Depends(get_session)],
    user: Annotated[User, Depends(get_current_user)],
    priv: Annotated[UserPrivilege, Depends(get_current_privilege)],
) -> PointsConsider:
    assert_org_access(user, priv, org_id)
    get_form_in_org(session, org_id, fid)
    row = PointsConsider(
        organization_id=org_id,
        fid=fid,
        source_GHG=body.source_GHG[:500],
        magnitude=body.magnitude[:500],
        influence=body.influence[:500],
        risk=body.risk[:500],
        sector=body.sector[:500],
        outsourcing=body.outsourcing[:500],
        engagement=body.engagement[:500],
    )
    session.add(row)
    session.commit()
    session.refresh(row)
    return row


@router.put(
    "/organizations/{org_id}/forms/{fid}/points-consider/{pid}",
    response_model=PointsConsiderRead,
)
def update_points_consider(
    org_id: int,
    fid: int,
    pid: int,
    body: PointsConsiderUpdate,
    session: Annotated[Session, Depends(get_session)],
    user: Annotated[User, Depends(get_current_user)],
    priv: Annotated[UserPrivilege, Depends(get_current_privilege)],
) -> PointsConsider:
    assert_org_access(user, priv, org_id)
    get_form_in_org(session, org_id, fid)
    row = session.get(PointsConsider, pid)
    if row is None or row.organization_id != org_id or row.fid != fid:
        raise HTTPException(status_code=404, detail="ไม่พบประเด็น")
    for key, val in body.model_dump(exclude_unset=True).items():
        if val is not None:
            setattr(row, key, val)
    session.add(row)
    session.commit()
    session.refresh(row)
    return row


@router.delete(
    "/organizations/{org_id}/forms/{fid}/points-consider/{pid}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_points_consider(
    org_id: int,
    fid: int,
    pid: int,
    session: Annotated[Session, Depends(get_session)],
    user: Annotated[User, Depends(get_current_user)],
    priv: Annotated[UserPrivilege, Depends(get_current_privilege)],
) -> None:
    assert_org_access(user, priv, org_id)
    get_form_in_org(session, org_id, fid)
    row = session.get(PointsConsider, pid)
    if row is None or row.organization_id != org_id or row.fid != fid:
        raise HTTPException(status_code=404, detail="ไม่พบประเด็น")
    session.delete(row)
    session.commit()


# --- Categories ---
@router.get(
    "/organizations/{org_id}/forms/{fid}/categories",
    response_model=list[CategoryRead],
)
def list_categories(
    org_id: int,
    fid: int,
    session: Annotated[Session, Depends(get_session)],
    user: Annotated[User, Depends(get_current_user)],
    priv: Annotated[UserPrivilege, Depends(get_current_privilege)],
) -> list[Category]:
    assert_org_access(user, priv, org_id)
    get_form_in_org(session, org_id, fid)
    st = select(Category).where(Category.fid == fid)
    return list(session.exec(st).all())


@router.get(
    "/organizations/{org_id}/forms/{fid}/categories/{cid}",
    response_model=CategoryRead,
)
def get_category(
    org_id: int,
    fid: int,
    cid: int,
    session: Annotated[Session, Depends(get_session)],
    user: Annotated[User, Depends(get_current_user)],
    priv: Annotated[UserPrivilege, Depends(get_current_privilege)],
) -> Category:
    assert_org_access(user, priv, org_id)
    get_form_in_org(session, org_id, fid)
    c = session.get(Category, cid)
    if c is None or c.fid != fid:
        raise HTTPException(status_code=404, detail="ไม่พบ category")
    return c


@router.post(
    "/organizations/{org_id}/forms/{fid}/categories",
    response_model=CategoryRead,
    status_code=201,
)
def create_category(
    org_id: int,
    fid: int,
    body: CategoryCreate,
    session: Annotated[Session, Depends(get_session)],
    user: Annotated[User, Depends(get_current_user)],
    priv: Annotated[UserPrivilege, Depends(get_current_privilege)],
) -> Category:
    assert_org_access(user, priv, org_id)
    get_form_in_org(session, org_id, fid)
    row = Category(fid=fid, description=body.description[:100])
    session.add(row)
    session.commit()
    session.refresh(row)
    return row


@router.patch(
    "/organizations/{org_id}/forms/{fid}/categories/{cid}",
    response_model=CategoryRead,
)
def patch_category(
    org_id: int,
    fid: int,
    cid: int,
    body: CategoryUpdate,
    session: Annotated[Session, Depends(get_session)],
    user: Annotated[User, Depends(get_current_user)],
    priv: Annotated[UserPrivilege, Depends(get_current_privilege)],
) -> Category:
    assert_org_access(user, priv, org_id)
    get_form_in_org(session, org_id, fid)
    c = session.get(Category, cid)
    if c is None or c.fid != fid:
        raise HTTPException(status_code=404, detail="ไม่พบ category")
    if body.description is not None:
        c.description = body.description[:100]
    session.add(c)
    session.commit()
    session.refresh(c)
    return c


@router.delete(
    "/organizations/{org_id}/forms/{fid}/categories/{cid}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_category(
    org_id: int,
    fid: int,
    cid: int,
    session: Annotated[Session, Depends(get_session)],
    user: Annotated[User, Depends(get_current_user)],
    priv: Annotated[UserPrivilege, Depends(get_current_privilege)],
) -> None:
    assert_org_access(user, priv, org_id)
    get_form_in_org(session, org_id, fid)
    c = session.get(Category, cid)
    if c is None or c.fid != fid:
        raise HTTPException(status_code=404, detail="ไม่พบ category")
    for ans in list(session.exec(select(CategoryAnswer).where(CategoryAnswer.cid == cid)).all()):
        session.delete(ans)
    session.delete(c)
    session.commit()


@router.get(
    "/organizations/{org_id}/categories/{cid}/answers",
    response_model=list[CategoryAnswerRead],
)
def list_category_answers(
    org_id: int,
    cid: int,
    session: Annotated[Session, Depends(get_session)],
    user: Annotated[User, Depends(get_current_user)],
    priv: Annotated[UserPrivilege, Depends(get_current_privilege)],
) -> list[CategoryAnswer]:
    assert_org_access(user, priv, org_id)
    _category_in_org(session, cid, org_id)
    st = select(CategoryAnswer).where(
        CategoryAnswer.cid == cid,
        CategoryAnswer.organization_id == org_id,
    )
    return list(session.exec(st).all())


@router.get(
    "/organizations/{org_id}/categories/{cid}/answers/{caid}",
    response_model=CategoryAnswerRead,
)
def get_category_answer(
    org_id: int,
    cid: int,
    caid: int,
    session: Annotated[Session, Depends(get_session)],
    user: Annotated[User, Depends(get_current_user)],
    priv: Annotated[UserPrivilege, Depends(get_current_privilege)],
) -> CategoryAnswer:
    assert_org_access(user, priv, org_id)
    _category_in_org(session, cid, org_id)
    row = session.get(CategoryAnswer, caid)
    if row is None or row.cid != cid or row.organization_id != org_id:
        raise HTTPException(status_code=404, detail="ไม่พบคำตอบ")
    return row


@router.post(
    "/organizations/{org_id}/categories/{cid}/answers",
    response_model=CategoryAnswerRead,
    status_code=201,
)
def create_category_answer(
    org_id: int,
    cid: int,
    body: CategoryAnswerCreate,
    session: Annotated[Session, Depends(get_session)],
    user: Annotated[User, Depends(get_current_user)],
    priv: Annotated[UserPrivilege, Depends(get_current_privilege)],
) -> CategoryAnswer:
    assert_org_access(user, priv, org_id)
    _category_in_org(session, cid, org_id)
    row = CategoryAnswer(cid=cid, organization_id=org_id, **body.model_dump())
    session.add(row)
    session.commit()
    session.refresh(row)
    return row


@router.delete(
    "/organizations/{org_id}/categories/{cid}/answers/{caid}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_category_answer(
    org_id: int,
    cid: int,
    caid: int,
    session: Annotated[Session, Depends(get_session)],
    user: Annotated[User, Depends(get_current_user)],
    priv: Annotated[UserPrivilege, Depends(get_current_privilege)],
) -> None:
    assert_org_access(user, priv, org_id)
    _category_in_org(session, cid, org_id)
    row = session.get(CategoryAnswer, caid)
    if row is None or row.cid != cid or row.organization_id != org_id:
        raise HTTPException(status_code=404, detail="ไม่พบคำตอบ")
    session.delete(row)
    session.commit()


@router.put(
    "/organizations/{org_id}/categories/{cid}/answers",
    response_model=CategoryAnswerRead,
)
def upsert_category_answer(
    org_id: int,
    cid: int,
    body: CategoryAnswerUpsert,
    session: Annotated[Session, Depends(get_session)],
    user: Annotated[User, Depends(get_current_user)],
    priv: Annotated[UserPrivilege, Depends(get_current_privilege)],
) -> CategoryAnswer:
    assert_org_access(user, priv, org_id)
    _category_in_org(session, cid, org_id)
    st = select(CategoryAnswer).where(
        CategoryAnswer.cid == cid,
        CategoryAnswer.organization_id == org_id,
    )
    existing = session.exec(st).first()
    data = body.model_dump()
    if existing:
        for k, v in data.items():
            setattr(existing, k, v)
        session.add(existing)
        session.commit()
        session.refresh(existing)
        return existing
    row = CategoryAnswer(cid=cid, organization_id=org_id, **data)
    session.add(row)
    session.commit()
    session.refresh(row)
    return row


# --- FR-04 ---
def _fr04_row_to_read(r: Fr041Detail) -> Fr04DetailRead:
    return Fr04DetailRead(
        fr04wid=r.fr04wid,
        subid=r.subid,
        value=r.value,
        unit=r.unit,
        co2_ef=r.co2_ef,
        fossil_ch4_ef=r.fossil_ch4_ef,
        ch4_ef=r.ch4_ef,
        n2o_ef=r.n2o_ef,
        sf6_ef=r.sf6_ef,
        nf3_ef=r.nf3_ef,
        hfcs_ef=r.hfcs_ef,
        pfcs_ef=r.pfcs_ef,
        hfcs_gwp=r.hfcs_gwp,
        pfcs_gwp=r.pfcs_gwp,
        ef_unit=r.ef_unit,
        gwp_unit=r.gwp_unit,
        kgco2e_total=r.kgco2e_total,
        self_collct=r.self_collct,
        supplier=r.supplier,
        th_lci_db=r.th_lci_db,
        tgo_ef=r.tgo_ef,
        thai_res=r.thai_res,
        int_db=r.int_db,
        other=r.other,
        substitute=r.substitute,
        reference=r.reference,
        description=r.description,
    )


@router.get("/subject-scopes/{subid}/fr04-details", response_model=list[Fr04DetailRead])
def list_fr04_details(
    subid: int,
    session: Annotated[Session, Depends(get_session)],
    user: Annotated[User, Depends(get_current_user)],
    priv: Annotated[UserPrivilege, Depends(get_current_privilege)],
) -> list[Fr04DetailRead]:
    sub = _get_subject_scope(session, subid)
    assert_org_access(user, priv, sub.organization_id)
    st = select(Fr041Detail).where(Fr041Detail.subid == subid)
    rows = list(session.exec(st).all())
    return [_fr04_row_to_read(r) for r in rows]


@router.get("/subject-scopes/{subid}/fr04-details/{fr04wid}", response_model=Fr04DetailRead)
def get_fr04_detail(
    subid: int,
    fr04wid: int,
    session: Annotated[Session, Depends(get_session)],
    user: Annotated[User, Depends(get_current_user)],
    priv: Annotated[UserPrivilege, Depends(get_current_privilege)],
) -> Fr04DetailRead:
    sub = _get_subject_scope(session, subid)
    assert_org_access(user, priv, sub.organization_id)
    row = session.get(Fr041Detail, fr04wid)
    if row is None or row.subid != subid:
        raise HTTPException(status_code=404, detail="ไม่พบรายละเอียด FR-04")
    return _fr04_row_to_read(row)


@router.post("/subject-scopes/{subid}/fr04-details", response_model=Fr04DetailRead, status_code=201)
def create_fr04_detail(
    subid: int,
    body: Fr04DetailUpsert,
    session: Annotated[Session, Depends(get_session)],
    user: Annotated[User, Depends(get_current_user)],
    priv: Annotated[UserPrivilege, Depends(get_current_privilege)],
) -> Fr04DetailRead:
    sub = _get_subject_scope(session, subid)
    assert_org_access(user, priv, sub.organization_id)
    d = body.model_dump(exclude={"fr04wid"}, exclude_none=False)
    ent = Fr041Detail(subid=subid, **d)
    session.add(ent)
    session.commit()
    session.refresh(ent)
    return _fr04_row_to_read(ent)


@router.patch("/subject-scopes/{subid}/fr04-details/{fr04wid}", response_model=Fr04DetailRead)
def patch_fr04_detail(
    subid: int,
    fr04wid: int,
    body: Fr04DetailPatch,
    session: Annotated[Session, Depends(get_session)],
    user: Annotated[User, Depends(get_current_user)],
    priv: Annotated[UserPrivilege, Depends(get_current_privilege)],
) -> Fr04DetailRead:
    sub = _get_subject_scope(session, subid)
    assert_org_access(user, priv, sub.organization_id)
    row = session.get(Fr041Detail, fr04wid)
    if row is None or row.subid != subid:
        raise HTTPException(status_code=404, detail="ไม่พบรายละเอียด FR-04")
    for key, val in body.model_dump(exclude_unset=True).items():
        if val is not None and hasattr(row, key):
            setattr(row, key, val)
    session.add(row)
    session.commit()
    session.refresh(row)
    return _fr04_row_to_read(row)


@router.delete("/subject-scopes/{subid}/fr04-details/{fr04wid}", status_code=status.HTTP_204_NO_CONTENT)
def delete_fr04_detail(
    subid: int,
    fr04wid: int,
    session: Annotated[Session, Depends(get_session)],
    user: Annotated[User, Depends(get_current_user)],
    priv: Annotated[UserPrivilege, Depends(get_current_privilege)],
) -> None:
    sub = _get_subject_scope(session, subid)
    assert_org_access(user, priv, sub.organization_id)
    row = session.get(Fr041Detail, fr04wid)
    if row is None or row.subid != subid:
        raise HTTPException(status_code=404, detail="ไม่พบรายละเอียด FR-04")
    session.delete(row)
    session.commit()


@router.put("/subject-scopes/{subid}/fr04-details", response_model=list[Fr04DetailRead])
def put_fr04_details(
    subid: int,
    body: Fr04DetailsPutBody,
    session: Annotated[Session, Depends(get_session)],
    user: Annotated[User, Depends(get_current_user)],
    priv: Annotated[UserPrivilege, Depends(get_current_privilege)],
) -> list[Fr04DetailRead]:
    sub = _get_subject_scope(session, subid)
    assert_org_access(user, priv, sub.organization_id)
    for old in session.exec(select(Fr041Detail).where(Fr041Detail.subid == subid)).all():
        session.delete(old)
    session.commit()
    out: list[Fr041Detail] = []
    for row in body.rows:
        d = row.model_dump(exclude={"fr04wid"}, exclude_none=False)
        ent = Fr041Detail(subid=subid, **d)
        session.add(ent)
        out.append(ent)
    session.commit()
    for r in out:
        session.refresh(r)
    return [_fr04_row_to_read(r) for r in out]


# --- Activity entries (หน้ากรอกข้อมูล v2) ---
@router.get(
    "/organizations/{org_id}/activity-entries",
    response_model=list[ActivityEntryRead],
)
def list_activity_entries(
    org_id: int,
    session: Annotated[Session, Depends(get_session)],
    user: Annotated[User, Depends(get_current_user)],
    priv: Annotated[UserPrivilege, Depends(get_current_privilege)],
    fid: int | None = Query(default=None),
    reporting_year: int | None = Query(default=None),
) -> list[ActivityEntryRead]:
    assert_org_access(user, priv, org_id)
    try:
        clauses = ["organization_id = :org"]
        params: dict[str, Any] = {"org": org_id}
        if fid is not None:
            clauses.append("fid = :fid")
            params["fid"] = fid
        if reporting_year is not None:
            clauses.append(
                "JSON_UNQUOTE(JSON_EXTRACT(entry_payload, '$.reporting_year')) = :year"
            )
            params["year"] = str(reporting_year)
        where = " AND ".join(clauses)
        rows = session.execute(
            text(
                f"""
                SELECT aeid, organization_id, fid, rpid, scope_scid, entry_kind,
                       category_code, entry_payload
                FROM activity_entries
                WHERE {where}
                ORDER BY aeid
                """
            ),
            params,
        ).mappings().all()
    except Exception as exc:
        raise HTTPException(status_code=503, detail="ตาราง activity_entries ยังไม่มีในฐานข้อมูลนี้") from exc

    out: list[ActivityEntryRead] = []
    for r in rows:
        payload = r["entry_payload"]
        if isinstance(payload, str):
            payload = json.loads(payload)
        out.append(
            ActivityEntryRead(
                aeid=r["aeid"],
                organization_id=r["organization_id"],
                fid=r["fid"],
                rpid=r["rpid"],
                scope_scid=r["scope_scid"],
                entry_kind=r["entry_kind"],
                category_code=r["category_code"],
                entry_payload=payload if isinstance(payload, dict) else {},
            )
        )
    return out
