"""สูตรคำนวณ GHG แบบ pure function — อ้างอิง docs/GHG_BusinessLogic_TestCases.md."""

from __future__ import annotations

import math
from dataclasses import dataclass
from typing import Any, Literal

# IPCC AR5 GWP100 — §1 CONSTANT
GWP_CO2 = 1.0
GWP_FOSSIL_CH4 = 30.0
GWP_CH4 = 28.0
GWP_N2O = 265.0
GWP_SF6 = 23_500.0
GWP_NF3 = 16_100.0

GWP_BY_GAS_CODE: dict[str, float] = {
    "CO2": GWP_CO2,
    "CO2_BIO": 0.0,
    "CH4": GWP_CH4,
    "CH4_FOSSIL": GWP_FOSSIL_CH4,
    "N2O": GWP_N2O,
    "SF6": GWP_SF6,
    "NF3": GWP_NF3,
}

ScopeKind = Literal["scope1", "scope2", "scope3", "biogenic"]
CalcMode = Literal["combustion_multigas", "refrigerant_gwp", "electricity_grid", "scope3_single_ef"]


@dataclass(frozen=True)
class Scope1EfInputs:
    """EF แยกก๊าซ [kg ก๊าซ / หน่วย] — ก๊าซที่ไม่มีใช้ 0."""

    ef_co2: float = 0.0
    ef_fossil_ch4: float = 0.0
    ef_ch4: float = 0.0
    ef_n2o: float = 0.0
    ef_sf6: float = 0.0
    ef_nf3: float = 0.0
    ef_hfcs: float = 0.0
    ef_pfcs: float = 0.0
    gwp_hfcs: float = 0.0
    gwp_pfcs: float = 0.0


def ef_from_raw(raw_kg_per_tj: float, ncv_mj_per_unit: float) -> float:
    """§1 — แปลง raw EF [kg/TJ] + NCV [MJ/unit] → EF [kg/unit]."""
    return raw_kg_per_tj * ncv_mj_per_unit * 1e-6


def total_ef_scope1(efs: Scope1EfInputs) -> float:
    """§2.1 กรณี Scope 1 — total_ef [kgCO2e/unit]."""
    return (
        efs.ef_co2 * GWP_CO2
        + efs.ef_fossil_ch4 * GWP_FOSSIL_CH4
        + efs.ef_ch4 * GWP_CH4
        + efs.ef_n2o * GWP_N2O
        + efs.ef_sf6 * GWP_SF6
        + efs.ef_nf3 * GWP_NF3
        + efs.ef_hfcs * efs.gwp_hfcs
        + efs.ef_pfcs * efs.gwp_pfcs
    )


def total_ef_biogenic(ef_co2: float, ef_outside: float, gwp_outside: float) -> float:
    """§2.1 กรณี Biogenic."""
    return ef_co2 * GWP_CO2 + ef_outside * gwp_outside


def total_ef_scope23(total_ef_input: float) -> float:
    """§2.1 กรณี Scope 2 / 3 — EF รวมจาก external DB."""
    return total_ef_input


def ton_gas_mass(qty: float, ef_kg_per_unit: float) -> float:
    """§2.2 — ton ก๊าซ (kg → ton)."""
    return qty * ef_kg_per_unit / 1000.0


def tco2e_from_gas(qty: float, ef_kg_per_unit: float, gwp: float) -> float:
    """§2.3 — tonCO2e แยกก๊าซ (CO₂ ใช้ gwp=1)."""
    return qty * ef_kg_per_unit * gwp / 1000.0


def total_ghg_ton(qty: float, total_ef_kgco2e_per_unit: float) -> float:
    """§2.4 — total_ghg [tonCO2e] ต่อรายการ."""
    return qty * total_ef_kgco2e_per_unit / 1000.0


def kgco2e_from_ef_rows(
    qty: float,
    rows: list[dict[str, Any]],
    *,
    unit_multiplier: float = 1.0,
) -> float:
    """
    คำนวณ kgCO2e จากแถว EF (ตรงกับ ef_calculation._kgco2e_from_ef_rows โดยไม่ใช้ DB).
    """
    if not rows or qty <= 0:
        return 0.0
    activity = qty * unit_multiplier
    calc_mode: CalcMode = rows[0].get("calc_mode") or "combustion_multigas"

    if calc_mode in ("refrigerant_gwp", "electricity_grid", "scope3_single_ef"):
        return sum(activity * float(r.get("ef_value") or 0) for r in rows)

    total = 0.0
    for row in rows:
        ef = float(row.get("ef_value") or 0)
        gwp = row.get("gwp_value")
        if gwp is not None:
            gwp_f = float(gwp)
        else:
            code = str(row.get("gas_code") or "CO2")
            gwp_f = GWP_BY_GAS_CODE.get(code, GWP_CO2)
        total += activity * ef * gwp_f
    return total


@dataclass(frozen=True)
class ScopeTotals:
    scope1: float = 0.0
    scope2: float = 0.0
    scope3: float = 0.0
    biogenic: float = 0.0

    @property
    def sum_s1s2(self) -> float:
        return self.scope1 + self.scope2

    @property
    def sum_all(self) -> float:
        """§2.6 — ไม่รวม biogenic."""
        return self.scope1 + self.scope2 + self.scope3


def pct_share(part: float, whole: float) -> float | None:
    """§2.5 — % สัดส่วน; whole=0 → None."""
    if whole <= 0:
        return None
    return (part / whole) * 100.0


def ghg_intensity(sum_tonco2e: float, base_unit_qty: float) -> float | None:
    """§2.7 — tonCO2e / หน่วยผลิต; base=0 → None."""
    if base_unit_qty <= 0:
        return None
    return sum_tonco2e / base_unit_qty


def display_summary_ceil(raw_value: float) -> int:
    """§2.8 — ปัดขึ้นสำหรับ Summary display เท่านั้น."""
    return math.ceil(raw_value)
