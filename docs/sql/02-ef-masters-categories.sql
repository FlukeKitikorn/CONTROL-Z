-- =============================================================================
-- [02/04] EF Masters + ef_categories (TGO 2569 / IPCC AR5)
-- อ้างอิง: docs/ef-database-update-plan.md ส่วนที่ 1–4
-- ต้องรัน 01-core-schema-seed.sql ก่อน
-- =============================================================================

USE control_z_v2;

-- -----------------------------------------------------------------------------
-- 1. gas_types เพิ่ม (หลัง seed พื้นฐาน CO2, CH4, N2O, SF6, NF3)
-- -----------------------------------------------------------------------------
INSERT INTO gas_types (gas_code, gas_name, is_kyoto) VALUES
  ('CH4_FOSSIL', 'Methane (Fossil source)',    1),
  ('CO2_BIO',    'Carbon dioxide (Biogenic)',  0),
  ('R22',        'HCFC-22',                    1),
  ('R32',        'HFC-32',                     1),
  ('R125',       'HFC-125',                    1),
  ('R134',       'HFC-134',                    1),
  ('R134A',      'HFC-134a',                   1),
  ('R143',       'HFC-143',                    1),
  ('R143A',      'HFC-143a',                   1),
  ('R404A',      'R-404A (HFC mixture)',       1),
  ('R407A',      'R-407A (HFC mixture)',       1),
  ('R407C',      'R-407C (HFC mixture)',       1),
  ('R410A',      'R-410A (HFC mixture)',       1)
ON DUPLICATE KEY UPDATE gas_name = VALUES(gas_name);

-- -----------------------------------------------------------------------------
-- 2. gwp_values เพิ่ม
-- -----------------------------------------------------------------------------
INSERT INTO gwp_values (gas_id, ar_period, gwp_value, source)
SELECT gas_id, 'AR5', v.gwp, v.src FROM (
  SELECT 'CH4_FOSSIL' AS code, 30.0000 AS gwp, 'IPCC AR5 Fossil CH4' AS src UNION ALL
  SELECT 'CO2_BIO',     0.0000, 'IPCC AR5 Biogenic CO2' UNION ALL
  SELECT 'R22',      1760.0000, 'IPCC 2013 AR5' UNION ALL
  SELECT 'R32',       677.0000, 'IPCC 2013 AR5' UNION ALL
  SELECT 'R125',     3170.0000, 'IPCC 2013 AR5' UNION ALL
  SELECT 'R134',     1120.0000, 'IPCC 2013 AR5' UNION ALL
  SELECT 'R134A',    1300.0000, 'IPCC 2013 AR5' UNION ALL
  SELECT 'R143',      328.0000, 'IPCC 2013 AR5' UNION ALL
  SELECT 'R143A',    4800.0000, 'IPCC 2013 AR5' UNION ALL
  SELECT 'R404A',    3942.8000, 'IPCC 2006 Table 7.8' UNION ALL
  SELECT 'R407A',    1923.4000, 'IPCC 2006 Table 7.8' UNION ALL
  SELECT 'R407C',    1624.2100, 'IPCC 2006 Table 7.8' UNION ALL
  SELECT 'R410A',    1923.5000, 'IPCC 2006 Table 7.8'
) v JOIN gas_types g ON g.gas_code = v.code
ON DUPLICATE KEY UPDATE gwp_value = VALUES(gwp_value), source = VALUES(source);

-- -----------------------------------------------------------------------------
-- 3. ef_sources เพิ่ม
-- -----------------------------------------------------------------------------
INSERT INTO ef_sources (source_code, source_name, source_name_th, organization, ar_period, source_type, sort_order) VALUES
  ('TGO_CFP_2565', 'TGO Carbon Footprint Product EF (July 2022)',
   'ค่า EF คาร์บอนฟุตพริ้นท์ผลิตภัณฑ์ — อบก. (ก.ค. 2565)', 'TGO', NULL, 'national', 11),
  ('USEEIO_V1', 'USEEIOv1.1 Matrices — US Environmentally-Extended IO',
   'ฐานข้อมูล USEEIOv1.1', NULL, NULL, 'international', 12),
  ('IPCC_2013_AR5', 'IPCC 2013 Fifth Assessment Report — GWP100',
   'IPCC AR5 2013 — ค่า GWP100', 'IPCC', 'AR5', 'international', 13)
ON DUPLICATE KEY UPDATE source_name = VALUES(source_name);

-- -----------------------------------------------------------------------------
-- 4. ef_categories หมวดย่อย (parent_id อ้าง category_id หลัง seed 01)
--    รันเฉพาะครั้งแรก — ถ้ามีแล้วให้ข้ามหรือลบ child ก่อน re-import
-- -----------------------------------------------------------------------------
INSERT IGNORE INTO ef_categories (parent_id, category_code, name_th, name_en, scope_id, unit_activity, sort_order)
SELECT p.category_id, x.code, x.name_th, x.name_en, x.scope_id, x.unit, x.sort_order
FROM (
  -- 4.1 Stationary (parent SCOPE1_COMBUSTION)
  SELECT 'SCOPE1_COMBUSTION' AS parent_code, 'FUEL_NATGAS_NCV_MJ' AS code, 'ก๊าซธรรมชาติ NCV (MJ)' AS name_th, 'Natural Gas NCV (MJ)' AS name_en, 1 AS scope_id, 'MJ' AS unit, 102 AS sort_order UNION ALL
  SELECT 'SCOPE1_COMBUSTION', 'FUEL_LPG_LITRE', 'LPG (ลิตร)', 'LPG (litre)', 1, 'litre', 105 UNION ALL
  SELECT 'SCOPE1_COMBUSTION', 'FUEL_FUELOIL_A', 'น้ำมันเตา A', 'Fuel Oil A', 1, 'litre', 111 UNION ALL
  SELECT 'SCOPE1_COMBUSTION', 'FUEL_FUELOIL_C', 'น้ำมันเตา C', 'Fuel Oil C', 1, 'litre', 112 UNION ALL
  SELECT 'SCOPE1_COMBUSTION', 'FUEL_KEROSENE_JET', 'น้ำมันก๊าด Jet', 'Jet Kerosene', 1, 'litre', 113 UNION ALL
  SELECT 'SCOPE1_COMBUSTION', 'FUEL_DIESEL', 'น้ำมันดีเซล', 'Diesel', 1, 'litre', 117 UNION ALL
  SELECT 'SCOPE1_COMBUSTION', 'FUEL_GASOLINE', 'น้ำมันเบนซิน', 'Gasoline', 1, 'litre', 118 UNION ALL
  SELECT 'SCOPE1_COMBUSTION', 'FUEL_LIGNITE', 'ถ่านหินลิกไนต์', 'Lignite', 1, 'kg', 127 UNION ALL
  SELECT 'SCOPE1_COMBUSTION', 'FUEL_ANTHRACITE', 'ถ่านหินแอนทราไซต์', 'Anthracite', 1, 'kg', 128 UNION ALL
  SELECT 'SCOPE1_COMBUSTION', 'FUEL_COAL_SUBBIT', 'ถ่านหิน Sub-bituminous', 'Sub-bituminous Coal', 1, 'kg', 131 UNION ALL
  SELECT 'SCOPE1_COMBUSTION', 'FUEL_WOOD', 'ฟืน (CH4+N2O)', 'Fuel wood Scope1', 1, 'kg', 132 UNION ALL
  SELECT 'SCOPE1_COMBUSTION', 'FUEL_BAGASSE', 'กากอ้อย (CH4+N2O)', 'Bagasse Scope1', 1, 'kg', 140 UNION ALL
  -- 4.2 On-road
  SELECT 'SCOPE1_MOBILE', 'MOBILE_ONROAD_CNG', 'CNG บนถนน', 'On-road CNG', 1, 'kg', 201 UNION ALL
  SELECT 'SCOPE1_MOBILE', 'MOBILE_ONROAD_LPG_L', 'LPG บนถนน (ลิตร)', 'On-road LPG litre', 1, 'litre', 202 UNION ALL
  SELECT 'SCOPE1_MOBILE', 'MOBILE_ONROAD_DIESEL', 'ดีเซลบนถนน', 'On-road Diesel', 1, 'litre', 204 UNION ALL
  SELECT 'SCOPE1_MOBILE', 'MOBILE_ONROAD_GAS_UNCNTRL', 'เบนซิน uncontrolled', 'Gasoline uncontrolled', 1, 'litre', 205 UNION ALL
  SELECT 'SCOPE1_MOBILE', 'MOBILE_ONROAD_GAS_OXCAT', 'เบนซิน oxcat', 'Gasoline oxcat', 1, 'litre', 206 UNION ALL
  SELECT 'SCOPE1_MOBILE', 'MOBILE_ONROAD_GAS_LOWM', 'เบนซิน low mileage', 'Gasoline low mileage', 1, 'litre', 207 UNION ALL
  -- 4.3 Off-road
  SELECT 'SCOPE1_MOBILE', 'MOBILE_OFFROAD_DIESEL', 'ดีเซลนอกถนน', 'Off-road Diesel', 1, 'litre', 302 UNION ALL
  SELECT 'SCOPE1_MOBILE', 'MOBILE_OFFROAD_GAS4ST', 'เบนซิน 4-stroke นอกถนน', 'Off-road Gas 4-stroke', 1, 'litre', 306 UNION ALL
  -- 4.4 Fugitive
  SELECT 'SCOPE1_FUGITIVE', 'FUGITIVE_R22', 'R-22', 'Refrigerant R-22', 1, 'kg', 401 UNION ALL
  SELECT 'SCOPE1_FUGITIVE', 'FUGITIVE_R32', 'R-32', 'Refrigerant R-32', 1, 'kg', 402 UNION ALL
  SELECT 'SCOPE1_FUGITIVE', 'FUGITIVE_R125', 'R-125', 'Refrigerant R-125', 1, 'kg', 403 UNION ALL
  SELECT 'SCOPE1_FUGITIVE', 'FUGITIVE_R134', 'R-134', 'Refrigerant R-134', 1, 'kg', 404 UNION ALL
  SELECT 'SCOPE1_FUGITIVE', 'FUGITIVE_R134A', 'R-134a', 'Refrigerant R-134a', 1, 'kg', 405 UNION ALL
  SELECT 'SCOPE1_FUGITIVE', 'FUGITIVE_R143', 'R-143', 'Refrigerant R-143', 1, 'kg', 406 UNION ALL
  SELECT 'SCOPE1_FUGITIVE', 'FUGITIVE_R143A', 'R-143a', 'Refrigerant R-143a', 1, 'kg', 407 UNION ALL
  SELECT 'SCOPE1_FUGITIVE', 'FUGITIVE_R404A', 'R-404A', 'Refrigerant R-404A', 1, 'kg', 408 UNION ALL
  SELECT 'SCOPE1_FUGITIVE', 'FUGITIVE_R407A', 'R-407A', 'Refrigerant R-407A', 1, 'kg', 409 UNION ALL
  SELECT 'SCOPE1_FUGITIVE', 'FUGITIVE_R407C', 'R-407C', 'Refrigerant R-407C', 1, 'kg', 410 UNION ALL
  SELECT 'SCOPE1_FUGITIVE', 'FUGITIVE_R410A', 'R-410A', 'Refrigerant R-410A', 1, 'kg', 411 UNION ALL
  -- 4.5 Electricity
  SELECT 'SCOPE2_ELECTRICITY', 'ELEC_GRID_TH_2016_S2', 'ไฟฟ้า 2016-18 Scope2', 'Grid 2016-18 CFO S2', 2, 'kWh', 501 UNION ALL
  SELECT 'SCOPE2_ELECTRICITY', 'ELEC_GRID_TH_2022_S2', 'ไฟฟ้า 2022-24 Scope2', 'Grid 2022-24 CFO S2', 2, 'kWh', 504 UNION ALL
  SELECT 'SCOPE2_ELECTRICITY', 'ELEC_GRID_TH_2022_S3', 'ไฟฟ้า 2022-24 Scope3 upstream', 'Grid 2022-24 S3', 2, 'kWh', 505 UNION ALL
  -- 4.6 Scope 3 (parent SCOPE3_UPSTREAM = 7, DOWNSTREAM = 8)
  SELECT 'SCOPE3_UPSTREAM', 'S3C1_PAPER', 'กระดาษ', 'Paper', 3, 'kg', 601 UNION ALL
  SELECT 'SCOPE3_UPSTREAM', 'S3C1_INK', 'หมึกพิมพ์', 'Ink', 3, 'kg', 602 UNION ALL
  SELECT 'SCOPE3_UPSTREAM', 'S3C1_WATER', 'น้ำประปา', 'Tap water', 3, 'm3', 603 UNION ALL
  SELECT 'SCOPE3_UPSTREAM', 'S3C2_BUILDING', 'อาคาร', 'Building', 3, 'THB', 611 UNION ALL
  SELECT 'SCOPE3_UPSTREAM', 'S3C2_COMPUTER', 'คอมพิวเตอร์', 'Computers', 3, 'THB', 613 UNION ALL
  SELECT 'SCOPE3_UPSTREAM', 'S3C3_DIESEL_UPS', 'ดีเซล upstream', 'Diesel upstream', 3, 'kg', 621 UNION ALL
  SELECT 'SCOPE3_UPSTREAM', 'S3C3_ELEC_UPS', 'ไฟฟ้า upstream', 'Electricity upstream', 3, 'kWh', 623 UNION ALL
  SELECT 'SCOPE3_UPSTREAM', 'S3C5_WASTE_LANDFILL', 'ขยะฝังกลบ', 'Waste landfill', 3, 'kg', 631 UNION ALL
  SELECT 'SCOPE3_UPSTREAM', 'S3C5_WASTE_INCIN', 'ขยะอันตรายเผาทำลาย', 'Hazardous waste incineration', 3, 'kg', 632 UNION ALL
  SELECT 'SCOPE3_DOWNSTREAM', 'S3C7_COMMUTE_DIESEL', 'เดินทาง Diesel', 'Commute Diesel', 3, 'litre', 641
) x
JOIN ef_categories p ON p.category_code = x.parent_code;

-- ผูก Scope 3 EF categories → หมวดฟอร์ม (s3_cat_*)
UPDATE ef_categories SET scope3_parent_code = 's3_cat_1_purchased_goods'
  WHERE category_code IN ('S3C1_PAPER','S3C1_INK','S3C1_WATER');
UPDATE ef_categories SET scope3_parent_code = 's3_cat_2_capital_goods'
  WHERE category_code LIKE 'S3C2_%';
UPDATE ef_categories SET scope3_parent_code = 's3_cat_3_fuel_energy_related'
  WHERE category_code LIKE 'S3C3_%';
UPDATE ef_categories SET scope3_parent_code = 's3_cat_5_waste_operations'
  WHERE category_code LIKE 'S3C5_%';
UPDATE ef_categories SET scope3_parent_code = 's3_cat_7_employee_commuting'
  WHERE category_code LIKE 'S3C7_%';
