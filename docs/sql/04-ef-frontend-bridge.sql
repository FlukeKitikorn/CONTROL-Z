-- =============================================================================
-- [04/04] Frontend ↔ EF Bridge — unit aliases, ui_sector_map, ef_ui_options,
--         scope3_ef_catalog, views ef_lookup + ef_resolve_by_ui
-- ต้องรัน 01 → 02 → 03 ก่อน
-- อ้างอิง: docs/ef-database-update-plan.md ส่วนที่ 12
--           Frontend/src/pages/DataInputPage.tsx (option_key constants)
-- =============================================================================

USE control_z_v2;

-- -----------------------------------------------------------------------------
-- 1) แปลงหน่วย UI → หน่วย EF
-- -----------------------------------------------------------------------------
INSERT IGNORE INTO unit_aliases (ui_unit, ef_unit_denominator, multiplier) VALUES
  ('L',     'litre', 1),
  ('litre', 'litre', 1),
  ('m3',    'm3',    1),
  ('t',     'kg',    1000),
  ('kg',    'kg',    1),
  ('kWh',   'kWh',   1),
  ('unit',  'kWh',   1),
  ('baht',  'THB',   1),
  ('THB',   'THB',   1);

-- -----------------------------------------------------------------------------
-- 2) แมป sector ใน form off-road → activity_subtype (ถ้า EF แยกตาม sector)
-- -----------------------------------------------------------------------------
INSERT IGNORE INTO ui_sector_map (ui_sector, ef_activity_subtype) VALUES
  ('agriculture', 'Agriculture'),
  ('forestry',    'Forestry'),
  ('industry',    'Industry'),
  ('household',   'Household');

-- -----------------------------------------------------------------------------
-- 3) ef_ui_options — คีย์ตรงกับ DataInputPage (Scope 1–2)
-- -----------------------------------------------------------------------------
INSERT INTO ef_ui_options
  (scope_scid, ui_context, option_key, label_th, ef_category_code, activity_subtype, ef_purpose, unit_denominator, calc_mode, sort_order)
VALUES
  -- Scope 1 stationary
  (1, 'stationary_combustion', 'fuel_oil_a',       'น้ำมันเตา A',           'FUEL_FUELOIL_A',       NULL, NULL, 'L',  'combustion_multigas', 10),
  (1, 'stationary_combustion', 'fuel_oil_c',       'น้ำมันเตา C',           'FUEL_FUELOIL_C',       NULL, NULL, 'L',  'combustion_multigas', 11),
  (1, 'stationary_combustion', 'diesel_gas_oil',   'ดีเซล',                 'FUEL_DIESEL',          NULL, NULL, 'L',  'combustion_multigas', 12),
  (1, 'stationary_combustion', 'motor_gasoline',   'เบนซิน',                'FUEL_GASOLINE',        NULL, NULL, 'L',  'combustion_multigas', 13),
  (1, 'stationary_combustion', 'jet_kerosene',     'น้ำมันก๊าด Jet',        'FUEL_KEROSENE_JET',    NULL, NULL, 'L',  'combustion_multigas', 14),
  (1, 'stationary_combustion', 'lpg',              'LPG',                   'FUEL_LPG_LITRE',       NULL, NULL, 'L',  'combustion_multigas', 15),
  (1, 'stationary_combustion', 'natural_gas',      'ก๊าซธรรมชาติ',          'FUEL_NATGAS_NCV_MJ',   NULL, NULL, 'm3', 'combustion_multigas', 16),
  (1, 'stationary_combustion', 'lignite',          'ถ่านหินลิกไนต์',        'FUEL_LIGNITE',         NULL, NULL, 't',  'combustion_multigas', 17),
  (1, 'stationary_combustion', 'anthracite',       'ถ่านหินแอนทราไซต์',    'FUEL_ANTHRACITE',      NULL, NULL, 't',  'combustion_multigas', 18),
  (1, 'stationary_combustion', 'sub_bituminous_coal','ถ่านหินซับบิทูมินัส', 'FUEL_COAL_SUBBIT',     NULL, NULL, 't',  'combustion_multigas', 19),
  (1, 'stationary_combustion', 'fuel_wood',        'ไม้ฟืน',                'FUEL_WOOD',            NULL, NULL, 't',  'combustion_multigas', 20),
  (1, 'stationary_combustion', 'bagasse',          'กากอ้อย',               'FUEL_BAGASSE',         NULL, NULL, 't',  'combustion_multigas', 21),
  -- Scope 1 on-road
  (1, 'on_road', 'diesel_gas_oil',                  'ดีเซล On-road',         'MOBILE_ONROAD_DIESEL', NULL, NULL, 'L',  'combustion_multigas', 30),
  (1, 'on_road', 'motor_gasoline_uncontrolled',     'เบนซิน uncontrolled',   'MOBILE_ONROAD_GAS_UNCNTRL', NULL, NULL, 'L', 'combustion_multigas', 31),
  (1, 'on_road', 'motor_gasoline_oxidation_catalyst','เบนซิน oxcat',         'MOBILE_ONROAD_GAS_OXCAT', NULL, NULL, 'L', 'combustion_multigas', 32),
  (1, 'on_road', 'motor_gasoline_low_mileage_light_duty','เบนซิน low mileage','MOBILE_ONROAD_GAS_LOWM', NULL, NULL, 'L', 'combustion_multigas', 33),
  (1, 'on_road', 'lpg',                             'LPG On-road',           'MOBILE_ONROAD_LPG_L',  NULL, NULL, 'L',  'combustion_multigas', 34),
  (1, 'on_road', 'cng',                             'CNG On-road',           'MOBILE_ONROAD_CNG',    NULL, NULL, 'kg', 'combustion_multigas', 35),
  -- Scope 1 off-road (activity_subtype ใน bridge; EF ชุด priority ใช้ NULL = ทุก sector)
  (1, 'off_road', 'diesel', 'ดีเซล off-road (เกษตร)',     'MOBILE_OFFROAD_DIESEL', 'Agriculture', NULL, 'L', 'combustion_multigas', 40),
  (1, 'off_road', 'diesel', 'ดีเซล off-road (ป่าไม้)',    'MOBILE_OFFROAD_DIESEL', 'Forestry',    NULL, 'L', 'combustion_multigas', 41),
  (1, 'off_road', 'diesel', 'ดีเซล off-road (อุตสาหกรรม)','MOBILE_OFFROAD_DIESEL', 'Industry',    NULL, 'L', 'combustion_multigas', 42),
  (1, 'off_road', 'diesel', 'ดีเซล off-road (ครัวเรือน)','MOBILE_OFFROAD_DIESEL', 'Household',   NULL, 'L', 'combustion_multigas', 43),
  -- Scope 2
  (2, 'electricity', 'grid', 'ไฟฟ้าระบบสายส่ง', 'ELEC_GRID_TH_2022_S2', NULL, 'cfo_scope2', 'kWh', 'electricity_grid', 50),
  (2, 'refrigerant', 'r22_hcfc22', 'R-22',  'FUGITIVE_R22',   NULL, NULL, 'kg', 'refrigerant_gwp', 60),
  (2, 'refrigerant', 'r32',        'R-32',  'FUGITIVE_R32',   NULL, NULL, 'kg', 'refrigerant_gwp', 61),
  (2, 'refrigerant', 'r125',       'R-125', 'FUGITIVE_R125',  NULL, NULL, 'kg', 'refrigerant_gwp', 62),
  (2, 'refrigerant', 'r134',       'R-134', 'FUGITIVE_R134',  NULL, NULL, 'kg', 'refrigerant_gwp', 63),
  (2, 'refrigerant', 'r134a',      'R-134a','FUGITIVE_R134A', NULL, NULL, 'kg', 'refrigerant_gwp', 64),
  (2, 'refrigerant', 'r143',       'R-143', 'FUGITIVE_R143',  NULL, NULL, 'kg', 'refrigerant_gwp', 65),
  (2, 'refrigerant', 'r143a',      'R-143a','FUGITIVE_R143A', NULL, NULL, 'kg', 'refrigerant_gwp', 66),
  (2, 'refrigerant', 'r404a',      'R-404A','FUGITIVE_R404A', NULL, NULL, 'kg', 'refrigerant_gwp', 67),
  (2, 'refrigerant', 'r407a',      'R-407A','FUGITIVE_R407A', NULL, NULL, 'kg', 'refrigerant_gwp', 68),
  (2, 'refrigerant', 'r407c',      'R-407C','FUGITIVE_R407C', NULL, NULL, 'kg', 'refrigerant_gwp', 69),
  (2, 'refrigerant', 'r410a',      'R-410A','FUGITIVE_R410A', NULL, NULL, 'kg', 'refrigerant_gwp', 70)
ON DUPLICATE KEY UPDATE
  label_th = VALUES(label_th),
  ef_category_code = VALUES(ef_category_code),
  calc_mode = VALUES(calc_mode);

-- -----------------------------------------------------------------------------
-- 4) scope3_ef_catalog — แมปบรรทัด Scope 3 ในฟอร์ม → ef_category_code
-- -----------------------------------------------------------------------------
INSERT INTO scope3_ef_catalog
  (line_code, scope3_category_code, label_th, default_unit, entry_mode_hint, ef_category_code, activity_name_match, sort_order)
VALUES
  ('S3C1_PAPER',  's3_cat_1_purchased_goods',       'กระดาษ',              'kg',   'quantity', 'S3C1_PAPER',         'กระดาษ', 1),
  ('S3C1_INK',    's3_cat_1_purchased_goods',       'หมึกพิมพ์',           'kg',   'quantity', 'S3C1_INK',           'หมึกพิมพ์', 2),
  ('S3C1_WATER',  's3_cat_1_purchased_goods',       'น้ำประปา',            'm3',   'quantity', 'S3C1_WATER',         'น้ำประปา', 3),
  ('S3C2_BUILDING','s3_cat_2_capital_goods',        'อาคาร / ปรับปรุงอาคาร','THB', 'baht',     'S3C2_BUILDING',      'อาคาร', 1),
  ('S3C2_COMPUTER','s3_cat_2_capital_goods',        'คอมพิวเตอร์',         'THB',  'baht',     'S3C2_COMPUTER',      'คอมพิวเตอร์', 2),
  ('S3C3_DIESEL_UPS','s3_cat_3_fuel_energy_related','ดีเซล upstream',      'kg',   'quantity', 'S3C3_DIESEL_UPS',    'การได้มาของน้ำมันดีเซล', 1),
  ('S3C3_ELEC_UPS', 's3_cat_3_fuel_energy_related', 'ไฟฟ้า upstream',      'kWh',  'quantity', 'S3C3_ELEC_UPS',      'การได้มาของไฟฟ้า', 2),
  ('S3C5_WASTE_LANDFILL','s3_cat_5_waste_operations','ขยะฝังกลบ',           'kg',   'quantity', 'S3C5_WASTE_LANDFILL','ขยะทั่วไป', 1),
  ('S3C5_WASTE_INCIN',   's3_cat_5_waste_operations','ขยะอันตรายเผาทำลาย',  'kg',   'quantity', 'S3C5_WASTE_INCIN',   'ขยะอันตราย', 2),
  ('S3C7_COMMUTE_DIESEL','s3_cat_7_employee_commuting','เดินทางพนักงาน Diesel','litre','fuel', 'S3C7_COMMUTE_DIESEL','รถกระบะ', 1)
ON DUPLICATE KEY UPDATE label_th = VALUES(label_th);

-- -----------------------------------------------------------------------------
-- 5) View: ef_lookup — รายการ EF ทั่วไป (admin / dropdown แหล่งอ้างอิง)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW ef_lookup AS
SELECT
  ef.ef_id,
  es.source_code,
  es.source_name_th  AS source_th,
  es.source_type,
  ec.category_code,
  ec.name_th          AS category_th,
  ec.unit_activity,
  gt.gas_code,
  gt.gas_name,
  ef.activity_name_th,
  ef.activity_subtype,
  ef.co2_type,
  ef.ef_purpose,
  ef.ef_value,
  ef.ef_unit,
  ef.ef_unit_numerator,
  ef.ef_unit_denominator,
  ef.region,
  ef.is_default,
  ef.tier_level,
  ef.effective_from,
  ef.effective_until,
  pc.name_th          AS parent_category_th
FROM emission_factors ef
JOIN ef_sources   es ON es.source_id   = ef.source_id
JOIN ef_categories ec ON ec.category_id = ef.category_id
JOIN gas_types    gt ON gt.gas_id      = ef.gas_id
LEFT JOIN ef_categories pc ON pc.category_id = ec.parent_id
WHERE ef.is_active = 1
  AND es.is_active = 1
  AND (ef.effective_until IS NULL OR ef.effective_until >= CURDATE());

-- -----------------------------------------------------------------------------
-- 6) View: ef_resolve_by_ui — Backend resolve ตาม option_key + ui_context
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW ef_resolve_by_ui AS
SELECT
  u.option_id,
  u.scope_scid,
  u.ui_context,
  u.option_key,
  u.label_th          AS ui_label_th,
  u.ef_category_code,
  u.activity_subtype,
  u.ef_purpose,
  u.unit_denominator  AS ui_unit,
  u.calc_mode,
  ec.category_id,
  ec.name_th          AS category_th,
  ec.scope3_parent_code,
  ef.ef_id,
  ef.gas_id,
  gt.gas_code,
  ef.ef_value,
  ef.ef_unit,
  ef.ef_unit_denominator,
  ef.co2_type,
  ef.ef_purpose       AS ef_row_purpose,
  ef.activity_subtype AS ef_row_subtype,
  ef.activity_name_th,
  ef.is_default,
  ef.effective_from,
  ef.effective_until,
  es.source_code,
  gv.gwp_value,
  gv.ar_period
FROM ef_ui_options u
JOIN ef_categories ec ON ec.category_code = u.ef_category_code
JOIN emission_factors ef ON ef.category_id = ec.category_id
  AND (u.activity_subtype IS NULL OR ef.activity_subtype = u.activity_subtype OR ef.activity_subtype IS NULL)
  AND (u.ef_purpose IS NULL OR ef.ef_purpose = u.ef_purpose OR ef.ef_purpose IS NULL)
JOIN ef_sources es ON es.source_id = ef.source_id
JOIN gas_types gt ON gt.gas_id = ef.gas_id
LEFT JOIN gwp_values gv ON gv.gas_id = ef.gas_id AND gv.ar_period = 'AR5'
WHERE u.is_active = 1
  AND ef.is_active = 1
  AND es.is_active = 1
  AND (ef.effective_until IS NULL OR ef.effective_until >= CURDATE());
