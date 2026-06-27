-- =============================================================================
-- [04c] Bridge เต็ม — ใช้หลัง 03c (EF full)
--  - unit aliases เพิ่ม (Scope 3)
--  - off-road gasoline แยก sector (เหมือน diesel)
--  - scope3_ef_catalog ครบตาม EF ชุดเต็ม
-- รันหลัง 04 (+ 04b ถ้ามี) บน DB ที่มี 03c แล้ว
-- =============================================================================

USE control_z_v2;

INSERT IGNORE INTO unit_aliases (ui_unit, ef_unit_denominator, multiplier) VALUES
  ('tkm',  'tkm',  1),
  ('km',   'km',   1),
  ('ton',  'ton',  1),
  ('litre','litre',1),
  ('L',    'litre',1);

-- CNG on-road: Frontend m3 → EF kg (ชั่วคราว)
INSERT IGNORE INTO unit_aliases (ui_unit, ef_unit_denominator, multiplier) VALUES
  ('m3', 'kg', 0.72000000);

-- ลบ off-road gasoline แบบ subtype NULL (จาก 04b) แล้วใส่แยก sector
DELETE FROM ef_ui_options
WHERE scope_scid = 1
  AND ui_context = 'off_road'
  AND option_key IN ('gasoline_4_stroke', 'gasoline_2_stroke')
  AND activity_subtype IS NULL;

INSERT INTO ef_ui_options
  (scope_scid, ui_context, option_key, label_th, ef_category_code, activity_subtype, ef_purpose, unit_denominator, calc_mode, sort_order)
VALUES
  (1, 'off_road', 'gasoline_4_stroke', 'เบนซิน 4 จังหวะ (เกษตร)',     'MOBILE_OFFROAD_GAS4ST', 'Agriculture', NULL, 'L', 'combustion_multigas', 44),
  (1, 'off_road', 'gasoline_4_stroke', 'เบนซิน 4 จังหวะ (ป่าไม้)',    'MOBILE_OFFROAD_GAS4ST', 'Forestry',    NULL, 'L', 'combustion_multigas', 45),
  (1, 'off_road', 'gasoline_4_stroke', 'เบนซิน 4 จังหวะ (อุตสาหกรรม)','MOBILE_OFFROAD_GAS4ST', 'Industry',    NULL, 'L', 'combustion_multigas', 46),
  (1, 'off_road', 'gasoline_4_stroke', 'เบนซิน 4 จังหวะ (ครัวเรือน)', 'MOBILE_OFFROAD_GAS4ST', 'Household',   NULL, 'L', 'combustion_multigas', 47),
  (1, 'off_road', 'gasoline_2_stroke', 'เบนซิน 2 จังหวะ (เกษตร)',     'MOBILE_OFFROAD_GAS2ST', 'Agriculture', NULL, 'L', 'combustion_multigas', 48),
  (1, 'off_road', 'gasoline_2_stroke', 'เบนซิน 2 จังหวะ (ป่าไม้)',    'MOBILE_OFFROAD_GAS2ST', 'Forestry',    NULL, 'L', 'combustion_multigas', 49),
  (1, 'off_road', 'gasoline_2_stroke', 'เบนซิน 2 จังหวะ (อุตสาหกรรม)','MOBILE_OFFROAD_GAS2ST', 'Industry',    NULL, 'L', 'combustion_multigas', 50),
  (1, 'off_road', 'gasoline_2_stroke', 'เบนซิน 2 จังหวะ (ครัวเรือน)', 'MOBILE_OFFROAD_GAS2ST', 'Household',   NULL, 'L', 'combustion_multigas', 51)
ON DUPLICATE KEY UPDATE
  label_th = VALUES(label_th),
  ef_category_code = VALUES(ef_category_code),
  activity_subtype = VALUES(activity_subtype);

-- scope3_ef_catalog — ขยายให้ครบ EF ชุดเต็ม
INSERT INTO scope3_ef_catalog
  (line_code, scope3_category_code, label_th, default_unit, entry_mode_hint, ef_category_code, activity_name_match, sort_order)
VALUES
  ('S3C2_OFFICE_EQUIP', 's3_cat_2_capital_goods',        'อุปกรณ์สำนักงาน',           'THB', 'baht',     'S3C2_OFFICE_EQUIP',  'อุปกรณ์สำนักงาน', 3),
  ('S3C2_SOFTWARE',     's3_cat_2_capital_goods',        'ซอฟต์แวร์',                  'THB', 'baht',     'S3C2_SOFTWARE',      'โปรแกรมคอมพิวเตอร์', 4),
  ('S3C2_VEHICLE_CAP',  's3_cat_2_capital_goods',        'ยานพาหนะ (สินทรัพย์ทุน)',    'THB', 'baht',     'S3C2_VEHICLE_CAP',   'ยานพาหนะ', 5),
  ('S3C3_GASOLINE_UPS', 's3_cat_3_fuel_energy_related',  'เบนซิน upstream',            'kg',  'quantity', 'S3C3_GASOLINE_UPS',  'การได้มาของน้ำมันเบนซิน', 3),
  ('S3C3_LPG_UPS',      's3_cat_3_fuel_energy_related',  'LPG upstream',               'kg',  'quantity', 'S3C3_LPG_UPS',       'การได้มาของ LPG', 4),
  ('S3C3_ETHANOL_UPS',  's3_cat_3_fuel_energy_related',  'เอทานอล upstream',          'kg',  'quantity', 'S3C3_ETHANOL_UPS',   'เอทานอล', 5),
  ('S3C5_SLUDGE',       's3_cat_5_waste_operations',     'กากตะกอน',                   'ton', 'quantity', 'S3C5_SLUDGE',        'กากตะกอน', 3),
  ('S3C5_TRANSPORT_TKM','s3_cat_5_waste_operations',     'ขนส่งของเสีย (tkm)',         'tkm', 'quantity', 'S3C5_TRANSPORT_TKM', 'รถบรรทุกขยะ', 4),
  ('S3C5_TRANSPORT_KM', 's3_cat_5_waste_operations',     'ขนส่งของเสีย (km)',          'km',  'quantity', 'S3C5_TRANSPORT_KM','รถบรรทุกขยะ', 5),
  ('S3C5_EXCAVATOR',    's3_cat_5_waste_operations',     'รถแบคโฮ/รถขุด',              'litre','fuel',   'S3C5_EXCAVATOR',     'รถแบคโฮ', 6),
  ('S3C7_COMMUTE_GAS',  's3_cat_7_employee_commuting',   'เดินทาง Gasoline',           'litre','fuel',    'S3C7_COMMUTE_GAS',   'Gasoline', 2),
  ('S3C7_COMMUTE_LPG',  's3_cat_7_employee_commuting',   'เดินทาง LPG',                'kg',  'fuel',     'S3C7_COMMUTE_LPG',   'LPG', 3),
  ('S3C7_COMMUTE_EV',   's3_cat_7_employee_commuting',   'เดินทาง EV',                 'kWh', 'quantity','S3C7_COMMUTE_EV',    'ไฟฟ้า', 4),
  ('S3C7_COMMUTE_CNG',  's3_cat_7_employee_commuting',   'เดินทาง CNG',                'kg',  'fuel',     'S3C7_COMMUTE_CNG',   'CNG', 5)
ON DUPLICATE KEY UPDATE
  label_th = VALUES(label_th),
  ef_category_code = VALUES(ef_category_code),
  default_unit = VALUES(default_unit);
