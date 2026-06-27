#!/usr/bin/env python3
"""Generate 02b + 03c SQL for full TGO 2569 emission factors (~190 rows)."""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).parent / "generated"

# (category_code, gas_code, ef_value, ef_unit, num, den, co2_type, activity_subtype, activity_name_th, ef_purpose, source, eff_until, is_default, eff_from)
# co2_type: fossil | biogenic | None
# activity_subtype: Agriculture | Forestry | Industry | Household | None
# ef_purpose: cfo_scope2 | scope3_elec | cfp | None

def row(
    cat: str,
    gas: str,
    val: float,
    unit: str,
    *,
    den: str,
    co2: str | None = "fossil",
    sub: str | None = None,
    name_th: str | None = None,
    purpose: str | None = None,
    src: str = "TGO_AR5",
    until: str | None = None,
    default: int = 1,
    eff_from: str = "2026-01-01",
) -> dict:
    num = unit.split("/")[0] if "/" in unit else "kgCO2eq"
    return {
        "cat": cat,
        "gas": gas,
        "val": val,
        "unit": unit,
        "num": num,
        "den": den,
        "co2": co2,
        "sub": sub,
        "name_th": name_th,
        "purpose": purpose,
        "src": src,
        "until": until,
        "default": default,
        "eff_from": eff_from,
    }


ROWS: list[dict] = []

# --- 6.1 Fossil stationary ---
def add_multigas(cat: str, co2: float, ch4: float, n2o: float, den: str = "litre"):
    ROWS.append(row(cat, "CO2", co2, f"kgCO2/{den}", den=den))
    ROWS.append(row(cat, "CH4_FOSSIL", ch4, f"kgCH4/{den}", den=den, co2=None))
    ROWS.append(row(cat, "N2O", n2o, f"kgN2O/{den}", den=den, co2=None))

for c, co2, ch4, n2o, den in [
    ("FUEL_NATGAS_NCV_SCF", 0.0572, 0.00000102, 0.00000010, "scf"),
    ("FUEL_NATGAS_NCV_MJ", 0.0561, 0.00000100, 0.00000010, "MJ"),
    ("FUEL_NATGAS_HHV_MJ", 0.0501, 0.00000100, 0.00000010, "MJ"),
    ("FUEL_NATGAS_HHV_MMBTU", 52.9, 0.001, 0.0001, "MMBTU"),
    ("FUEL_LPG_LITRE", 1.6797, 0.0000266, 0.00000266, "litre"),
    ("FUEL_LPG_KG", 3.1106, 0.0000493, 0.00000493, "kg"),
    ("FUEL_FUELOIL_A", 3.2097, 0.000124, 0.0000249, "litre"),
    ("FUEL_FUELOIL_C", 3.2353, 0.000125, 0.0000251, "litre"),
    ("FUEL_KEROSENE_JET", 2.4689, 0.000104, 0.0000207, "litre"),
    ("FUEL_KEROSENE_OTHER", 2.4827, 0.000104, 0.0000207, "litre"),
    ("FUEL_DIESEL", 2.6987, 0.000109, 0.0000219, "litre"),
    ("FUEL_GASOLINE", 2.1816, 0.0000944, 0.0000189, "litre"),
    ("FUEL_LIGNITE", 1.2019, 0.000105, 0.0000157, "kg"),
    ("FUEL_ANTHRACITE", 3.0866, 0.000314, 0.0000471, "kg"),
    ("FUEL_COAL_BITUMINOUS", 2.4946, 0.0003, 0.0, "kg"),
    ("FUEL_COAL_COKING", 2.6138, 0.0003, 0.0, "kg"),
    ("FUEL_COAL_SUBBIT", 2.53, 0.0000264, 0.0000396, "kg"),
]:
    add_multigas(c, co2, ch4, n2o, den)

for c, v in [
    ("FUEL_ACETYLENE", 3.3846), ("FUEL_ETHANE", 3.1429), ("FUEL_PROPANE", 3.0), ("FUEL_BUTANE", 3.0345),
]:
    ROWS.append(row(c, "CO2", v, "kgCO2/kg", den="kg"))

# --- 6.2 Biomass ---
BIOMASS = [
    ("FUEL_BIODIESEL", "CO2", 1.644, "litre", "fossil"),
    ("FUEL_BIODIESEL", "CH4", 0.0001, "litre", None),
    ("FUEL_BIODIESEL", "N2O", 0.0, "litre", None),
    ("FUEL_BIOGASOLINE", "CO2", 1.4968, "litre", "fossil"),
    ("FUEL_BIOGASOLINE", "CH4", 0.0001, "litre", None),
    ("FUEL_BIOGASOLINE", "N2O", 0.0, "litre", None),
    ("FUEL_WOOD", "CH4", 0.00048, "kg", None),
    ("FUEL_WOOD", "N2O", 0.000064, "kg", None),
    ("FUEL_WOOD_BIO", "CO2_BIO", 1.7909, "kg", "biogenic"),
    ("FUEL_SAWDUST", "CH4", 0.0003, "kg", None),
    ("FUEL_SAWDUST", "N2O", 0.0, "kg", None),
    ("FUEL_SAWDUST_BIO", "CO2_BIO", 1.2186, "kg", "biogenic"),
    ("FUEL_CHARCOAL", "CH4", 0.0058, "kg", None),
    ("FUEL_CHARCOAL", "N2O", 0.0001, "kg", None),
    ("FUEL_CHARCOAL_BIO", "CO2_BIO", 3.2346, "kg", "biogenic"),
    ("FUEL_PADDYHUSK", "CH4", 0.0004, "kg", None),
    ("FUEL_PADDYHUSK", "N2O", 0.0001, "kg", None),
    ("FUEL_PADDYHUSK_BIO", "CO2_BIO", 1.44, "kg", "biogenic"),
    ("FUEL_BAGASSE", "CH4", 0.000226, "kg", None),
    ("FUEL_BAGASSE", "N2O", 0.0000301, "kg", None),
    ("FUEL_BAGASSE_BIO", "CO2_BIO", 0.753, "kg", "biogenic"),
    ("FUEL_PALMSHELL", "CH4", 0.000556, "kg", None),
    ("FUEL_PALMSHELL", "N2O", 0.0000741, "kg", None),
    ("FUEL_PALMSHELL_BIO", "CO2_BIO", 1.853, "kg", "biogenic"),
    ("FUEL_COB", "CH4", 0.000503, "kg", None),
    ("FUEL_COB", "N2O", 0.0000671, "kg", None),
    ("FUEL_COB_BIO", "CO2_BIO", 1.678, "kg", "biogenic"),
    ("FUEL_BIOGAS", "CH4", 0.0000209, "m3", None),
    ("FUEL_BIOGAS", "N2O", 0.00000209, "m3", None),
    ("FUEL_BIOGAS_BIO", "CO2_BIO", 1.1428, "m3", "biogenic"),
]
for cat, gas, val, den, co2t in BIOMASS:
    if gas == "CO2_BIO":
        unit, num = f"kgCO2bio/{den}", "kgCO2bio"
    elif gas == "CO2":
        unit, num = f"kgCO2/{den}", "kgCO2"
    elif gas == "CH4":
        unit, num = f"kgCH4/{den}", "kgCH4"
    else:
        unit, num = f"kgN2O/{den}", "kgN2O"
    ROWS.append(row(cat, gas, val, unit, den=den, co2=co2t))

# --- 6.3 Blended stationary ---
for c, co2, ch4, n2o in [
    ("FUEL_DIESEL_B7", 2.5098, 0.0001, 0.0), ("FUEL_DIESEL_B20", 2.159, 0.0001, 0.0),
    ("FUEL_GASOHOL_E10", 1.9634, 0.0001, 0.0), ("FUEL_GASOHOL_E20", 1.7453, 0.0001, 0.0),
    ("FUEL_GASOHOL_E85", 0.3272, 0.0001, 0.0),
]:
    add_multigas(c, co2, ch4, n2o)
for c, v in [
    ("FUEL_DIESEL_B7_BIO", 0.1151), ("FUEL_DIESEL_B20_BIO", 0.3288),
    ("FUEL_GASOHOL_E10_BIO", 0.1497), ("FUEL_GASOHOL_E20_BIO", 0.2994), ("FUEL_GASOHOL_E85_BIO", 1.2723),
]:
    ROWS.append(row(c, "CO2_BIO", v, "kgCO2bio/litre", den="litre", co2="biogenic"))

# --- 7 On-road ---
def add_mobile(cat: str, co2: float, ch4: float, n2o: float, ch4_gas: str = "CH4_FOSSIL", den: str = "litre"):
    ROWS.append(row(cat, "CO2", co2, f"kgCO2/{den}", den=den))
    ROWS.append(row(cat, ch4_gas, ch4, f"kgCH4/{den}", den=den, co2=None))
    if n2o is not None:
        ROWS.append(row(cat, "N2O", n2o, f"kgN2O/{den}", den=den, co2=None))

onroad = [
    ("MOBILE_ONROAD_CNG", 2.1262, 0.00349, 0.000114, "CH4_FOSSIL", "kg"),
    ("MOBILE_ONROAD_LPG_KG", 3.1106, 0.00306, 0.00000986, "CH4_FOSSIL", "kg"),
    ("MOBILE_ONROAD_LPG_L", 1.6797, 0.00165, 0.00000532, "CH4_FOSSIL", "litre"),
    ("MOBILE_ONROAD_DIESEL", 2.6987, 0.000142, 0.000142, "CH4_FOSSIL", "litre"),
    ("MOBILE_ONROAD_GAS_UNCNTRL", 2.1816, 0.00104, 0.000101, "CH4_FOSSIL", "litre"),
    ("MOBILE_ONROAD_GAS_OXCAT", 2.1816, 0.000787, 0.000252, "CH4_FOSSIL", "litre"),
    ("MOBILE_ONROAD_GAS_LOWM", 2.1816, 0.00012, 0.000179, "CH4_FOSSIL", "litre"),
    ("MOBILE_ONROAD_BIODIESEL", 1.644, 0.0001, 0.0001, "CH4_FOSSIL", "litre"),
    ("MOBILE_ONROAD_ETHANOL", 1.4968, 0.0004, None, "CH4", "litre"),
    ("MOBILE_ONROAD_B7", 2.5098, 0.0001, 0.0001, "CH4_FOSSIL", "litre"),
    ("MOBILE_ONROAD_B20", 2.159, 0.0001, 0.0001, "CH4_FOSSIL", "litre"),
    ("MOBILE_ONROAD_E10_OXCAT", 1.9634, 0.0007, 0.0002, "CH4_FOSSIL", "litre"),
    ("MOBILE_ONROAD_E20_OXCAT", 1.7453, 0.0007, 0.0002, "CH4_FOSSIL", "litre"),
    ("MOBILE_ONROAD_E85_OXCAT", 0.3272, 0.0004, 0.0, "CH4_FOSSIL", "litre"),
    ("MOBILE_ONROAD_E10_LOWM", 1.9634, 0.0001, 0.0002, "CH4_FOSSIL", "litre"),
    ("MOBILE_ONROAD_E20_LOWM", 1.7453, 0.0002, 0.0001, "CH4_FOSSIL", "litre"),
    ("MOBILE_ONROAD_E85_LOWM", 0.3272, 0.0003, 0.0, "CH4_FOSSIL", "litre"),
]
for t in onroad:
    add_mobile(*t)
for c, v in [
    ("MOBILE_ONROAD_B7_BIO", 0.1151), ("MOBILE_ONROAD_B20_BIO", 0.3288),
    ("MOBILE_ONROAD_E10_OXCAT_BIO", 0.1497), ("MOBILE_ONROAD_E20_OXCAT_BIO", 0.2994),
    ("MOBILE_ONROAD_E85_OXCAT_BIO", 1.2723), ("MOBILE_ONROAD_E10_LOWM_BIO", 0.1497),
    ("MOBILE_ONROAD_E20_LOWM_BIO", 0.2994), ("MOBILE_ONROAD_E85_LOWM_BIO", 1.2723),
]:
    ROWS.append(row(c, "CO2_BIO", v, "kgCO2bio/litre", den="litre", co2="biogenic"))

# --- 8 Off-road ---
ROWS.append(row("MOBILE_OFFROAD_LPG_KG", "CO2", 3.1106, "kgCO2/kg", den="kg"))
ROWS.append(row("MOBILE_OFFROAD_LPG_KG", "CH4_FOSSIL", 0.0025, "kgCH4/kg", den="kg", co2=None))
ROWS.append(row("MOBILE_OFFROAD_LPG_KG", "N2O", 0.0001, "kgN2O/kg", den="kg", co2=None))

for sector in ("Agriculture", "Forestry", "Industry", "Household"):
    for gas, val, num, unit in [
        ("CO2", 2.6987, "kgCO2", "kgCO2/litre"),
        ("CH4_FOSSIL", 0.000151, "kgCH4", "kgCH4/litre"),
        ("N2O", 0.00104, "kgN2O", "kgN2O/litre"),
    ]:
        ROWS.append(row(
            "MOBILE_OFFROAD_DIESEL", gas, val, unit, den="litre",
            sub=sector, name_th=f"ดีเซลนอกถนน ({sector})",
            co2="fossil" if gas == "CO2" else None,
        ))

ROWS.append(row("MOBILE_OFFROAD_BIODIESEL", "CO2", 1.644, "kgCO2/litre", den="litre"))
ROWS.append(row("MOBILE_OFFROAD_ETHANOL", "CO2", 1.4968, "kgCO2/litre", den="litre"))

offroad_gas4 = {
    "Agriculture": (2.1816, 0.00252, 0.000063),
    "Forestry": (2.1816, 0.0, 0.0),
    "Industry": (2.1816, 0.00157, 0.000063),
    "Household": (2.1816, 0.00378, 0.000063),
}
for sector, (co2, ch4, n2o) in offroad_gas4.items():
    ROWS.append(row("MOBILE_OFFROAD_GAS4ST", "CO2", co2, "kgCO2/litre", den="litre", sub=sector, name_th=f"เบนซิน 4-stroke ({sector})"))
    ROWS.append(row("MOBILE_OFFROAD_GAS4ST", "CH4_FOSSIL", ch4, "kgCH4/litre", den="litre", sub=sector, name_th=f"เบนซิน 4-stroke ({sector}) CH4", co2=None))
    ROWS.append(row("MOBILE_OFFROAD_GAS4ST", "N2O", n2o, "kgN2O/litre", den="litre", sub=sector, name_th=f"เบนซิน 4-stroke ({sector}) N2O", co2=None))

offroad_gas2 = {
    "Agriculture": (2.1816, 0.00441, 0.0000126),
    "Forestry": (2.1816, 0.00535, 0.0000126),
    "Industry": (2.1816, 0.00409, 0.0000126),
    "Household": (2.1816, 0.00567, 0.0000126),
}
for sector, (co2, ch4, n2o) in offroad_gas2.items():
    ROWS.append(row("MOBILE_OFFROAD_GAS2ST", "CO2", co2, "kgCO2/litre", den="litre", sub=sector, name_th=f"เบนซิน 2-stroke ({sector})"))
    ROWS.append(row("MOBILE_OFFROAD_GAS2ST", "CH4_FOSSIL", ch4, "kgCH4/litre", den="litre", sub=sector, name_th=f"เบนซิน 2-stroke ({sector}) CH4", co2=None))
    ROWS.append(row("MOBILE_OFFROAD_GAS2ST", "N2O", n2o, "kgN2O/litre", den="litre", sub=sector, name_th=f"เบนซิน 2-stroke ({sector}) N2O", co2=None))

add_multigas("MOBILE_OFFROAD_B7", 2.5098, 0.0002, 0.001)
ROWS.append(row("MOBILE_OFFROAD_B7_BIO", "CO2_BIO", 0.1151, "kgCO2bio/litre", den="litre", co2="biogenic"))

# --- 9 Refrigerants (gas = refrigerant, ef = GWP) ---
REF_MAP = {
    "FUGITIVE_R22": "R22", "FUGITIVE_R32": "R32", "FUGITIVE_R125": "R125",
    "FUGITIVE_R134": "R134", "FUGITIVE_R134A": "R134A", "FUGITIVE_R143": "R143",
    "FUGITIVE_R143A": "R143A", "FUGITIVE_R404A": "R404A", "FUGITIVE_R407A": "R407A",
    "FUGITIVE_R407C": "R407C", "FUGITIVE_R410A": "R410A",
}
GWP_REF = {
    "R22": 1760, "R32": 677, "R125": 3170, "R134": 1120, "R134A": 1300,
    "R143": 328, "R143A": 4800, "R404A": 3942.8, "R407A": 1923.4, "R407C": 1624.21, "R410A": 1923.5,
}
for cat, gas in REF_MAP.items():
    ROWS.append(row(cat, gas, GWP_REF[gas], "kgCO2eq/kg", den="kg", src="IPCC_2013_AR5", co2=None))

# --- 10 Electricity ---
ROWS.append(row("ELEC_GRID_TH_2016_S2", "CO2", 0.4999, "kgCO2/kWh", den="kWh", purpose="cfo_scope2", src="THAI_LCI", until="2026-03-31", default=0))
ROWS.append(row("ELEC_GRID_TH_2016_S3", "CO2", 0.0987, "kgCO2/kWh", den="kWh", purpose="scope3_elec", src="THAI_LCI", until="2026-03-31", default=0))
ROWS.append(row("ELEC_GRID_TH_2016_CFP", "CO2", 0.5986, "kgCO2/kWh", den="kWh", purpose="cfp", src="THAI_LCI", default=0))
ROWS.append(row("ELEC_GRID_TH_2022_S2", "CO2", 0.475, "kgCO2/kWh", den="kWh", purpose="cfo_scope2", src="THAI_LCI", default=1))
ROWS.append(row("ELEC_GRID_TH_2022_S3", "CO2", 0.0812, "kgCO2/kWh", den="kWh", purpose="scope3_elec", src="THAI_LCI", default=1))
ROWS.append(row("ELEC_GRID_TH_2022_CFP", "CO2", 0.5562, "kgCO2/kWh", den="kWh", purpose="cfp", src="THAI_LCI", default=1))

# --- 11 Scope 3 ---
S3_TGO = [
    ("S3C1_PAPER", "กระดาษ", 2.102, "kgCO2eq/kg", "kg"),
    ("S3C1_INK", "หมึกพิมพ์ / หมึกทั่วไป", 4.52, "kgCO2eq/kg", "kg"),
    ("S3C1_WATER", "น้ำประปา", 0.541, "kgCO2eq/m3", "m3"),
    ("S3C3_DIESEL_UPS", "การได้มาของน้ำมันดีเซล", 0.3522, "kgCO2eq/kg", "kg"),
    ("S3C3_GASOLINE_UPS", "การได้มาของน้ำมันเบนซิน", 0.4024, "kgCO2eq/kg", "kg"),
    ("S3C3_ELEC_UPS", "การได้มาของไฟฟ้า", 0.0987, "kgCO2eq/kWh", "kWh"),
    ("S3C3_LPG_UPS", "การได้มาของ LPG", 0.8582, "kgCO2eq/kg", "kg"),
    ("S3C3_ETHANOL_UPS", "การได้มาของเอทานอล (Ethanol acquisition)", 0.3962, "kgCO2eq/kg", "kg"),
    ("S3C5_WASTE_LANDFILL", "ขยะทั่วไป (กำจัดด้วยวิธีฝังกลบ)", 0.7933, "kgCO2eq/kg", "kg"),
    ("S3C5_WASTE_INCIN", "ขยะอันตราย (กำจัดด้วยวิธีเผาทำลาย)", 1.21, "kgCO2eq/kg", "kg"),
    ("S3C5_SLUDGE", "กากตะกอน (ส่วนที่นำไปฝังกลบ)", 0.9828, "kgCO2eq/ton", "ton"),
    ("S3C5_EXCAVATOR", "รถแบคโฮ/รถขุด ดีเซล (off-road)", 2.9793, "kgCO2eq/litre", "litre"),
]
for cat, name, val, unit, den in S3_TGO:
    src = "IPCC_AR5" if cat == "S3C5_SLUDGE" else "TGO_CFP_2565"
    ROWS.append(row(cat, "CO2", val, unit, den=den, name_th=name, src=src, eff_from="2022-07-01", co2=None))

S3_USEEIO = [
    ("S3C2_BUILDING", "อาคาร", 0.2292),
    ("S3C2_BUILDING", "สิ่งปรับปรุงอาคาร", 0.2292),
    ("S3C2_OFFICE_EQUIP", "อุปกรณ์สำนักงาน (เครื่องมือ, อุปกรณ์ตกแต่ง)", 0.3574),
    ("S3C2_COMPUTER", "คอมพิวเตอร์", 0.146),
    ("S3C2_SOFTWARE", "โปรแกรมคอมพิวเตอร์ (ซอฟต์แวร์ระบบงาน)", 0.0398),
    ("S3C2_VEHICLE_CAP", "ยานพาหนะ (Pickup trucks, vans, SUVs)", 0.4086),
]
for cat, name, val in S3_USEEIO:
    ROWS.append(row(cat, "CO2", val, "kgCO2eq/THB", den="THB", name_th=name, src="USEEIO_V1", eff_from="2022-07-01", co2=None))

S3_TRANSPORT = [
    ("S3C5_TRANSPORT_TKM", "รถบรรทุกขยะ 6 ล้อ (0% Loading)", 0.0475, "tkm"),
    ("S3C5_TRANSPORT_KM", "รถบรรทุกขยะ 6 ล้อ (100% Loading)", 0.4923, "km"),
    ("S3C5_TRANSPORT_TKM", "รถบรรทุกขยะรีไซเคิล 4 ล้อ (100% Loading)", 0.2154, "tkm"),
    ("S3C5_TRANSPORT_KM", "รถบรรทุกขยะรีไซเคิล 4 ล้อ (0% Loading)", 0.2415, "km"),
    ("S3C5_TRANSPORT_TKM", "รถขนส่งกากตะกอน 10 ล้อ (100% Loading)", 0.0533, "tkm"),
    ("S3C5_TRANSPORT_KM", "รถขนส่งกากตะกอน 10 ล้อ (0% Loading)", 0.59, "km"),
]
for cat, name, val, den in S3_TRANSPORT:
    unit = f"kgCO2eq/{den}"
    ROWS.append(row(cat, "CO2", val, unit, den=den, name_th=name, src="TGO_CFP_2565", eff_from="2022-07-01", co2=None))

S3_COMMUTE = [
    ("S3C7_COMMUTE_DIESEL", "รถกระบะ/รถยนต์/รถเมล์ (Diesel)", 2.7406, "litre"),
    ("S3C7_COMMUTE_GAS", "รถยนต์/รถจักรยานยนต์ (Gasoline)", 2.2394, "litre"),
    ("S3C7_COMMUTE_LPG", "รถยนต์ส่วนบุคคล (LPG)", 3.2049, "kg"),
    ("S3C7_COMMUTE_EV", "รถยนต์ไฟฟ้า (EV)", 0.4999, "kWh"),
    ("S3C7_COMMUTE_CNG", "รถ Taxi (CNG)", 2.609, "kg"),
    ("S3C7_COMMUTE_DIESEL", "การเดินทางของลูกค้า (Diesel)", 2.7406, "litre"),
    ("S3C7_COMMUTE_GAS", "การเดินทางของลูกค้า (Gasoline)", 2.2394, "litre"),
    ("S3C7_COMMUTE_CNG", "การเดินทางของลูกค้า (CNG)", 2.609, "kg"),
]
for cat, name, val, den in S3_COMMUTE:
    ROWS.append(row(cat, "CO2", val, f"kgCO2eq/{den}", den=den, name_th=name, src="TGO_CFP_2565", eff_from="2022-07-01", co2=None))


CATEGORIES_02B = [
    ("SCOPE1_COMBUSTION", "FUEL_NATGAS_NCV_SCF", "ก๊าซธรรมชาติ NCV (scf)", "Natural Gas NCV (scf)", 1, "scf", 101),
    ("SCOPE1_COMBUSTION", "FUEL_NATGAS_HHV_MJ", "ก๊าซธรรมชาติ HHV (MJ)", "Natural Gas HHV (MJ)", 1, "MJ", 103),
    ("SCOPE1_COMBUSTION", "FUEL_NATGAS_HHV_MMBTU", "ก๊าซธรรมชาติ HHV (MMBTU)", "Natural Gas HHV (MMBTU)", 1, "MMBTU", 104),
    ("SCOPE1_COMBUSTION", "FUEL_LPG_KG", "LPG (กก.)", "LPG (kg)", 1, "kg", 106),
    ("SCOPE1_COMBUSTION", "FUEL_ACETYLENE", "ก๊าซอะเซทิลีน", "Acetylene", 1, "kg", 107),
    ("SCOPE1_COMBUSTION", "FUEL_ETHANE", "ก๊าซอีเทน", "Ethane", 1, "kg", 108),
    ("SCOPE1_COMBUSTION", "FUEL_PROPANE", "ก๊าซโพรเพน", "Propane", 1, "kg", 109),
    ("SCOPE1_COMBUSTION", "FUEL_BUTANE", "ก๊าซบิวเทน", "Butane", 1, "kg", 110),
    ("SCOPE1_COMBUSTION", "FUEL_KEROSENE_OTHER", "น้ำมันก๊าด Other Kerosene", "Other Kerosene", 1, "litre", 114),
    ("SCOPE1_COMBUSTION", "FUEL_BIODIESEL", "ไบโอดีเซล", "Biodiesel", 1, "litre", 115),
    ("SCOPE1_COMBUSTION", "FUEL_BIOGASOLINE", "ไบโอแก๊สโซลีน (Ethanol)", "Bio-gasoline (Ethanol)", 1, "litre", 116),
    ("SCOPE1_COMBUSTION", "FUEL_DIESEL_B7", "ดีเซล B7 (Fossil Scope 1)", "Diesel B7 — Scope 1 fossil", 1, "litre", 117),
    ("SCOPE1_COMBUSTION", "FUEL_DIESEL_B7_BIO", "ดีเซล B7 (Biogenic CO2)", "Diesel B7 — Biogenic CO2", 1, "litre", 118),
    ("SCOPE1_COMBUSTION", "FUEL_DIESEL_B20", "ดีเซล B20 (Fossil Scope 1)", "Diesel B20 — Scope 1 fossil", 1, "litre", 119),
    ("SCOPE1_COMBUSTION", "FUEL_DIESEL_B20_BIO", "ดีเซล B20 (Biogenic CO2)", "Diesel B20 — Biogenic CO2", 1, "litre", 120),
    ("SCOPE1_COMBUSTION", "FUEL_GASOHOL_E10", "แก๊สโซฮอล์ E10 (Fossil Scope 1)", "Gasohol E10 — Scope 1 fossil", 1, "litre", 121),
    ("SCOPE1_COMBUSTION", "FUEL_GASOHOL_E10_BIO", "แก๊สโซฮอล์ E10 (Biogenic CO2)", "Gasohol E10 — Biogenic CO2", 1, "litre", 122),
    ("SCOPE1_COMBUSTION", "FUEL_GASOHOL_E20", "แก๊สโซฮอล์ E20 (Fossil Scope 1)", "Gasohol E20 — Scope 1 fossil", 1, "litre", 123),
    ("SCOPE1_COMBUSTION", "FUEL_GASOHOL_E20_BIO", "แก๊สโซฮอล์ E20 (Biogenic CO2)", "Gasohol E20 — Biogenic CO2", 1, "litre", 124),
    ("SCOPE1_COMBUSTION", "FUEL_GASOHOL_E85", "แก๊สโซฮอล์ E85 (Fossil Scope 1)", "Gasohol E85 — Scope 1 fossil", 1, "litre", 125),
    ("SCOPE1_COMBUSTION", "FUEL_GASOHOL_E85_BIO", "แก๊สโซฮอล์ E85 (Biogenic CO2)", "Gasohol E85 — Biogenic CO2", 1, "litre", 126),
    ("SCOPE1_COMBUSTION", "FUEL_COAL_BITUMINOUS", "ถ่านหิน Bituminous", "Bituminous Coal", 1, "kg", 129),
    ("SCOPE1_COMBUSTION", "FUEL_COAL_COKING", "ถ่านหิน Coking", "Coking Coal", 1, "kg", 130),
    ("SCOPE1_COMBUSTION", "FUEL_WOOD_BIO", "ฟืน (Biogenic CO2)", "Fuel wood — Biogenic CO2", 1, "kg", 133),
    ("SCOPE1_COMBUSTION", "FUEL_SAWDUST", "ขี้เลื่อย (CH4+N2O เท่านั้น)", "Saw dust — Scope 1 (CH4+N2O)", 1, "kg", 134),
    ("SCOPE1_COMBUSTION", "FUEL_SAWDUST_BIO", "ขี้เลื่อย (Biogenic CO2)", "Saw dust — Biogenic CO2", 1, "kg", 135),
    ("SCOPE1_COMBUSTION", "FUEL_CHARCOAL", "ถ่านไม้ (CH4+N2O เท่านั้น)", "Charcoal — Scope 1 (CH4+N2O)", 1, "kg", 136),
    ("SCOPE1_COMBUSTION", "FUEL_CHARCOAL_BIO", "ถ่านไม้ (Biogenic CO2)", "Charcoal — Biogenic CO2", 1, "kg", 137),
    ("SCOPE1_COMBUSTION", "FUEL_PADDYHUSK", "แกลบ (CH4+N2O เท่านั้น)", "Paddy husk — Scope 1 (CH4+N2O)", 1, "kg", 138),
    ("SCOPE1_COMBUSTION", "FUEL_PADDYHUSK_BIO", "แกลบ (Biogenic CO2)", "Paddy husk — Biogenic CO2", 1, "kg", 139),
    ("SCOPE1_COMBUSTION", "FUEL_BAGASSE_BIO", "กากอ้อย (Biogenic CO2)", "Bagasse — Biogenic CO2", 1, "kg", 141),
    ("SCOPE1_COMBUSTION", "FUEL_PALMSHELL", "กะลาปาล์ม (CH4+N2O เท่านั้น)", "Palm kernel shell — Scope 1", 1, "kg", 142),
    ("SCOPE1_COMBUSTION", "FUEL_PALMSHELL_BIO", "กะลาปาล์ม (Biogenic CO2)", "Palm kernel shell — Biogenic", 1, "kg", 143),
    ("SCOPE1_COMBUSTION", "FUEL_COB", "ซังข้าวโพด (CH4+N2O เท่านั้น)", "Cob — Scope 1 (CH4+N2O)", 1, "kg", 144),
    ("SCOPE1_COMBUSTION", "FUEL_COB_BIO", "ซังข้าวโพด (Biogenic CO2)", "Cob — Biogenic CO2", 1, "kg", 145),
    ("SCOPE1_COMBUSTION", "FUEL_BIOGAS", "ก๊าซชีวภาพ (CH4+N2O เท่านั้น)", "Biogas — Scope 1 (CH4+N2O)", 1, "m3", 146),
    ("SCOPE1_COMBUSTION", "FUEL_BIOGAS_BIO", "ก๊าซชีวภาพ (Biogenic CO2)", "Biogas — Biogenic CO2", 1, "m3", 147),
    ("SCOPE1_MOBILE", "MOBILE_ONROAD_LPG_KG", "LPG (ยานพาหนะบนถนน, กก.)", "On-road LPG (kg)", 1, "kg", 203),
    ("SCOPE1_MOBILE", "MOBILE_ONROAD_BIODIESEL", "ไบโอดีเซล (ยานพาหนะบนถนน)", "On-road Biodiesel", 1, "litre", 208),
    ("SCOPE1_MOBILE", "MOBILE_ONROAD_ETHANOL", "เอทานอล (ยานพาหนะบนถนน)", "On-road Ethanol (Bio-gasoline)", 1, "litre", 209),
    ("SCOPE1_MOBILE", "MOBILE_ONROAD_B7", "ดีเซล B7 บนถนน (Fossil)", "On-road Diesel B7 — Scope 1", 1, "litre", 210),
    ("SCOPE1_MOBILE", "MOBILE_ONROAD_B7_BIO", "ดีเซล B7 บนถนน (Biogenic)", "On-road Diesel B7 — Biogenic CO2", 1, "litre", 211),
    ("SCOPE1_MOBILE", "MOBILE_ONROAD_B20", "ดีเซล B20 บนถนน (Fossil)", "On-road Diesel B20 — Scope 1", 1, "litre", 212),
    ("SCOPE1_MOBILE", "MOBILE_ONROAD_B20_BIO", "ดีเซล B20 บนถนน (Biogenic)", "On-road Diesel B20 — Biogenic CO2", 1, "litre", 213),
    ("SCOPE1_MOBILE", "MOBILE_ONROAD_E10_OXCAT", "แก๊สโซฮอล์ E10 (oxidation catalyst)", "On-road Gasohol E10 oxcat", 1, "litre", 214),
    ("SCOPE1_MOBILE", "MOBILE_ONROAD_E10_OXCAT_BIO", "E10 oxcat (Biogenic)", "On-road Gasohol E10 oxcat — Biogenic", 1, "litre", 215),
    ("SCOPE1_MOBILE", "MOBILE_ONROAD_E20_OXCAT", "แก๊สโซฮอล์ E20 (oxidation catalyst)", "On-road Gasohol E20 oxcat", 1, "litre", 216),
    ("SCOPE1_MOBILE", "MOBILE_ONROAD_E20_OXCAT_BIO", "E20 oxcat (Biogenic)", "On-road Gasohol E20 oxcat — Biogenic", 1, "litre", 217),
    ("SCOPE1_MOBILE", "MOBILE_ONROAD_E85_OXCAT", "แก๊สโซฮอล์ E85 (oxidation catalyst)", "On-road Gasohol E85 oxcat", 1, "litre", 218),
    ("SCOPE1_MOBILE", "MOBILE_ONROAD_E85_OXCAT_BIO", "E85 oxcat (Biogenic)", "On-road Gasohol E85 oxcat — Biogenic", 1, "litre", 219),
    ("SCOPE1_MOBILE", "MOBILE_ONROAD_E10_LOWM", "แก๊สโซฮอล์ E10 (low mileage ≥1995)", "On-road Gasohol E10 low mileage", 1, "litre", 220),
    ("SCOPE1_MOBILE", "MOBILE_ONROAD_E10_LOWM_BIO", "E10 low mileage (Biogenic)", "On-road Gasohol E10 low mileage — Biogenic", 1, "litre", 221),
    ("SCOPE1_MOBILE", "MOBILE_ONROAD_E20_LOWM", "แก๊สโซฮอล์ E20 (low mileage ≥1995)", "On-road Gasohol E20 low mileage", 1, "litre", 222),
    ("SCOPE1_MOBILE", "MOBILE_ONROAD_E20_LOWM_BIO", "E20 low mileage (Biogenic)", "On-road Gasohol E20 low mileage — Biogenic", 1, "litre", 223),
    ("SCOPE1_MOBILE", "MOBILE_ONROAD_E85_LOWM", "แก๊สโซฮอล์ E85 (low mileage ≥1995)", "On-road Gasohol E85 low mileage", 1, "litre", 224),
    ("SCOPE1_MOBILE", "MOBILE_ONROAD_E85_LOWM_BIO", "E85 low mileage (Biogenic)", "On-road Gasohol E85 low mileage — Biogenic", 1, "litre", 225),
    ("SCOPE1_MOBILE", "MOBILE_OFFROAD_LPG_KG", "LPG (ยานพาหนะนอกถนน, กก.)", "Off-road LPG (kg)", 1, "kg", 301),
    ("SCOPE1_MOBILE", "MOBILE_OFFROAD_BIODIESEL", "ไบโอดีเซล (ยานพาหนะนอกถนน)", "Off-road Biodiesel", 1, "litre", 303),
    ("SCOPE1_MOBILE", "MOBILE_OFFROAD_ETHANOL", "เอทานอล (ยานพาหนะนอกถนน)", "Off-road Ethanol", 1, "litre", 304),
    ("SCOPE1_MOBILE", "MOBILE_OFFROAD_GAS2ST", "น้ำมันเบนซิน 2-stroke (นอกถนน)", "Off-road Motor Gasoline 2-stroke", 1, "litre", 305),
    ("SCOPE1_MOBILE", "MOBILE_OFFROAD_B7", "ดีเซล B7 (นอกถนน, Fossil)", "Off-road Diesel B7 — Scope 1", 1, "litre", 307),
    ("SCOPE1_MOBILE", "MOBILE_OFFROAD_B7_BIO", "ดีเซล B7 (นอกถนน, Biogenic)", "Off-road Diesel B7 — Biogenic", 1, "litre", 308),
    ("SCOPE2_ELECTRICITY", "ELEC_GRID_TH_2016_CFP", "ไฟฟ้า 2016-18 CFP", "Grid 2016-18 CFP", 2, "kWh", 503),
    ("SCOPE2_ELECTRICITY", "ELEC_GRID_TH_2022_CFP", "ไฟฟ้า 2022-24 CFP", "Grid 2022-24 CFP", 2, "kWh", 506),
    ("SCOPE3_UPSTREAM", "S3C2_OFFICE_EQUIP", "อุปกรณ์สำนักงาน", "Office equipment", 3, "THB", 612),
    ("SCOPE3_UPSTREAM", "S3C2_SOFTWARE", "ซอฟต์แวร์", "Software", 3, "THB", 614),
    ("SCOPE3_UPSTREAM", "S3C2_VEHICLE_CAP", "ยานพาหนะ (สินทรัพย์ทุน)", "Vehicles (capital goods)", 3, "THB", 615),
    ("SCOPE3_UPSTREAM", "S3C3_GASOLINE_UPS", "เบนซิน upstream", "Gasoline upstream", 3, "kg", 622),
    ("SCOPE3_UPSTREAM", "S3C3_LPG_UPS", "LPG upstream", "LPG upstream", 3, "kg", 624),
    ("SCOPE3_UPSTREAM", "S3C3_ETHANOL_UPS", "เอทานอล upstream", "Ethanol upstream", 3, "kg", 625),
    ("SCOPE3_UPSTREAM", "S3C5_SLUDGE", "กากตะกอน", "Sludge", 3, "ton", 633),
    ("SCOPE3_UPSTREAM", "S3C5_TRANSPORT_TKM", "ขนส่งของเสีย (tkm)", "Waste transport (tkm)", 3, "tkm", 634),
    ("SCOPE3_UPSTREAM", "S3C5_TRANSPORT_KM", "ขนส่งของเสีย (km)", "Waste transport (km)", 3, "km", 635),
    ("SCOPE3_UPSTREAM", "S3C5_EXCAVATOR", "รถแบคโฮ/รถขุด", "Excavator", 3, "litre", 636),
    ("SCOPE3_DOWNSTREAM", "S3C7_COMMUTE_GAS", "เดินทาง Gasoline", "Commute Gasoline", 3, "litre", 642),
    ("SCOPE3_DOWNSTREAM", "S3C7_COMMUTE_LPG", "เดินทาง LPG", "Commute LPG", 3, "kg", 643),
    ("SCOPE3_DOWNSTREAM", "S3C7_COMMUTE_EV", "เดินทาง EV", "Commute EV", 3, "kWh", 644),
    ("SCOPE3_DOWNSTREAM", "S3C7_COMMUTE_CNG", "เดินทาง CNG", "Commute CNG", 3, "kg", 645),
]


def sql_escape(s: str) -> str:
    return s.replace("'", "''")


def gen_02b() -> str:
    lines = [
        "-- [02b] ef_categories เพิ่มเติม — TGO 2569 full",
        "USE control_z_v2;",
        "INSERT IGNORE INTO ef_categories (parent_id, category_code, name_th, name_en, scope_id, unit_activity, sort_order)",
        "SELECT p.category_id, x.code, x.name_th, x.name_en, x.scope_id, x.unit, x.sort_order",
        "FROM (",
    ]
    parts = []
    for parent, code, th, en, scope, unit, sort in CATEGORIES_02B:
        parts.append(
            f"  SELECT '{parent}' AS parent_code, '{code}' AS code, "
            f"'{sql_escape(th)}' AS name_th, '{sql_escape(en)}' AS name_en, "
            f"{scope} AS scope_id, '{unit}' AS unit, {sort} AS sort_order"
        )
    lines.append("\n  UNION ALL\n".join(parts))
    lines.append(") x JOIN ef_categories p ON p.category_code = x.parent_code;")
    lines.append("")
    lines.append("UPDATE ef_categories SET scope3_parent_code = 's3_cat_2_capital_goods' WHERE category_code LIKE 'S3C2_%';")
    lines.append("UPDATE ef_categories SET scope3_parent_code = 's3_cat_3_fuel_energy_related' WHERE category_code IN ('S3C3_GASOLINE_UPS','S3C3_LPG_UPS','S3C3_ETHANOL_UPS');")
    lines.append("UPDATE ef_categories SET scope3_parent_code = 's3_cat_5_waste_operations' WHERE category_code IN ('S3C5_SLUDGE','S3C5_TRANSPORT_TKM','S3C5_TRANSPORT_KM','S3C5_EXCAVATOR');")
    lines.append("UPDATE ef_categories SET scope3_parent_code = 's3_cat_7_employee_commuting' WHERE category_code IN ('S3C7_COMMUTE_GAS','S3C7_COMMUTE_LPG','S3C7_COMMUTE_EV','S3C7_COMMUTE_CNG');")
    return "\n".join(lines) + "\n"


def gen_03c() -> str:
    lines = [
        "-- [03c] Emission Factors — TGO 2569 FULL (~190 rows)",
        "-- Generated by docs/scripts/generate_ef_full.py",
        "USE control_z_v2;",
        "",
        "DELETE FROM emission_factors;",
        "",
        "INSERT INTO emission_factors (",
        "  source_id, category_id, gas_id, activity_name_th, activity_subtype,",
        "  co2_type, ef_purpose, ef_value, ef_unit, ef_unit_numerator, ef_unit_denominator,",
        "  region, is_default, effective_from, effective_until",
        ")",
        "SELECT",
        "  (SELECT source_id FROM ef_sources WHERE source_code = r.src),",
        "  c.category_id,",
        "  g.gas_id,",
        "  COALESCE(r.name_th, c.name_th),",
        "  r.sub,",
        "  r.co2,",
        "  r.purpose,",
        "  r.val,",
        "  r.unit,",
        "  r.num,",
        "  r.den,",
        "  'Thailand',",
        "  r.is_def,",
        "  r.eff_from,",
        "  r.until",
        "FROM (",
    ]
    parts = []
    for i, r in enumerate(ROWS):
        co2_sql = f"'{r['co2']}'" if r["co2"] else "NULL"
        sub_sql = f"'{r['sub']}'" if r["sub"] else "NULL"
        pur_sql = f"'{r['purpose']}'" if r["purpose"] else "NULL"
        name_sql = f"'{sql_escape(r['name_th'])}'" if r["name_th"] else "NULL"
        until_sql = f"'{r['until']}'" if r["until"] else "NULL"
        parts.append(
            f"  SELECT '{r['cat']}' AS cat, '{r['gas']}' AS gas, {r['val']:.8f} AS val, "
            f"'{r['unit']}' AS unit, '{r['num']}' AS num, '{r['den']}' AS den, "
            f"{co2_sql} AS co2, {sub_sql} AS sub, {name_sql} AS name_th, {pur_sql} AS purpose, "
            f"'{r['src']}' AS src, '{r['eff_from']}' AS eff_from, {until_sql} AS until, {r['default']} AS is_def"
        )
    lines.append("\n  UNION ALL\n".join(parts))
    lines.append(") r")
    lines.append("JOIN ef_categories c ON c.category_code = r.cat")
    lines.append("JOIN gas_types g ON g.gas_code = r.gas;")
    lines.append("")
    lines.append(f"-- Total rows: {len(ROWS)}")
    return "\n".join(lines) + "\n"


def main() -> None:
    p02 = ROOT / "02b-ef-categories-full.sql"
    p03 = ROOT / "03c-ef-emission-factors-full.sql"
    p02.write_text(gen_02b(), encoding="utf-8")
    p03.write_text(gen_03c(), encoding="utf-8")
    print(f"Wrote {p02.name} ({len(CATEGORIES_02B)} categories)")
    print(f"Wrote {p03.name} ({len(ROWS)} emission factor rows)")


if __name__ == "__main__":
    main()
