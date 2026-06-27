-- =============================================================================
-- [03b/04] Emission Factors — ขยาย stationary + on-road multigas + off-road ตาม sector
-- อ้างอิง: docs/ef-database-update-plan.md ส่วน 6.1, 7, 8
-- รันหลัง 03 (ไม่ต้อง re-run 01–02)
-- =============================================================================

USE control_z_v2;

SET @src_tgo := (SELECT source_id FROM ef_sources WHERE source_code = 'TGO_AR5');
SET @g_co2   := (SELECT gas_id FROM gas_types WHERE gas_code = 'CO2');
SET @g_ch4f  := (SELECT gas_id FROM gas_types WHERE gas_code = 'CH4_FOSSIL');
SET @g_n2o   := (SELECT gas_id FROM gas_types WHERE gas_code = 'N2O');

-- ลบแถว CO2-only ของ on-road gasoline (03 ใส่ไม่ครบ) แล้วใส่ชุดเต็ม
DELETE ef FROM emission_factors ef
JOIN ef_categories ec ON ec.category_id = ef.category_id
WHERE ec.category_code IN ('MOBILE_ONROAD_GAS_UNCNTRL','MOBILE_ONROAD_GAS_OXCAT','MOBILE_ONROAD_GAS_LOWM');

-- On-road gasoline ครบ 3 gas
INSERT INTO emission_factors (
  source_id, category_id, gas_id, activity_name_th, co2_type, ef_value, ef_unit,
  ef_unit_numerator, ef_unit_denominator, region, is_default, effective_from
)
SELECT @src_tgo, c.category_id, g.gas_id, c.name_th, g.co2_type, g.ef_val, g.ef_unit, g.num, 'litre', 'Thailand', 1, '2026-01-01'
FROM ef_categories c
JOIN (
  SELECT 'MOBILE_ONROAD_GAS_UNCNTRL' AS cat, @g_co2 AS gas_id, 'fossil' AS co2_type, 2.18160000 AS ef_val, 'kgCO2/litre' AS ef_unit, 'kgCO2' AS num UNION ALL
  SELECT 'MOBILE_ONROAD_GAS_UNCNTRL', @g_ch4f, NULL, 0.00104000, 'kgCH4/litre', 'kgCH4' UNION ALL
  SELECT 'MOBILE_ONROAD_GAS_UNCNTRL', @g_n2o, NULL, 0.00010100, 'kgN2O/litre', 'kgN2O' UNION ALL
  SELECT 'MOBILE_ONROAD_GAS_OXCAT', @g_co2, 'fossil', 2.18160000, 'kgCO2/litre', 'kgCO2' UNION ALL
  SELECT 'MOBILE_ONROAD_GAS_OXCAT', @g_ch4f, NULL, 0.00078700, 'kgCH4/litre', 'kgCH4' UNION ALL
  SELECT 'MOBILE_ONROAD_GAS_OXCAT', @g_n2o, NULL, 0.00025200, 'kgN2O/litre', 'kgN2O' UNION ALL
  SELECT 'MOBILE_ONROAD_GAS_LOWM', @g_co2, 'fossil', 2.18160000, 'kgCO2/litre', 'kgCO2' UNION ALL
  SELECT 'MOBILE_ONROAD_GAS_LOWM', @g_ch4f, NULL, 0.00012000, 'kgCH4/litre', 'kgCH4' UNION ALL
  SELECT 'MOBILE_ONROAD_GAS_LOWM', @g_n2o, NULL, 0.00017900, 'kgN2O/litre', 'kgN2O'
) g ON g.cat = c.category_code;

-- On-road LPG (litre) + CNG (kg)
DELETE ef FROM emission_factors ef
JOIN ef_categories ec ON ec.category_id = ef.category_id
WHERE ec.category_code IN ('MOBILE_ONROAD_LPG_L', 'MOBILE_ONROAD_CNG');

INSERT INTO emission_factors (
  source_id, category_id, gas_id, activity_name_th, co2_type, ef_value, ef_unit,
  ef_unit_numerator, ef_unit_denominator, region, is_default, effective_from
)
SELECT @src_tgo, c.category_id, g.gas_id, c.name_th, g.co2_type, g.ef_val, g.ef_unit, g.num, g.den, 'Thailand', 1, '2026-01-01'
FROM ef_categories c
JOIN (
  SELECT 'MOBILE_ONROAD_LPG_L' AS cat, @g_co2 AS gas_id, 'fossil' AS co2_type, 1.67970000 AS ef_val, 'kgCO2/litre' AS ef_unit, 'kgCO2' AS num, 'litre' AS den UNION ALL
  SELECT 'MOBILE_ONROAD_LPG_L', @g_ch4f, NULL, 0.00165000, 'kgCH4/litre', 'kgCH4', 'litre' UNION ALL
  SELECT 'MOBILE_ONROAD_LPG_L', @g_n2o, NULL, 0.00000532, 'kgN2O/litre', 'kgN2O', 'litre' UNION ALL
  SELECT 'MOBILE_ONROAD_CNG', @g_co2, 'fossil', 2.12620000, 'kgCO2/kg', 'kgCO2', 'kg' UNION ALL
  SELECT 'MOBILE_ONROAD_CNG', @g_ch4f, NULL, 0.00349000, 'kgCH4/kg', 'kgCH4', 'kg' UNION ALL
  SELECT 'MOBILE_ONROAD_CNG', @g_n2o, NULL, 0.00011400, 'kgN2O/kg', 'kgN2O', 'kg'
) g ON g.cat = c.category_code;

-- Stationary: น้ำมันเตา, ก๊าด, ถ่านหิน
DELETE ef FROM emission_factors ef
JOIN ef_categories ec ON ec.category_id = ef.category_id
WHERE ec.category_code IN (
  'FUEL_FUELOIL_A','FUEL_FUELOIL_C','FUEL_KEROSENE_JET',
  'FUEL_LIGNITE','FUEL_ANTHRACITE','FUEL_COAL_SUBBIT'
);

INSERT INTO emission_factors (
  source_id, category_id, gas_id, activity_name_th, activity_name_en,
  co2_type, ef_value, ef_unit, ef_unit_numerator, ef_unit_denominator,
  region, is_default, effective_from
)
SELECT @src_tgo, c.category_id, g.gas_id, c.name_th, c.name_en,
       g.co2_type, g.ef_val, g.ef_unit, g.num, g.den,
       'Thailand', 1, '2026-01-01'
FROM ef_categories c
JOIN (
  SELECT 'FUEL_FUELOIL_A' AS cat, @g_co2 AS gas_id, 'fossil' AS co2_type, 3.20970000 AS ef_val, 'kgCO2/litre' AS ef_unit, 'kgCO2' AS num, 'litre' AS den UNION ALL
  SELECT 'FUEL_FUELOIL_A', @g_ch4f, NULL, 0.00012400, 'kgCH4/litre', 'kgCH4', 'litre' UNION ALL
  SELECT 'FUEL_FUELOIL_A', @g_n2o, NULL, 0.00002490, 'kgN2O/litre', 'kgN2O', 'litre' UNION ALL
  SELECT 'FUEL_FUELOIL_C', @g_co2, 'fossil', 3.23530000, 'kgCO2/litre', 'kgCO2', 'litre' UNION ALL
  SELECT 'FUEL_FUELOIL_C', @g_ch4f, NULL, 0.00012500, 'kgCH4/litre', 'kgCH4', 'litre' UNION ALL
  SELECT 'FUEL_FUELOIL_C', @g_n2o, NULL, 0.00002510, 'kgN2O/litre', 'kgN2O', 'litre' UNION ALL
  SELECT 'FUEL_KEROSENE_JET', @g_co2, 'fossil', 2.46890000, 'kgCO2/litre', 'kgCO2', 'litre' UNION ALL
  SELECT 'FUEL_KEROSENE_JET', @g_ch4f, NULL, 0.00010400, 'kgCH4/litre', 'kgCH4', 'litre' UNION ALL
  SELECT 'FUEL_KEROSENE_JET', @g_n2o, NULL, 0.00002070, 'kgN2O/litre', 'kgN2O', 'litre' UNION ALL
  SELECT 'FUEL_LIGNITE', @g_co2, 'fossil', 1.20190000, 'kgCO2/kg', 'kgCO2', 'kg' UNION ALL
  SELECT 'FUEL_LIGNITE', @g_ch4f, NULL, 0.00010500, 'kgCH4/kg', 'kgCH4', 'kg' UNION ALL
  SELECT 'FUEL_LIGNITE', @g_n2o, NULL, 0.00001570, 'kgN2O/kg', 'kgN2O', 'kg' UNION ALL
  SELECT 'FUEL_ANTHRACITE', @g_co2, 'fossil', 3.08660000, 'kgCO2/kg', 'kgCO2', 'kg' UNION ALL
  SELECT 'FUEL_ANTHRACITE', @g_ch4f, NULL, 0.00031400, 'kgCH4/kg', 'kgCH4', 'kg' UNION ALL
  SELECT 'FUEL_ANTHRACITE', @g_n2o, NULL, 0.00004710, 'kgN2O/kg', 'kgN2O', 'kg' UNION ALL
  SELECT 'FUEL_COAL_SUBBIT', @g_co2, 'fossil', 2.53000000, 'kgCO2/kg', 'kgCO2', 'kg' UNION ALL
  SELECT 'FUEL_COAL_SUBBIT', @g_ch4f, NULL, 0.00002640, 'kgCH4/kg', 'kgCH4', 'kg' UNION ALL
  SELECT 'FUEL_COAL_SUBBIT', @g_n2o, NULL, 0.00003960, 'kgN2O/kg', 'kgN2O', 'kg'
) g ON g.cat = c.category_code;

-- Off-road diesel แยก sector (แทน NULL ใน 03)
DELETE ef FROM emission_factors ef
JOIN ef_categories ec ON ec.category_id = ef.category_id
WHERE ec.category_code = 'MOBILE_OFFROAD_DIESEL';

INSERT INTO emission_factors (
  source_id, category_id, gas_id, activity_name_th, activity_subtype, co2_type,
  ef_value, ef_unit, ef_unit_numerator, ef_unit_denominator, region, is_default, effective_from
)
SELECT @src_tgo, c.category_id, g.gas_id,
       CONCAT('ดีเซลนอกถนน (', s.sector, ')'), s.sector, g.co2_type,
       g.ef_val, g.ef_unit, g.num, 'litre', 'Thailand', 1, '2026-01-01'
FROM ef_categories c
CROSS JOIN (
  SELECT 'Agriculture' AS sector UNION ALL SELECT 'Forestry' UNION ALL SELECT 'Industry' UNION ALL SELECT 'Household'
) s
JOIN (
  SELECT @g_co2 AS gas_id, 'fossil' AS co2_type, 2.69870000 AS ef_val, 'kgCO2/litre' AS ef_unit, 'kgCO2' AS num UNION ALL
  SELECT @g_ch4f, NULL, 0.00015100, 'kgCH4/litre', 'kgCH4' UNION ALL
  SELECT @g_n2o, NULL, 0.00104000, 'kgN2O/litre', 'kgN2O'
) g ON c.category_code = 'MOBILE_OFFROAD_DIESEL';

-- Off-road gasoline 4-stroke (frontend: gasoline_4_stroke)
DELETE ef FROM emission_factors ef
JOIN ef_categories ec ON ec.category_id = ef.category_id
WHERE ec.category_code = 'MOBILE_OFFROAD_GAS4ST';

INSERT INTO emission_factors (
  source_id, category_id, gas_id, activity_name_th, co2_type, ef_value, ef_unit,
  ef_unit_numerator, ef_unit_denominator, region, is_default, effective_from
)
SELECT @src_tgo, c.category_id, g.gas_id, c.name_th, g.co2_type, g.ef_val, g.ef_unit, g.num, 'litre', 'Thailand', 1, '2026-01-01'
FROM ef_categories c
JOIN (
  SELECT @g_co2 AS gas_id, 'fossil' AS co2_type, 2.18160000 AS ef_val, 'kgCO2/litre' AS ef_unit, 'kgCO2' AS num UNION ALL
  SELECT @g_ch4f, NULL, 0.00012000, 'kgCH4/litre', 'kgCH4' UNION ALL
  SELECT @g_n2o, NULL, 0.00017900, 'kgN2O/litre', 'kgN2O'
) g ON c.category_code = 'MOBILE_OFFROAD_GAS4ST';
