-- =============================================================================
-- CONTROL-Z v2 — Full schema + seed สำหรับหน้า «กรอกข้อมูล»
--
-- ⚠️  DEPRECATED สำหรับงาน EF / TGO 2569 — ใช้ชุดแยกขั้นแทน:
--     docs/database-import-plan.md
--     docs/sql/01-core-schema-seed.sql  → 02 → 03 → 04
--
-- อ้างอิงเดิม:
--   docs/mysql-data-dictionary-and-seed.sql (core + EF)
--   docs/data-input-db-source-analysis.md (ขยาย schema)
--
-- ฐานข้อมูล: control_z_v2  (import แยกจาก control_z เพื่อเทียบกัน)
--
-- บัญชีทดสอบ (dev เท่านั้น):
--   user@example.com / SecretPass1!
--   admin@admin.com  / root@#1234
--
-- รัน (legacy monolith):
--   mysql -u root -p < docs/mysql-data-input-seed.sql
-- =============================================================================

CREATE DATABASE IF NOT EXISTS control_z_v2
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE control_z_v2;

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- -----------------------------------------------------------------------------
-- DROP (ลำดับย้อน FK)
-- -----------------------------------------------------------------------------
DROP VIEW IF EXISTS ef_lookup;
DROP TABLE IF EXISTS fr04_ef_selection;
DROP TABLE IF EXISTS emission_factors;
DROP TABLE IF EXISTS ef_categories;
DROP TABLE IF EXISTS ef_sources;
DROP TABLE IF EXISTS activity_entries;
DROP TABLE IF EXISTS reporting_periods;
DROP TABLE IF EXISTS fr04_1_detail;
DROP TABLE IF EXISTS details_scope;
DROP TABLE IF EXISTS category_anwser;
DROP TABLE IF EXISTS category;
DROP TABLE IF EXISTS points_consider;
DROP TABLE IF EXISTS subject_scope;
DROP TABLE IF EXISTS collect_information;
DROP TABLE IF EXISTS organization_information;
DROP TABLE IF EXISTS form_details;
DROP TABLE IF EXISTS edit_forms;
DROP TABLE IF EXISTS forms;
DROP TABLE IF EXISTS user_privileges;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS organizations;
DROP TABLE IF EXISTS gwp_values;
DROP TABLE IF EXISTS gas_types;
DROP TABLE IF EXISTS gwp;
DROP TABLE IF EXISTS scope;

-- =============================================================================
-- SECTION 1: Core tables (ตาม data dictionary + tables.py)
-- =============================================================================

CREATE TABLE organizations (
  organization_id    INT          NOT NULL AUTO_INCREMENT,
  name_of_agency     VARCHAR(50)  NOT NULL,
  organization_name  VARCHAR(50)  NOT NULL,
  address1           VARCHAR(100) NOT NULL,
  subdistrict        VARCHAR(50)  NOT NULL,
  district           VARCHAR(50)  NOT NULL,
  province           VARCHAR(50)  NOT NULL,
  postal_code        VARCHAR(50)  NOT NULL,
  phone              VARCHAR(50)  NOT NULL,
  email              VARCHAR(50)  NOT NULL,
  logo               VARCHAR(100) NULL,
  organization_image VARCHAR(50)  NULL,
  organization_map   VARCHAR(50)  NULL,
  organ_structure    VARCHAR(50)  NULL,
  registration_date  VARCHAR(50)  NOT NULL,
  created_at         DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at         DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
                                   ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (organization_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE users (
  user_id         INT          NOT NULL AUTO_INCREMENT,
  organization_id INT          NOT NULL,
  prefix          VARCHAR(50)  NOT NULL,
  firstname       VARCHAR(50)  NOT NULL,
  lastname        VARCHAR(50)  NOT NULL,
  address         VARCHAR(100) NOT NULL,
  subdistrict     VARCHAR(50)  NOT NULL,
  district        VARCHAR(50)  NOT NULL,
  province        VARCHAR(50)  NOT NULL,
  postal_code     VARCHAR(50)  NOT NULL,
  phone           VARCHAR(50)  NULL,
  email           VARCHAR(50)  NULL,
  image           VARCHAR(100) NULL,
  created_at      DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at      DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
                                  ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (user_id),
  KEY ix_users_organization_id (organization_id),
  CONSTRAINT fk_users_organization
    FOREIGN KEY (organization_id) REFERENCES organizations (organization_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE user_privileges (
  upid          INT          NOT NULL AUTO_INCREMENT,
  user_id       INT          NOT NULL,
  uname         VARCHAR(50)  NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  uread         TINYINT(1)   NOT NULL DEFAULT 0,
  uwrite        TINYINT(1)   NOT NULL DEFAULT 0,
  uedit         TINYINT(1)   NOT NULL DEFAULT 0,
  uall          TINYINT(1)   NOT NULL DEFAULT 0,
  created_at    DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at    DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
                                ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (upid),
  UNIQUE KEY uq_user_privileges_uname (uname),
  UNIQUE KEY uq_user_privileges_user_id (user_id),
  CONSTRAINT fk_user_privileges_user
    FOREIGN KEY (user_id) REFERENCES users (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE forms (
  fid             INT          NOT NULL AUTO_INCREMENT,
  form_id         VARCHAR(50)  NOT NULL,
  name            VARCHAR(100) NOT NULL,
  version         VARCHAR(50)  NOT NULL,
  version_date    VARCHAR(50)  NOT NULL,
  create_date     VARCHAR(50)  NULL,
  end_date        VARCHAR(50)  NULL,
  organization_id INT          NOT NULL,
  created_at      DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at      DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
                                  ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (fid),
  KEY ix_forms_organization_id (organization_id),
  CONSTRAINT fk_forms_organization
    FOREIGN KEY (organization_id) REFERENCES organizations (organization_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE edit_forms (
  efid      INT         NOT NULL AUTO_INCREMENT,
  fid       INT         NOT NULL,
  user_id   INT         NOT NULL,
  edit_date VARCHAR(50) NOT NULL,
  PRIMARY KEY (efid),
  KEY ix_edit_forms_fid (fid),
  KEY ix_edit_forms_user_id (user_id),
  CONSTRAINT fk_edit_forms_form
    FOREIGN KEY (fid) REFERENCES forms (fid),
  CONSTRAINT fk_edit_forms_user
    FOREIGN KEY (user_id) REFERENCES users (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE form_details (
  fdid        INT          NOT NULL AUTO_INCREMENT,
  fid         INT          NOT NULL,
  subject     VARCHAR(100) NOT NULL,
  description VARCHAR(150) NOT NULL,
  created_at  DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at  DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
                              ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (fdid),
  KEY ix_form_details_fid (fid),
  CONSTRAINT fk_form_details_form
    FOREIGN KEY (fid) REFERENCES forms (fid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE organization_information (
  ogid            INT          NOT NULL AUTO_INCREMENT,
  organization_id INT          NOT NULL,
  description     VARCHAR(300) NOT NULL,
  created_at      DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at      DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
                                  ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (ogid),
  KEY ix_org_info_organization_id (organization_id),
  CONSTRAINT fk_org_info_organization
    FOREIGN KEY (organization_id) REFERENCES organizations (organization_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ขยายตาม data-input-db-source-analysis.md
CREATE TABLE collect_information (
  ciid                    INT          NOT NULL AUTO_INCREMENT,
  organization_id         INT          NOT NULL,
  period_collection       VARCHAR(100) NOT NULL COMMENT 'label สรุปช่วง (backward compat)',
  productivity            FLOAT        NOT NULL,
  unit_productivity       VARCHAR(100) NOT NULL,
  base_year               VARCHAR(100) NOT NULL,
  base_year_output        FLOAT        NOT NULL,
  unit_base_output        VARCHAR(100) NOT NULL,
  collection_granularity  ENUM('daily','weekly','monthly','yearly') NULL
                          COMMENT 'ความถี่รอบเก็บข้อมูล',
  period_start            DATE         NULL COMMENT 'วันเริ่มรอบที่เลือก',
  period_end              DATE         NULL COMMENT 'วันสิ้นสุดรอบที่เลือก',
  reporting_year          SMALLINT     NULL COMMENT 'ปีรายงานสำหรับ aggregate',
  doc_firstname           VARCHAR(50)  NULL COMMENT 'ชื่อผู้จัดทำในเอกสาร',
  doc_lastname            VARCHAR(50)  NULL COMMENT 'นามสกุลผู้จัดทำในเอกสาร',
  created_at              DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at              DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
                                          ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (ciid),
  KEY ix_collect_info_organization_id (organization_id),
  KEY ix_collect_info_reporting_year (organization_id, reporting_year),
  CONSTRAINT fk_collect_info_organization
    FOREIGN KEY (organization_id) REFERENCES organizations (organization_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE reporting_periods (
  rpid                   INT          NOT NULL AUTO_INCREMENT,
  organization_id        INT          NOT NULL,
  fid                    INT          NULL,
  reporting_year         SMALLINT     NOT NULL,
  collection_granularity ENUM('daily','weekly','monthly','yearly') NOT NULL,
  period_start           DATE         NOT NULL,
  period_end             DATE         NOT NULL,
  label                  VARCHAR(100) NULL,
  created_at             DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at             DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
                                         ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (rpid),
  UNIQUE KEY uq_reporting_period (organization_id, reporting_year, collection_granularity, period_start),
  KEY ix_reporting_periods_fid (fid),
  CONSTRAINT fk_reporting_periods_org
    FOREIGN KEY (organization_id) REFERENCES organizations (organization_id),
  CONSTRAINT fk_reporting_periods_form
    FOREIGN KEY (fid) REFERENCES forms (fid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='รอบย่อยภายในปีรายงาน (รายวัน/สัปดาห์/เดือน)';

CREATE TABLE scope (
  scid        INT          NOT NULL AUTO_INCREMENT,
  description VARCHAR(100) NOT NULL,
  PRIMARY KEY (scid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE subject_scope (
  subid           INT          NOT NULL AUTO_INCREMENT,
  scid            INT          NOT NULL,
  organization_id INT          NOT NULL,
  fid             INT          NOT NULL,
  description     VARCHAR(100) NOT NULL COMMENT 'หัวข้อ เช่น scope1_on_road',
  created_at      DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at      DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
                                  ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (subid),
  KEY ix_subject_scope_scid (scid),
  KEY ix_subject_scope_org_fid (organization_id, fid),
  CONSTRAINT fk_subject_scope_scope
    FOREIGN KEY (scid) REFERENCES scope (scid),
  CONSTRAINT fk_subject_scope_organization
    FOREIGN KEY (organization_id) REFERENCES organizations (organization_id),
  CONSTRAINT fk_subject_scope_form
    FOREIGN KEY (fid) REFERENCES forms (fid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE details_scope (
  osid        INT          NOT NULL AUTO_INCREMENT,
  subid       INT          NOT NULL,
  description VARCHAR(300) NOT NULL COMMENT 'รายละเอียดสั้น (legacy); ใช้ activity_entries สำหรับ payload เต็ม',
  created_at  DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at  DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
                              ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (osid),
  KEY ix_details_scope_subid (subid),
  CONSTRAINT fk_details_scope_subject
    FOREIGN KEY (subid) REFERENCES subject_scope (subid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE activity_entries (
  aeid            INT          NOT NULL AUTO_INCREMENT,
  organization_id INT          NOT NULL,
  fid             INT          NOT NULL,
  rpid            INT          NULL COMMENT 'รอบย่อย (ถ้ามี)',
  scope_scid      TINYINT      NOT NULL COMMENT '1=Scope1, 2=Scope2, 3=Scope3',
  entry_kind      VARCHAR(50)  NOT NULL COMMENT 'เช่น on_road, electricity, s3_cat_6',
  category_code   VARCHAR(80)  NULL COMMENT 'รหัสหมวด Scope3 ตาม frontend',
  entry_payload   JSON         NOT NULL COMMENT 'แถวกรอกจากฟอร์ม (quantity, unit, metadata)',
  created_at      DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at      DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
                                  ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (aeid),
  KEY ix_activity_entries_org_fid (organization_id, fid),
  KEY ix_activity_entries_scope_kind (scope_scid, entry_kind),
  KEY ix_activity_entries_category (category_code),
  KEY ix_activity_entries_rpid (rpid),
  CONSTRAINT fk_activity_entries_org
    FOREIGN KEY (organization_id) REFERENCES organizations (organization_id),
  CONSTRAINT fk_activity_entries_form
    FOREIGN KEY (fid) REFERENCES forms (fid),
  CONSTRAINT fk_activity_entries_period
    FOREIGN KEY (rpid) REFERENCES reporting_periods (rpid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='รายการกิจกรรม Scope 1–3 (JSON payload จากหน้ากรอกข้อมูล)';

CREATE TABLE points_consider (
  pid             INT          NOT NULL AUTO_INCREMENT,
  organization_id INT          NOT NULL,
  fid             INT          NOT NULL,
  source_GHG      VARCHAR(500) NOT NULL,
  magnitude       VARCHAR(500) NOT NULL,
  influence       VARCHAR(500) NOT NULL,
  risk            VARCHAR(500) NOT NULL,
  sector          VARCHAR(500) NOT NULL,
  outsourcing     VARCHAR(500) NOT NULL,
  engagement      VARCHAR(500) NOT NULL,
  created_at      DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at      DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
                                  ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (pid),
  KEY ix_points_consider_org_fid (organization_id, fid),
  CONSTRAINT fk_points_consider_org
    FOREIGN KEY (organization_id) REFERENCES organizations (organization_id),
  CONSTRAINT fk_points_consider_form
    FOREIGN KEY (fid) REFERENCES forms (fid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ขยาย category สำหรับ 15 หมวด Scope 3
CREATE TABLE category (
  cid           INT          NOT NULL AUTO_INCREMENT,
  fid           INT          NOT NULL,
  category_code VARCHAR(80)  NULL COMMENT 'รหัสตาม SCOPE3_ASSESSMENT_CATEGORIES',
  description   VARCHAR(100) NOT NULL COMMENT 'ชื่อไทยสั้น',
  title_en      VARCHAR(200) NULL,
  sort_order    SMALLINT     NOT NULL DEFAULT 0,
  created_at    DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at    DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
                              ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (cid),
  UNIQUE KEY uq_category_fid_code (fid, category_code),
  KEY ix_category_fid (fid),
  CONSTRAINT fk_category_form
    FOREIGN KEY (fid) REFERENCES forms (fid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ขยายคอลัมน์ Material Topic
CREATE TABLE category_anwser (
  caid              INT          NOT NULL AUTO_INCREMENT,
  cid               INT          NOT NULL,
  organization_id   INT          NOT NULL,
  source_GHG        INT          NOT NULL COMMENT 'presence 0|1 (legacy)',
  magnitude         INT          NOT NULL COMMENT 'legacy magnitude score',
  influence         INT          NOT NULL COMMENT 'influenceLevel 1|3|5',
  risk              INT          NOT NULL COMMENT 'riskLevel 1|3|5',
  sector            INT          NOT NULL COMMENT 'sectorGuidance 0|1',
  outsourcing       INT          NOT NULL COMMENT '0|1',
  engagement        INT          NOT NULL COMMENT 'employeeEngagement 0|1',
  opportunity_level TINYINT      NULL COMMENT 'opportunityLevel 1|3|5',
  ghg_percent       DECIMAL(5,2) NULL COMMENT '%GHG ที่กรอก (0–100)',
  material_total    DECIMAL(4,2) NULL COMMENT 'คะแนนรวม Material Topic',
  is_material       TINYINT(1)   NULL COMMENT '1 = ต้องกรอก Scope 3',
  presence          TINYINT(1)   NULL COMMENT 'มีกิจกรรมในหมวด 0|1',
  remark            VARCHAR(300) NULL,
  created_at        DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at        DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
                                    ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (caid),
  UNIQUE KEY uq_category_answer_org (cid, organization_id),
  KEY ix_category_answer_org (organization_id),
  CONSTRAINT fk_category_answer_category
    FOREIGN KEY (cid) REFERENCES category (cid),
  CONSTRAINT fk_category_answer_org
    FOREIGN KEY (organization_id) REFERENCES organizations (organization_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE fr04_1_detail (
  fr04wid       INT          NOT NULL AUTO_INCREMENT,
  subid         INT          NOT NULL,
  value         FLOAT        NOT NULL,
  unit          VARCHAR(10)  NOT NULL,
  co2_ef        FLOAT        NULL,
  fossil_ch4_ef FLOAT        NULL,
  ch4_ef        FLOAT        NULL,
  n2o_ef        FLOAT        NULL,
  sf6_ef        FLOAT        NULL,
  nf3_ef        FLOAT        NULL,
  hfcs_ef       FLOAT        NULL,
  pfcs_ef       FLOAT        NULL,
  hfcs_gwp      FLOAT        NULL,
  pfcs_gwp      FLOAT        NULL,
  ef_unit       FLOAT        NULL,
  gwp_unit      FLOAT        NULL,
  kgco2e_total  FLOAT        NULL,
  self_collct   INT          NULL,
  supplier      INT          NULL,
  th_lci_db     INT          NULL,
  tgo_ef        INT          NULL,
  thai_res      INT          NULL,
  int_db        INT          NULL,
  `Other`       INT          NULL,
  substitute    INT          NULL,
  reference     VARCHAR(100) NULL,
  description   VARCHAR(100) NULL,
  created_at    DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at    DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
                                ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (fr04wid),
  KEY ix_fr04_subid (subid),
  CONSTRAINT fk_fr04_subject_scope
    FOREIGN KEY (subid) REFERENCES subject_scope (subid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE gwp (
  gwpid   INT          NOT NULL AUTO_INCREMENT,
  subject VARCHAR(100) NOT NULL,
  value   VARCHAR(100) NOT NULL,
  PRIMARY KEY (gwpid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- สำหรับตาราง emission factor
CREATE TABLE gas_types (
  gas_id   INT         NOT NULL AUTO_INCREMENT,
  gas_code VARCHAR(10) NOT NULL,
  gas_name VARCHAR(50) NOT NULL,
  is_kyoto TINYINT(1)  NOT NULL DEFAULT 1,
  PRIMARY KEY (gas_id),
  UNIQUE KEY uq_gas_types_code (gas_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE gwp_values (
  gwp_id    INT            NOT NULL AUTO_INCREMENT,
  gas_id    INT            NOT NULL,
  ar_period VARCHAR(10)    NOT NULL COMMENT 'AR5, AR6, …',
  gwp_value DECIMAL(18,4)  NOT NULL,
  source    VARCHAR(100)   NULL,
  PRIMARY KEY (gwp_id),
  UNIQUE KEY uq_gwp_gas_ar (gas_id, ar_period),
  CONSTRAINT fk_gwp_values_gas
    FOREIGN KEY (gas_id) REFERENCES gas_types (gas_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- SECTION 2: Emission Factor tables (จาก mysql-data-dictionary-and-seed.sql)
-- =============================================================================

CREATE TABLE ef_sources (
  source_id      INT          NOT NULL AUTO_INCREMENT,
  source_code    VARCHAR(30)  NOT NULL,
  source_name    VARCHAR(200) NOT NULL,
  source_name_th VARCHAR(200) NULL,
  organization   VARCHAR(200) NULL,
  ar_period      VARCHAR(10)  NULL,
  version        VARCHAR(50)  NULL,
  publication_year YEAR         NULL,
  reference_url  VARCHAR(500) NULL,
  source_type    ENUM('national','international','supplier','self_collect','other')
                 NOT NULL DEFAULT 'national',
  is_active      TINYINT(1)   NOT NULL DEFAULT 1,
  sort_order     TINYINT      NOT NULL DEFAULT 0,
  created_at     DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (source_id),
  UNIQUE KEY uq_ef_sources_code (source_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE ef_categories (
  category_id   INT          NOT NULL AUTO_INCREMENT,
  parent_id     INT          NULL,
  scope_id      INT          NULL,
  category_code VARCHAR(50)  NOT NULL,
  name_th       VARCHAR(200) NOT NULL,
  name_en       VARCHAR(200) NULL,
  description   VARCHAR(500) NULL,
  unit_activity VARCHAR(50)  NULL,
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE emission_factors (
  ef_id                INT           NOT NULL AUTO_INCREMENT,
  source_id            INT           NOT NULL,
  category_id          INT           NOT NULL,
  gas_id               INT           NOT NULL,
  activity_name_th     VARCHAR(200)  NOT NULL,
  activity_name_en     VARCHAR(200)  NULL,
  activity_subtype     VARCHAR(100)  NULL,
  ef_value             DECIMAL(20,8) NOT NULL,
  ef_unit              VARCHAR(100)  NOT NULL,
  ef_unit_numerator    VARCHAR(50)   NOT NULL,
  ef_unit_denominator  VARCHAR(50)   NOT NULL,
  heating_value        DECIMAL(18,6) NULL,
  heating_unit         VARCHAR(50)   NULL,
  region               VARCHAR(100)  NULL,
  tier_level           TINYINT       NULL,
  is_default           TINYINT(1)    NOT NULL DEFAULT 0,
  is_active            TINYINT(1)    NOT NULL DEFAULT 1,
  effective_from       DATE          NULL,
  effective_until      DATE          NULL,
  notes                VARCHAR(500)  NULL,
  created_at           DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at           DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
                                     ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (ef_id),
  UNIQUE KEY uq_ef_source_cat_gas_activity (source_id, category_id, gas_id, activity_name_th, region),
  KEY ix_ef_source_id (source_id),
  KEY ix_ef_category_id (category_id),
  KEY ix_ef_gas_id (gas_id),
  CONSTRAINT fk_ef_source
    FOREIGN KEY (source_id) REFERENCES ef_sources (source_id),
  CONSTRAINT fk_ef_category
    FOREIGN KEY (category_id) REFERENCES ef_categories (category_id),
  CONSTRAINT fk_ef_gas
    FOREIGN KEY (gas_id) REFERENCES gas_types (gas_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE fr04_ef_selection (
  selection_id     INT           NOT NULL AUTO_INCREMENT,
  fr04wid          INT           NOT NULL,
  ef_id            INT           NULL,
  gas_id           INT           NOT NULL,
  ef_value_used    DECIMAL(20,8) NOT NULL,
  ef_unit_used     VARCHAR(100)  NOT NULL,
  gwp_id           INT           NULL,
  gwp_value_used   DECIMAL(18,4) NULL,
  kgco2e           DECIMAL(20,6) NULL,
  source_flag      ENUM('tgo_ef','th_lci_db','int_db','supplier','self_collect','other','manual')
                   NOT NULL DEFAULT 'tgo_ef',
  custom_reference VARCHAR(200)  NULL,
  custom_note      VARCHAR(300)  NULL,
  created_at       DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at       DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
                                   ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (selection_id),
  UNIQUE KEY uq_fr04_ef_gas (fr04wid, gas_id),
  CONSTRAINT fk_fr04_ef_fr04
    FOREIGN KEY (fr04wid) REFERENCES fr04_1_detail (fr04wid) ON DELETE CASCADE,
  CONSTRAINT fk_fr04_ef_master
    FOREIGN KEY (ef_id) REFERENCES emission_factors (ef_id),
  CONSTRAINT fk_fr04_ef_gas
    FOREIGN KEY (gas_id) REFERENCES gas_types (gas_id),
  CONSTRAINT fk_fr04_ef_gwp
    FOREIGN KEY (gwp_id) REFERENCES gwp_values (gwp_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- =============================================================================
-- SECTION 3: Seed data
-- =============================================================================

-- องค์กรตัวอย่าง
INSERT INTO organizations (
  name_of_agency, organization_name, address1, subdistrict, district, province,
  postal_code, phone, email, registration_date
) VALUES
  ('บริษัทตัวอย่าง จำกัด', 'CONTROL-Z Demo Org', '123 ถ.สุขุมวิท',
   'คลองตัน', 'วัฒนา', 'กรุงเทพมหานคร', '10110', '02-123-4567',
   'contact@demo-org.example', '2024-01-15'),
  ('หน่วยงานผู้ดูแลระบบ', 'CONTROL-Z Admin', '1 ถ.แอดมิน',
   'บางรัก', 'บางรัก', 'กรุงเทพมหานคร', '10500', '02-000-0000',
   'admin@control-z.local', '2024-01-01');

INSERT INTO users (
  organization_id, prefix, firstname, lastname, address, subdistrict, district,
  province, postal_code, phone, email
) VALUES
  (1, 'นาย', 'สมชาย', 'ใจดี', '456/7', 'คลองตัน', 'วัฒนา',
   'กรุงเทพมหานคร', '10110', '081-234-5678', 'user@example.com'),
  (2, 'นาย', 'แอดมิน', 'ระบบ', '1', 'บางรัก', 'บางรัก',
   'กรุงเทพมหานคร', '10500', '080-000-0000', 'admin@admin.com');

-- bcrypt: SecretPass1! / root@#1234
INSERT INTO user_privileges (user_id, uname, password_hash, uread, uwrite, uedit, uall) VALUES
  (1, 'user@example.com',
   '$2b$12$jWzEHM1Fjd8HE/oJ/1WdLOLbxO0YJ2b2r2uXCWKpGxkymcUlt.pUK', 1, 1, 1, 0),
  (2, 'admin@admin.com',
   '$2b$12$AJNxsfSNtfwyJ/GsiSmJ5ON3Vj3T3aX1LibuhufEEinFvGi8UCBQ.', 1, 1, 1, 1);

INSERT INTO forms (
  form_id, name, version, version_date, create_date, organization_id
) VALUES (
  'Fr-04', 'แบบฟอร์มสินค้าคงคลังก๊าซเรือนกระจก', '1.0', '2025-01-01', '2025-06-01', 1
);

INSERT INTO scope (description) VALUES
  ('ขอบเขตที่ 1'),
  ('ขอบเขตที่ 2'),
  ('ขอบเขตที่ 3');

INSERT INTO gwp (subject, value) VALUES
  ('GWP100 CH4', '28'),
  ('GWP100 N2O', '265');

INSERT INTO gas_types (gas_code, gas_name) VALUES
  ('CO2',  'Carbon dioxide'),
  ('CH4',  'Methane'),
  ('N2O',  'Nitrous oxide'),
  ('SF6',  'Sulfur hexafluoride'),
  ('NF3',  'Nitrogen trifluoride');

INSERT INTO gwp_values (gas_id, ar_period, gwp_value, source) VALUES
  (1, 'AR5', 1.0000, 'CO2 reference'),
  (2, 'AR5', 28.0000, 'IPCC AR5'),
  (3, 'AR5', 265.0000, 'IPCC AR5');

INSERT INTO organization_information (organization_id, description) VALUES
  (1, 'องค์กรตัวอย่างสำหรับทดสอบ flow กรอกข้อมูล GHG');

-- ข้อมูลทั่วไป + รอบปฏิทิน (รายปี 2025)
INSERT INTO collect_information (
  organization_id, period_collection, productivity, unit_productivity,
  base_year, base_year_output, unit_base_output,
  collection_granularity, period_start, period_end, reporting_year,
  doc_firstname, doc_lastname
) VALUES (
  1, 'ปี 2025 (1 ม.ค. – 31 ธ.ค.)', 1250, 'ตัน',
  'ปี 2024', 1100, 'ตัน',
  'yearly', '2025-01-01', '2025-12-31', 2025,
  'สมชาย', 'ใจดี'
);

-- รอบย่อยรายเดือน (ตัวอย่าง aggregate รายปี)
INSERT INTO reporting_periods (
  organization_id, fid, reporting_year, collection_granularity,
  period_start, period_end, label
) VALUES
  (1, 1, 2025, 'monthly', '2025-01-01', '2025-01-31', 'ม.ค. 2025'),
  (1, 1, 2025, 'monthly', '2025-02-01', '2025-02-28', 'ก.พ. 2025'),
  (1, 1, 2025, 'monthly', '2025-03-01', '2025-03-31', 'มี.ค. 2025');

INSERT INTO form_details (fid, subject, description) VALUES
  (1, 'ผู้จัดทำรายงาน', 'ข้อมูลผู้จัดทำเอกสาร Fr-04');

INSERT INTO subject_scope (scid, organization_id, fid, description) VALUES
  (1, 1, 1, 'scope1_on_road'),
  (1, 1, 1, 'scope1_stationary'),
  (2, 1, 1, 'scope2_electricity'),
  (2, 1, 1, 'scope2_refrigerant');

INSERT INTO details_scope (subid, description) VALUES
  (1, 'รถกระบะดีเซล 12,000 ลิตร/ปี'),
  (3, 'ไฟฟ้าจากการไฟฟ้า 850,000 kWh/ปี');

-- 15 หมวด Scope 3 (ตาม SCOPE3_ASSESSMENT_CATEGORIES ใน Frontend)
INSERT INTO category (fid, category_code, description, title_en, sort_order) VALUES
  (1, 's3_cat_1_purchased_goods',       'การจัดซื้อสินค้าและบริการ',              'Purchased goods and services', 1),
  (1, 's3_cat_2_capital_goods',         'สินทรัพย์ทุน',                            'Capital goods', 2),
  (1, 's3_cat_3_fuel_energy_related',   'กิจกรรมที่เกี่ยวข้องกับเชื้อเพลิงและพลังงาน', 'Fuel- and energy-related activities', 3),
  (1, 's3_cat_4_upstream_transport',    'การขนส่งและกระจายสินค้าต้นน้ำ',           'Upstream transportation and distribution', 4),
  (1, 's3_cat_5_waste_operations',      'ของเสียที่เกิดจากการดำเนินงาน',           'Waste generated in operations', 5),
  (1, 's3_cat_6_business_travel',       'การเดินทางเพื่อธุรกิจ',                   'Business travel', 6),
  (1, 's3_cat_7_employee_commuting',    'การเดินทางของพนักงาน',                    'Employee commuting', 7),
  (1, 's3_cat_8_upstream_leased',       'สินทรัพย์ที่เช่าใช้ต้นน้ำ',               'Upstream leased assets', 8),
  (1, 's3_cat_9_downstream_transport',  'การขนส่งและกระจายสินค้าปลายน้ำ',          'Downstream transportation and distribution', 9),
  (1, 's3_cat_10_processing_sold',      'การแปรรูปผลิตภัณฑ์ที่จำหน่าย',            'Processing of sold products', 10),
  (1, 's3_cat_11_use_sold',             'การใช้งานผลิตภัณฑ์ที่จำหน่าย',            'Use of sold products', 11),
  (1, 's3_cat_12_end_of_life',          'การจัดการซากผลิตภัณฑ์หลังหมดอายุการใช้งาน', 'End-of-life treatment of sold products', 12),
  (1, 's3_cat_13_downstream_leased',    'สินทรัพย์ที่ให้เช่าปลายน้ำ',              'Downstream leased assets', 13),
  (1, 's3_cat_14_franchises',           'แฟรนไชส์',                                'Franchises', 14),
  (1, 's3_cat_15_investments',          'การลงทุน',                                'Investments', 15);

-- ตัวอย่างแบบประเมิน Material Topic (หมวด 6 = business travel — material)
INSERT INTO category_anwser (
  cid, organization_id, source_GHG, magnitude, influence, risk, sector,
  outsourcing, engagement, opportunity_level, ghg_percent, material_total,
  is_material, presence, remark
) VALUES
  (6, 1, 1, 4, 3, 3, 1, 0, 0, 3, 35.00, 3.40, 1, 1,
   'มีการเดินทางเพื่อธุรกิจสม่ำเสมอ — เกินเกณฑ์ Material Topic'),
  (7, 1, 1, 2, 1, 1, 0, 0, 1, 1, 5.00, 1.70, 0, 1,
   'การเดินทางพนักงาน — คะแนนต่ำกว่าเกณฑ์');

-- activity_entries ตัวอย่าง (JSON จากหน้ากรอกข้อมูล)
INSERT INTO activity_entries (
  organization_id, fid, rpid, scope_scid, entry_kind, category_code, entry_payload
) VALUES
  (1, 1, 1, 1, 'on_road', NULL,
   JSON_OBJECT(
     'fuel', 'diesel', 'vehicleType', 'pickup',
     'quantity', 1000, 'unit', 'liter',
     'periodLabel', 'ม.ค. 2025'
   )),
  (1, 1, 1, 2, 'electricity', NULL,
   JSON_OBJECT(
     'energyType', 'grid', 'quantity', 70000, 'unit', 'kWh',
     'periodLabel', 'ม.ค. 2025'
   )),
  (1, 1, NULL, 3, 'scope3_entry', 's3_cat_6_business_travel',
   JSON_OBJECT(
     'transportMode', 'air', 'distanceKm', 1200,
     'trips', 4, 'remark', 'เที่ยวบินในประเทศ'
   ));

INSERT INTO fr04_1_detail (subid, value, unit, tgo_ef, kgco2e_total, description) VALUES
  (1, 12000, 'ลิตร', 1, NULL, 'รถกระบะดีเซลรวมปี'),
  (3, 850000, 'kWh', 1, NULL, 'ไฟฟ้าจากการไฟฟ้ารวมปี');

-- EF master seed (จาก mysql-data-dictionary-and-seed.sql)
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

INSERT INTO ef_categories (category_code, name_th, name_en, scope_id, sort_order) VALUES
  ('SCOPE1_COMBUSTION',  'การเผาไหม้เชื้อเพลิงแบบอยู่กับที่',  'Stationary Combustion',        1, 1),
  ('SCOPE1_MOBILE',      'การเผาไหม้จากการเคลื่อนที่',          'Mobile Combustion',            1, 2),
  ('SCOPE1_PROCESS',     'การปล่อยจากกระบวนการผลิต',           'Industrial Process Emissions',  1, 3),
  ('SCOPE1_FUGITIVE',    'การปล่อยแบบรั่วซึม',                 'Fugitive Emissions',            1, 4),
  ('SCOPE2_ELECTRICITY', 'การใช้ไฟฟ้า',                        'Purchased Electricity',         2, 5),
  ('SCOPE2_STEAM',       'การใช้ไอน้ำ/ความร้อน',               'Purchased Steam/Heat',          2, 6),
  ('SCOPE3_UPSTREAM',    'Scope 3 — Upstream',                 'Upstream Activities',           3, 7),
  ('SCOPE3_DOWNSTREAM',  'Scope 3 — Downstream',               'Downstream Activities',         3, 8);

INSERT INTO ef_categories (parent_id, category_code, name_th, name_en, scope_id, unit_activity, sort_order) VALUES
  (1, 'FUEL_DIESEL',    'น้ำมันดีเซล',        'Diesel',          1, 'ลิตร',  11),
  (1, 'FUEL_GASOLINE',  'น้ำมันเบนซิน',       'Gasoline',        1, 'ลิตร',  12),
  (1, 'FUEL_LPG',       'LPG',                'LPG',             1, 'กก.',   13),
  (1, 'FUEL_NG',        'ก๊าซธรรมชาติ (CNG)', 'Natural Gas/CNG', 1, 'ลบ.ม.', 14),
  (1, 'FUEL_BUNKER',    'น้ำมันเตา',          'Fuel Oil/Bunker', 1, 'ลิตร',  15),
  (1, 'FUEL_COAL',      'ถ่านหิน',            'Coal',            1, 'กก.',   16),
  (1, 'FUEL_BIOMASS',   'เชื้อเพลิงชีวมวล',  'Biomass Fuel',    1, 'กก.',   17),
  (2, 'MOBILE_ROAD',    'ยานพาหนะทางถนน',   'Road Transport',  1, 'ลิตร',  21),
  (2, 'MOBILE_AIR',     'การเดินทางทางอากาศ', 'Air Travel',     1, 'km',    22),
  (2, 'MOBILE_SHIP',    'การขนส่งทางน้ำ',   'Water Transport', 1, 'ลิตร',  23),
  (5, 'ELEC_GRID_TH',   'ไฟฟ้าจากระบบสายส่ง (ไทย)', 'Thailand Grid Electricity', 2, 'kWh', 51),
  (5, 'ELEC_RENEWABLE',  'ไฟฟ้าพลังงานหมุนเวียน',    'Renewable Electricity',     2, 'kWh', 52);

INSERT INTO emission_factors (
  source_id, category_id, gas_id,
  activity_name_th, activity_name_en,
  ef_value, ef_unit, ef_unit_numerator, ef_unit_denominator,
  region, is_default, effective_from, notes
) VALUES (
  1,
  (SELECT category_id FROM ef_categories WHERE category_code = 'ELEC_GRID_TH'),
  1,
  'ไฟฟ้าจากระบบสายส่งแห่งชาติ (ไทย)',
  'Thailand National Grid Electricity',
  0.5813, 'kgCO2/kWh', 'kgCO2', 'kWh',
  'Thailand', 1, '2020-01-01',
  'ค่า EF ไฟฟ้า TGO AR5 ปี 2020'
);

INSERT INTO emission_factors (
  source_id, category_id, gas_id,
  activity_name_th, activity_name_en,
  ef_value, ef_unit, ef_unit_numerator, ef_unit_denominator,
  heating_value, heating_unit, is_default, effective_from
) VALUES (
  1,
  (SELECT category_id FROM ef_categories WHERE category_code = 'FUEL_DIESEL'),
  1,
  'น้ำมันดีเซล', 'Diesel',
  2.6580, 'kgCO2/liter', 'kgCO2', 'liter',
  35.8, 'MJ/liter', 1, '2015-01-01'
);

INSERT INTO emission_factors (
  source_id, category_id, gas_id,
  activity_name_th, activity_name_en,
  ef_value, ef_unit, ef_unit_numerator, ef_unit_denominator,
  is_default, effective_from
) VALUES
  (1, (SELECT category_id FROM ef_categories WHERE category_code = 'FUEL_DIESEL'), 2,
   'น้ำมันดีเซล', 'Diesel', 0.000126, 'kgCH4/liter', 'kgCH4', 'liter', 1, '2015-01-01'),
  (1, (SELECT category_id FROM ef_categories WHERE category_code = 'FUEL_DIESEL'), 3,
   'น้ำมันดีเซล', 'Diesel', 0.0000126, 'kgN2O/liter', 'kgN2O', 'liter', 1, '2015-01-01'),
  (1, (SELECT category_id FROM ef_categories WHERE category_code = 'FUEL_GASOLINE'), 1,
   'น้ำมันเบนซิน', 'Gasoline', 2.3558, 'kgCO2/liter', 'kgCO2', 'liter', 1, '2015-01-01'),
  (1, (SELECT category_id FROM ef_categories WHERE category_code = 'FUEL_LPG'), 1,
   'LPG', 'LPG', 2.9942, 'kgCO2/kg', 'kgCO2', 'kg', 1, '2015-01-01');

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
-- สรุปความต่างจาก control_z เดิม
--   • ฐานข้อมูลแยกชื่อ control_z_v2
--   • collect_information + reporting_periods รองรับ granularity / reporting_year
--   • activity_entries เก็บ JSON รายการ Scope 1–3
--   • category มี category_code + seed 15 หมวด Scope 3
--   • category_anwser มีฟิลด์ Material Topic (ghg_percent, material_total, …)
--   • รวม gas_types, gwp_values และตาราง EF ครบ
-- =============================================================================
