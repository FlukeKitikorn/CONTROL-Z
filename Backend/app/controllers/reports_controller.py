from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select

from app.controllers.resource_utils import get_form_in_org
from app.core.access import assert_org_access
from app.core.database import get_session
from app.core.deps import get_current_privilege, get_current_user
from app.models import Category, FormDetail, GhgtForm, SubjectScope, User, UserPrivilege
from app.schemas.rest import ReportBundleResponse

router = APIRouter(tags=["reports"])


def _normalize_form_code(code: str) -> list[str]:
    c = code.strip()
    return list({c, c.replace("_", "-"), c.replace("-", "_")})


@router.get(
    "/organizations/{org_id}/reports/{form_code}",
    response_model=ReportBundleResponse,
)
def get_report_bundle(
    org_id: int,
    form_code: str,
    session: Annotated[Session, Depends(get_session)],
    user: Annotated[User, Depends(get_current_user)],
    priv: Annotated[UserPrivilege, Depends(get_current_privilege)],
    fid: int | None = Query(default=None),
) -> ReportBundleResponse:
    assert_org_access(user, priv, org_id)
    f: GhgtForm | None = None
    if fid is not None:
        f = get_form_in_org(session, org_id, fid)
    else:
        variants = _normalize_form_code(form_code)
        for v in variants:
            st = select(GhgtForm).where(
                GhgtForm.organization_id == org_id,
                GhgtForm.form_id == v,
            )
            f = session.exec(st).first()
            if f:
                break
    if f is None:
        raise HTTPException(status_code=404, detail="ไม่พบฟอร์มสำหรับรหัสนี้")
    details = list(session.exec(select(FormDetail).where(FormDetail.fid == f.fid)).all())
    subjects = list(
        session.exec(
            select(SubjectScope).where(
                SubjectScope.fid == f.fid,
                SubjectScope.organization_id == org_id,
            )
        ).all()
    )
    categories = list(session.exec(select(Category).where(Category.fid == f.fid)).all())
    data: dict[str, Any] = {
        "form": {
            "fid": f.fid,
            "form_id": f.form_id,
            "name": f.name,
            "version": f.version,
            "version_date": f.version_date,
        },
        "form_details": [{"subject": d.subject, "description": d.description} for d in details],
        "subject_scopes": [
            {"subid": s.subid, "scid": s.scid, "description": s.description} for s in subjects
        ],
        "categories": [{"cid": c.cid, "description": c.description} for c in categories],
    }
    return ReportBundleResponse(
        organization_id=org_id,
        form_code=form_code,
        fid=f.fid,
        data=data,
    )


@router.get("/organizations/{org_id}/reports/{form_code}/export")
def export_report_stub(
    org_id: int,
    form_code: str,
    user: Annotated[User, Depends(get_current_user)],
    priv: Annotated[UserPrivilege, Depends(get_current_privilege)],
    format: str = Query(default="xlsx", pattern="^(xlsx|pdf)$"),
) -> dict[str, str]:
    assert_org_access(user, priv, org_id)
    return {
        "detail": "การส่งออกไฟล์ยังไม่ได้ implement — ใช้ฝั่งเว็บหรือต่อ Excel service",
        "form_code": form_code,
        "organization_id": org_id,
        "format": format,
    }
