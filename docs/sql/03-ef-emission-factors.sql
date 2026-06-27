-- =============================================================================
-- [03/04] Emission Factors — ชุด priority (TGO 2569 บังคับใช้ 1 ม.ค. 2569)
-- อ้างอิง: docs/ef-database-update-plan.md ส่วนที่ 6–11 (subset สำหรับ dev)
-- ชุดเต็ม ~190 แถว: เติมต่อจากตารางในเอกสาร หรือ generate จาก Excel
-- ต้องรัน 02 ก่อน
-- =============================================================================

USE control_z_v2;

SET @src_tgo   := (SELECT source_id FROM ef_sources WHERE source_code = 'TGO_AR5');
SET @src_lci   := (SELECT source_id FROM ef_sources WHERE source_code = 'THAI_LCI');
SET @src_ipcc  := (SELECT source_id FROM ef_sources WHERE source_code = 'IPCC_2013_AR5');
SET @src_cfp   := (SELECT source_id FROM ef_sources WHERE source_code = 'TGO_CFP_2565');
SET @g_co2     := (SELECT gas_id FROM gas_types WHERE gas_code = 'CO2');
SET @g_ch4     := (SELECT gas_id FROM gas_types WHERE gas_code = 'CH4');
SET @g_ch4f    := (SELECT gas_id FROM gas_types WHERE gas_code = 'CH4_FOSSIL');
SET @g_n2o     := (SELECT gas_id FROM gas_types WHERE gas_code = 'N2O');

-- Macro-style: diesel stationary + on-road (CO2 + fossil CH4 + N2O)
INSERT INTO emission_factors (
  source_id, category_id, gas_id, activity_name_th, activity_name_en,
  co2_type, ef_value, ef_unit, ef_unit_numerator, ef_unit_denominator,
  region, is_default, effective_from, notes
)
SELECT @src_tgo, c.category_id, g.gas_id, c.name_th, c.name_en,
       g.co2_type, g.ef_val, g.ef_unit, g.num, 'litre',
       'Thailand', 1, '2026-01-01', 'TGO อบก. ก.พ. 2569'
FROM ef_categories c
JOIN (
  SELECT 'FUEL_DIESEL' AS cat, @g_co2 AS gas_id, 'fossil' AS co2_type, 2.69870000 AS ef_val, 'kgCO2/litre' AS ef_unit, 'kgCO2' AS num UNION ALL
  SELECT 'FUEL_DIESEL', @g_ch4f, NULL, 0.00010900, 'kgCH4/litre', 'kgCH4' UNION ALL
  SELECT 'FUEL_DIESEL', @g_n2o, NULL, 0.00002190, 'kgN2O/litre', 'kgN2O' UNION ALL
  SELECT 'MOBILE_ONROAD_DIESEL', @g_co2, 'fossil', 2.69870000, 'kgCO2/litre', 'kgCO2' UNION ALL
  SELECT 'MOBILE_ONROAD_DIESEL', @g_ch4f, NULL, 0.00014200, 'kgCH4/litre', 'kgCH4' UNION ALL
  SELECT 'MOBILE_ONROAD_DIESEL', @g_n2o, NULL, 0.00014200, 'kgN2O/litre', 'kgN2O' UNION ALL
  SELECT 'FUEL_GASOLINE', @g_co2, 'fossil', 2.18160000, 'kgCO2/litre', 'kgCO2' UNION ALL
  SELECT 'FUEL_GASOLINE', @g_ch4f, NULL, 0.00009440, 'kgCH4/litre', 'kgCH4' UNION ALL
  SELECT 'FUEL_GASOLINE', @g_n2o, NULL, 0.00001890, 'kgN2O/litre', 'kgN2O'
) g ON g.cat = c.category_code;

-- On-road gasoline variants
INSERT INTO emission_factors (source_id, category_id, gas_id, activity_name_th, co2_type, ef_value, ef_unit, ef_unit_numerator, ef_unit_denominator, region, is_default, effective_from)
SELECT @src_tgo, c.category_id, @g_co2, c.name_th, 'fossil', 2.18160000, 'kgCO2/litre', 'kgCO2', 'litre', 'Thailand', 1, '2026-01-01'
FROM ef_categories c
WHERE c.category_code IN ('MOBILE_ONROAD_GAS_UNCNTRL','MOBILE_ONROAD_GAS_OXCAT','MOBILE_ONROAD_GAS_LOWM');

-- Off-road diesel (activity_subtype NULL = ใช้ร่วมทุก sector ใน ui_sector_map)
INSERT INTO emission_factors (source_id, category_id, gas_id, activity_name_th, activity_subtype, co2_type, ef_value, ef_unit, ef_unit_numerator, ef_unit_denominator, region, is_default, effective_from)
SELECT @src_tgo, c.category_id, g.gas_id, 'ดีเซลนอกถนน', NULL, g.co2_type, g.ef_val, g.ef_unit, g.num, 'litre', 'Thailand', 1, '2026-01-01'
FROM ef_categories c
JOIN (
  SELECT @g_co2 AS gas_id, 'fossil' AS co2_type, 2.69870000 AS ef_val, 'kgCO2/litre' AS ef_unit, 'kgCO2' AS num UNION ALL
  SELECT @g_ch4f, NULL, 0.00014200, 'kgCH4/litre', 'kgCH4' UNION ALL
  SELECT @g_n2o, NULL, 0.00014200, 'kgN2O/litre', 'kgN2O'
) g ON c.category_code = 'MOBILE_OFFROAD_DIESEL';

-- ไฟฟ้า grid 2022-2024 Scope 2 (default สำหรับหน้ากรอกข้อมูล)
INSERT INTO emission_factors (
  source_id, category_id, gas_id, activity_name_th, ef_purpose, ef_value, ef_unit,
  ef_unit_numerator, ef_unit_denominator, region, is_default, effective_from, notes
) VALUES (
  @src_lci,
  (SELECT category_id FROM ef_categories WHERE category_code = 'ELEC_GRID_TH_2022_S2'),
  @g_co2,
  'ไฟฟ้า grid mix ปี 2022-2024 (CFO Scope2)',
  'cfo_scope2',
  0.47500000, 'kgCO2/kWh', 'kgCO2', 'kWh', 'Thailand', 1, '2026-01-01',
  'Thai National LCI DB — ชุดใหม่ TGO 2569'
);

-- Refrigerants (kgCO2eq/kg = GWP100)
INSERT INTO emission_factors (source_id, category_id, gas_id, activity_name_th, ef_value, ef_unit, ef_unit_numerator, ef_unit_denominator, region, is_default, effective_from)
SELECT @src_ipcc, c.category_id, g.gas_id, c.name_th, gv.gwp_value, 'kgCO2eq/kg', 'kgCO2eq', 'kg', 'Thailand', 1, '2026-01-01'
FROM ef_categories c
JOIN (
  SELECT 'FUGITIVE_R22' AS cat, 'R22' AS gas UNION ALL
  SELECT 'FUGITIVE_R32', 'R32' UNION ALL
  SELECT 'FUGITIVE_R125', 'R125' UNION ALL
  SELECT 'FUGITIVE_R134', 'R134' UNION ALL
  SELECT 'FUGITIVE_R134A', 'R134A' UNION ALL
  SELECT 'FUGITIVE_R143', 'R143' UNION ALL
  SELECT 'FUGITIVE_R143A', 'R143A' UNION ALL
  SELECT 'FUGITIVE_R404A', 'R404A' UNION ALL
  SELECT 'FUGITIVE_R407A', 'R407A' UNION ALL
  SELECT 'FUGITIVE_R407C', 'R407C' UNION ALL
  SELECT 'FUGITIVE_R410A', 'R410A'
) m ON m.cat = c.category_code
JOIN gas_types g ON g.gas_code = m.gas
JOIN gwp_values gv ON gv.gas_id = g.gas_id AND gv.ar_period = 'AR5';

-- Scope 3 ตัวอย่าง (kgCO2eq รวม — gas CO2)
INSERT INTO emission_factors (source_id, category_id, gas_id, activity_name_th, ef_value, ef_unit, ef_unit_numerator, ef_unit_denominator, region, is_default, effective_from)
SELECT @src_cfp, c.category_id, @g_co2, c.name_th, v.ef_val, v.ef_unit, 'kgCO2eq', v.den, 'Thailand', 1, '2022-07-01'
FROM (
  SELECT 'S3C1_PAPER' AS cat, 2.10200000 AS ef_val, 'kgCO2eq/kg' AS ef_unit, 'kg' AS den UNION ALL
  SELECT 'S3C1_INK', 4.52000000, 'kgCO2eq/kg', 'kg' UNION ALL
  SELECT 'S3C1_WATER', 0.54100000, 'kgCO2eq/m3', 'm3' UNION ALL
  SELECT 'S3C2_BUILDING', 0.22920000, 'kgCO2eq/THB', 'THB' UNION ALL
  SELECT 'S3C3_DIESEL_UPS', 0.35220000, 'kgCO2eq/kg', 'kg' UNION ALL
  SELECT 'S3C3_ELEC_UPS', 0.09870000, 'kgCO2eq/kWh', 'kWh' UNION ALL
  SELECT 'S3C5_WASTE_LANDFILL', 0.79330000, 'kgCO2eq/kg', 'kg' UNION ALL
  SELECT 'S3C5_WASTE_INCIN', 1.21000000, 'kgCO2eq/kg', 'kg' UNION ALL
  SELECT 'S3C7_COMMUTE_DIESEL', 2.74060000, 'kgCO2eq/litre', 'litre'
) v
JOIN ef_categories c ON c.category_code = v.cat;

-- Stationary: LPG + ก๊าซธรรมชาติ (MJ)
INSERT INTO emission_factors (
  source_id, category_id, gas_id, activity_name_th, activity_name_en,
  co2_type, ef_value, ef_unit, ef_unit_numerator, ef_unit_denominator,
  region, is_default, effective_from, notes
)
SELECT @src_tgo, c.category_id, g.gas_id, c.name_th, c.name_en,
       g.co2_type, g.ef_val, g.ef_unit, g.num, g.den,
       'Thailand', 1, '2026-01-01', 'TGO อบก. ก.พ. 2569'
FROM ef_categories c
JOIN (
  SELECT 'FUEL_LPG_LITRE' AS cat, @g_co2 AS gas_id, 'fossil' AS co2_type, 1.67970000 AS ef_val, 'kgCO2/litre' AS ef_unit, 'kgCO2' AS num, 'litre' AS den UNION ALL
  SELECT 'FUEL_LPG_LITRE', @g_ch4f, NULL, 0.00002660, 'kgCH4/litre', 'kgCH4', 'litre' UNION ALL
  SELECT 'FUEL_LPG_LITRE', @g_n2o, NULL, 0.00000266, 'kgN2O/litre', 'kgN2O', 'litre' UNION ALL
  SELECT 'FUEL_NATGAS_NCV_MJ', @g_co2, 'fossil', 0.05610000, 'kgCO2/MJ', 'kgCO2', 'MJ' UNION ALL
  SELECT 'FUEL_NATGAS_NCV_MJ', @g_ch4f, NULL, 0.00000100, 'kgCH4/MJ', 'kgCH4', 'MJ' UNION ALL
  SELECT 'FUEL_NATGAS_NCV_MJ', @g_n2o, NULL, 0.00000010, 'kgN2O/MJ', 'kgN2O', 'MJ'
) g ON g.cat = c.category_code;
