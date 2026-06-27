"""คำนวณ kgCO2e จาก annual_report_bundle + EF ในฐานข้อมูล."""

from __future__ import annotations

from typing import Any

from sqlmodel import Session

from app.services.ef_resolver import (
    get_scope3_catalog_line,
    get_unit_multiplier,
    lookup_category_ef_rows,
    resolve_ui_ef_rows,
)

_SECTOR_UI_TO_EF = {
    "agriculture": "Agriculture",
    "forestry": "Forestry",
    "industry": "Industry",
    "household": "Household",
}

from app.services.ghg_formulas import kgco2e_from_ef_rows as _kgco2e_pure


def _num(v: Any) -> float | None:
    if v is None:
        return None
    try:
        f = float(v)
        return f if f >= 0 else None
    except (TypeError, ValueError):
        return None


def _kgco2e_from_ef_rows(session: Session, qty: float, ui_unit: str, rows: list[dict[str, Any]]) -> float:
    if not rows or qty <= 0:
        return 0.0
    ef_den = str(rows[0].get("ef_unit_denominator") or ui_unit)
    mult = get_unit_multiplier(session, ui_unit, ef_den)
    return _kgco2e_pure(qty, rows, unit_multiplier=mult)


def _material_topic_ids(assessments: Any, category_ids: list[str]) -> list[str]:
    if not isinstance(assessments, list):
        return []
    out: list[str] = []
    for i, cat_id in enumerate(category_ids):
        row = assessments[i] if i < len(assessments) else {}
        if not isinstance(row, dict):
            row = {}
        if row.get("categoryId") and row["categoryId"] != cat_id:
            match = next((r for r in assessments if isinstance(r, dict) and r.get("categoryId") == cat_id), {})
            row = match
        if _is_material_row(row):
            out.append(cat_id)
    return out


def _ghg_score(row: dict[str, Any]) -> float:
    pct = row.get("ghgPercent")
    if pct is not None:
        try:
            p = float(pct)
        except (TypeError, ValueError):
            p = -1
        if p > 40:
            return 5
        if p > 30:
            return 4
        if p > 20:
            return 3
        if p > 10:
            return 2
        return 1
    mag = row.get("magnitude")
    if isinstance(mag, (int, float)) and 1 <= mag <= 5:
        return float(round(mag))
    return 1.0


def _lvl(primary: Any, legacy: Any = None) -> float:
    v = primary if primary is not None else legacy
    if v == 5:
        return 5.0
    if v == 3:
        return 3.0
    return 1.0


def _material_total(row: dict[str, Any]) -> float:
    g = _ghg_score(row) * 0.6
    inf = _lvl(row.get("influenceLevel")) * 0.2
    risk = _lvl(row.get("riskLevel"), row.get("opportunityRisk")) * 0.1
    opp = _lvl(row.get("opportunityLevel"), row.get("opportunityRisk")) * 0.1
    return g + inf + risk + opp


def _is_material_row(row: dict[str, Any]) -> bool:
    return row.get("presence") == "yes" and _material_total(row) >= 3.0


def _scope1_option_key(category: str, entry: dict[str, Any]) -> str | None:
    key = entry.get("activity_key")
    if not key or not isinstance(key, str):
        return None
    if category == "off_road":
        if key == "diesel":
            return "diesel"
        if key in ("gasoline_4_stroke", "gasoline_2_stroke"):
            return "gasoline_4_stroke" if key == "gasoline_4_stroke" else key
        return key
    if category == "on_road" and entry.get("entry_mode") == "vehicle_based":
        return None
    return key


def _calc_scope1(session: Session, payload: dict[str, Any]) -> float:
    category = payload.get("scope1_category")
    if not category or category == "none":
        return 0.0
    entries = payload.get("scope1_entries")
    if not isinstance(entries, list):
        return 0.0

    total = 0.0
    for entry in entries:
        if not isinstance(entry, dict):
            continue
        option_key = _scope1_option_key(str(category), entry)
        if not option_key:
            continue
        qty = _num(entry.get("quantity"))
        if qty is None or qty <= 0:
            continue
        ui_unit = str(entry.get("unit") or "L")
        subtype = None
        if category == "off_road":
            sector = entry.get("sector")
            if isinstance(sector, str):
                subtype = _SECTOR_UI_TO_EF.get(sector)

        rows = resolve_ui_ef_rows(
            session,
            scope_scid=1,
            ui_context=str(category),
            option_key=option_key,
            activity_subtype=subtype,
        )
        total += _kgco2e_from_ef_rows(session, qty, ui_unit, rows)
    return total


def _calc_scope2(session: Session, payload: dict[str, Any]) -> float:
    energy = payload.get("scope2_energy_type")
    if not energy or energy == "none":
        return 0.0
    batches = payload.get("scope2_batches")
    if not isinstance(batches, list):
        return 0.0

    total = 0.0
    if energy == "electricity":
        for batch in batches:
            if not isinstance(batch, dict):
                continue
            lines = batch.get("lines")
            if not isinstance(lines, list):
                continue
            for line in lines:
                if not isinstance(line, dict):
                    continue
                qty = _num(line.get("quantity"))
                if qty is None:
                    continue
                ui_unit = str(line.get("unit") or "kWh")
                rows = resolve_ui_ef_rows(
                    session, scope_scid=2, ui_context="electricity", option_key="grid"
                )
                total += _kgco2e_from_ef_rows(session, qty, ui_unit, rows)

    elif energy == "refrigerants":
        for batch in batches:
            if not isinstance(batch, dict):
                continue
            ref_type = batch.get("ref_type")
            if not ref_type:
                continue
            lines = batch.get("lines")
            if not isinstance(lines, list):
                continue
            for line in lines:
                if not isinstance(line, dict):
                    continue
                qty = _num(line.get("quantity"))
                if qty is None:
                    continue
                rows = resolve_ui_ef_rows(
                    session,
                    scope_scid=2,
                    ui_context="refrigerant",
                    option_key=str(ref_type),
                )
                total += _kgco2e_from_ef_rows(session, qty, "kg", rows)
    return total


def _match_purchased_line_code(text_val: str) -> str | None:
    t = text_val.lower()
    if "กระดาษ" in text_val or "paper" in t:
        return "S3C1_PAPER"
    if "หมึก" in text_val or "ink" in t or "toner" in t:
        return "S3C1_INK"
    if "น้ำ" in text_val or "water" in t:
        return "S3C1_WATER"
    return None


def _calc_scope3_category(
    session: Session, cat: str, entries: list[Any]
) -> float:
    total = 0.0
    for entry in entries:
        if not isinstance(entry, dict):
            continue
        line_code: str | None = None
        qty: float | None = None
        ui_unit = "kg"

        if cat == "s3_cat_1_purchased_goods":
            mode = entry.get("entry_mode")
            product = str(entry.get("product_service_type") or "")
            line_code = _match_purchased_line_code(product)
            if not line_code:
                continue
            amount = _num(entry.get("amount"))
            if amount is None:
                continue
            if mode == "baht":
                qty = amount
                ui_unit = "THB"
            else:
                qty = amount
                ui_unit = str(entry.get("quantity_unit") or "kg")

        elif cat == "s3_cat_2_capital_goods":
            asset = entry.get("asset_type")
            qty = _num(entry.get("value_baht"))
            if qty is None:
                continue
            ui_unit = "THB"
            line_code = "S3C2_BUILDING" if asset == "building" else None

        elif cat == "s3_cat_3_fuel_energy_related":
            kind = entry.get("energy_kind")
            qty = _num(entry.get("amount"))
            if qty is None:
                continue
            ui_unit = str(entry.get("unit") or "kWh")
            if kind == "electricity":
                line_code = "S3C3_ELEC_UPS"
            elif kind == "fuel" and ui_unit.lower() in ("litre", "l"):
                line_code = "S3C3_DIESEL_UPS"
                ui_unit = "kg"

        elif cat == "s3_cat_5_waste_operations":
            qty = _num(entry.get("amount"))
            if qty is None:
                continue
            method = entry.get("disposal_method")
            waste = str(entry.get("waste_type") or "")
            if method == "incineration" or "อันตราย" in waste:
                line_code = "S3C5_WASTE_INCIN"
            else:
                line_code = "S3C5_WASTE_LANDFILL"

        elif cat == "s3_cat_7_employee_commuting":
            commute = str(entry.get("commute_mode") or "").lower()
            if "diesel" in commute or "ดีเซล" in commute or "กระบะ" in commute:
                emp = _num(entry.get("employee_count")) or 0
                dist = _num(entry.get("avg_distance_km")) or 0
                days = _num(entry.get("work_days")) or 0
                if emp > 0 and dist > 0 and days > 0:
                    qty = emp * dist * days * 0.05
                    ui_unit = "litre"
                    line_code = "S3C7_COMMUTE_DIESEL"

        if not line_code or qty is None or qty <= 0:
            continue

        catalog = get_scope3_catalog_line(session, line_code)
        if not catalog:
            continue
        ef_cat = catalog["ef_category_code"]
        rows = lookup_category_ef_rows(session, ef_cat)
        if rows:
            scoped = [{**r, "calc_mode": "scope3_single_ef", "ef_unit_denominator": r.get("ef_unit_denominator")} for r in rows]
            total += _kgco2e_from_ef_rows(session, qty, ui_unit, scoped)
    return total


def _calc_scope3(session: Session, payload: dict[str, Any]) -> float:
    assessments = payload.get("s3_self_assessments")
    category_ids = [
        "s3_cat_1_purchased_goods",
        "s3_cat_2_capital_goods",
        "s3_cat_3_fuel_energy_related",
        "s3_cat_4_upstream_transport",
        "s3_cat_5_waste_operations",
        "s3_cat_6_business_travel",
        "s3_cat_7_employee_commuting",
        "s3_cat_8_upstream_leased",
        "s3_cat_9_downstream_transport",
        "s3_cat_10_processing_sold",
        "s3_cat_11_use_sold",
        "s3_cat_12_end_of_life",
        "s3_cat_13_downstream_leased",
        "s3_cat_14_franchises",
        "s3_cat_15_investments",
    ]
    material = _material_topic_ids(assessments, category_ids)
    if not material:
        return 0.0

    cat_entries = payload.get("scope3_cat_entries")
    if not isinstance(cat_entries, dict):
        return 0.0

    total = 0.0
    for cat in material:
        entries = cat_entries.get(cat)
        if not isinstance(entries, list):
            continue
        total += _calc_scope3_category(session, cat, entries)
    return total


def calculate_from_annual_bundle(session: Session, bundle: dict[str, Any]) -> dict[str, float]:
    """คืน kgCO2e แยก scope + รวม."""
    payload = bundle.get("payload")
    if not isinstance(payload, dict):
        payload = {}

    s1 = _calc_scope1(session, payload)
    s2 = _calc_scope2(session, payload)
    s3 = _calc_scope3(session, payload)
    total = s1 + s2 + s3
    return {
        "scope1_kgco2e": round(s1, 6),
        "scope2_kgco2e": round(s2, 6),
        "scope3_kgco2e": round(s3, 6),
        "total_kgco2e": round(total, 6),
    }
