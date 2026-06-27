-- =============================================================================
-- EF ↔ Frontend bridge — ใช้หลัง import ข้อมูลตาม ef-database-update-plan.md
-- ฐานข้อมูล: control_z_v2
--
-- เป้าหมาย: ไม่แก้ flow / option_key ใน DataInputPage.tsx
-- Backend resolve EF ผ่าน ef_ui_options + scope3_ef_catalog
-- =============================================================================

USE control_z_v2;

-- -----------------------------------------------------------------------------
-- 1) คอลัมน์ที่แผน EF ระบุไว้แล้ว (รันครั้งเดียว — ข้ามถ้ามีแล้ว)
-- -----------------------------------------------------------------------------
ALTER TABLE emission_factors
  ADD COLUMN co2_type ENUM('fossil','biogenic') NULL
    COMMENT 'NULL=ไม่ใช่ CO2 fossil/biogenic สำหรับแยกรายงาน'
    AFTER activity_subtype;

ALTER TABLE emission_factors
  ADD COLUMN ef_purpose ENUM('direct','scope3_upstream','cfo_scope2','scope3_elec','cfp') NULL
    COMMENT 'ใช้เลือกชุด EF ไฟฟ้า/upstream'
    AFTER co2_type;

-- -----------------------------------------------------------------------------
-- 2) ผูก ef_categories กับ 15 หมวด Scope 3 บนฟอร์ม (s3_cat_*)
-- -----------------------------------------------------------------------------
ALTER TABLE ef_categories
  ADD COLUMN scope3_parent_code VARCHAR(80) NULL
    COMMENT 'FK แบบ soft → category.category_code เช่น s3_cat_1_purchased_goods'
    AFTER category_code;

ALTER TABLE ef_categories
  ADD KEY ix_ef_categories_s3_parent (scope3_parent_code);

-- -----------------------------------------------------------------------------
-- 3) Master map: ค่า dropdown Frontend → ef_category_code (+ context)
--    option_key ต้องตรงกับ value ใน DataInputPage.tsx
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ef_ui_options (
  option_id          INT          NOT NULL AUTO_INCREMENT,
  scope_scid         TINYINT      NOT NULL COMMENT '1=Scope1, 2=Scope2, 3=Scope3',
  ui_context         VARCHAR(50)  NOT NULL COMMENT 'stationary_combustion|on_road|off_road|electricity|refrigerant',
  option_key         VARCHAR(80)  NOT NULL COMMENT 'ค่า value ใน form เช่น diesel_gas_oil, r134a',
  label_th           VARCHAR(200) NOT NULL,
  ef_category_code   VARCHAR(80)  NOT NULL COMMENT '→ ef_categories.category_code',
  activity_subtype   VARCHAR(100) NULL COMMENT 'เช่น Agriculture สำหรับ off-road; NULL=ไม่แยก',
  ef_purpose         ENUM('direct','scope3_upstream','cfo_scope2','scope3_elec','cfp') NULL,
  unit_denominator   VARCHAR(20)  NOT NULL COMMENT 'หน่วยกิจกรรมมาตรฐาน: L|m3|t|kg|kWh',
  calc_mode          ENUM(
                       'combustion_multigas',
                       'refrigerant_gwp',
                       'electricity_grid',
                       'scope3_single_ef'
                     ) NOT NULL DEFAULT 'combustion_multigas',
  sort_order         SMALLINT     NOT NULL DEFAULT 0,
  is_active          TINYINT(1)   NOT NULL DEFAULT 1,
  notes              VARCHAR(300) NULL,
  PRIMARY KEY (option_id),
  UNIQUE KEY uq_ef_ui_option (scope_scid, ui_context, option_key, activity_subtype),
  KEY ix_ef_ui_ef_cat (ef_category_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='แมป UI option → EF category (ไม่แก้ Frontend)';

-- -----------------------------------------------------------------------------
-- 4) รายการ EF ย่อย Scope 3 (ใช้ตอนคำนวณ / แสดงผลรายงาน)
--    Frontend หมวด s3_cat_* ยังกรอกอิสระ — backend เลือก line จาก catalog
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS scope3_ef_catalog (
  line_code            VARCHAR(50)  NOT NULL,
  scope3_category_code VARCHAR(80)  NOT NULL COMMENT 's3_cat_1_purchased_goods …',
  label_th             VARCHAR(200) NOT NULL,
  default_unit         VARCHAR(20)  NOT NULL,
  entry_mode_hint      ENUM('baht','quantity','either','distance','fuel') NULL,
  ef_category_code     VARCHAR(80)  NOT NULL,
  activity_name_match  VARCHAR(200) NULL COMMENT 'optional filter → emission_factors.activity_name_th',
  sort_order           SMALLINT     NOT NULL DEFAULT 0,
  is_active            TINYINT(1)   NOT NULL DEFAULT 1,
  PRIMARY KEY (line_code),
  KEY ix_s3_ef_cat_parent (scope3_category_code),
  KEY ix_s3_ef_cat_ef (ef_category_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 5) แปลงหน่วย UI → หน่วย EF
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS unit_aliases (
  ui_unit            VARCHAR(20)  NOT NULL COMMENT 'L|m3|t|kWh|kg|unit|litre',
  ef_unit_denominator VARCHAR(20) NOT NULL COMMENT 'litre|m3|kg|kWh|THB|tkm|km',
  multiplier         DECIMAL(18,8) NOT NULL DEFAULT 1.00000000,
  PRIMARY KEY (ui_unit, ef_unit_denominator)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
-- 6) Seed ตัวอย่าง ef_ui_options (Scope 1–2 ที่ Frontend ใช้อยู่แล้ว)
--    เติมครบหลัง import ef_categories ตาม ef-database-update-plan.md
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
  -- Scope 1 off-road (sector แยกใน form → activity_subtype)
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
  (2, 'refrigerant', 'r143a',      'R-143a','FUGITIVE_R143A', NULL, NULL, 'kg', 'refrigerant_gwp', 66)
ON DUPLICATE KEY UPDATE
  label_th = VALUES(label_th),
  ef_category_code = VALUES(ef_category_code),
  calc_mode = VALUES(calc_mode);

-- -----------------------------------------------------------------------------
-- 7) Seed scope3_ef_catalog (อ้าง ef-database-update-plan ส่วนที่ 11)
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
-- 8) View สำหรับ Backend — resolve EF ต่อ UI option
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
