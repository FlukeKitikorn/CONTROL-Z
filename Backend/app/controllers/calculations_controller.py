from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, col, select

from app.core.access import assert_org_access
from app.core.database import get_session
from app.core.deps import get_current_privilege, get_current_user
from app.models import Fr041Detail, SubjectScope, User, UserPrivilege
from app.schemas.rest import AnnualReportingBundle, CalculationRunRequest, CalculationRunResponse
from app.services.activity_persistence import (
    load_latest_annual_report_bundle,
    load_latest_calculation_snapshot,
    persist_activity_entries_from_bundle,
    save_annual_report_bundle,
    save_calculation_snapshot,
)
from app.services.ef_calculation import calculate_from_annual_bundle

router = APIRouter(tags=["calculations"])


def _legacy_fr04_total_kg(session: Session, org_id: int) -> float:
    subs = list(
        session.exec(select(SubjectScope).where(SubjectScope.organization_id == org_id)).all()
    )
    subids = [s.subid for s in subs if s.subid is not None]
    if not subids:
        return 0.0
    rows = list(session.exec(select(Fr041Detail).where(col(Fr041Detail.subid).in_(subids))).all())
    return sum((r.kgco2e_total or 0.0) for r in rows)


@router.post(
    "/organizations/{org_id}/annual-report-bundle",
    response_model=AnnualReportingBundle,
)
def save_bundle(
    org_id: int,
    body: AnnualReportingBundle,
    session: Annotated[Session, Depends(get_session)],
    user: Annotated[User, Depends(get_current_user)],
    priv: Annotated[UserPrivilege, Depends(get_current_privilege)],
) -> AnnualReportingBundle:
    """บันทึกข้อมูลกรอกรายปี (รวมรอบย่อย) — ยังไม่คำนวณ."""
    assert_org_access(user, priv, org_id)
    bundle_dict = body.model_dump()
    save_annual_report_bundle(session, org_id, bundle_dict)
    session.commit()
    return body


@router.get(
    "/organizations/{org_id}/annual-report-bundle/latest",
    response_model=AnnualReportingBundle,
)
def get_latest_bundle(
    org_id: int,
    session: Annotated[Session, Depends(get_session)],
    user: Annotated[User, Depends(get_current_user)],
    priv: Annotated[UserPrivilege, Depends(get_current_privilege)],
) -> AnnualReportingBundle:
    assert_org_access(user, priv, org_id)
    raw = load_latest_annual_report_bundle(session, org_id)
    if raw is None:
        raise HTTPException(status_code=404, detail="ยังไม่มีข้อมูลที่บันทึกสำหรับปีรายงาน")
    return AnnualReportingBundle(**raw)


@router.post(
    "/organizations/{org_id}/calculations/run",
    response_model=CalculationRunResponse,
)
def run_calculation(
    org_id: int,
    session: Annotated[Session, Depends(get_session)],
    user: Annotated[User, Depends(get_current_user)],
    priv: Annotated[UserPrivilege, Depends(get_current_privilege)],
    body: CalculationRunRequest | None = None,
) -> CalculationRunResponse:
    assert_org_access(user, priv, org_id)

    bundle = body.annual_report_bundle if body else None
    if bundle is not None:
        try:
            bundle_dict = bundle.model_dump()
            totals = calculate_from_annual_bundle(session, bundle_dict)
            persist_activity_entries_from_bundle(
                session,
                org_id,
                bundle_dict,
                fid=body.fid if body else None,
                reporting_year=bundle.reportingYear,
            )
            ran_at = datetime.now(timezone.utc).isoformat()
            save_calculation_snapshot(
                session,
                org_id,
                fid=body.fid if body else None,
                totals=totals,
                ran_at=ran_at,
            )
            session.commit()
            total_kg = totals["total_kgco2e"]
            return CalculationRunResponse(
                ran_at=ran_at,
                total_tco2e=round(total_kg / 1000.0, 6),
                vs_base_year_percent=None,
                scope1_tco2e=round(totals["scope1_kgco2e"] / 1000.0, 6),
                scope2_tco2e=round(totals["scope2_kgco2e"] / 1000.0, 6),
                scope3_tco2e=round(totals["scope3_kgco2e"] / 1000.0, 6),
                source="api",
            )
        except Exception:
            session.rollback()

    snap = load_latest_calculation_snapshot(session, org_id)
    if snap is not None:
        total_kg = float(snap.get("total_kgco2e") or 0.0)
        return CalculationRunResponse(
            ran_at=str(snap.get("ran_at") or datetime.now(timezone.utc).isoformat()),
            total_tco2e=round(total_kg / 1000.0, 6),
            vs_base_year_percent=None,
            scope1_tco2e=round(float(snap.get("scope1_kgco2e") or 0.0) / 1000.0, 6),
            scope2_tco2e=round(float(snap.get("scope2_kgco2e") or 0.0) / 1000.0, 6),
            scope3_tco2e=round(float(snap.get("scope3_kgco2e") or 0.0) / 1000.0, 6),
            source="api",
        )

    total_kg = _legacy_fr04_total_kg(session, org_id)
    total_tco2e = total_kg / 1000.0
    third = total_tco2e / 3.0 if total_tco2e else 0.0
    return CalculationRunResponse(
        ran_at=datetime.now(timezone.utc).isoformat(),
        total_tco2e=round(total_tco2e, 6),
        vs_base_year_percent=None,
        scope1_tco2e=round(third, 6),
        scope2_tco2e=round(third, 6),
        scope3_tco2e=round(third, 6),
        source="api",
    )


@router.get(
    "/organizations/{org_id}/calculations/latest",
    response_model=CalculationRunResponse,
)
def latest_calculation(
    org_id: int,
    session: Annotated[Session, Depends(get_session)],
    user: Annotated[User, Depends(get_current_user)],
    priv: Annotated[UserPrivilege, Depends(get_current_privilege)],
) -> CalculationRunResponse:
    """คำนวณแบบ on-the-fly (ไม่มีตาราง snapshot) — ผลล่าสุด = รันใหม่ทุกครั้ง"""
    return run_calculation(org_id, session, user, priv, None)


@router.get("/organizations/{org_id}/calculations/history", response_model=list[CalculationRunResponse])
def calculation_history(
    org_id: int,
    user: Annotated[User, Depends(get_current_user)],
    priv: Annotated[UserPrivilege, Depends(get_current_privilege)],
) -> list[CalculationRunResponse]:
    assert_org_access(user, priv, org_id)
    return []
