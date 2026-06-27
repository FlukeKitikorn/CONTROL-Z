"""Resolve emission factors via DB views (ef_resolve_by_ui, ef_lookup)."""

from __future__ import annotations

from decimal import Decimal
from typing import Any

from sqlalchemy import text
from sqlmodel import Session

_RESOLVE_COLS = """
  option_id, scope_scid, ui_context, option_key, ui_label_th,
  ef_category_code, activity_subtype, ef_purpose, ui_unit, calc_mode,
  category_id, category_th, scope3_parent_code,
  ef_id, gas_id, gas_code, ef_value, ef_unit, ef_unit_denominator,
  co2_type, ef_row_purpose, ef_row_subtype, activity_name_th,
  is_default, effective_from, effective_until, source_code, gwp_value, ar_period
"""

_LOOKUP_COLS = """
  ef_id, source_code, source_th, source_type, category_code, category_th,
  unit_activity, gas_code, gas_name, activity_name_th, activity_subtype,
  co2_type, ef_purpose, ef_value, ef_unit, ef_unit_numerator,
  ef_unit_denominator, region, is_default, tier_level,
  effective_from, effective_until, parent_category_th
"""


def _row_to_dict(row: Any) -> dict[str, Any]:
    if hasattr(row, "_mapping"):
        return {k: _serialize(v) for k, v in row._mapping.items()}
    return dict(row)


def _serialize(v: Any) -> Any:
    if isinstance(v, Decimal):
        return float(v)
    return v


def resolve_ui_ef_rows(
    session: Session,
    *,
    scope_scid: int,
    ui_context: str,
    option_key: str,
    activity_subtype: str | None = None,
) -> list[dict[str, Any]]:
    """แถว EF ทั้งหมด (หลาย gas) สำหรับ UI option เดียว."""
    stmt = text(
        f"""
        SELECT {_RESOLVE_COLS}
        FROM ef_resolve_by_ui
        WHERE scope_scid = :scope_scid
          AND ui_context = :ui_context
          AND option_key = :option_key
          AND (:activity_subtype IS NULL
               OR activity_subtype IS NULL
               OR activity_subtype = :activity_subtype)
          AND (:activity_subtype IS NULL
               OR ef_row_subtype IS NULL
               OR ef_row_subtype = :activity_subtype)
        ORDER BY gas_code
        """
    )
    rows = session.execute(
        stmt,
        {
            "scope_scid": scope_scid,
            "ui_context": ui_context,
            "option_key": option_key,
            "activity_subtype": activity_subtype,
        },
    ).mappings().all()
    return [_row_to_dict(r) for r in rows]


def lookup_category_ef_rows(session: Session, category_code: str) -> list[dict[str, Any]]:
    """แถว EF ตาม ef_categories.category_code (Scope 3 / admin)."""
    stmt = text(
        f"""
        SELECT {_LOOKUP_COLS}
        FROM ef_lookup
        WHERE category_code = :category_code
        ORDER BY gas_code, ef_id
        """
    )
    rows = session.execute(stmt, {"category_code": category_code}).mappings().all()
    return [_row_to_dict(r) for r in rows]


def get_unit_multiplier(session: Session, ui_unit: str, ef_denominator: str) -> float:
    stmt = text(
        """
        SELECT multiplier FROM unit_aliases
        WHERE ui_unit = :ui_unit AND ef_unit_denominator = :ef_den
        LIMIT 1
        """
    )
    row = session.execute(stmt, {"ui_unit": ui_unit, "ef_den": ef_denominator}).first()
    if row is None:
        if ui_unit.lower() == ef_denominator.lower():
            return 1.0
        return 1.0
    val = row[0]
    return float(val)


def list_ui_options(
    session: Session,
    *,
    scope_scid: int | None = None,
    ui_context: str | None = None,
) -> list[dict[str, Any]]:
    clauses = ["is_active = 1"]
    params: dict[str, Any] = {}
    if scope_scid is not None:
        clauses.append("scope_scid = :scope_scid")
        params["scope_scid"] = scope_scid
    if ui_context:
        clauses.append("ui_context = :ui_context")
        params["ui_context"] = ui_context
    where = " AND ".join(clauses)
    stmt = text(
        f"""
        SELECT option_id, scope_scid, ui_context, option_key, label_th,
               ef_category_code, activity_subtype, ef_purpose, unit_denominator, calc_mode
        FROM ef_ui_options
        WHERE {where}
        ORDER BY scope_scid, sort_order, option_key
        """
    )
    rows = session.execute(stmt, params).mappings().all()
    return [_row_to_dict(r) for r in rows]


def get_scope3_catalog_line(session: Session, line_code: str) -> dict[str, Any] | None:
    stmt = text(
        """
        SELECT line_code, scope3_category_code, label_th, default_unit,
               entry_mode_hint, ef_category_code, activity_name_match
        FROM scope3_ef_catalog
        WHERE line_code = :line_code AND is_active = 1
        LIMIT 1
        """
    )
    row = session.execute(stmt, {"line_code": line_code}).mappings().first()
    return _row_to_dict(row) if row else None


def list_scope3_catalog(
    session: Session,
    *,
    scope3_category_code: str | None = None,
) -> list[dict[str, Any]]:
    clauses = ["is_active = 1"]
    params: dict[str, Any] = {}
    if scope3_category_code:
        clauses.append("scope3_category_code = :cat")
        params["cat"] = scope3_category_code
    where = " AND ".join(clauses)
    stmt = text(
        f"""
        SELECT line_code, scope3_category_code, label_th, default_unit,
               entry_mode_hint, ef_category_code, activity_name_match, sort_order
        FROM scope3_ef_catalog
        WHERE {where}
        ORDER BY sort_order, line_code
        """
    )
    rows = session.execute(stmt, params).mappings().all()
    return [_row_to_dict(r) for r in rows]
