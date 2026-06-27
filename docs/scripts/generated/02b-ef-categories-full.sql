-- [02b] ef_categories เพิ่มเติม — TGO 2569 full
USE control_z_v2;
INSERT IGNORE INTO ef_categories (parent_id, category_code, name_th, name_en, scope_id, unit_activity, sort_order)
SELECT p.category_id, x.code, x.name_th, x.name_en, x.scope_id, x.unit, x.sort_order
FROM (
  SELECT 'SCOPE1_COMBUSTION' AS parent_code, 'FUEL_NATGAS_NCV_SCF' AS code, 'ก๊าซธรรมชาติ NCV (scf)' AS name_th, 'Natural Gas NCV (scf)' AS name_en, 1 AS scope_id, 'scf' AS unit, 101 AS sort_order
  UNION ALL
  SELECT 'SCOPE1_COMBUSTION' AS parent_code, 'FUEL_NATGAS_HHV_MJ' AS code, 'ก๊าซธรรมชาติ HHV (MJ)' AS name_th, 'Natural Gas HHV (MJ)' AS name_en, 1 AS scope_id, 'MJ' AS unit, 103 AS sort_order
  UNION ALL
  SELECT 'SCOPE1_COMBUSTION' AS parent_code, 'FUEL_NATGAS_HHV_MMBTU' AS code, 'ก๊าซธรรมชาติ HHV (MMBTU)' AS name_th, 'Natural Gas HHV (MMBTU)' AS name_en, 1 AS scope_id, 'MMBTU' AS unit, 104 AS sort_order
  UNION ALL
  SELECT 'SCOPE1_COMBUSTION' AS parent_code, 'FUEL_LPG_KG' AS code, 'LPG (กก.)' AS name_th, 'LPG (kg)' AS name_en, 1 AS scope_id, 'kg' AS unit, 106 AS sort_order
  UNION ALL
  SELECT 'SCOPE1_COMBUSTION' AS parent_code, 'FUEL_ACETYLENE' AS code, 'ก๊าซอะเซทิลีน' AS name_th, 'Acetylene' AS name_en, 1 AS scope_id, 'kg' AS unit, 107 AS sort_order
  UNION ALL
  SELECT 'SCOPE1_COMBUSTION' AS parent_code, 'FUEL_ETHANE' AS code, 'ก๊าซอีเทน' AS name_th, 'Ethane' AS name_en, 1 AS scope_id, 'kg' AS unit, 108 AS sort_order
  UNION ALL
  SELECT 'SCOPE1_COMBUSTION' AS parent_code, 'FUEL_PROPANE' AS code, 'ก๊าซโพรเพน' AS name_th, 'Propane' AS name_en, 1 AS scope_id, 'kg' AS unit, 109 AS sort_order
  UNION ALL
  SELECT 'SCOPE1_COMBUSTION' AS parent_code, 'FUEL_BUTANE' AS code, 'ก๊าซบิวเทน' AS name_th, 'Butane' AS name_en, 1 AS scope_id, 'kg' AS unit, 110 AS sort_order
  UNION ALL
  SELECT 'SCOPE1_COMBUSTION' AS parent_code, 'FUEL_KEROSENE_OTHER' AS code, 'น้ำมันก๊าด Other Kerosene' AS name_th, 'Other Kerosene' AS name_en, 1 AS scope_id, 'litre' AS unit, 114 AS sort_order
  UNION ALL
  SELECT 'SCOPE1_COMBUSTION' AS parent_code, 'FUEL_BIODIESEL' AS code, 'ไบโอดีเซล' AS name_th, 'Biodiesel' AS name_en, 1 AS scope_id, 'litre' AS unit, 115 AS sort_order
  UNION ALL
  SELECT 'SCOPE1_COMBUSTION' AS parent_code, 'FUEL_BIOGASOLINE' AS code, 'ไบโอแก๊สโซลีน (Ethanol)' AS name_th, 'Bio-gasoline (Ethanol)' AS name_en, 1 AS scope_id, 'litre' AS unit, 116 AS sort_order
  UNION ALL
  SELECT 'SCOPE1_COMBUSTION' AS parent_code, 'FUEL_DIESEL_B7' AS code, 'ดีเซล B7 (Fossil Scope 1)' AS name_th, 'Diesel B7 — Scope 1 fossil' AS name_en, 1 AS scope_id, 'litre' AS unit, 117 AS sort_order
  UNION ALL
  SELECT 'SCOPE1_COMBUSTION' AS parent_code, 'FUEL_DIESEL_B7_BIO' AS code, 'ดีเซล B7 (Biogenic CO2)' AS name_th, 'Diesel B7 — Biogenic CO2' AS name_en, 1 AS scope_id, 'litre' AS unit, 118 AS sort_order
  UNION ALL
  SELECT 'SCOPE1_COMBUSTION' AS parent_code, 'FUEL_DIESEL_B20' AS code, 'ดีเซล B20 (Fossil Scope 1)' AS name_th, 'Diesel B20 — Scope 1 fossil' AS name_en, 1 AS scope_id, 'litre' AS unit, 119 AS sort_order
  UNION ALL
  SELECT 'SCOPE1_COMBUSTION' AS parent_code, 'FUEL_DIESEL_B20_BIO' AS code, 'ดีเซล B20 (Biogenic CO2)' AS name_th, 'Diesel B20 — Biogenic CO2' AS name_en, 1 AS scope_id, 'litre' AS unit, 120 AS sort_order
  UNION ALL
  SELECT 'SCOPE1_COMBUSTION' AS parent_code, 'FUEL_GASOHOL_E10' AS code, 'แก๊สโซฮอล์ E10 (Fossil Scope 1)' AS name_th, 'Gasohol E10 — Scope 1 fossil' AS name_en, 1 AS scope_id, 'litre' AS unit, 121 AS sort_order
  UNION ALL
  SELECT 'SCOPE1_COMBUSTION' AS parent_code, 'FUEL_GASOHOL_E10_BIO' AS code, 'แก๊สโซฮอล์ E10 (Biogenic CO2)' AS name_th, 'Gasohol E10 — Biogenic CO2' AS name_en, 1 AS scope_id, 'litre' AS unit, 122 AS sort_order
  UNION ALL
  SELECT 'SCOPE1_COMBUSTION' AS parent_code, 'FUEL_GASOHOL_E20' AS code, 'แก๊สโซฮอล์ E20 (Fossil Scope 1)' AS name_th, 'Gasohol E20 — Scope 1 fossil' AS name_en, 1 AS scope_id, 'litre' AS unit, 123 AS sort_order
  UNION ALL
  SELECT 'SCOPE1_COMBUSTION' AS parent_code, 'FUEL_GASOHOL_E20_BIO' AS code, 'แก๊สโซฮอล์ E20 (Biogenic CO2)' AS name_th, 'Gasohol E20 — Biogenic CO2' AS name_en, 1 AS scope_id, 'litre' AS unit, 124 AS sort_order
  UNION ALL
  SELECT 'SCOPE1_COMBUSTION' AS parent_code, 'FUEL_GASOHOL_E85' AS code, 'แก๊สโซฮอล์ E85 (Fossil Scope 1)' AS name_th, 'Gasohol E85 — Scope 1 fossil' AS name_en, 1 AS scope_id, 'litre' AS unit, 125 AS sort_order
  UNION ALL
  SELECT 'SCOPE1_COMBUSTION' AS parent_code, 'FUEL_GASOHOL_E85_BIO' AS code, 'แก๊สโซฮอล์ E85 (Biogenic CO2)' AS name_th, 'Gasohol E85 — Biogenic CO2' AS name_en, 1 AS scope_id, 'litre' AS unit, 126 AS sort_order
  UNION ALL
  SELECT 'SCOPE1_COMBUSTION' AS parent_code, 'FUEL_COAL_BITUMINOUS' AS code, 'ถ่านหิน Bituminous' AS name_th, 'Bituminous Coal' AS name_en, 1 AS scope_id, 'kg' AS unit, 129 AS sort_order
  UNION ALL
  SELECT 'SCOPE1_COMBUSTION' AS parent_code, 'FUEL_COAL_COKING' AS code, 'ถ่านหิน Coking' AS name_th, 'Coking Coal' AS name_en, 1 AS scope_id, 'kg' AS unit, 130 AS sort_order
  UNION ALL
  SELECT 'SCOPE1_COMBUSTION' AS parent_code, 'FUEL_WOOD_BIO' AS code, 'ฟืน (Biogenic CO2)' AS name_th, 'Fuel wood — Biogenic CO2' AS name_en, 1 AS scope_id, 'kg' AS unit, 133 AS sort_order
  UNION ALL
  SELECT 'SCOPE1_COMBUSTION' AS parent_code, 'FUEL_SAWDUST' AS code, 'ขี้เลื่อย (CH4+N2O เท่านั้น)' AS name_th, 'Saw dust — Scope 1 (CH4+N2O)' AS name_en, 1 AS scope_id, 'kg' AS unit, 134 AS sort_order
  UNION ALL
  SELECT 'SCOPE1_COMBUSTION' AS parent_code, 'FUEL_SAWDUST_BIO' AS code, 'ขี้เลื่อย (Biogenic CO2)' AS name_th, 'Saw dust — Biogenic CO2' AS name_en, 1 AS scope_id, 'kg' AS unit, 135 AS sort_order
  UNION ALL
  SELECT 'SCOPE1_COMBUSTION' AS parent_code, 'FUEL_CHARCOAL' AS code, 'ถ่านไม้ (CH4+N2O เท่านั้น)' AS name_th, 'Charcoal — Scope 1 (CH4+N2O)' AS name_en, 1 AS scope_id, 'kg' AS unit, 136 AS sort_order
  UNION ALL
  SELECT 'SCOPE1_COMBUSTION' AS parent_code, 'FUEL_CHARCOAL_BIO' AS code, 'ถ่านไม้ (Biogenic CO2)' AS name_th, 'Charcoal — Biogenic CO2' AS name_en, 1 AS scope_id, 'kg' AS unit, 137 AS sort_order
  UNION ALL
  SELECT 'SCOPE1_COMBUSTION' AS parent_code, 'FUEL_PADDYHUSK' AS code, 'แกลบ (CH4+N2O เท่านั้น)' AS name_th, 'Paddy husk — Scope 1 (CH4+N2O)' AS name_en, 1 AS scope_id, 'kg' AS unit, 138 AS sort_order
  UNION ALL
  SELECT 'SCOPE1_COMBUSTION' AS parent_code, 'FUEL_PADDYHUSK_BIO' AS code, 'แกลบ (Biogenic CO2)' AS name_th, 'Paddy husk — Biogenic CO2' AS name_en, 1 AS scope_id, 'kg' AS unit, 139 AS sort_order
  UNION ALL
  SELECT 'SCOPE1_COMBUSTION' AS parent_code, 'FUEL_BAGASSE_BIO' AS code, 'กากอ้อย (Biogenic CO2)' AS name_th, 'Bagasse — Biogenic CO2' AS name_en, 1 AS scope_id, 'kg' AS unit, 141 AS sort_order
  UNION ALL
  SELECT 'SCOPE1_COMBUSTION' AS parent_code, 'FUEL_PALMSHELL' AS code, 'กะลาปาล์ม (CH4+N2O เท่านั้น)' AS name_th, 'Palm kernel shell — Scope 1' AS name_en, 1 AS scope_id, 'kg' AS unit, 142 AS sort_order
  UNION ALL
  SELECT 'SCOPE1_COMBUSTION' AS parent_code, 'FUEL_PALMSHELL_BIO' AS code, 'กะลาปาล์ม (Biogenic CO2)' AS name_th, 'Palm kernel shell — Biogenic' AS name_en, 1 AS scope_id, 'kg' AS unit, 143 AS sort_order
  UNION ALL
  SELECT 'SCOPE1_COMBUSTION' AS parent_code, 'FUEL_COB' AS code, 'ซังข้าวโพด (CH4+N2O เท่านั้น)' AS name_th, 'Cob — Scope 1 (CH4+N2O)' AS name_en, 1 AS scope_id, 'kg' AS unit, 144 AS sort_order
  UNION ALL
  SELECT 'SCOPE1_COMBUSTION' AS parent_code, 'FUEL_COB_BIO' AS code, 'ซังข้าวโพด (Biogenic CO2)' AS name_th, 'Cob — Biogenic CO2' AS name_en, 1 AS scope_id, 'kg' AS unit, 145 AS sort_order
  UNION ALL
  SELECT 'SCOPE1_COMBUSTION' AS parent_code, 'FUEL_BIOGAS' AS code, 'ก๊าซชีวภาพ (CH4+N2O เท่านั้น)' AS name_th, 'Biogas — Scope 1 (CH4+N2O)' AS name_en, 1 AS scope_id, 'm3' AS unit, 146 AS sort_order
  UNION ALL
  SELECT 'SCOPE1_COMBUSTION' AS parent_code, 'FUEL_BIOGAS_BIO' AS code, 'ก๊าซชีวภาพ (Biogenic CO2)' AS name_th, 'Biogas — Biogenic CO2' AS name_en, 1 AS scope_id, 'm3' AS unit, 147 AS sort_order
  UNION ALL
  SELECT 'SCOPE1_MOBILE' AS parent_code, 'MOBILE_ONROAD_LPG_KG' AS code, 'LPG (ยานพาหนะบนถนน, กก.)' AS name_th, 'On-road LPG (kg)' AS name_en, 1 AS scope_id, 'kg' AS unit, 203 AS sort_order
  UNION ALL
  SELECT 'SCOPE1_MOBILE' AS parent_code, 'MOBILE_ONROAD_BIODIESEL' AS code, 'ไบโอดีเซล (ยานพาหนะบนถนน)' AS name_th, 'On-road Biodiesel' AS name_en, 1 AS scope_id, 'litre' AS unit, 208 AS sort_order
  UNION ALL
  SELECT 'SCOPE1_MOBILE' AS parent_code, 'MOBILE_ONROAD_ETHANOL' AS code, 'เอทานอล (ยานพาหนะบนถนน)' AS name_th, 'On-road Ethanol (Bio-gasoline)' AS name_en, 1 AS scope_id, 'litre' AS unit, 209 AS sort_order
  UNION ALL
  SELECT 'SCOPE1_MOBILE' AS parent_code, 'MOBILE_ONROAD_B7' AS code, 'ดีเซล B7 บนถนน (Fossil)' AS name_th, 'On-road Diesel B7 — Scope 1' AS name_en, 1 AS scope_id, 'litre' AS unit, 210 AS sort_order
  UNION ALL
  SELECT 'SCOPE1_MOBILE' AS parent_code, 'MOBILE_ONROAD_B7_BIO' AS code, 'ดีเซล B7 บนถนน (Biogenic)' AS name_th, 'On-road Diesel B7 — Biogenic CO2' AS name_en, 1 AS scope_id, 'litre' AS unit, 211 AS sort_order
  UNION ALL
  SELECT 'SCOPE1_MOBILE' AS parent_code, 'MOBILE_ONROAD_B20' AS code, 'ดีเซล B20 บนถนน (Fossil)' AS name_th, 'On-road Diesel B20 — Scope 1' AS name_en, 1 AS scope_id, 'litre' AS unit, 212 AS sort_order
  UNION ALL
  SELECT 'SCOPE1_MOBILE' AS parent_code, 'MOBILE_ONROAD_B20_BIO' AS code, 'ดีเซล B20 บนถนน (Biogenic)' AS name_th, 'On-road Diesel B20 — Biogenic CO2' AS name_en, 1 AS scope_id, 'litre' AS unit, 213 AS sort_order
  UNION ALL
  SELECT 'SCOPE1_MOBILE' AS parent_code, 'MOBILE_ONROAD_E10_OXCAT' AS code, 'แก๊สโซฮอล์ E10 (oxidation catalyst)' AS name_th, 'On-road Gasohol E10 oxcat' AS name_en, 1 AS scope_id, 'litre' AS unit, 214 AS sort_order
  UNION ALL
  SELECT 'SCOPE1_MOBILE' AS parent_code, 'MOBILE_ONROAD_E10_OXCAT_BIO' AS code, 'E10 oxcat (Biogenic)' AS name_th, 'On-road Gasohol E10 oxcat — Biogenic' AS name_en, 1 AS scope_id, 'litre' AS unit, 215 AS sort_order
  UNION ALL
  SELECT 'SCOPE1_MOBILE' AS parent_code, 'MOBILE_ONROAD_E20_OXCAT' AS code, 'แก๊สโซฮอล์ E20 (oxidation catalyst)' AS name_th, 'On-road Gasohol E20 oxcat' AS name_en, 1 AS scope_id, 'litre' AS unit, 216 AS sort_order
  UNION ALL
  SELECT 'SCOPE1_MOBILE' AS parent_code, 'MOBILE_ONROAD_E20_OXCAT_BIO' AS code, 'E20 oxcat (Biogenic)' AS name_th, 'On-road Gasohol E20 oxcat — Biogenic' AS name_en, 1 AS scope_id, 'litre' AS unit, 217 AS sort_order
  UNION ALL
  SELECT 'SCOPE1_MOBILE' AS parent_code, 'MOBILE_ONROAD_E85_OXCAT' AS code, 'แก๊สโซฮอล์ E85 (oxidation catalyst)' AS name_th, 'On-road Gasohol E85 oxcat' AS name_en, 1 AS scope_id, 'litre' AS unit, 218 AS sort_order
  UNION ALL
  SELECT 'SCOPE1_MOBILE' AS parent_code, 'MOBILE_ONROAD_E85_OXCAT_BIO' AS code, 'E85 oxcat (Biogenic)' AS name_th, 'On-road Gasohol E85 oxcat — Biogenic' AS name_en, 1 AS scope_id, 'litre' AS unit, 219 AS sort_order
  UNION ALL
  SELECT 'SCOPE1_MOBILE' AS parent_code, 'MOBILE_ONROAD_E10_LOWM' AS code, 'แก๊สโซฮอล์ E10 (low mileage ≥1995)' AS name_th, 'On-road Gasohol E10 low mileage' AS name_en, 1 AS scope_id, 'litre' AS unit, 220 AS sort_order
  UNION ALL
  SELECT 'SCOPE1_MOBILE' AS parent_code, 'MOBILE_ONROAD_E10_LOWM_BIO' AS code, 'E10 low mileage (Biogenic)' AS name_th, 'On-road Gasohol E10 low mileage — Biogenic' AS name_en, 1 AS scope_id, 'litre' AS unit, 221 AS sort_order
  UNION ALL
  SELECT 'SCOPE1_MOBILE' AS parent_code, 'MOBILE_ONROAD_E20_LOWM' AS code, 'แก๊สโซฮอล์ E20 (low mileage ≥1995)' AS name_th, 'On-road Gasohol E20 low mileage' AS name_en, 1 AS scope_id, 'litre' AS unit, 222 AS sort_order
  UNION ALL
  SELECT 'SCOPE1_MOBILE' AS parent_code, 'MOBILE_ONROAD_E20_LOWM_BIO' AS code, 'E20 low mileage (Biogenic)' AS name_th, 'On-road Gasohol E20 low mileage — Biogenic' AS name_en, 1 AS scope_id, 'litre' AS unit, 223 AS sort_order
  UNION ALL
  SELECT 'SCOPE1_MOBILE' AS parent_code, 'MOBILE_ONROAD_E85_LOWM' AS code, 'แก๊สโซฮอล์ E85 (low mileage ≥1995)' AS name_th, 'On-road Gasohol E85 low mileage' AS name_en, 1 AS scope_id, 'litre' AS unit, 224 AS sort_order
  UNION ALL
  SELECT 'SCOPE1_MOBILE' AS parent_code, 'MOBILE_ONROAD_E85_LOWM_BIO' AS code, 'E85 low mileage (Biogenic)' AS name_th, 'On-road Gasohol E85 low mileage — Biogenic' AS name_en, 1 AS scope_id, 'litre' AS unit, 225 AS sort_order
  UNION ALL
  SELECT 'SCOPE1_MOBILE' AS parent_code, 'MOBILE_OFFROAD_LPG_KG' AS code, 'LPG (ยานพาหนะนอกถนน, กก.)' AS name_th, 'Off-road LPG (kg)' AS name_en, 1 AS scope_id, 'kg' AS unit, 301 AS sort_order
  UNION ALL
  SELECT 'SCOPE1_MOBILE' AS parent_code, 'MOBILE_OFFROAD_BIODIESEL' AS code, 'ไบโอดีเซล (ยานพาหนะนอกถนน)' AS name_th, 'Off-road Biodiesel' AS name_en, 1 AS scope_id, 'litre' AS unit, 303 AS sort_order
  UNION ALL
  SELECT 'SCOPE1_MOBILE' AS parent_code, 'MOBILE_OFFROAD_ETHANOL' AS code, 'เอทานอล (ยานพาหนะนอกถนน)' AS name_th, 'Off-road Ethanol' AS name_en, 1 AS scope_id, 'litre' AS unit, 304 AS sort_order
  UNION ALL
  SELECT 'SCOPE1_MOBILE' AS parent_code, 'MOBILE_OFFROAD_GAS2ST' AS code, 'น้ำมันเบนซิน 2-stroke (นอกถนน)' AS name_th, 'Off-road Motor Gasoline 2-stroke' AS name_en, 1 AS scope_id, 'litre' AS unit, 305 AS sort_order
  UNION ALL
  SELECT 'SCOPE1_MOBILE' AS parent_code, 'MOBILE_OFFROAD_B7' AS code, 'ดีเซล B7 (นอกถนน, Fossil)' AS name_th, 'Off-road Diesel B7 — Scope 1' AS name_en, 1 AS scope_id, 'litre' AS unit, 307 AS sort_order
  UNION ALL
  SELECT 'SCOPE1_MOBILE' AS parent_code, 'MOBILE_OFFROAD_B7_BIO' AS code, 'ดีเซล B7 (นอกถนน, Biogenic)' AS name_th, 'Off-road Diesel B7 — Biogenic' AS name_en, 1 AS scope_id, 'litre' AS unit, 308 AS sort_order
  UNION ALL
  SELECT 'SCOPE2_ELECTRICITY' AS parent_code, 'ELEC_GRID_TH_2016_CFP' AS code, 'ไฟฟ้า 2016-18 CFP' AS name_th, 'Grid 2016-18 CFP' AS name_en, 2 AS scope_id, 'kWh' AS unit, 503 AS sort_order
  UNION ALL
  SELECT 'SCOPE2_ELECTRICITY' AS parent_code, 'ELEC_GRID_TH_2022_CFP' AS code, 'ไฟฟ้า 2022-24 CFP' AS name_th, 'Grid 2022-24 CFP' AS name_en, 2 AS scope_id, 'kWh' AS unit, 506 AS sort_order
  UNION ALL
  SELECT 'SCOPE3_UPSTREAM' AS parent_code, 'S3C2_OFFICE_EQUIP' AS code, 'อุปกรณ์สำนักงาน' AS name_th, 'Office equipment' AS name_en, 3 AS scope_id, 'THB' AS unit, 612 AS sort_order
  UNION ALL
  SELECT 'SCOPE3_UPSTREAM' AS parent_code, 'S3C2_SOFTWARE' AS code, 'ซอฟต์แวร์' AS name_th, 'Software' AS name_en, 3 AS scope_id, 'THB' AS unit, 614 AS sort_order
  UNION ALL
  SELECT 'SCOPE3_UPSTREAM' AS parent_code, 'S3C2_VEHICLE_CAP' AS code, 'ยานพาหนะ (สินทรัพย์ทุน)' AS name_th, 'Vehicles (capital goods)' AS name_en, 3 AS scope_id, 'THB' AS unit, 615 AS sort_order
  UNION ALL
  SELECT 'SCOPE3_UPSTREAM' AS parent_code, 'S3C3_GASOLINE_UPS' AS code, 'เบนซิน upstream' AS name_th, 'Gasoline upstream' AS name_en, 3 AS scope_id, 'kg' AS unit, 622 AS sort_order
  UNION ALL
  SELECT 'SCOPE3_UPSTREAM' AS parent_code, 'S3C3_LPG_UPS' AS code, 'LPG upstream' AS name_th, 'LPG upstream' AS name_en, 3 AS scope_id, 'kg' AS unit, 624 AS sort_order
  UNION ALL
  SELECT 'SCOPE3_UPSTREAM' AS parent_code, 'S3C3_ETHANOL_UPS' AS code, 'เอทานอล upstream' AS name_th, 'Ethanol upstream' AS name_en, 3 AS scope_id, 'kg' AS unit, 625 AS sort_order
  UNION ALL
  SELECT 'SCOPE3_UPSTREAM' AS parent_code, 'S3C5_SLUDGE' AS code, 'กากตะกอน' AS name_th, 'Sludge' AS name_en, 3 AS scope_id, 'ton' AS unit, 633 AS sort_order
  UNION ALL
  SELECT 'SCOPE3_UPSTREAM' AS parent_code, 'S3C5_TRANSPORT_TKM' AS code, 'ขนส่งของเสีย (tkm)' AS name_th, 'Waste transport (tkm)' AS name_en, 3 AS scope_id, 'tkm' AS unit, 634 AS sort_order
  UNION ALL
  SELECT 'SCOPE3_UPSTREAM' AS parent_code, 'S3C5_TRANSPORT_KM' AS code, 'ขนส่งของเสีย (km)' AS name_th, 'Waste transport (km)' AS name_en, 3 AS scope_id, 'km' AS unit, 635 AS sort_order
  UNION ALL
  SELECT 'SCOPE3_UPSTREAM' AS parent_code, 'S3C5_EXCAVATOR' AS code, 'รถแบคโฮ/รถขุด' AS name_th, 'Excavator' AS name_en, 3 AS scope_id, 'litre' AS unit, 636 AS sort_order
  UNION ALL
  SELECT 'SCOPE3_DOWNSTREAM' AS parent_code, 'S3C7_COMMUTE_GAS' AS code, 'เดินทาง Gasoline' AS name_th, 'Commute Gasoline' AS name_en, 3 AS scope_id, 'litre' AS unit, 642 AS sort_order
  UNION ALL
  SELECT 'SCOPE3_DOWNSTREAM' AS parent_code, 'S3C7_COMMUTE_LPG' AS code, 'เดินทาง LPG' AS name_th, 'Commute LPG' AS name_en, 3 AS scope_id, 'kg' AS unit, 643 AS sort_order
  UNION ALL
  SELECT 'SCOPE3_DOWNSTREAM' AS parent_code, 'S3C7_COMMUTE_EV' AS code, 'เดินทาง EV' AS name_th, 'Commute EV' AS name_en, 3 AS scope_id, 'kWh' AS unit, 644 AS sort_order
  UNION ALL
  SELECT 'SCOPE3_DOWNSTREAM' AS parent_code, 'S3C7_COMMUTE_CNG' AS code, 'เดินทาง CNG' AS name_th, 'Commute CNG' AS name_en, 3 AS scope_id, 'kg' AS unit, 645 AS sort_order
) x JOIN ef_categories p ON p.category_code = x.parent_code;

UPDATE ef_categories SET scope3_parent_code = 's3_cat_2_capital_goods' WHERE category_code LIKE 'S3C2_%';
UPDATE ef_categories SET scope3_parent_code = 's3_cat_3_fuel_energy_related' WHERE category_code IN ('S3C3_GASOLINE_UPS','S3C3_LPG_UPS','S3C3_ETHANOL_UPS');
UPDATE ef_categories SET scope3_parent_code = 's3_cat_5_waste_operations' WHERE category_code IN ('S3C5_SLUDGE','S3C5_TRANSPORT_TKM','S3C5_TRANSPORT_KM','S3C5_EXCAVATOR');
UPDATE ef_categories SET scope3_parent_code = 's3_cat_7_employee_commuting' WHERE category_code IN ('S3C7_COMMUTE_GAS','S3C7_COMMUTE_LPG','S3C7_COMMUTE_EV','S3C7_COMMUTE_CNG');
