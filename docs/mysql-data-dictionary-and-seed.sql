-- =============================================================================
-- CONTROL-Z: Emission Factor (EF) Tables — เพิ่มเข้า schema v2.0
-- วิเคราะห์จาก ef_database.htm (Excel: sheet Fr-01…Fr-05, EF TGO AR5)
-- และ flags ใน fr04_1_detail: tgo_ef, th_lci_db, int_db, supplier, self_collect
--
-- แนวคิดหลัก:
--   1. ef_sources      — master แหล่งที่มา (TGO, IPCC, ThaiLCI, …)
--   2. ef_categories   — หมวดกิจกรรม (การเผาไหม้เชื้อเพลิง, ไฟฟ้า, …)
--   3. emission_factors — ค่า EF จริง (1 row ต่อ 1 ประเภทกิจกรรม/ก๊าซ/แหล่ง)
--   4. fr04_ef_selection — บันทึกว่าแต่ละ fr04_1_detail เลือก EF ตัวไหน
-- =============================================================================

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS fr04_ef_selection;
DROP TABLE IF EXISTS emission_factors;
DROP TABLE IF EXISTS ef_categories;
DROP TABLE IF EXISTS ef_sources;

-- =============================================================================
-- SECTION A: EF Master Tables
-- =============================================================================

-- -----------------------------------------------------------------------------
-- ef_sources — แหล่งที่มาของ EF
-- ตรงกับ flags ใน fr04_1_detail เดิม
-- -----------------------------------------------------------------------------
CREATE TABLE ef_sources (
  source_id     INT          NOT NULL AUTO_INCREMENT,
  source_code   VARCHAR(30)  NOT NULL COMMENT 'รหัสสั้น เช่น TGO_AR5, IPCC_AR6, ThaiLCI, INT_DB',
  source_name   VARCHAR(200) NOT NULL COMMENT 'ชื่อเต็ม',
  source_name_th VARCHAR(200) NULL     COMMENT 'ชื่อภาษาไทย',
  organization  VARCHAR(200) NULL     COMMENT 'หน่วยงานที่ออก เช่น TGO, IPCC, TIIS',
  ar_period     VARCHAR(10)  NULL     COMMENT 'AR period ถ้ามี เช่น AR5, AR6',
  version       VARCHAR(50)  NULL     COMMENT 'เวอร์ชัน/ปี เช่น 2023, v2.1',
  publication_year YEAR      NULL,
  reference_url VARCHAR(500) NULL,
  source_type   ENUM('national','international','supplier','self_collect','other')
                NOT NULL DEFAULT 'national',
  is_active     TINYINT(1)   NOT NULL DEFAULT 1,
  sort_order    TINYINT      NOT NULL DEFAULT 0 COMMENT 'ลำดับแสดงใน dropdown',
  created_at    DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (source_id),
  UNIQUE KEY uq_ef_sources_code (source_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='แหล่งที่มาของ Emission Factor';

-- -----------------------------------------------------------------------------
-- ef_categories — หมวดหมู่กิจกรรมที่ก่อให้เกิด GHG
-- ใช้สร้าง hierarchy สำหรับ dropdown เลือก EF ฝั่ง UI
-- -----------------------------------------------------------------------------
CREATE TABLE ef_categories (
  category_id   INT          NOT NULL AUTO_INCREMENT,
  parent_id     INT          NULL     COMMENT 'self-ref สำหรับ hierarchy เช่น Scope1 > การเผาไหม้ > น้ำมัน',
  scope_id      INT          NULL     COMMENT 'FK → scope (1,2,3) ถ้า category ผูกกับ scope เฉพาะ',
  category_code VARCHAR(50)  NOT NULL COMMENT 'รหัส เช่น STATIONARY_COMBUSTION, ELECTRICITY',
  name_th       VARCHAR(200) NOT NULL COMMENT 'ชื่อภาษาไทย',
  name_en       VARCHAR(200) NULL,
  description   VARCHAR(500) NULL,
  unit_activity VARCHAR(50)  NULL     COMMENT 'หน่วยของกิจกรรม เช่น ลิตร, kWh, km',
  sort_order    SMALLINT     NOT NULL DEFAULT 0,
  is_active     TINYINT(1)   NOT NULL DEFAULT 1,
  PRIMARY KEY (category_id),
  UNIQUE KEY uq_ef_categories_code (category_code),
  KEY ix_ef_categories_parent (parent_id),
  KEY ix_ef_categories_scope (scope_id),
  CONSTRAINT fk_ef_categories_parent
    FOREIGN KEY (parent_id) REFERENCES ef_categories (category_id),
  CONSTRAINT fk_ef_categories_scope
    FOREIGN KEY (scope_id) REFERENCES scope (scid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='หมวดหมู่กิจกรรม GHG (hierarchy)';

-- -----------------------------------------------------------------------------
-- emission_factors — ค่า EF จริง (หัวใจหลัก)
-- 1 row = 1 ค่า EF สำหรับ กิจกรรม + ก๊าซ + แหล่งอ้างอิง
-- -----------------------------------------------------------------------------
CREATE TABLE emission_factors (
  ef_id           INT           NOT NULL AUTO_INCREMENT,
  source_id       INT           NOT NULL COMMENT 'FK → ef_sources',
  category_id     INT           NOT NULL COMMENT 'FK → ef_categories',
  gas_id          INT           NOT NULL COMMENT 'FK → gas_types (CO2/CH4/N2O/…)',

  -- ตัวระบุกิจกรรม (ชื่อเชื้อเพลิง/วัตถุดิบ เพื่อใช้ filter)
  activity_name_th VARCHAR(200) NOT NULL COMMENT 'ชื่อกิจกรรม/เชื้อเพลิง ภาษาไทย เช่น น้ำมันดีเซล',
  activity_name_en VARCHAR(200) NULL,
  activity_subtype VARCHAR(100) NULL     COMMENT 'ประเภทย่อย เช่น หน่วยที่เผา / ภูมิภาค',

  -- ค่า EF
  ef_value        DECIMAL(20,8) NOT NULL COMMENT 'ค่า Emission Factor',
  ef_unit         VARCHAR(100)  NOT NULL COMMENT 'หน่วย เช่น kgCO2e/liter, kgCO2/kWh',
  ef_unit_numerator   VARCHAR(50) NOT NULL COMMENT 'หน่วยผล เช่น kgCO2, kgCH4',
  ef_unit_denominator VARCHAR(50) NOT NULL COMMENT 'หน่วยกิจกรรม เช่น liter, kWh, km',

  -- metadata
  heating_value   DECIMAL(18,6) NULL     COMMENT 'ค่าความร้อน (ถ้ามี) สำหรับเชื้อเพลิง',
  heating_unit    VARCHAR(50)   NULL,
  region          VARCHAR(100)  NULL     COMMENT 'ภูมิภาค/ประเทศ ถ้า EF แตกต่างตามพื้นที่',
  tier_level      TINYINT       NULL     COMMENT 'IPCC Tier 1/2/3',
  is_default      TINYINT(1)    NOT NULL DEFAULT 0 COMMENT '1 = ค่า default ของหมวดนี้',
  is_active       TINYINT(1)    NOT NULL DEFAULT 1,
  effective_from  DATE          NULL,
  effective_until DATE          NULL     COMMENT 'NULL = ยังใช้อยู่',
  notes           VARCHAR(500)  NULL     COMMENT 'หมายเหตุ/ข้อจำกัด',
  created_at      DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at      DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
                                ON UPDATE CURRENT_TIMESTAMP(6),

  PRIMARY KEY (ef_id),
  -- unique: กิจกรรม + ก๊าซ + แหล่ง ต้องไม่ซ้ำ (ป้องกัน duplicate)
  UNIQUE KEY uq_ef_source_cat_gas_activity (source_id, category_id, gas_id, activity_name_th, region),
  KEY ix_ef_source_id (source_id),
  KEY ix_ef_category_id (category_id),
  KEY ix_ef_gas_id (gas_id),
  KEY ix_ef_active_default (is_active, is_default),
  CONSTRAINT fk_ef_source
    FOREIGN KEY (source_id) REFERENCES ef_sources (source_id),
  CONSTRAINT fk_ef_category
    FOREIGN KEY (category_id) REFERENCES ef_categories (category_id),
  CONSTRAINT fk_ef_gas
    FOREIGN KEY (gas_id) REFERENCES gas_types (gas_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='ค่า Emission Factor (master)';

-- =============================================================================
-- SECTION B: เชื่อมกับ fr04_1_detail
-- =============================================================================

-- -----------------------------------------------------------------------------
-- fr04_ef_selection — บันทึกว่าแต่ละแถว fr04 ใช้ EF ตัวไหน
-- แทนที่ flags เดิม: tgo_ef, th_lci_db, int_db, supplier, self_collect, ...
-- -----------------------------------------------------------------------------
CREATE TABLE fr04_ef_selection (
  selection_id    INT           NOT NULL AUTO_INCREMENT,
  fr04wid         INT           NOT NULL COMMENT 'FK → fr04_1_detail',
  ef_id           INT           NULL     COMMENT 'FK → emission_factors (NULL = custom/manual)',
  gas_id          INT           NOT NULL COMMENT 'FK → gas_types',

  -- ค่าที่ใช้จริงในการคำนวณ (snapshot ณ เวลากรอก)
  ef_value_used   DECIMAL(20,8) NOT NULL COMMENT 'ค่า EF ที่ใช้จริง (copy จาก master หรือกรอกเอง)',
  ef_unit_used    VARCHAR(100)  NOT NULL,
  gwp_id          INT           NULL     COMMENT 'FK → gwp_values ที่ใช้แปลงเป็น CO2e',
  gwp_value_used  DECIMAL(18,4) NULL     COMMENT 'ค่า GWP ที่ใช้จริง (snapshot)',

  -- ผลคำนวณรายก๊าซ
  kgco2e          DECIMAL(20,6) NULL     COMMENT 'ผลคำนวณ kgCO2e ของก๊าซนี้',

  -- แหล่งที่มา (ยังคง flag ไว้เพื่อ UI checkbox ตามฟอร์มเดิม)
  source_flag     ENUM('tgo_ef','th_lci_db','int_db','supplier','self_collect','other','manual')
                  NOT NULL DEFAULT 'tgo_ef',
  custom_reference VARCHAR(200) NULL     COMMENT 'อ้างอิงถ้ากรอก EF เอง',
  custom_note     VARCHAR(300)  NULL,

  created_at      DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at      DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
                                ON UPDATE CURRENT_TIMESTAMP(6),

  PRIMARY KEY (selection_id),
  -- fr04 1 แถว มีได้หลายก๊าซ แต่ก๊าซซ้ำไม่ได้ใน fr04 เดียวกัน
  UNIQUE KEY uq_fr04_ef_gas (fr04wid, gas_id),
  KEY ix_fr04_ef_fr04wid (fr04wid),
  KEY ix_fr04_ef_ef_id (ef_id),
  CONSTRAINT fk_fr04_ef_fr04
    FOREIGN KEY (fr04wid) REFERENCES fr04_1_detail (fr04wid) ON DELETE CASCADE,
  CONSTRAINT fk_fr04_ef_master
    FOREIGN KEY (ef_id) REFERENCES emission_factors (ef_id),
  CONSTRAINT fk_fr04_ef_gas
    FOREIGN KEY (gas_id) REFERENCES gas_types (gas_id),
  CONSTRAINT fk_fr04_ef_gwp
    FOREIGN KEY (gwp_id) REFERENCES gwp_values (gwp_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='EF ที่ถูกเลือกใช้ในแต่ละแถวของ fr04_1_detail';

SET FOREIGN_KEY_CHECKS = 1;

-- =============================================================================
-- SEED: ef_sources — แหล่ง EF ทั้งหมดที่ระบบรองรับ
-- (ตรงกับ flags เดิมใน fr04_1_detail)
-- =============================================================================
INSERT INTO ef_sources (source_code, source_name, source_name_th, organization, ar_period, source_type, sort_order) VALUES
  ('TGO_AR5',   'Thailand Greenhouse Gas Management Organization EF (AR5)',
                'ค่า EF จาก อบก. (AR5)',            'TGO',   'AR5', 'national',      1),
  ('TGO_AR6',   'Thailand Greenhouse Gas Management Organization EF (AR6)',
                'ค่า EF จาก อบก. (AR6)',            'TGO',   'AR6', 'national',      2),
  ('THAI_LCI',  'Thailand Life Cycle Inventory Database',
                'ฐานข้อมูล Thai LCI',               'TIIS',  NULL,  'national',      3),
  ('THAI_RES',  'Thai Research / Academic Sources',
                'งานวิจัยไทย',                      NULL,    NULL,  'national',      4),
  ('IPCC_AR5',  'IPCC Fifth Assessment Report EF',
                'IPCC AR5',                         'IPCC',  'AR5', 'international', 5),
  ('IPCC_AR6',  'IPCC Sixth Assessment Report EF',
                'IPCC AR6',                         'IPCC',  'AR6', 'international', 6),
  ('INT_DB',    'International Database (other)',
                'ฐานข้อมูลนานาชาติ (อื่น ๆ)',       NULL,    NULL,  'international', 7),
  ('SUPPLIER',  'Supplier-specific EF',
                'ค่า EF จาก Supplier',              NULL,    NULL,  'supplier',      8),
  ('SELF',      'Self-collected / Measured EF',
                'ค่า EF วัดเอง / เก็บข้อมูลเอง',   NULL,    NULL,  'self_collect',  9),
  ('OTHER',     'Other Sources',
                'แหล่งอื่น ๆ',                     NULL,    NULL,  'other',         10);

-- =============================================================================
-- SEED: ef_categories — หมวดกิจกรรมหลัก (ตาม TGO / IPCC)
-- =============================================================================
-- Level 1: หมวดใหญ่
INSERT INTO ef_categories (category_code, name_th, name_en, scope_id, sort_order) VALUES
  ('SCOPE1_COMBUSTION',  'การเผาไหม้เชื้อเพลิงแบบอยู่กับที่',  'Stationary Combustion',        1, 1),
  ('SCOPE1_MOBILE',      'การเผาไหม้จากการเคลื่อนที่',          'Mobile Combustion',            1, 2),
  ('SCOPE1_PROCESS',     'การปล่อยจากกระบวนการผลิต',           'Industrial Process Emissions',  1, 3),
  ('SCOPE1_FUGITIVE',    'การปล่อยแบบรั่วซึม',                 'Fugitive Emissions',            1, 4),
  ('SCOPE2_ELECTRICITY', 'การใช้ไฟฟ้า',                        'Purchased Electricity',         2, 5),
  ('SCOPE2_STEAM',       'การใช้ไอน้ำ/ความร้อน',               'Purchased Steam/Heat',          2, 6),
  ('SCOPE3_UPSTREAM',    'Scope 3 — Upstream',                 'Upstream Activities',           3, 7),
  ('SCOPE3_DOWNSTREAM',  'Scope 3 — Downstream',               'Downstream Activities',         3, 8);

-- Level 2: หมวดย่อยของ SCOPE1_COMBUSTION (parent_id = 1)
INSERT INTO ef_categories (parent_id, category_code, name_th, name_en, scope_id, unit_activity, sort_order) VALUES
  (1, 'FUEL_DIESEL',    'น้ำมันดีเซล',        'Diesel',          1, 'ลิตร',  11),
  (1, 'FUEL_GASOLINE',  'น้ำมันเบนซิน',       'Gasoline',        1, 'ลิตร',  12),
  (1, 'FUEL_LPG',       'LPG',                'LPG',             1, 'กก.',   13),
  (1, 'FUEL_NG',        'ก๊าซธรรมชาติ (CNG)', 'Natural Gas/CNG', 1, 'ลบ.ม.', 14),
  (1, 'FUEL_BUNKER',    'น้ำมันเตา',          'Fuel Oil/Bunker', 1, 'ลิตร',  15),
  (1, 'FUEL_COAL',      'ถ่านหิน',            'Coal',            1, 'กก.',   16),
  (1, 'FUEL_BIOMASS',   'เชื้อเพลิงชีวมวล',  'Biomass Fuel',    1, 'กก.',   17);

-- Level 2: หมวดย่อยของ SCOPE1_MOBILE (parent_id = 2)
INSERT INTO ef_categories (parent_id, category_code, name_th, name_en, scope_id, unit_activity, sort_order) VALUES
  (2, 'MOBILE_ROAD',    'ยานพาหนะทางถนน',   'Road Transport',  1, 'ลิตร',  21),
  (2, 'MOBILE_AIR',     'การเดินทางทางอากาศ', 'Air Travel',     1, 'km',    22),
  (2, 'MOBILE_SHIP',    'การขนส่งทางน้ำ',   'Water Transport', 1, 'ลิตร',  23);

-- Level 2: SCOPE2
INSERT INTO ef_categories (parent_id, category_code, name_th, name_en, scope_id, unit_activity, sort_order) VALUES
  (5, 'ELEC_GRID_TH',   'ไฟฟ้าจากระบบสายส่ง (ไทย)', 'Thailand Grid Electricity', 2, 'kWh', 51),
  (5, 'ELEC_RENEWABLE',  'ไฟฟ้าพลังงานหมุนเวียน',    'Renewable Electricity',     2, 'kWh', 52);

-- =============================================================================
-- SEED: emission_factors — ค่า EF ตัวอย่าง (TGO AR5, ค่าจริงที่ TGO ใช้)
-- ต้องเติมเพิ่มเมื่อได้ข้อมูลครบจาก ef_database.htm
-- =============================================================================

-- ไฟฟ้าจากระบบสายส่งประเทศไทย (TGO AR5) — CO2 only (Scope 2 ใช้ค่ารวม)
INSERT INTO emission_factors (
  source_id, category_id, gas_id,
  activity_name_th, activity_name_en,
  ef_value, ef_unit, ef_unit_numerator, ef_unit_denominator,
  region, is_default, effective_from, notes
) VALUES (
  1,   -- TGO_AR5
  (SELECT category_id FROM ef_categories WHERE category_code = 'ELEC_GRID_TH'),
  1,   -- CO2
  'ไฟฟ้าจากระบบสายส่งแห่งชาติ (ไทย)',
  'Thailand National Grid Electricity',
  0.5813,
  'kgCO2/kWh', 'kgCO2', 'kWh',
  'Thailand', 1, '2020-01-01',
  'ค่า EF ไฟฟ้า TGO AR5 ปี 2020 — อัปเดตทุกปีจาก EGAT'
);

-- น้ำมันดีเซล — CO2 (TGO AR5)
INSERT INTO emission_factors (
  source_id, category_id, gas_id,
  activity_name_th, activity_name_en,
  ef_value, ef_unit, ef_unit_numerator, ef_unit_denominator,
  heating_value, heating_unit,
  is_default, effective_from
) VALUES (
  1,   -- TGO_AR5
  (SELECT category_id FROM ef_categories WHERE category_code = 'FUEL_DIESEL'),
  1,   -- CO2
  'น้ำมันดีเซล', 'Diesel',
  2.6580, 'kgCO2/liter', 'kgCO2', 'liter',
  35.8, 'MJ/liter',
  1, '2015-01-01'
);

-- น้ำมันดีเซล — CH4 (TGO AR5)
INSERT INTO emission_factors (
  source_id, category_id, gas_id,
  activity_name_th, activity_name_en,
  ef_value, ef_unit, ef_unit_numerator, ef_unit_denominator,
  is_default, effective_from
) VALUES (
  1,   -- TGO_AR5
  (SELECT category_id FROM ef_categories WHERE category_code = 'FUEL_DIESEL'),
  2,   -- CH4
  'น้ำมันดีเซล', 'Diesel',
  0.000126, 'kgCH4/liter', 'kgCH4', 'liter',
  1, '2015-01-01'
);

-- น้ำมันดีเซล — N2O (TGO AR5)
INSERT INTO emission_factors (
  source_id, category_id, gas_id,
  activity_name_th, activity_name_en,
  ef_value, ef_unit, ef_unit_numerator, ef_unit_denominator,
  is_default, effective_from
) VALUES (
  1,   -- TGO_AR5
  (SELECT category_id FROM ef_categories WHERE category_code = 'FUEL_DIESEL'),
  3,   -- N2O
  'น้ำมันดีเซล', 'Diesel',
  0.0000126, 'kgN2O/liter', 'kgN2O', 'liter',
  1, '2015-01-01'
);

-- น้ำมันเบนซิน — CO2 (TGO AR5)
INSERT INTO emission_factors (
  source_id, category_id, gas_id,
  activity_name_th, activity_name_en,
  ef_value, ef_unit, ef_unit_numerator, ef_unit_denominator,
  is_default, effective_from
) VALUES (
  1,
  (SELECT category_id FROM ef_categories WHERE category_code = 'FUEL_GASOLINE'),
  1,
  'น้ำมันเบนซิน', 'Gasoline',
  2.3558, 'kgCO2/liter', 'kgCO2', 'liter',
  1, '2015-01-01'
);

-- LPG — CO2 (TGO AR5)
INSERT INTO emission_factors (
  source_id, category_id, gas_id,
  activity_name_th, activity_name_en,
  ef_value, ef_unit, ef_unit_numerator, ef_unit_denominator,
  is_default, effective_from
) VALUES (
  1,
  (SELECT category_id FROM ef_categories WHERE category_code = 'FUEL_LPG'),
  1,
  'LPG', 'LPG',
  2.9942, 'kgCO2/kg', 'kgCO2', 'kg',
  1, '2015-01-01'
);

-- =============================================================================
-- VIEW: ef_lookup — สำหรับ Backend query ง่าย
-- ใช้ใน dropdown UI: "เลือกกิจกรรม → เลือกแหล่ง → ได้ EF"
-- =============================================================================
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
  ef.ef_value,
  ef.ef_unit,
  ef.ef_unit_numerator,
  ef.ef_unit_denominator,
  ef.region,
  ef.is_default,
  ef.tier_level,
  ef.effective_from,
  ef.effective_until,
  -- parent category
  pc.name_th          AS parent_category_th
FROM emission_factors ef
  JOIN ef_sources   es ON es.source_id   = ef.source_id
  JOIN ef_categories ec ON ec.category_id = ef.category_id
  JOIN gas_types    gt ON gt.gas_id      = ef.gas_id
  LEFT JOIN ef_categories pc ON pc.category_id = ec.parent_id
WHERE ef.is_active = 1
  AND es.is_active = 1
  AND (ef.effective_until IS NULL OR ef.effective_until >= CURDATE());

-- =============================================================================
-- หมายเหตุสำหรับทีม Backend
-- =============================================================================
-- 1. FLOW การเลือก EF ในหน้า data-input:
--    a. User เลือก "ประเภทกิจกรรม" → query ef_categories (parent/child)
--    b. User เลือก "แหล่งอ้างอิง" → filter ef_lookup ตาม category + source_type
--    c. ระบบ prefill ef_value → user ยืนยันหรือแก้ (manual mode)
--    d. บันทึกลง fr04_ef_selection พร้อม snapshot ef_value_used + gwp_value_used
--
-- 2. สูตรคำนวณ kgCO2e ต่อแถว:
--    kgco2e = activity_value (fr04_1_detail.value)
--             × ef_value_used (fr04_ef_selection)
--             × gwp_value_used (fr04_ef_selection)
--    (ถ้า gas เป็น CO2 → gwp = 1 เสมอ)
--
-- 3. flags เดิมใน fr04_1_detail (tgo_ef, th_lci_db, etc.)
--    → ยังคงไว้ชั่วคราว (backward compat) แต่ควร migrate ไปใช้
--      fr04_ef_selection.source_flag ในรอบ refactor ถัดไป
--
-- 4. เมื่อได้ข้อมูลครบจาก ef_database.xlsx:
--    → bulk INSERT ลง emission_factors โดยจับคู่กับ category_code + source_code + gas_code
--    → ใช้ UNIQUE KEY uq_ef_source_cat_gas_activity ป้องกัน duplicate
-- =============================================================================
