"""Unit tests — docs/GHG_BusinessLogic_TestCases.md (TC-01 … TC-12)."""

from __future__ import annotations

import math

import pytest

from app.services.ghg_formulas import (
    GWP_FOSSIL_CH4,
    GWP_N2O,
    Scope1EfInputs,
    ScopeTotals,
    display_summary_ceil,
    ef_from_raw,
    ghg_intensity,
    kgco2e_from_ef_rows,
    pct_share,
    tco2e_from_gas,
    ton_gas_mass,
    total_ef_biogenic,
    total_ef_scope1,
    total_ef_scope23,
    total_ghg_ton,
)

# ค่าอ้างอิง Excel_CFO_Demo — tolerance สำหรับ float
RTOL = 1e-3
ATOL = 1e-4


class TestTc01EfConversionGasoline:
    """TC-01: แปลง raw EF → EF [kg/unit] น้ำมันเบนซิน."""

    def test_ef_co2_ch4_n2o(self) -> None:
        co2_raw = 69_300.0
        ch4_raw = 33.0
        n2o_raw = 3.2
        ncv = 31.48

        ef_co2 = ef_from_raw(co2_raw, ncv)
        ef_ch4 = ef_from_raw(ch4_raw, ncv)
        ef_n2o = ef_from_raw(n2o_raw, ncv)

        assert ef_co2 == pytest.approx(2.1816, rel=RTOL, abs=ATOL)
        assert ef_ch4 == pytest.approx(0.0010, rel=RTOL, abs=ATOL)
        assert ef_n2o == pytest.approx(0.0001, rel=RTOL, abs=ATOL)


class TestTc02TotalEfGasoline:
    """TC-02: total_ef Scope 1 — เบนซิน."""

    def test_total_ef_from_steps(self) -> None:
        """คำนวณจาก Steps ในเอกสาร: 2.1816 + 0.0720 + 1.4840 = 3.7376."""
        efs = Scope1EfInputs(
            ef_co2=2.1816,
            ef_fossil_ch4=0.0024,
            ef_n2o=0.0056,
        )
        assert total_ef_scope1(efs) == pytest.approx(3.7376, rel=RTOL, abs=ATOL)

    def test_total_ef_excel_expected_column(self) -> None:
        """คอลัมน์ Expected ใน Excel demo รายงาน 3.7328 (ปัดกลางทาง) — เก็บเป็น regression."""
        efs = Scope1EfInputs(
            ef_co2=2.1816,
            ef_fossil_ch4=0.0024,
            ef_n2o=0.0056,
        )
        excel_reported = 3.7328
        assert total_ef_scope1(efs) != pytest.approx(excel_reported, abs=0.001)


class TestTc03TonGhgByGas:
    """TC-03: ton ก๊าซแยก — เบนซิน."""

    QTY = 707.23

    def test_ton_co2_fossil_ch4_n2o(self) -> None:
        assert ton_gas_mass(self.QTY, 2.1816) == pytest.approx(1.5429, rel=RTOL, abs=ATOL)
        assert ton_gas_mass(self.QTY, 0.0024) == pytest.approx(0.0017, rel=RTOL, abs=ATOL)
        assert ton_gas_mass(self.QTY, 0.0056) == pytest.approx(0.0040, rel=RTOL, abs=ATOL)


class TestTc04Tco2eByGas:
    """TC-04: tonCO2e แยกก๊าซ — เบนซิน."""

    QTY = 707.23

    def test_tco2e_fossil_ch4_n2o(self) -> None:
        # Steps: 707.23 × 0.0024 × 30 / 1000 = 0.0509…
        assert tco2e_from_gas(self.QTY, 0.0024, GWP_FOSSIL_CH4) == pytest.approx(
            0.0509, rel=RTOL, abs=ATOL
        )
        assert tco2e_from_gas(self.QTY, 0.0056, GWP_N2O) == pytest.approx(
            1.0495, rel=RTOL, abs=ATOL
        )


class TestTc05TotalGhgLineItem:
    """TC-05: total_ghg ต่อรายการ — เบนซิน."""

    def test_total_ghg_with_exact_total_ef(self) -> None:
        assert total_ghg_ton(707.23, 3.7376) == pytest.approx(2.6433, rel=RTOL, abs=ATOL)

    def test_total_ghg_excel_demo_rounded_ef(self) -> None:
        """Excel ใช้ total_ef ปัดแล้ว 3.7328 → 2.6398."""
        assert total_ghg_ton(707.23, 3.7328) == pytest.approx(2.6398, rel=RTOL, abs=ATOL)


class TestTc06Biogenic:
    """TC-06: Biogenic — ขยะฝังกลบ."""

    def test_total_ef_and_ghg(self) -> None:
        total_ef = total_ef_biogenic(ef_co2=0.0, ef_outside=2.32, gwp_outside=1.0)
        assert total_ef == pytest.approx(2.3200, rel=RTOL, abs=ATOL)
        assert total_ghg_ton(1744.70, total_ef) == pytest.approx(4.0477, rel=RTOL, abs=ATOL)


class TestTc07Scope2Electricity:
    """TC-07: Scope 2 — ไฟฟ้า."""

    def test_total_ghg(self) -> None:
        total_ef = total_ef_scope23(0.5813)
        assert total_ef == pytest.approx(0.5813, rel=RTOL, abs=ATOL)
        assert total_ghg_ton(48_932.99, total_ef) == pytest.approx(28.4407, rel=RTOL, abs=ATOL)


class TestTc08Scope3Paper:
    """TC-08: Scope 3 — กระดาษ."""

    def test_total_ghg(self) -> None:
        total_ef = total_ef_scope23(1.14)
        assert total_ghg_ton(581.29, total_ef) == pytest.approx(0.6627, rel=RTOL, abs=ATOL)


class TestTc09ScopeSumsExcludeBiogenic:
    """TC-09: SUM scope — biogenic ไม่รวมใน sum_all."""

    def test_aggregates(self) -> None:
        totals = ScopeTotals(
            scope1=2.6398,
            scope2=28.4407,
            scope3=0.6627,
            biogenic=4.0477,
        )
        assert totals.sum_s1s2 == pytest.approx(31.0805, rel=RTOL, abs=ATOL)
        assert totals.sum_all == pytest.approx(31.7432, rel=RTOL, abs=ATOL)
        assert totals.biogenic not in (totals.sum_s1s2, totals.sum_all)
        assert totals.sum_all + totals.biogenic == pytest.approx(35.7909, rel=RTOL, abs=ATOL)


class TestTc10DisplayCeil:
    """TC-10: Math.ceil สำหรับ Summary."""

    @pytest.mark.parametrize(
        ("raw", "expected"),
        [
            (2.6398, 3),
            (28.4407, 29),
            (31.7432, 32),
            (3.0, 3),
            (2.999, 3),
        ],
    )
    def test_ceil(self, raw: float, expected: int) -> None:
        assert display_summary_ceil(raw) == expected
        assert display_summary_ceil(raw) == math.ceil(raw)


class TestTc11Percentages:
    """TC-11: % สัดส่วน — Gasoline."""

    GASOLINE = 2.6398
    SUM_S1 = 2.6398
    SUM_S1S2 = 31.0805
    SUM_ALL = 31.7432

    def test_pct_in_scope(self) -> None:
        assert pct_share(self.GASOLINE, self.SUM_S1) == pytest.approx(100.0, abs=0.01)

    def test_pct_s1s2(self) -> None:
        assert pct_share(self.GASOLINE, self.SUM_S1S2) == pytest.approx(8.49, abs=0.01)

    def test_pct_all(self) -> None:
        assert pct_share(self.GASOLINE, self.SUM_ALL) == pytest.approx(8.31, abs=0.01)


class TestTc12EdgeCases:
    """TC-12: edge cases."""

    def test_zero_ef_gas_does_not_affect_total_ef(self) -> None:
        efs = Scope1EfInputs(ef_co2=2.0, ef_ch4=0.0, ef_sf6=0.0)
        assert total_ef_scope1(efs) == pytest.approx(2.0, abs=ATOL)

    def test_qty_zero_gives_zero_ghg(self) -> None:
        assert total_ghg_ton(0.0, 3.7328) == 0.0

    def test_intensity_divide_by_zero(self) -> None:
        assert ghg_intensity(10.0, 0.0) is None

    def test_pct_zero_denominator(self) -> None:
        assert pct_share(1.0, 0.0) is None

    def test_scope23_ignores_per_gas_ef(self) -> None:
        """Scope 2/3 ใช้ total_ef_input เท่านั้น."""
        assert total_ef_scope23(0.5813) == 0.5813


class TestKgco2eFromEfRows:
    """ทดสอบ logic เดียวกับ ef_calculation._kgco2e_from_ef_rows."""

    def test_combustion_multigas_matches_tc02_qty(self) -> None:
        qty = 707.23
        rows = [
            {"gas_code": "CO2", "ef_value": 2.1816, "calc_mode": "combustion_multigas"},
            {"gas_code": "CH4_FOSSIL", "ef_value": 0.0024, "calc_mode": "combustion_multigas"},
            {"gas_code": "N2O", "ef_value": 0.0056, "calc_mode": "combustion_multigas"},
        ]
        kg = kgco2e_from_ef_rows(qty, rows)
        assert kg / 1000.0 == pytest.approx(2.6433, rel=RTOL, abs=ATOL)

    def test_electricity_grid_no_extra_gwp(self) -> None:
        qty = 48_932.99
        rows = [
            {
                "gas_code": "CO2",
                "ef_value": 0.5813,
                "calc_mode": "electricity_grid",
                "gwp_value": 999.0,
            },
        ]
        kg = kgco2e_from_ef_rows(qty, rows)
        assert kg / 1000.0 == pytest.approx(28.4407, rel=RTOL, abs=ATOL)

    def test_scope3_single_ef(self) -> None:
        qty = 581.29
        rows = [{"ef_value": 1.14, "calc_mode": "scope3_single_ef"}]
        kg = kgco2e_from_ef_rows(qty, rows)
        assert kg / 1000.0 == pytest.approx(0.6627, rel=RTOL, abs=ATOL)

    def test_co2_bio_gwp_zero(self) -> None:
        rows = [{"gas_code": "CO2_BIO", "ef_value": 1.5, "calc_mode": "combustion_multigas"}]
        assert kgco2e_from_ef_rows(100.0, rows) == 0.0
