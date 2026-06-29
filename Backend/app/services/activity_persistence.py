"""บันทึก annual_report_bundle ลง activity_entries."""

from __future__ import annotations

import json
from typing import Any

from sqlalchemy import text
from sqlmodel import Session


def _table_exists(session: Session, table: str) -> bool:
    row = session.execute(
        text(
            """
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = DATABASE() AND table_name = :t
            LIMIT 1
            """
        ),
        {"t": table},
    ).first()
    return row is not None


def _resolve_fid(session: Session, org_id: int, fid: int | None) -> int | None:
    if fid is not None:
        return fid
    row = session.execute(
        text("SELECT fid FROM forms WHERE organization_id = :org ORDER BY fid LIMIT 1"),
        {"org": org_id},
    ).first()
    return int(row[0]) if row else None


def persist_activity_entries_from_bundle(
    session: Session,
    org_id: int,
    bundle: dict[str, Any],
    *,
    fid: int | None = None,
    reporting_year: int | None = None,
) -> int:
    """แทนที่ activity_entries ของ org+fid+ปีรายงาน แล้ว insert ใหม่. คืนจำนวนแถว."""
    if not _table_exists(session, "activity_entries"):
        return 0

    resolved_fid = _resolve_fid(session, org_id, fid)
    if resolved_fid is None:
        return 0

    year = reporting_year if reporting_year is not None else bundle.get("reportingYear")

    if year is not None:
        session.execute(
            text(
                """
                DELETE FROM activity_entries
                WHERE organization_id = :org AND fid = :fid
                  AND JSON_UNQUOTE(JSON_EXTRACT(entry_payload, '$.reporting_year')) = :year
                """
            ),
            {"org": org_id, "fid": resolved_fid, "year": str(year)},
        )
    else:
        session.execute(
            text("DELETE FROM activity_entries WHERE organization_id = :org AND fid = :fid"),
            {"org": org_id, "fid": resolved_fid},
        )

    payload = bundle.get("payload")
    if not isinstance(payload, dict):
        payload = {}

    meta = {
        "reporting_year": year,
        "period_start": bundle.get("periodStart"),
        "period_end": bundle.get("periodEnd"),
        "collection_granularity": bundle.get("collectionGranularity"),
        "prepared_at": bundle.get("preparedAt"),
    }

    rows: list[dict[str, Any]] = []

    scope1_cat = payload.get("scope1_category")
    entries1 = payload.get("scope1_entries")
    if scope1_cat and scope1_cat != "none" and isinstance(entries1, list):
        for entry in entries1:
            if isinstance(entry, dict):
                rows.append(
                    {
                        "scope_scid": 1,
                        "entry_kind": str(scope1_cat),
                        "category_code": None,
                        "entry_payload": {**meta, "scope1_category": scope1_cat, **entry},
                    }
                )

    scope2_type = payload.get("scope2_energy_type")
    batches2 = payload.get("scope2_batches")
    if scope2_type and scope2_type != "none" and isinstance(batches2, list):
        for bi, batch in enumerate(batches2):
            if not isinstance(batch, dict):
                continue
            lines = batch.get("lines")
            if not isinstance(lines, list):
                continue
            for li, line in enumerate(lines):
                if isinstance(line, dict):
                    rows.append(
                        {
                            "scope_scid": 2,
                            "entry_kind": str(scope2_type),
                            "category_code": None,
                            "entry_payload": {
                                **meta,
                                "scope2_energy_type": scope2_type,
                                "batch_index": bi,
                                "line_index": li,
                                "ref_type": batch.get("ref_type"),
                                **line,
                            },
                        }
                    )

    cat_entries = payload.get("scope3_cat_entries")
    if isinstance(cat_entries, dict):
        for cat_code, entries in cat_entries.items():
            if not isinstance(entries, list):
                continue
            for entry in entries:
                if isinstance(entry, dict):
                    rows.append(
                        {
                            "scope_scid": 3,
                            "entry_kind": "scope3_entry",
                            "category_code": str(cat_code),
                            "entry_payload": {**meta, "scope3_category": cat_code, **entry},
                        }
                    )

    assessments = payload.get("s3_self_assessments")
    if isinstance(assessments, list):
        rows.append(
            {
                "scope_scid": 3,
                "entry_kind": "s3_self_assessment",
                "category_code": None,
                "entry_payload": {**meta, "assessments": assessments},
            }
        )

    for row in rows:
        session.execute(
            text(
                """
                INSERT INTO activity_entries
                  (organization_id, fid, rpid, scope_scid, entry_kind, category_code, entry_payload)
                VALUES
                  (:org, :fid, NULL, :scope, :kind, :cat, CAST(:payload AS JSON))
                """
            ),
            {
                "org": org_id,
                "fid": resolved_fid,
                "scope": row["scope_scid"],
                "kind": row["entry_kind"],
                "cat": row["category_code"],
                "payload": json.dumps(row["entry_payload"], ensure_ascii=False),
            },
        )

    return len(rows)


def save_calculation_snapshot(
    session: Session,
    org_id: int,
    *,
    fid: int | None,
    totals: dict[str, float],
    ran_at: str,
) -> None:
    """เก็บผลคำนวณล่าสุดใน activity_entries (ไม่ต้องเพิ่มตาราง)."""
    if not _table_exists(session, "activity_entries"):
        return
    resolved_fid = _resolve_fid(session, org_id, fid)
    if resolved_fid is None:
        return
    session.execute(
        text(
            """
            DELETE FROM activity_entries
            WHERE organization_id = :org AND fid = :fid AND entry_kind = 'calculation_snapshot'
            """
        ),
        {"org": org_id, "fid": resolved_fid},
    )
    payload = {
        "ran_at": ran_at,
        "scope1_kgco2e": totals.get("scope1_kgco2e", 0.0),
        "scope2_kgco2e": totals.get("scope2_kgco2e", 0.0),
        "scope3_kgco2e": totals.get("scope3_kgco2e", 0.0),
        "total_kgco2e": totals.get("total_kgco2e", 0.0),
    }
    session.execute(
        text(
            """
            INSERT INTO activity_entries
              (organization_id, fid, rpid, scope_scid, entry_kind, category_code, entry_payload)
            VALUES
              (:org, :fid, NULL, 3, 'calculation_snapshot', NULL, CAST(:payload AS JSON))
            """
        ),
        {"org": org_id, "fid": resolved_fid, "payload": json.dumps(payload, ensure_ascii=False)},
    )


def load_latest_calculation_snapshot(session: Session, org_id: int) -> dict[str, Any] | None:
    if not _table_exists(session, "activity_entries"):
        return None
    row = session.execute(
        text(
            """
            SELECT entry_payload
            FROM activity_entries
            WHERE organization_id = :org AND entry_kind = 'calculation_snapshot'
            ORDER BY aeid DESC
            LIMIT 1
            """
        ),
        {"org": org_id},
    ).first()
    if row is None:
        return None
    payload = row[0]
    if isinstance(payload, str):
        payload = json.loads(payload)
    return payload if isinstance(payload, dict) else None


def save_annual_report_bundle(
    session: Session,
    org_id: int,
    bundle: dict[str, Any],
    *,
    fid: int | None = None,
) -> int:
    """บันทึก bundle รายปี + activity entries (ยังไม่คำนวณ)."""
    if not _table_exists(session, "activity_entries"):
        return 0

    resolved_fid = _resolve_fid(session, org_id, fid)
    if resolved_fid is None:
        return 0

    year = bundle.get("reportingYear")
    if year is not None:
        session.execute(
            text(
                """
                DELETE FROM activity_entries
                WHERE organization_id = :org AND fid = :fid
                  AND entry_kind = 'annual_report_bundle'
                  AND JSON_UNQUOTE(JSON_EXTRACT(entry_payload, '$.reportingYear')) = :year
                """
            ),
            {"org": org_id, "fid": resolved_fid, "year": str(year)},
        )

    session.execute(
        text(
            """
            INSERT INTO activity_entries
              (organization_id, fid, rpid, scope_scid, entry_kind, category_code, entry_payload)
            VALUES
              (:org, :fid, NULL, 3, 'annual_report_bundle', NULL, CAST(:payload AS JSON))
            """
        ),
        {"org": org_id, "fid": resolved_fid, "payload": json.dumps(bundle, ensure_ascii=False)},
    )

    return persist_activity_entries_from_bundle(
        session, org_id, bundle, fid=resolved_fid, reporting_year=year
    )


_META_ENTRY_KINDS = ("annual_report_bundle", "calculation_snapshot")


def list_activity_entries_page(
    session: Session,
    org_id: int,
    *,
    page: int = 1,
    page_size: int = 20,
    fid: int | None = None,
    reporting_year: int | None = None,
    scope_scid: int | None = None,
    entry_kind: str | None = None,
    q: str | None = None,
    include_meta: bool = False,
) -> dict[str, Any]:
    """รายการ activity_entries แบบแบ่งหน้า — คืน items, total, summary."""
    if not _table_exists(session, "activity_entries"):
        return {
            "items": [],
            "total": 0,
            "page": page,
            "page_size": page_size,
            "summary": {
                "total": 0,
                "scope1": 0,
                "scope2": 0,
                "scope3": 0,
                "reporting_years": [],
            },
        }

    page = max(1, page)
    page_size = min(max(1, page_size), 100)
    offset = (page - 1) * page_size

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
    if scope_scid is not None:
        clauses.append("scope_scid = :scope")
        params["scope"] = scope_scid
    if entry_kind:
        clauses.append("entry_kind = :kind")
        params["kind"] = entry_kind
    if not include_meta:
        clauses.append("entry_kind NOT IN ('annual_report_bundle', 'calculation_snapshot')")
    if q and q.strip():
        clauses.append("CAST(entry_payload AS CHAR) LIKE :q")
        params["q"] = f"%{q.strip()}%"

    where = " AND ".join(clauses)

    count_row = session.execute(
        text(f"SELECT COUNT(*) FROM activity_entries WHERE {where}"),
        params,
    ).first()
    total = int(count_row[0]) if count_row else 0

    summary_clauses = ["organization_id = :org"]
    summary_params: dict[str, Any] = {"org": org_id}
    if fid is not None:
        summary_clauses.append("fid = :fid")
        summary_params["fid"] = fid
    if not include_meta:
        summary_clauses.append("entry_kind NOT IN ('annual_report_bundle', 'calculation_snapshot')")
    summary_where = " AND ".join(summary_clauses)

    summary_row = session.execute(
        text(
            f"""
            SELECT
              COUNT(*) AS total,
              SUM(CASE WHEN scope_scid = 1 THEN 1 ELSE 0 END) AS scope1,
              SUM(CASE WHEN scope_scid = 2 THEN 1 ELSE 0 END) AS scope2,
              SUM(CASE WHEN scope_scid = 3 THEN 1 ELSE 0 END) AS scope3
            FROM activity_entries
            WHERE {summary_where}
            """
        ),
        summary_params,
    ).mappings().first()

    year_rows = session.execute(
        text(
            f"""
            SELECT DISTINCT JSON_UNQUOTE(JSON_EXTRACT(entry_payload, '$.reporting_year')) AS y
            FROM activity_entries
            WHERE {summary_where}
              AND JSON_EXTRACT(entry_payload, '$.reporting_year') IS NOT NULL
            ORDER BY y DESC
            """
        ),
        summary_params,
    ).all()
    reporting_years: list[int] = []
    for yr in year_rows:
        raw = yr[0]
        if raw is None:
            continue
        try:
            reporting_years.append(int(str(raw)))
        except ValueError:
            continue

    rows = session.execute(
        text(
            f"""
            SELECT aeid, organization_id, fid, rpid, scope_scid, entry_kind,
                   category_code, entry_payload
            FROM activity_entries
            WHERE {where}
            ORDER BY aeid DESC
            LIMIT :limit OFFSET :offset
            """
        ),
        {**params, "limit": page_size, "offset": offset},
    ).mappings().all()

    items: list[dict[str, Any]] = []
    for r in rows:
        payload = r["entry_payload"]
        if isinstance(payload, str):
            payload = json.loads(payload)
        items.append(
            {
                "aeid": r["aeid"],
                "organization_id": r["organization_id"],
                "fid": r["fid"],
                "rpid": r["rpid"],
                "scope_scid": r["scope_scid"],
                "entry_kind": r["entry_kind"],
                "category_code": r["category_code"],
                "entry_payload": payload if isinstance(payload, dict) else {},
            }
        )

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "summary": {
            "total": int(summary_row["total"] or 0) if summary_row else 0,
            "scope1": int(summary_row["scope1"] or 0) if summary_row else 0,
            "scope2": int(summary_row["scope2"] or 0) if summary_row else 0,
            "scope3": int(summary_row["scope3"] or 0) if summary_row else 0,
            "reporting_years": reporting_years,
        },
    }


def load_latest_annual_report_bundle(session: Session, org_id: int) -> dict[str, Any] | None:
    if not _table_exists(session, "activity_entries"):
        return None
    row = session.execute(
        text(
            """
            SELECT entry_payload
            FROM activity_entries
            WHERE organization_id = :org AND entry_kind = 'annual_report_bundle'
            ORDER BY aeid DESC
            LIMIT 1
            """
        ),
        {"org": org_id},
    ).first()
    if row is None:
        return None
    payload = row[0]
    if isinstance(payload, str):
        payload = json.loads(payload)
    return payload if isinstance(payload, dict) else None
