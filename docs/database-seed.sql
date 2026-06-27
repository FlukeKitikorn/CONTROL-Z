-- =============================================================================
-- CONTROL-Z - Database seed (latest combined)
-- Database: control_z_v2 | charset utf8mb4
-- Docs: docs/database-overview.md
-- Build: docs/scripts/build-database-seed.ps1
-- =============================================================================

-- >>> BEGIN parts/01-core-schema-seed.sql
-- =============================================================================
-- [01/04] CONTROL-Z v2 — Core schema + seed แอป (ไม่รวม EF ชุด TGO 2569)
--
-- ฐานข้อมูล: control_z_v2
-- เอกสาร: docs/database-overview.md
-- สร้างรวม: docs/database-seed.sql (จาก docs/scripts/build-database-seed.ps1)
--
-- บัญชีทดสอบ: user@example.com / SecretPass1! | admin@admin.com / root@#1234
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
DROP VIEW IF EXISTS ef_resolve_by_ui;
DROP VIEW IF EXISTS ef_lookup;
DROP TABLE IF EXISTS ef_ui_options;
DROP TABLE IF EXISTS scope3_ef_catalog;
DROP TABLE IF EXISTS unit_aliases;
DROP TABLE IF EXISTS ui_sector_map;
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

-- ขยายตาม docs/database-overview.md (กลุ่ม collect_information)
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
-- SECTION 2: Emission Factor tables (ดู docs/database-overview.md)
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
  category_id         INT          NOT NULL AUTO_INCREMENT,
  parent_id           INT          NULL,
  scope_id            INT          NULL,
  category_code       VARCHAR(50)  NOT NULL,
  scope3_parent_code  VARCHAR(80)  NULL COMMENT 'เช่น s3_cat_1_purchased_goods',
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
  KEY ix_ef_categories_s3_parent (scope3_parent_code),
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
  co2_type             ENUM('fossil','biogenic') NULL,
  ef_purpose           ENUM('direct','scope3_upstream','cfo_scope2','scope3_elec','cfp') NULL,
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

-- Bridge tables (Frontend option_key → EF) — รายละเอียด seed ใน 04
CREATE TABLE ef_ui_options (
  option_id          INT          NOT NULL AUTO_INCREMENT,
  scope_scid         TINYINT      NOT NULL,
  ui_context         VARCHAR(50)  NOT NULL,
  option_key         VARCHAR(80)  NOT NULL,
  label_th           VARCHAR(200) NOT NULL,
  ef_category_code   VARCHAR(80)  NOT NULL,
  activity_subtype   VARCHAR(100) NULL,
  ef_purpose         ENUM('direct','scope3_upstream','cfo_scope2','scope3_elec','cfp') NULL,
  unit_denominator   VARCHAR(20)  NOT NULL,
  calc_mode          ENUM('combustion_multigas','refrigerant_gwp','electricity_grid','scope3_single_ef')
                     NOT NULL DEFAULT 'combustion_multigas',
  sort_order         SMALLINT     NOT NULL DEFAULT 0,
  is_active          TINYINT(1)   NOT NULL DEFAULT 1,
  notes              VARCHAR(300) NULL,
  PRIMARY KEY (option_id),
  UNIQUE KEY uq_ef_ui_option (scope_scid, ui_context, option_key, activity_subtype),
  KEY ix_ef_ui_ef_cat (ef_category_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE scope3_ef_catalog (
  line_code            VARCHAR(50)  NOT NULL,
  scope3_category_code VARCHAR(80)  NOT NULL,
  label_th             VARCHAR(200) NOT NULL,
  default_unit         VARCHAR(20)  NOT NULL,
  entry_mode_hint      ENUM('baht','quantity','either','distance','fuel') NULL,
  ef_category_code     VARCHAR(80)  NOT NULL,
  activity_name_match  VARCHAR(200) NULL,
  sort_order           SMALLINT     NOT NULL DEFAULT 0,
  is_active            TINYINT(1)   NOT NULL DEFAULT 1,
  PRIMARY KEY (line_code),
  KEY ix_s3_ef_cat_parent (scope3_category_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE unit_aliases (
  ui_unit             VARCHAR(20)  NOT NULL,
  ef_unit_denominator VARCHAR(20)  NOT NULL,
  multiplier          DECIMAL(18,8) NOT NULL DEFAULT 1.00000000,
  PRIMARY KEY (ui_unit, ef_unit_denominator)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE ui_sector_map (
  ui_sector           VARCHAR(50)  NOT NULL COMMENT 'ค่าใน form: agriculture, forestry, …',
  ef_activity_subtype VARCHAR(100) NOT NULL COMMENT 'ค่าใน emission_factors.activity_subtype',
  PRIMARY KEY (ui_sector)
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

-- EF master seed (ดู docs/database-overview.md)
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

-- EF hierarchy ระดับบนเท่านั้น — หมวดย่อย + ค่า EF อยู่ใน 02 และ 03
INSERT INTO ef_categories (category_code, name_th, name_en, scope_id, sort_order) VALUES
  ('SCOPE1_COMBUSTION',  'การเผาไหม้เชื้อเพลิงแบบอยู่กับที่',  'Stationary Combustion',        1, 1),
  ('SCOPE1_MOBILE',      'การเผาไหม้จากการเคลื่อนที่',          'Mobile Combustion',            1, 2),
  ('SCOPE1_PROCESS',     'การปล่อยจากกระบวนการผลิต',           'Industrial Process Emissions',  1, 3),
  ('SCOPE1_FUGITIVE',    'การปล่อยแบบรั่วซึม',                 'Fugitive Emissions',            1, 4),
  ('SCOPE2_ELECTRICITY', 'การใช้ไฟฟ้า',                        'Purchased Electricity',         2, 5),
  ('SCOPE2_STEAM',       'การใช้ไอน้ำ/ความร้อน',               'Purchased Steam/Heat',          2, 6),
  ('SCOPE3_UPSTREAM',    'Scope 3 — Upstream',                 'Upstream Activities',           3, 7),
  ('SCOPE3_DOWNSTREAM',  'Scope 3 — Downstream',               'Downstream Activities',         3, 8);

-- Views สร้างใน 04-ef-frontend-bridge.sql หลังมีข้อมูล EF + bridge seed

-- <<< END parts/01-core-schema-seed.sql

-- >>> BEGIN parts/02-ef-masters-categories.sql
-- =============================================================================
-- [02/04] EF Masters + ef_categories (TGO 2569 / IPCC AR5)
-- อ้างอิง: docs/database-overview.md (กลุ่ม EF masters)
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

-- <<< END parts/02-ef-masters-categories.sql

-- >>> BEGIN generated/02b-ef-categories-full.sql
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

-- <<< END generated/02b-ef-categories-full.sql

-- >>> BEGIN generated/03c-ef-emission-factors-full.sql
-- [03c] Emission Factors — TGO 2569 FULL (~190 rows)
-- Generated by docs/scripts/generate_ef_full.py
USE control_z_v2;

DELETE FROM emission_factors;

INSERT INTO emission_factors (
  source_id, category_id, gas_id, activity_name_th, activity_subtype,
  co2_type, ef_purpose, ef_value, ef_unit, ef_unit_numerator, ef_unit_denominator,
  region, is_default, effective_from, effective_until
)
SELECT
  (SELECT source_id FROM ef_sources WHERE source_code = r.src),
  c.category_id,
  g.gas_id,
  COALESCE(r.name_th, c.name_th),
  r.sub,
  r.co2,
  r.purpose,
  r.val,
  r.unit,
  r.num,
  r.den,
  'Thailand',
  r.is_def,
  r.eff_from,
  r.until
FROM (
  SELECT 'FUEL_NATGAS_NCV_SCF' AS cat, 'CO2' AS gas, 0.05720000 AS val, 'kgCO2/scf' AS unit, 'kgCO2' AS num, 'scf' AS den, 'fossil' AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'FUEL_NATGAS_NCV_SCF' AS cat, 'CH4_FOSSIL' AS gas, 0.00000102 AS val, 'kgCH4/scf' AS unit, 'kgCH4' AS num, 'scf' AS den, NULL AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'FUEL_NATGAS_NCV_SCF' AS cat, 'N2O' AS gas, 0.00000010 AS val, 'kgN2O/scf' AS unit, 'kgN2O' AS num, 'scf' AS den, NULL AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'FUEL_NATGAS_NCV_MJ' AS cat, 'CO2' AS gas, 0.05610000 AS val, 'kgCO2/MJ' AS unit, 'kgCO2' AS num, 'MJ' AS den, 'fossil' AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'FUEL_NATGAS_NCV_MJ' AS cat, 'CH4_FOSSIL' AS gas, 0.00000100 AS val, 'kgCH4/MJ' AS unit, 'kgCH4' AS num, 'MJ' AS den, NULL AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'FUEL_NATGAS_NCV_MJ' AS cat, 'N2O' AS gas, 0.00000010 AS val, 'kgN2O/MJ' AS unit, 'kgN2O' AS num, 'MJ' AS den, NULL AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'FUEL_NATGAS_HHV_MJ' AS cat, 'CO2' AS gas, 0.05010000 AS val, 'kgCO2/MJ' AS unit, 'kgCO2' AS num, 'MJ' AS den, 'fossil' AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'FUEL_NATGAS_HHV_MJ' AS cat, 'CH4_FOSSIL' AS gas, 0.00000100 AS val, 'kgCH4/MJ' AS unit, 'kgCH4' AS num, 'MJ' AS den, NULL AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'FUEL_NATGAS_HHV_MJ' AS cat, 'N2O' AS gas, 0.00000010 AS val, 'kgN2O/MJ' AS unit, 'kgN2O' AS num, 'MJ' AS den, NULL AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'FUEL_NATGAS_HHV_MMBTU' AS cat, 'CO2' AS gas, 52.90000000 AS val, 'kgCO2/MMBTU' AS unit, 'kgCO2' AS num, 'MMBTU' AS den, 'fossil' AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'FUEL_NATGAS_HHV_MMBTU' AS cat, 'CH4_FOSSIL' AS gas, 0.00100000 AS val, 'kgCH4/MMBTU' AS unit, 'kgCH4' AS num, 'MMBTU' AS den, NULL AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'FUEL_NATGAS_HHV_MMBTU' AS cat, 'N2O' AS gas, 0.00010000 AS val, 'kgN2O/MMBTU' AS unit, 'kgN2O' AS num, 'MMBTU' AS den, NULL AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'FUEL_LPG_LITRE' AS cat, 'CO2' AS gas, 1.67970000 AS val, 'kgCO2/litre' AS unit, 'kgCO2' AS num, 'litre' AS den, 'fossil' AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'FUEL_LPG_LITRE' AS cat, 'CH4_FOSSIL' AS gas, 0.00002660 AS val, 'kgCH4/litre' AS unit, 'kgCH4' AS num, 'litre' AS den, NULL AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'FUEL_LPG_LITRE' AS cat, 'N2O' AS gas, 0.00000266 AS val, 'kgN2O/litre' AS unit, 'kgN2O' AS num, 'litre' AS den, NULL AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'FUEL_LPG_KG' AS cat, 'CO2' AS gas, 3.11060000 AS val, 'kgCO2/kg' AS unit, 'kgCO2' AS num, 'kg' AS den, 'fossil' AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'FUEL_LPG_KG' AS cat, 'CH4_FOSSIL' AS gas, 0.00004930 AS val, 'kgCH4/kg' AS unit, 'kgCH4' AS num, 'kg' AS den, NULL AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'FUEL_LPG_KG' AS cat, 'N2O' AS gas, 0.00000493 AS val, 'kgN2O/kg' AS unit, 'kgN2O' AS num, 'kg' AS den, NULL AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'FUEL_FUELOIL_A' AS cat, 'CO2' AS gas, 3.20970000 AS val, 'kgCO2/litre' AS unit, 'kgCO2' AS num, 'litre' AS den, 'fossil' AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'FUEL_FUELOIL_A' AS cat, 'CH4_FOSSIL' AS gas, 0.00012400 AS val, 'kgCH4/litre' AS unit, 'kgCH4' AS num, 'litre' AS den, NULL AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'FUEL_FUELOIL_A' AS cat, 'N2O' AS gas, 0.00002490 AS val, 'kgN2O/litre' AS unit, 'kgN2O' AS num, 'litre' AS den, NULL AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'FUEL_FUELOIL_C' AS cat, 'CO2' AS gas, 3.23530000 AS val, 'kgCO2/litre' AS unit, 'kgCO2' AS num, 'litre' AS den, 'fossil' AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'FUEL_FUELOIL_C' AS cat, 'CH4_FOSSIL' AS gas, 0.00012500 AS val, 'kgCH4/litre' AS unit, 'kgCH4' AS num, 'litre' AS den, NULL AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'FUEL_FUELOIL_C' AS cat, 'N2O' AS gas, 0.00002510 AS val, 'kgN2O/litre' AS unit, 'kgN2O' AS num, 'litre' AS den, NULL AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'FUEL_KEROSENE_JET' AS cat, 'CO2' AS gas, 2.46890000 AS val, 'kgCO2/litre' AS unit, 'kgCO2' AS num, 'litre' AS den, 'fossil' AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'FUEL_KEROSENE_JET' AS cat, 'CH4_FOSSIL' AS gas, 0.00010400 AS val, 'kgCH4/litre' AS unit, 'kgCH4' AS num, 'litre' AS den, NULL AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'FUEL_KEROSENE_JET' AS cat, 'N2O' AS gas, 0.00002070 AS val, 'kgN2O/litre' AS unit, 'kgN2O' AS num, 'litre' AS den, NULL AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'FUEL_KEROSENE_OTHER' AS cat, 'CO2' AS gas, 2.48270000 AS val, 'kgCO2/litre' AS unit, 'kgCO2' AS num, 'litre' AS den, 'fossil' AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'FUEL_KEROSENE_OTHER' AS cat, 'CH4_FOSSIL' AS gas, 0.00010400 AS val, 'kgCH4/litre' AS unit, 'kgCH4' AS num, 'litre' AS den, NULL AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'FUEL_KEROSENE_OTHER' AS cat, 'N2O' AS gas, 0.00002070 AS val, 'kgN2O/litre' AS unit, 'kgN2O' AS num, 'litre' AS den, NULL AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'FUEL_DIESEL' AS cat, 'CO2' AS gas, 2.69870000 AS val, 'kgCO2/litre' AS unit, 'kgCO2' AS num, 'litre' AS den, 'fossil' AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'FUEL_DIESEL' AS cat, 'CH4_FOSSIL' AS gas, 0.00010900 AS val, 'kgCH4/litre' AS unit, 'kgCH4' AS num, 'litre' AS den, NULL AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'FUEL_DIESEL' AS cat, 'N2O' AS gas, 0.00002190 AS val, 'kgN2O/litre' AS unit, 'kgN2O' AS num, 'litre' AS den, NULL AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'FUEL_GASOLINE' AS cat, 'CO2' AS gas, 2.18160000 AS val, 'kgCO2/litre' AS unit, 'kgCO2' AS num, 'litre' AS den, 'fossil' AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'FUEL_GASOLINE' AS cat, 'CH4_FOSSIL' AS gas, 0.00009440 AS val, 'kgCH4/litre' AS unit, 'kgCH4' AS num, 'litre' AS den, NULL AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'FUEL_GASOLINE' AS cat, 'N2O' AS gas, 0.00001890 AS val, 'kgN2O/litre' AS unit, 'kgN2O' AS num, 'litre' AS den, NULL AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'FUEL_LIGNITE' AS cat, 'CO2' AS gas, 1.20190000 AS val, 'kgCO2/kg' AS unit, 'kgCO2' AS num, 'kg' AS den, 'fossil' AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'FUEL_LIGNITE' AS cat, 'CH4_FOSSIL' AS gas, 0.00010500 AS val, 'kgCH4/kg' AS unit, 'kgCH4' AS num, 'kg' AS den, NULL AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'FUEL_LIGNITE' AS cat, 'N2O' AS gas, 0.00001570 AS val, 'kgN2O/kg' AS unit, 'kgN2O' AS num, 'kg' AS den, NULL AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'FUEL_ANTHRACITE' AS cat, 'CO2' AS gas, 3.08660000 AS val, 'kgCO2/kg' AS unit, 'kgCO2' AS num, 'kg' AS den, 'fossil' AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'FUEL_ANTHRACITE' AS cat, 'CH4_FOSSIL' AS gas, 0.00031400 AS val, 'kgCH4/kg' AS unit, 'kgCH4' AS num, 'kg' AS den, NULL AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'FUEL_ANTHRACITE' AS cat, 'N2O' AS gas, 0.00004710 AS val, 'kgN2O/kg' AS unit, 'kgN2O' AS num, 'kg' AS den, NULL AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'FUEL_COAL_BITUMINOUS' AS cat, 'CO2' AS gas, 2.49460000 AS val, 'kgCO2/kg' AS unit, 'kgCO2' AS num, 'kg' AS den, 'fossil' AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'FUEL_COAL_BITUMINOUS' AS cat, 'CH4_FOSSIL' AS gas, 0.00030000 AS val, 'kgCH4/kg' AS unit, 'kgCH4' AS num, 'kg' AS den, NULL AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'FUEL_COAL_BITUMINOUS' AS cat, 'N2O' AS gas, 0.00000000 AS val, 'kgN2O/kg' AS unit, 'kgN2O' AS num, 'kg' AS den, NULL AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'FUEL_COAL_COKING' AS cat, 'CO2' AS gas, 2.61380000 AS val, 'kgCO2/kg' AS unit, 'kgCO2' AS num, 'kg' AS den, 'fossil' AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'FUEL_COAL_COKING' AS cat, 'CH4_FOSSIL' AS gas, 0.00030000 AS val, 'kgCH4/kg' AS unit, 'kgCH4' AS num, 'kg' AS den, NULL AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'FUEL_COAL_COKING' AS cat, 'N2O' AS gas, 0.00000000 AS val, 'kgN2O/kg' AS unit, 'kgN2O' AS num, 'kg' AS den, NULL AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'FUEL_COAL_SUBBIT' AS cat, 'CO2' AS gas, 2.53000000 AS val, 'kgCO2/kg' AS unit, 'kgCO2' AS num, 'kg' AS den, 'fossil' AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'FUEL_COAL_SUBBIT' AS cat, 'CH4_FOSSIL' AS gas, 0.00002640 AS val, 'kgCH4/kg' AS unit, 'kgCH4' AS num, 'kg' AS den, NULL AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'FUEL_COAL_SUBBIT' AS cat, 'N2O' AS gas, 0.00003960 AS val, 'kgN2O/kg' AS unit, 'kgN2O' AS num, 'kg' AS den, NULL AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'FUEL_ACETYLENE' AS cat, 'CO2' AS gas, 3.38460000 AS val, 'kgCO2/kg' AS unit, 'kgCO2' AS num, 'kg' AS den, 'fossil' AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'FUEL_ETHANE' AS cat, 'CO2' AS gas, 3.14290000 AS val, 'kgCO2/kg' AS unit, 'kgCO2' AS num, 'kg' AS den, 'fossil' AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'FUEL_PROPANE' AS cat, 'CO2' AS gas, 3.00000000 AS val, 'kgCO2/kg' AS unit, 'kgCO2' AS num, 'kg' AS den, 'fossil' AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'FUEL_BUTANE' AS cat, 'CO2' AS gas, 3.03450000 AS val, 'kgCO2/kg' AS unit, 'kgCO2' AS num, 'kg' AS den, 'fossil' AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'FUEL_BIODIESEL' AS cat, 'CO2' AS gas, 1.64400000 AS val, 'kgCO2/litre' AS unit, 'kgCO2' AS num, 'litre' AS den, 'fossil' AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'FUEL_BIODIESEL' AS cat, 'CH4' AS gas, 0.00010000 AS val, 'kgCH4/litre' AS unit, 'kgCH4' AS num, 'litre' AS den, NULL AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'FUEL_BIODIESEL' AS cat, 'N2O' AS gas, 0.00000000 AS val, 'kgN2O/litre' AS unit, 'kgN2O' AS num, 'litre' AS den, NULL AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'FUEL_BIOGASOLINE' AS cat, 'CO2' AS gas, 1.49680000 AS val, 'kgCO2/litre' AS unit, 'kgCO2' AS num, 'litre' AS den, 'fossil' AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'FUEL_BIOGASOLINE' AS cat, 'CH4' AS gas, 0.00010000 AS val, 'kgCH4/litre' AS unit, 'kgCH4' AS num, 'litre' AS den, NULL AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'FUEL_BIOGASOLINE' AS cat, 'N2O' AS gas, 0.00000000 AS val, 'kgN2O/litre' AS unit, 'kgN2O' AS num, 'litre' AS den, NULL AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'FUEL_WOOD' AS cat, 'CH4' AS gas, 0.00048000 AS val, 'kgCH4/kg' AS unit, 'kgCH4' AS num, 'kg' AS den, NULL AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'FUEL_WOOD' AS cat, 'N2O' AS gas, 0.00006400 AS val, 'kgN2O/kg' AS unit, 'kgN2O' AS num, 'kg' AS den, NULL AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'FUEL_WOOD_BIO' AS cat, 'CO2_BIO' AS gas, 1.79090000 AS val, 'kgCO2bio/kg' AS unit, 'kgCO2bio' AS num, 'kg' AS den, 'biogenic' AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'FUEL_SAWDUST' AS cat, 'CH4' AS gas, 0.00030000 AS val, 'kgCH4/kg' AS unit, 'kgCH4' AS num, 'kg' AS den, NULL AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'FUEL_SAWDUST' AS cat, 'N2O' AS gas, 0.00000000 AS val, 'kgN2O/kg' AS unit, 'kgN2O' AS num, 'kg' AS den, NULL AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'FUEL_SAWDUST_BIO' AS cat, 'CO2_BIO' AS gas, 1.21860000 AS val, 'kgCO2bio/kg' AS unit, 'kgCO2bio' AS num, 'kg' AS den, 'biogenic' AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'FUEL_CHARCOAL' AS cat, 'CH4' AS gas, 0.00580000 AS val, 'kgCH4/kg' AS unit, 'kgCH4' AS num, 'kg' AS den, NULL AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'FUEL_CHARCOAL' AS cat, 'N2O' AS gas, 0.00010000 AS val, 'kgN2O/kg' AS unit, 'kgN2O' AS num, 'kg' AS den, NULL AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'FUEL_CHARCOAL_BIO' AS cat, 'CO2_BIO' AS gas, 3.23460000 AS val, 'kgCO2bio/kg' AS unit, 'kgCO2bio' AS num, 'kg' AS den, 'biogenic' AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'FUEL_PADDYHUSK' AS cat, 'CH4' AS gas, 0.00040000 AS val, 'kgCH4/kg' AS unit, 'kgCH4' AS num, 'kg' AS den, NULL AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'FUEL_PADDYHUSK' AS cat, 'N2O' AS gas, 0.00010000 AS val, 'kgN2O/kg' AS unit, 'kgN2O' AS num, 'kg' AS den, NULL AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'FUEL_PADDYHUSK_BIO' AS cat, 'CO2_BIO' AS gas, 1.44000000 AS val, 'kgCO2bio/kg' AS unit, 'kgCO2bio' AS num, 'kg' AS den, 'biogenic' AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'FUEL_BAGASSE' AS cat, 'CH4' AS gas, 0.00022600 AS val, 'kgCH4/kg' AS unit, 'kgCH4' AS num, 'kg' AS den, NULL AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'FUEL_BAGASSE' AS cat, 'N2O' AS gas, 0.00003010 AS val, 'kgN2O/kg' AS unit, 'kgN2O' AS num, 'kg' AS den, NULL AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'FUEL_BAGASSE_BIO' AS cat, 'CO2_BIO' AS gas, 0.75300000 AS val, 'kgCO2bio/kg' AS unit, 'kgCO2bio' AS num, 'kg' AS den, 'biogenic' AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'FUEL_PALMSHELL' AS cat, 'CH4' AS gas, 0.00055600 AS val, 'kgCH4/kg' AS unit, 'kgCH4' AS num, 'kg' AS den, NULL AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'FUEL_PALMSHELL' AS cat, 'N2O' AS gas, 0.00007410 AS val, 'kgN2O/kg' AS unit, 'kgN2O' AS num, 'kg' AS den, NULL AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'FUEL_PALMSHELL_BIO' AS cat, 'CO2_BIO' AS gas, 1.85300000 AS val, 'kgCO2bio/kg' AS unit, 'kgCO2bio' AS num, 'kg' AS den, 'biogenic' AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'FUEL_COB' AS cat, 'CH4' AS gas, 0.00050300 AS val, 'kgCH4/kg' AS unit, 'kgCH4' AS num, 'kg' AS den, NULL AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'FUEL_COB' AS cat, 'N2O' AS gas, 0.00006710 AS val, 'kgN2O/kg' AS unit, 'kgN2O' AS num, 'kg' AS den, NULL AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'FUEL_COB_BIO' AS cat, 'CO2_BIO' AS gas, 1.67800000 AS val, 'kgCO2bio/kg' AS unit, 'kgCO2bio' AS num, 'kg' AS den, 'biogenic' AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'FUEL_BIOGAS' AS cat, 'CH4' AS gas, 0.00002090 AS val, 'kgCH4/m3' AS unit, 'kgCH4' AS num, 'm3' AS den, NULL AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'FUEL_BIOGAS' AS cat, 'N2O' AS gas, 0.00000209 AS val, 'kgN2O/m3' AS unit, 'kgN2O' AS num, 'm3' AS den, NULL AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'FUEL_BIOGAS_BIO' AS cat, 'CO2_BIO' AS gas, 1.14280000 AS val, 'kgCO2bio/m3' AS unit, 'kgCO2bio' AS num, 'm3' AS den, 'biogenic' AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'FUEL_DIESEL_B7' AS cat, 'CO2' AS gas, 2.50980000 AS val, 'kgCO2/litre' AS unit, 'kgCO2' AS num, 'litre' AS den, 'fossil' AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'FUEL_DIESEL_B7' AS cat, 'CH4_FOSSIL' AS gas, 0.00010000 AS val, 'kgCH4/litre' AS unit, 'kgCH4' AS num, 'litre' AS den, NULL AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'FUEL_DIESEL_B7' AS cat, 'N2O' AS gas, 0.00000000 AS val, 'kgN2O/litre' AS unit, 'kgN2O' AS num, 'litre' AS den, NULL AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'FUEL_DIESEL_B20' AS cat, 'CO2' AS gas, 2.15900000 AS val, 'kgCO2/litre' AS unit, 'kgCO2' AS num, 'litre' AS den, 'fossil' AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'FUEL_DIESEL_B20' AS cat, 'CH4_FOSSIL' AS gas, 0.00010000 AS val, 'kgCH4/litre' AS unit, 'kgCH4' AS num, 'litre' AS den, NULL AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'FUEL_DIESEL_B20' AS cat, 'N2O' AS gas, 0.00000000 AS val, 'kgN2O/litre' AS unit, 'kgN2O' AS num, 'litre' AS den, NULL AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'FUEL_GASOHOL_E10' AS cat, 'CO2' AS gas, 1.96340000 AS val, 'kgCO2/litre' AS unit, 'kgCO2' AS num, 'litre' AS den, 'fossil' AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'FUEL_GASOHOL_E10' AS cat, 'CH4_FOSSIL' AS gas, 0.00010000 AS val, 'kgCH4/litre' AS unit, 'kgCH4' AS num, 'litre' AS den, NULL AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'FUEL_GASOHOL_E10' AS cat, 'N2O' AS gas, 0.00000000 AS val, 'kgN2O/litre' AS unit, 'kgN2O' AS num, 'litre' AS den, NULL AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'FUEL_GASOHOL_E20' AS cat, 'CO2' AS gas, 1.74530000 AS val, 'kgCO2/litre' AS unit, 'kgCO2' AS num, 'litre' AS den, 'fossil' AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'FUEL_GASOHOL_E20' AS cat, 'CH4_FOSSIL' AS gas, 0.00010000 AS val, 'kgCH4/litre' AS unit, 'kgCH4' AS num, 'litre' AS den, NULL AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'FUEL_GASOHOL_E20' AS cat, 'N2O' AS gas, 0.00000000 AS val, 'kgN2O/litre' AS unit, 'kgN2O' AS num, 'litre' AS den, NULL AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'FUEL_GASOHOL_E85' AS cat, 'CO2' AS gas, 0.32720000 AS val, 'kgCO2/litre' AS unit, 'kgCO2' AS num, 'litre' AS den, 'fossil' AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'FUEL_GASOHOL_E85' AS cat, 'CH4_FOSSIL' AS gas, 0.00010000 AS val, 'kgCH4/litre' AS unit, 'kgCH4' AS num, 'litre' AS den, NULL AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'FUEL_GASOHOL_E85' AS cat, 'N2O' AS gas, 0.00000000 AS val, 'kgN2O/litre' AS unit, 'kgN2O' AS num, 'litre' AS den, NULL AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'FUEL_DIESEL_B7_BIO' AS cat, 'CO2_BIO' AS gas, 0.11510000 AS val, 'kgCO2bio/litre' AS unit, 'kgCO2bio' AS num, 'litre' AS den, 'biogenic' AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'FUEL_DIESEL_B20_BIO' AS cat, 'CO2_BIO' AS gas, 0.32880000 AS val, 'kgCO2bio/litre' AS unit, 'kgCO2bio' AS num, 'litre' AS den, 'biogenic' AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'FUEL_GASOHOL_E10_BIO' AS cat, 'CO2_BIO' AS gas, 0.14970000 AS val, 'kgCO2bio/litre' AS unit, 'kgCO2bio' AS num, 'litre' AS den, 'biogenic' AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'FUEL_GASOHOL_E20_BIO' AS cat, 'CO2_BIO' AS gas, 0.29940000 AS val, 'kgCO2bio/litre' AS unit, 'kgCO2bio' AS num, 'litre' AS den, 'biogenic' AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'FUEL_GASOHOL_E85_BIO' AS cat, 'CO2_BIO' AS gas, 1.27230000 AS val, 'kgCO2bio/litre' AS unit, 'kgCO2bio' AS num, 'litre' AS den, 'biogenic' AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'MOBILE_ONROAD_CNG' AS cat, 'CO2' AS gas, 2.12620000 AS val, 'kgCO2/kg' AS unit, 'kgCO2' AS num, 'kg' AS den, 'fossil' AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'MOBILE_ONROAD_CNG' AS cat, 'CH4_FOSSIL' AS gas, 0.00349000 AS val, 'kgCH4/kg' AS unit, 'kgCH4' AS num, 'kg' AS den, NULL AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'MOBILE_ONROAD_CNG' AS cat, 'N2O' AS gas, 0.00011400 AS val, 'kgN2O/kg' AS unit, 'kgN2O' AS num, 'kg' AS den, NULL AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'MOBILE_ONROAD_LPG_KG' AS cat, 'CO2' AS gas, 3.11060000 AS val, 'kgCO2/kg' AS unit, 'kgCO2' AS num, 'kg' AS den, 'fossil' AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'MOBILE_ONROAD_LPG_KG' AS cat, 'CH4_FOSSIL' AS gas, 0.00306000 AS val, 'kgCH4/kg' AS unit, 'kgCH4' AS num, 'kg' AS den, NULL AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'MOBILE_ONROAD_LPG_KG' AS cat, 'N2O' AS gas, 0.00000986 AS val, 'kgN2O/kg' AS unit, 'kgN2O' AS num, 'kg' AS den, NULL AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'MOBILE_ONROAD_LPG_L' AS cat, 'CO2' AS gas, 1.67970000 AS val, 'kgCO2/litre' AS unit, 'kgCO2' AS num, 'litre' AS den, 'fossil' AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'MOBILE_ONROAD_LPG_L' AS cat, 'CH4_FOSSIL' AS gas, 0.00165000 AS val, 'kgCH4/litre' AS unit, 'kgCH4' AS num, 'litre' AS den, NULL AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'MOBILE_ONROAD_LPG_L' AS cat, 'N2O' AS gas, 0.00000532 AS val, 'kgN2O/litre' AS unit, 'kgN2O' AS num, 'litre' AS den, NULL AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'MOBILE_ONROAD_DIESEL' AS cat, 'CO2' AS gas, 2.69870000 AS val, 'kgCO2/litre' AS unit, 'kgCO2' AS num, 'litre' AS den, 'fossil' AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'MOBILE_ONROAD_DIESEL' AS cat, 'CH4_FOSSIL' AS gas, 0.00014200 AS val, 'kgCH4/litre' AS unit, 'kgCH4' AS num, 'litre' AS den, NULL AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'MOBILE_ONROAD_DIESEL' AS cat, 'N2O' AS gas, 0.00014200 AS val, 'kgN2O/litre' AS unit, 'kgN2O' AS num, 'litre' AS den, NULL AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'MOBILE_ONROAD_GAS_UNCNTRL' AS cat, 'CO2' AS gas, 2.18160000 AS val, 'kgCO2/litre' AS unit, 'kgCO2' AS num, 'litre' AS den, 'fossil' AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'MOBILE_ONROAD_GAS_UNCNTRL' AS cat, 'CH4_FOSSIL' AS gas, 0.00104000 AS val, 'kgCH4/litre' AS unit, 'kgCH4' AS num, 'litre' AS den, NULL AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'MOBILE_ONROAD_GAS_UNCNTRL' AS cat, 'N2O' AS gas, 0.00010100 AS val, 'kgN2O/litre' AS unit, 'kgN2O' AS num, 'litre' AS den, NULL AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'MOBILE_ONROAD_GAS_OXCAT' AS cat, 'CO2' AS gas, 2.18160000 AS val, 'kgCO2/litre' AS unit, 'kgCO2' AS num, 'litre' AS den, 'fossil' AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'MOBILE_ONROAD_GAS_OXCAT' AS cat, 'CH4_FOSSIL' AS gas, 0.00078700 AS val, 'kgCH4/litre' AS unit, 'kgCH4' AS num, 'litre' AS den, NULL AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'MOBILE_ONROAD_GAS_OXCAT' AS cat, 'N2O' AS gas, 0.00025200 AS val, 'kgN2O/litre' AS unit, 'kgN2O' AS num, 'litre' AS den, NULL AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'MOBILE_ONROAD_GAS_LOWM' AS cat, 'CO2' AS gas, 2.18160000 AS val, 'kgCO2/litre' AS unit, 'kgCO2' AS num, 'litre' AS den, 'fossil' AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'MOBILE_ONROAD_GAS_LOWM' AS cat, 'CH4_FOSSIL' AS gas, 0.00012000 AS val, 'kgCH4/litre' AS unit, 'kgCH4' AS num, 'litre' AS den, NULL AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'MOBILE_ONROAD_GAS_LOWM' AS cat, 'N2O' AS gas, 0.00017900 AS val, 'kgN2O/litre' AS unit, 'kgN2O' AS num, 'litre' AS den, NULL AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'MOBILE_ONROAD_BIODIESEL' AS cat, 'CO2' AS gas, 1.64400000 AS val, 'kgCO2/litre' AS unit, 'kgCO2' AS num, 'litre' AS den, 'fossil' AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'MOBILE_ONROAD_BIODIESEL' AS cat, 'CH4_FOSSIL' AS gas, 0.00010000 AS val, 'kgCH4/litre' AS unit, 'kgCH4' AS num, 'litre' AS den, NULL AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'MOBILE_ONROAD_BIODIESEL' AS cat, 'N2O' AS gas, 0.00010000 AS val, 'kgN2O/litre' AS unit, 'kgN2O' AS num, 'litre' AS den, NULL AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'MOBILE_ONROAD_ETHANOL' AS cat, 'CO2' AS gas, 1.49680000 AS val, 'kgCO2/litre' AS unit, 'kgCO2' AS num, 'litre' AS den, 'fossil' AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'MOBILE_ONROAD_ETHANOL' AS cat, 'CH4' AS gas, 0.00040000 AS val, 'kgCH4/litre' AS unit, 'kgCH4' AS num, 'litre' AS den, NULL AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'MOBILE_ONROAD_B7' AS cat, 'CO2' AS gas, 2.50980000 AS val, 'kgCO2/litre' AS unit, 'kgCO2' AS num, 'litre' AS den, 'fossil' AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'MOBILE_ONROAD_B7' AS cat, 'CH4_FOSSIL' AS gas, 0.00010000 AS val, 'kgCH4/litre' AS unit, 'kgCH4' AS num, 'litre' AS den, NULL AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'MOBILE_ONROAD_B7' AS cat, 'N2O' AS gas, 0.00010000 AS val, 'kgN2O/litre' AS unit, 'kgN2O' AS num, 'litre' AS den, NULL AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'MOBILE_ONROAD_B20' AS cat, 'CO2' AS gas, 2.15900000 AS val, 'kgCO2/litre' AS unit, 'kgCO2' AS num, 'litre' AS den, 'fossil' AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'MOBILE_ONROAD_B20' AS cat, 'CH4_FOSSIL' AS gas, 0.00010000 AS val, 'kgCH4/litre' AS unit, 'kgCH4' AS num, 'litre' AS den, NULL AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'MOBILE_ONROAD_B20' AS cat, 'N2O' AS gas, 0.00010000 AS val, 'kgN2O/litre' AS unit, 'kgN2O' AS num, 'litre' AS den, NULL AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'MOBILE_ONROAD_E10_OXCAT' AS cat, 'CO2' AS gas, 1.96340000 AS val, 'kgCO2/litre' AS unit, 'kgCO2' AS num, 'litre' AS den, 'fossil' AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'MOBILE_ONROAD_E10_OXCAT' AS cat, 'CH4_FOSSIL' AS gas, 0.00070000 AS val, 'kgCH4/litre' AS unit, 'kgCH4' AS num, 'litre' AS den, NULL AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'MOBILE_ONROAD_E10_OXCAT' AS cat, 'N2O' AS gas, 0.00020000 AS val, 'kgN2O/litre' AS unit, 'kgN2O' AS num, 'litre' AS den, NULL AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'MOBILE_ONROAD_E20_OXCAT' AS cat, 'CO2' AS gas, 1.74530000 AS val, 'kgCO2/litre' AS unit, 'kgCO2' AS num, 'litre' AS den, 'fossil' AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'MOBILE_ONROAD_E20_OXCAT' AS cat, 'CH4_FOSSIL' AS gas, 0.00070000 AS val, 'kgCH4/litre' AS unit, 'kgCH4' AS num, 'litre' AS den, NULL AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'MOBILE_ONROAD_E20_OXCAT' AS cat, 'N2O' AS gas, 0.00020000 AS val, 'kgN2O/litre' AS unit, 'kgN2O' AS num, 'litre' AS den, NULL AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'MOBILE_ONROAD_E85_OXCAT' AS cat, 'CO2' AS gas, 0.32720000 AS val, 'kgCO2/litre' AS unit, 'kgCO2' AS num, 'litre' AS den, 'fossil' AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'MOBILE_ONROAD_E85_OXCAT' AS cat, 'CH4_FOSSIL' AS gas, 0.00040000 AS val, 'kgCH4/litre' AS unit, 'kgCH4' AS num, 'litre' AS den, NULL AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'MOBILE_ONROAD_E85_OXCAT' AS cat, 'N2O' AS gas, 0.00000000 AS val, 'kgN2O/litre' AS unit, 'kgN2O' AS num, 'litre' AS den, NULL AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'MOBILE_ONROAD_E10_LOWM' AS cat, 'CO2' AS gas, 1.96340000 AS val, 'kgCO2/litre' AS unit, 'kgCO2' AS num, 'litre' AS den, 'fossil' AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'MOBILE_ONROAD_E10_LOWM' AS cat, 'CH4_FOSSIL' AS gas, 0.00010000 AS val, 'kgCH4/litre' AS unit, 'kgCH4' AS num, 'litre' AS den, NULL AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'MOBILE_ONROAD_E10_LOWM' AS cat, 'N2O' AS gas, 0.00020000 AS val, 'kgN2O/litre' AS unit, 'kgN2O' AS num, 'litre' AS den, NULL AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'MOBILE_ONROAD_E20_LOWM' AS cat, 'CO2' AS gas, 1.74530000 AS val, 'kgCO2/litre' AS unit, 'kgCO2' AS num, 'litre' AS den, 'fossil' AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'MOBILE_ONROAD_E20_LOWM' AS cat, 'CH4_FOSSIL' AS gas, 0.00020000 AS val, 'kgCH4/litre' AS unit, 'kgCH4' AS num, 'litre' AS den, NULL AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'MOBILE_ONROAD_E20_LOWM' AS cat, 'N2O' AS gas, 0.00010000 AS val, 'kgN2O/litre' AS unit, 'kgN2O' AS num, 'litre' AS den, NULL AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'MOBILE_ONROAD_E85_LOWM' AS cat, 'CO2' AS gas, 0.32720000 AS val, 'kgCO2/litre' AS unit, 'kgCO2' AS num, 'litre' AS den, 'fossil' AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'MOBILE_ONROAD_E85_LOWM' AS cat, 'CH4_FOSSIL' AS gas, 0.00030000 AS val, 'kgCH4/litre' AS unit, 'kgCH4' AS num, 'litre' AS den, NULL AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'MOBILE_ONROAD_E85_LOWM' AS cat, 'N2O' AS gas, 0.00000000 AS val, 'kgN2O/litre' AS unit, 'kgN2O' AS num, 'litre' AS den, NULL AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'MOBILE_ONROAD_B7_BIO' AS cat, 'CO2_BIO' AS gas, 0.11510000 AS val, 'kgCO2bio/litre' AS unit, 'kgCO2bio' AS num, 'litre' AS den, 'biogenic' AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'MOBILE_ONROAD_B20_BIO' AS cat, 'CO2_BIO' AS gas, 0.32880000 AS val, 'kgCO2bio/litre' AS unit, 'kgCO2bio' AS num, 'litre' AS den, 'biogenic' AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'MOBILE_ONROAD_E10_OXCAT_BIO' AS cat, 'CO2_BIO' AS gas, 0.14970000 AS val, 'kgCO2bio/litre' AS unit, 'kgCO2bio' AS num, 'litre' AS den, 'biogenic' AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'MOBILE_ONROAD_E20_OXCAT_BIO' AS cat, 'CO2_BIO' AS gas, 0.29940000 AS val, 'kgCO2bio/litre' AS unit, 'kgCO2bio' AS num, 'litre' AS den, 'biogenic' AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'MOBILE_ONROAD_E85_OXCAT_BIO' AS cat, 'CO2_BIO' AS gas, 1.27230000 AS val, 'kgCO2bio/litre' AS unit, 'kgCO2bio' AS num, 'litre' AS den, 'biogenic' AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'MOBILE_ONROAD_E10_LOWM_BIO' AS cat, 'CO2_BIO' AS gas, 0.14970000 AS val, 'kgCO2bio/litre' AS unit, 'kgCO2bio' AS num, 'litre' AS den, 'biogenic' AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'MOBILE_ONROAD_E20_LOWM_BIO' AS cat, 'CO2_BIO' AS gas, 0.29940000 AS val, 'kgCO2bio/litre' AS unit, 'kgCO2bio' AS num, 'litre' AS den, 'biogenic' AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'MOBILE_ONROAD_E85_LOWM_BIO' AS cat, 'CO2_BIO' AS gas, 1.27230000 AS val, 'kgCO2bio/litre' AS unit, 'kgCO2bio' AS num, 'litre' AS den, 'biogenic' AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'MOBILE_OFFROAD_LPG_KG' AS cat, 'CO2' AS gas, 3.11060000 AS val, 'kgCO2/kg' AS unit, 'kgCO2' AS num, 'kg' AS den, 'fossil' AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'MOBILE_OFFROAD_LPG_KG' AS cat, 'CH4_FOSSIL' AS gas, 0.00250000 AS val, 'kgCH4/kg' AS unit, 'kgCH4' AS num, 'kg' AS den, NULL AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'MOBILE_OFFROAD_LPG_KG' AS cat, 'N2O' AS gas, 0.00010000 AS val, 'kgN2O/kg' AS unit, 'kgN2O' AS num, 'kg' AS den, NULL AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'MOBILE_OFFROAD_DIESEL' AS cat, 'CO2' AS gas, 2.69870000 AS val, 'kgCO2/litre' AS unit, 'kgCO2' AS num, 'litre' AS den, 'fossil' AS co2, 'Agriculture' AS sub, 'ดีเซลนอกถนน (Agriculture)' AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'MOBILE_OFFROAD_DIESEL' AS cat, 'CH4_FOSSIL' AS gas, 0.00015100 AS val, 'kgCH4/litre' AS unit, 'kgCH4' AS num, 'litre' AS den, NULL AS co2, 'Agriculture' AS sub, 'ดีเซลนอกถนน (Agriculture)' AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'MOBILE_OFFROAD_DIESEL' AS cat, 'N2O' AS gas, 0.00104000 AS val, 'kgN2O/litre' AS unit, 'kgN2O' AS num, 'litre' AS den, NULL AS co2, 'Agriculture' AS sub, 'ดีเซลนอกถนน (Agriculture)' AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'MOBILE_OFFROAD_DIESEL' AS cat, 'CO2' AS gas, 2.69870000 AS val, 'kgCO2/litre' AS unit, 'kgCO2' AS num, 'litre' AS den, 'fossil' AS co2, 'Forestry' AS sub, 'ดีเซลนอกถนน (Forestry)' AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'MOBILE_OFFROAD_DIESEL' AS cat, 'CH4_FOSSIL' AS gas, 0.00015100 AS val, 'kgCH4/litre' AS unit, 'kgCH4' AS num, 'litre' AS den, NULL AS co2, 'Forestry' AS sub, 'ดีเซลนอกถนน (Forestry)' AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'MOBILE_OFFROAD_DIESEL' AS cat, 'N2O' AS gas, 0.00104000 AS val, 'kgN2O/litre' AS unit, 'kgN2O' AS num, 'litre' AS den, NULL AS co2, 'Forestry' AS sub, 'ดีเซลนอกถนน (Forestry)' AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'MOBILE_OFFROAD_DIESEL' AS cat, 'CO2' AS gas, 2.69870000 AS val, 'kgCO2/litre' AS unit, 'kgCO2' AS num, 'litre' AS den, 'fossil' AS co2, 'Industry' AS sub, 'ดีเซลนอกถนน (Industry)' AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'MOBILE_OFFROAD_DIESEL' AS cat, 'CH4_FOSSIL' AS gas, 0.00015100 AS val, 'kgCH4/litre' AS unit, 'kgCH4' AS num, 'litre' AS den, NULL AS co2, 'Industry' AS sub, 'ดีเซลนอกถนน (Industry)' AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'MOBILE_OFFROAD_DIESEL' AS cat, 'N2O' AS gas, 0.00104000 AS val, 'kgN2O/litre' AS unit, 'kgN2O' AS num, 'litre' AS den, NULL AS co2, 'Industry' AS sub, 'ดีเซลนอกถนน (Industry)' AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'MOBILE_OFFROAD_DIESEL' AS cat, 'CO2' AS gas, 2.69870000 AS val, 'kgCO2/litre' AS unit, 'kgCO2' AS num, 'litre' AS den, 'fossil' AS co2, 'Household' AS sub, 'ดีเซลนอกถนน (Household)' AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'MOBILE_OFFROAD_DIESEL' AS cat, 'CH4_FOSSIL' AS gas, 0.00015100 AS val, 'kgCH4/litre' AS unit, 'kgCH4' AS num, 'litre' AS den, NULL AS co2, 'Household' AS sub, 'ดีเซลนอกถนน (Household)' AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'MOBILE_OFFROAD_DIESEL' AS cat, 'N2O' AS gas, 0.00104000 AS val, 'kgN2O/litre' AS unit, 'kgN2O' AS num, 'litre' AS den, NULL AS co2, 'Household' AS sub, 'ดีเซลนอกถนน (Household)' AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'MOBILE_OFFROAD_BIODIESEL' AS cat, 'CO2' AS gas, 1.64400000 AS val, 'kgCO2/litre' AS unit, 'kgCO2' AS num, 'litre' AS den, 'fossil' AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'MOBILE_OFFROAD_ETHANOL' AS cat, 'CO2' AS gas, 1.49680000 AS val, 'kgCO2/litre' AS unit, 'kgCO2' AS num, 'litre' AS den, 'fossil' AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'MOBILE_OFFROAD_GAS4ST' AS cat, 'CO2' AS gas, 2.18160000 AS val, 'kgCO2/litre' AS unit, 'kgCO2' AS num, 'litre' AS den, 'fossil' AS co2, 'Agriculture' AS sub, 'เบนซิน 4-stroke (Agriculture)' AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'MOBILE_OFFROAD_GAS4ST' AS cat, 'CH4_FOSSIL' AS gas, 0.00252000 AS val, 'kgCH4/litre' AS unit, 'kgCH4' AS num, 'litre' AS den, NULL AS co2, 'Agriculture' AS sub, 'เบนซิน 4-stroke (Agriculture) CH4' AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'MOBILE_OFFROAD_GAS4ST' AS cat, 'N2O' AS gas, 0.00006300 AS val, 'kgN2O/litre' AS unit, 'kgN2O' AS num, 'litre' AS den, NULL AS co2, 'Agriculture' AS sub, 'เบนซิน 4-stroke (Agriculture) N2O' AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'MOBILE_OFFROAD_GAS4ST' AS cat, 'CO2' AS gas, 2.18160000 AS val, 'kgCO2/litre' AS unit, 'kgCO2' AS num, 'litre' AS den, 'fossil' AS co2, 'Forestry' AS sub, 'เบนซิน 4-stroke (Forestry)' AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'MOBILE_OFFROAD_GAS4ST' AS cat, 'CH4_FOSSIL' AS gas, 0.00000000 AS val, 'kgCH4/litre' AS unit, 'kgCH4' AS num, 'litre' AS den, NULL AS co2, 'Forestry' AS sub, 'เบนซิน 4-stroke (Forestry) CH4' AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'MOBILE_OFFROAD_GAS4ST' AS cat, 'N2O' AS gas, 0.00000000 AS val, 'kgN2O/litre' AS unit, 'kgN2O' AS num, 'litre' AS den, NULL AS co2, 'Forestry' AS sub, 'เบนซิน 4-stroke (Forestry) N2O' AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'MOBILE_OFFROAD_GAS4ST' AS cat, 'CO2' AS gas, 2.18160000 AS val, 'kgCO2/litre' AS unit, 'kgCO2' AS num, 'litre' AS den, 'fossil' AS co2, 'Industry' AS sub, 'เบนซิน 4-stroke (Industry)' AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'MOBILE_OFFROAD_GAS4ST' AS cat, 'CH4_FOSSIL' AS gas, 0.00157000 AS val, 'kgCH4/litre' AS unit, 'kgCH4' AS num, 'litre' AS den, NULL AS co2, 'Industry' AS sub, 'เบนซิน 4-stroke (Industry) CH4' AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'MOBILE_OFFROAD_GAS4ST' AS cat, 'N2O' AS gas, 0.00006300 AS val, 'kgN2O/litre' AS unit, 'kgN2O' AS num, 'litre' AS den, NULL AS co2, 'Industry' AS sub, 'เบนซิน 4-stroke (Industry) N2O' AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'MOBILE_OFFROAD_GAS4ST' AS cat, 'CO2' AS gas, 2.18160000 AS val, 'kgCO2/litre' AS unit, 'kgCO2' AS num, 'litre' AS den, 'fossil' AS co2, 'Household' AS sub, 'เบนซิน 4-stroke (Household)' AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'MOBILE_OFFROAD_GAS4ST' AS cat, 'CH4_FOSSIL' AS gas, 0.00378000 AS val, 'kgCH4/litre' AS unit, 'kgCH4' AS num, 'litre' AS den, NULL AS co2, 'Household' AS sub, 'เบนซิน 4-stroke (Household) CH4' AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'MOBILE_OFFROAD_GAS4ST' AS cat, 'N2O' AS gas, 0.00006300 AS val, 'kgN2O/litre' AS unit, 'kgN2O' AS num, 'litre' AS den, NULL AS co2, 'Household' AS sub, 'เบนซิน 4-stroke (Household) N2O' AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'MOBILE_OFFROAD_GAS2ST' AS cat, 'CO2' AS gas, 2.18160000 AS val, 'kgCO2/litre' AS unit, 'kgCO2' AS num, 'litre' AS den, 'fossil' AS co2, 'Agriculture' AS sub, 'เบนซิน 2-stroke (Agriculture)' AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'MOBILE_OFFROAD_GAS2ST' AS cat, 'CH4_FOSSIL' AS gas, 0.00441000 AS val, 'kgCH4/litre' AS unit, 'kgCH4' AS num, 'litre' AS den, NULL AS co2, 'Agriculture' AS sub, 'เบนซิน 2-stroke (Agriculture) CH4' AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'MOBILE_OFFROAD_GAS2ST' AS cat, 'N2O' AS gas, 0.00001260 AS val, 'kgN2O/litre' AS unit, 'kgN2O' AS num, 'litre' AS den, NULL AS co2, 'Agriculture' AS sub, 'เบนซิน 2-stroke (Agriculture) N2O' AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'MOBILE_OFFROAD_GAS2ST' AS cat, 'CO2' AS gas, 2.18160000 AS val, 'kgCO2/litre' AS unit, 'kgCO2' AS num, 'litre' AS den, 'fossil' AS co2, 'Forestry' AS sub, 'เบนซิน 2-stroke (Forestry)' AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'MOBILE_OFFROAD_GAS2ST' AS cat, 'CH4_FOSSIL' AS gas, 0.00535000 AS val, 'kgCH4/litre' AS unit, 'kgCH4' AS num, 'litre' AS den, NULL AS co2, 'Forestry' AS sub, 'เบนซิน 2-stroke (Forestry) CH4' AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'MOBILE_OFFROAD_GAS2ST' AS cat, 'N2O' AS gas, 0.00001260 AS val, 'kgN2O/litre' AS unit, 'kgN2O' AS num, 'litre' AS den, NULL AS co2, 'Forestry' AS sub, 'เบนซิน 2-stroke (Forestry) N2O' AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'MOBILE_OFFROAD_GAS2ST' AS cat, 'CO2' AS gas, 2.18160000 AS val, 'kgCO2/litre' AS unit, 'kgCO2' AS num, 'litre' AS den, 'fossil' AS co2, 'Industry' AS sub, 'เบนซิน 2-stroke (Industry)' AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'MOBILE_OFFROAD_GAS2ST' AS cat, 'CH4_FOSSIL' AS gas, 0.00409000 AS val, 'kgCH4/litre' AS unit, 'kgCH4' AS num, 'litre' AS den, NULL AS co2, 'Industry' AS sub, 'เบนซิน 2-stroke (Industry) CH4' AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'MOBILE_OFFROAD_GAS2ST' AS cat, 'N2O' AS gas, 0.00001260 AS val, 'kgN2O/litre' AS unit, 'kgN2O' AS num, 'litre' AS den, NULL AS co2, 'Industry' AS sub, 'เบนซิน 2-stroke (Industry) N2O' AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'MOBILE_OFFROAD_GAS2ST' AS cat, 'CO2' AS gas, 2.18160000 AS val, 'kgCO2/litre' AS unit, 'kgCO2' AS num, 'litre' AS den, 'fossil' AS co2, 'Household' AS sub, 'เบนซิน 2-stroke (Household)' AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'MOBILE_OFFROAD_GAS2ST' AS cat, 'CH4_FOSSIL' AS gas, 0.00567000 AS val, 'kgCH4/litre' AS unit, 'kgCH4' AS num, 'litre' AS den, NULL AS co2, 'Household' AS sub, 'เบนซิน 2-stroke (Household) CH4' AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'MOBILE_OFFROAD_GAS2ST' AS cat, 'N2O' AS gas, 0.00001260 AS val, 'kgN2O/litre' AS unit, 'kgN2O' AS num, 'litre' AS den, NULL AS co2, 'Household' AS sub, 'เบนซิน 2-stroke (Household) N2O' AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'MOBILE_OFFROAD_B7' AS cat, 'CO2' AS gas, 2.50980000 AS val, 'kgCO2/litre' AS unit, 'kgCO2' AS num, 'litre' AS den, 'fossil' AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'MOBILE_OFFROAD_B7' AS cat, 'CH4_FOSSIL' AS gas, 0.00020000 AS val, 'kgCH4/litre' AS unit, 'kgCH4' AS num, 'litre' AS den, NULL AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'MOBILE_OFFROAD_B7' AS cat, 'N2O' AS gas, 0.00100000 AS val, 'kgN2O/litre' AS unit, 'kgN2O' AS num, 'litre' AS den, NULL AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'MOBILE_OFFROAD_B7_BIO' AS cat, 'CO2_BIO' AS gas, 0.11510000 AS val, 'kgCO2bio/litre' AS unit, 'kgCO2bio' AS num, 'litre' AS den, 'biogenic' AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'TGO_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'FUGITIVE_R22' AS cat, 'R22' AS gas, 1760.00000000 AS val, 'kgCO2eq/kg' AS unit, 'kgCO2eq' AS num, 'kg' AS den, NULL AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'IPCC_2013_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'FUGITIVE_R32' AS cat, 'R32' AS gas, 677.00000000 AS val, 'kgCO2eq/kg' AS unit, 'kgCO2eq' AS num, 'kg' AS den, NULL AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'IPCC_2013_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'FUGITIVE_R125' AS cat, 'R125' AS gas, 3170.00000000 AS val, 'kgCO2eq/kg' AS unit, 'kgCO2eq' AS num, 'kg' AS den, NULL AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'IPCC_2013_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'FUGITIVE_R134' AS cat, 'R134' AS gas, 1120.00000000 AS val, 'kgCO2eq/kg' AS unit, 'kgCO2eq' AS num, 'kg' AS den, NULL AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'IPCC_2013_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'FUGITIVE_R134A' AS cat, 'R134A' AS gas, 1300.00000000 AS val, 'kgCO2eq/kg' AS unit, 'kgCO2eq' AS num, 'kg' AS den, NULL AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'IPCC_2013_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'FUGITIVE_R143' AS cat, 'R143' AS gas, 328.00000000 AS val, 'kgCO2eq/kg' AS unit, 'kgCO2eq' AS num, 'kg' AS den, NULL AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'IPCC_2013_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'FUGITIVE_R143A' AS cat, 'R143A' AS gas, 4800.00000000 AS val, 'kgCO2eq/kg' AS unit, 'kgCO2eq' AS num, 'kg' AS den, NULL AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'IPCC_2013_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'FUGITIVE_R404A' AS cat, 'R404A' AS gas, 3942.80000000 AS val, 'kgCO2eq/kg' AS unit, 'kgCO2eq' AS num, 'kg' AS den, NULL AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'IPCC_2013_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'FUGITIVE_R407A' AS cat, 'R407A' AS gas, 1923.40000000 AS val, 'kgCO2eq/kg' AS unit, 'kgCO2eq' AS num, 'kg' AS den, NULL AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'IPCC_2013_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'FUGITIVE_R407C' AS cat, 'R407C' AS gas, 1624.21000000 AS val, 'kgCO2eq/kg' AS unit, 'kgCO2eq' AS num, 'kg' AS den, NULL AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'IPCC_2013_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'FUGITIVE_R410A' AS cat, 'R410A' AS gas, 1923.50000000 AS val, 'kgCO2eq/kg' AS unit, 'kgCO2eq' AS num, 'kg' AS den, NULL AS co2, NULL AS sub, NULL AS name_th, NULL AS purpose, 'IPCC_2013_AR5' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'ELEC_GRID_TH_2016_S2' AS cat, 'CO2' AS gas, 0.49990000 AS val, 'kgCO2/kWh' AS unit, 'kgCO2' AS num, 'kWh' AS den, 'fossil' AS co2, NULL AS sub, NULL AS name_th, 'cfo_scope2' AS purpose, 'THAI_LCI' AS src, '2026-01-01' AS eff_from, '2026-03-31' AS until, 0 AS is_def
  UNION ALL
  SELECT 'ELEC_GRID_TH_2016_S3' AS cat, 'CO2' AS gas, 0.09870000 AS val, 'kgCO2/kWh' AS unit, 'kgCO2' AS num, 'kWh' AS den, 'fossil' AS co2, NULL AS sub, NULL AS name_th, 'scope3_elec' AS purpose, 'THAI_LCI' AS src, '2026-01-01' AS eff_from, '2026-03-31' AS until, 0 AS is_def
  UNION ALL
  SELECT 'ELEC_GRID_TH_2016_CFP' AS cat, 'CO2' AS gas, 0.59860000 AS val, 'kgCO2/kWh' AS unit, 'kgCO2' AS num, 'kWh' AS den, 'fossil' AS co2, NULL AS sub, NULL AS name_th, 'cfp' AS purpose, 'THAI_LCI' AS src, '2026-01-01' AS eff_from, NULL AS until, 0 AS is_def
  UNION ALL
  SELECT 'ELEC_GRID_TH_2022_S2' AS cat, 'CO2' AS gas, 0.47500000 AS val, 'kgCO2/kWh' AS unit, 'kgCO2' AS num, 'kWh' AS den, 'fossil' AS co2, NULL AS sub, NULL AS name_th, 'cfo_scope2' AS purpose, 'THAI_LCI' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'ELEC_GRID_TH_2022_S3' AS cat, 'CO2' AS gas, 0.08120000 AS val, 'kgCO2/kWh' AS unit, 'kgCO2' AS num, 'kWh' AS den, 'fossil' AS co2, NULL AS sub, NULL AS name_th, 'scope3_elec' AS purpose, 'THAI_LCI' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'ELEC_GRID_TH_2022_CFP' AS cat, 'CO2' AS gas, 0.55620000 AS val, 'kgCO2/kWh' AS unit, 'kgCO2' AS num, 'kWh' AS den, 'fossil' AS co2, NULL AS sub, NULL AS name_th, 'cfp' AS purpose, 'THAI_LCI' AS src, '2026-01-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'S3C1_PAPER' AS cat, 'CO2' AS gas, 2.10200000 AS val, 'kgCO2eq/kg' AS unit, 'kgCO2eq' AS num, 'kg' AS den, NULL AS co2, NULL AS sub, 'กระดาษ' AS name_th, NULL AS purpose, 'TGO_CFP_2565' AS src, '2022-07-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'S3C1_INK' AS cat, 'CO2' AS gas, 4.52000000 AS val, 'kgCO2eq/kg' AS unit, 'kgCO2eq' AS num, 'kg' AS den, NULL AS co2, NULL AS sub, 'หมึกพิมพ์ / หมึกทั่วไป' AS name_th, NULL AS purpose, 'TGO_CFP_2565' AS src, '2022-07-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'S3C1_WATER' AS cat, 'CO2' AS gas, 0.54100000 AS val, 'kgCO2eq/m3' AS unit, 'kgCO2eq' AS num, 'm3' AS den, NULL AS co2, NULL AS sub, 'น้ำประปา' AS name_th, NULL AS purpose, 'TGO_CFP_2565' AS src, '2022-07-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'S3C3_DIESEL_UPS' AS cat, 'CO2' AS gas, 0.35220000 AS val, 'kgCO2eq/kg' AS unit, 'kgCO2eq' AS num, 'kg' AS den, NULL AS co2, NULL AS sub, 'การได้มาของน้ำมันดีเซล' AS name_th, NULL AS purpose, 'TGO_CFP_2565' AS src, '2022-07-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'S3C3_GASOLINE_UPS' AS cat, 'CO2' AS gas, 0.40240000 AS val, 'kgCO2eq/kg' AS unit, 'kgCO2eq' AS num, 'kg' AS den, NULL AS co2, NULL AS sub, 'การได้มาของน้ำมันเบนซิน' AS name_th, NULL AS purpose, 'TGO_CFP_2565' AS src, '2022-07-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'S3C3_ELEC_UPS' AS cat, 'CO2' AS gas, 0.09870000 AS val, 'kgCO2eq/kWh' AS unit, 'kgCO2eq' AS num, 'kWh' AS den, NULL AS co2, NULL AS sub, 'การได้มาของไฟฟ้า' AS name_th, NULL AS purpose, 'TGO_CFP_2565' AS src, '2022-07-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'S3C3_LPG_UPS' AS cat, 'CO2' AS gas, 0.85820000 AS val, 'kgCO2eq/kg' AS unit, 'kgCO2eq' AS num, 'kg' AS den, NULL AS co2, NULL AS sub, 'การได้มาของ LPG' AS name_th, NULL AS purpose, 'TGO_CFP_2565' AS src, '2022-07-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'S3C3_ETHANOL_UPS' AS cat, 'CO2' AS gas, 0.39620000 AS val, 'kgCO2eq/kg' AS unit, 'kgCO2eq' AS num, 'kg' AS den, NULL AS co2, NULL AS sub, 'การได้มาของเอทานอล (Ethanol acquisition)' AS name_th, NULL AS purpose, 'TGO_CFP_2565' AS src, '2022-07-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'S3C5_WASTE_LANDFILL' AS cat, 'CO2' AS gas, 0.79330000 AS val, 'kgCO2eq/kg' AS unit, 'kgCO2eq' AS num, 'kg' AS den, NULL AS co2, NULL AS sub, 'ขยะทั่วไป (กำจัดด้วยวิธีฝังกลบ)' AS name_th, NULL AS purpose, 'TGO_CFP_2565' AS src, '2022-07-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'S3C5_WASTE_INCIN' AS cat, 'CO2' AS gas, 1.21000000 AS val, 'kgCO2eq/kg' AS unit, 'kgCO2eq' AS num, 'kg' AS den, NULL AS co2, NULL AS sub, 'ขยะอันตราย (กำจัดด้วยวิธีเผาทำลาย)' AS name_th, NULL AS purpose, 'TGO_CFP_2565' AS src, '2022-07-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'S3C5_SLUDGE' AS cat, 'CO2' AS gas, 0.98280000 AS val, 'kgCO2eq/ton' AS unit, 'kgCO2eq' AS num, 'ton' AS den, NULL AS co2, NULL AS sub, 'กากตะกอน (ส่วนที่นำไปฝังกลบ)' AS name_th, NULL AS purpose, 'IPCC_AR5' AS src, '2022-07-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'S3C5_EXCAVATOR' AS cat, 'CO2' AS gas, 2.97930000 AS val, 'kgCO2eq/litre' AS unit, 'kgCO2eq' AS num, 'litre' AS den, NULL AS co2, NULL AS sub, 'รถแบคโฮ/รถขุด ดีเซล (off-road)' AS name_th, NULL AS purpose, 'TGO_CFP_2565' AS src, '2022-07-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'S3C2_BUILDING' AS cat, 'CO2' AS gas, 0.22920000 AS val, 'kgCO2eq/THB' AS unit, 'kgCO2eq' AS num, 'THB' AS den, NULL AS co2, NULL AS sub, 'อาคาร' AS name_th, NULL AS purpose, 'USEEIO_V1' AS src, '2022-07-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'S3C2_BUILDING' AS cat, 'CO2' AS gas, 0.22920000 AS val, 'kgCO2eq/THB' AS unit, 'kgCO2eq' AS num, 'THB' AS den, NULL AS co2, NULL AS sub, 'สิ่งปรับปรุงอาคาร' AS name_th, NULL AS purpose, 'USEEIO_V1' AS src, '2022-07-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'S3C2_OFFICE_EQUIP' AS cat, 'CO2' AS gas, 0.35740000 AS val, 'kgCO2eq/THB' AS unit, 'kgCO2eq' AS num, 'THB' AS den, NULL AS co2, NULL AS sub, 'อุปกรณ์สำนักงาน (เครื่องมือ, อุปกรณ์ตกแต่ง)' AS name_th, NULL AS purpose, 'USEEIO_V1' AS src, '2022-07-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'S3C2_COMPUTER' AS cat, 'CO2' AS gas, 0.14600000 AS val, 'kgCO2eq/THB' AS unit, 'kgCO2eq' AS num, 'THB' AS den, NULL AS co2, NULL AS sub, 'คอมพิวเตอร์' AS name_th, NULL AS purpose, 'USEEIO_V1' AS src, '2022-07-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'S3C2_SOFTWARE' AS cat, 'CO2' AS gas, 0.03980000 AS val, 'kgCO2eq/THB' AS unit, 'kgCO2eq' AS num, 'THB' AS den, NULL AS co2, NULL AS sub, 'โปรแกรมคอมพิวเตอร์ (ซอฟต์แวร์ระบบงาน)' AS name_th, NULL AS purpose, 'USEEIO_V1' AS src, '2022-07-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'S3C2_VEHICLE_CAP' AS cat, 'CO2' AS gas, 0.40860000 AS val, 'kgCO2eq/THB' AS unit, 'kgCO2eq' AS num, 'THB' AS den, NULL AS co2, NULL AS sub, 'ยานพาหนะ (Pickup trucks, vans, SUVs)' AS name_th, NULL AS purpose, 'USEEIO_V1' AS src, '2022-07-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'S3C5_TRANSPORT_TKM' AS cat, 'CO2' AS gas, 0.04750000 AS val, 'kgCO2eq/tkm' AS unit, 'kgCO2eq' AS num, 'tkm' AS den, NULL AS co2, NULL AS sub, 'รถบรรทุกขยะ 6 ล้อ (0% Loading)' AS name_th, NULL AS purpose, 'TGO_CFP_2565' AS src, '2022-07-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'S3C5_TRANSPORT_KM' AS cat, 'CO2' AS gas, 0.49230000 AS val, 'kgCO2eq/km' AS unit, 'kgCO2eq' AS num, 'km' AS den, NULL AS co2, NULL AS sub, 'รถบรรทุกขยะ 6 ล้อ (100% Loading)' AS name_th, NULL AS purpose, 'TGO_CFP_2565' AS src, '2022-07-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'S3C5_TRANSPORT_TKM' AS cat, 'CO2' AS gas, 0.21540000 AS val, 'kgCO2eq/tkm' AS unit, 'kgCO2eq' AS num, 'tkm' AS den, NULL AS co2, NULL AS sub, 'รถบรรทุกขยะรีไซเคิล 4 ล้อ (100% Loading)' AS name_th, NULL AS purpose, 'TGO_CFP_2565' AS src, '2022-07-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'S3C5_TRANSPORT_KM' AS cat, 'CO2' AS gas, 0.24150000 AS val, 'kgCO2eq/km' AS unit, 'kgCO2eq' AS num, 'km' AS den, NULL AS co2, NULL AS sub, 'รถบรรทุกขยะรีไซเคิล 4 ล้อ (0% Loading)' AS name_th, NULL AS purpose, 'TGO_CFP_2565' AS src, '2022-07-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'S3C5_TRANSPORT_TKM' AS cat, 'CO2' AS gas, 0.05330000 AS val, 'kgCO2eq/tkm' AS unit, 'kgCO2eq' AS num, 'tkm' AS den, NULL AS co2, NULL AS sub, 'รถขนส่งกากตะกอน 10 ล้อ (100% Loading)' AS name_th, NULL AS purpose, 'TGO_CFP_2565' AS src, '2022-07-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'S3C5_TRANSPORT_KM' AS cat, 'CO2' AS gas, 0.59000000 AS val, 'kgCO2eq/km' AS unit, 'kgCO2eq' AS num, 'km' AS den, NULL AS co2, NULL AS sub, 'รถขนส่งกากตะกอน 10 ล้อ (0% Loading)' AS name_th, NULL AS purpose, 'TGO_CFP_2565' AS src, '2022-07-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'S3C7_COMMUTE_DIESEL' AS cat, 'CO2' AS gas, 2.74060000 AS val, 'kgCO2eq/litre' AS unit, 'kgCO2eq' AS num, 'litre' AS den, NULL AS co2, NULL AS sub, 'รถกระบะ/รถยนต์/รถเมล์ (Diesel)' AS name_th, NULL AS purpose, 'TGO_CFP_2565' AS src, '2022-07-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'S3C7_COMMUTE_GAS' AS cat, 'CO2' AS gas, 2.23940000 AS val, 'kgCO2eq/litre' AS unit, 'kgCO2eq' AS num, 'litre' AS den, NULL AS co2, NULL AS sub, 'รถยนต์/รถจักรยานยนต์ (Gasoline)' AS name_th, NULL AS purpose, 'TGO_CFP_2565' AS src, '2022-07-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'S3C7_COMMUTE_LPG' AS cat, 'CO2' AS gas, 3.20490000 AS val, 'kgCO2eq/kg' AS unit, 'kgCO2eq' AS num, 'kg' AS den, NULL AS co2, NULL AS sub, 'รถยนต์ส่วนบุคคล (LPG)' AS name_th, NULL AS purpose, 'TGO_CFP_2565' AS src, '2022-07-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'S3C7_COMMUTE_EV' AS cat, 'CO2' AS gas, 0.49990000 AS val, 'kgCO2eq/kWh' AS unit, 'kgCO2eq' AS num, 'kWh' AS den, NULL AS co2, NULL AS sub, 'รถยนต์ไฟฟ้า (EV)' AS name_th, NULL AS purpose, 'TGO_CFP_2565' AS src, '2022-07-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'S3C7_COMMUTE_CNG' AS cat, 'CO2' AS gas, 2.60900000 AS val, 'kgCO2eq/kg' AS unit, 'kgCO2eq' AS num, 'kg' AS den, NULL AS co2, NULL AS sub, 'รถ Taxi (CNG)' AS name_th, NULL AS purpose, 'TGO_CFP_2565' AS src, '2022-07-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'S3C7_COMMUTE_DIESEL' AS cat, 'CO2' AS gas, 2.74060000 AS val, 'kgCO2eq/litre' AS unit, 'kgCO2eq' AS num, 'litre' AS den, NULL AS co2, NULL AS sub, 'การเดินทางของลูกค้า (Diesel)' AS name_th, NULL AS purpose, 'TGO_CFP_2565' AS src, '2022-07-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'S3C7_COMMUTE_GAS' AS cat, 'CO2' AS gas, 2.23940000 AS val, 'kgCO2eq/litre' AS unit, 'kgCO2eq' AS num, 'litre' AS den, NULL AS co2, NULL AS sub, 'การเดินทางของลูกค้า (Gasoline)' AS name_th, NULL AS purpose, 'TGO_CFP_2565' AS src, '2022-07-01' AS eff_from, NULL AS until, 1 AS is_def
  UNION ALL
  SELECT 'S3C7_COMMUTE_CNG' AS cat, 'CO2' AS gas, 2.60900000 AS val, 'kgCO2eq/kg' AS unit, 'kgCO2eq' AS num, 'kg' AS den, NULL AS co2, NULL AS sub, 'การเดินทางของลูกค้า (CNG)' AS name_th, NULL AS purpose, 'TGO_CFP_2565' AS src, '2022-07-01' AS eff_from, NULL AS until, 1 AS is_def
) r
JOIN ef_categories c ON c.category_code = r.cat
JOIN gas_types g ON g.gas_code = r.gas;

-- Total rows: 257

-- <<< END generated/03c-ef-emission-factors-full.sql

-- >>> BEGIN parts/04-ef-frontend-bridge.sql
-- =============================================================================
-- [04/04] Frontend ↔ EF Bridge — unit aliases, ui_sector_map, ef_ui_options,
--         scope3_ef_catalog, views ef_lookup + ef_resolve_by_ui
-- ต้องรัน 01 → 02 → 03 ก่อน
-- อ้างอิง: docs/database-overview.md (bridge EF ↔ Frontend)
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

-- <<< END parts/04-ef-frontend-bridge.sql

-- >>> BEGIN parts/04c-ef-bridge-full.sql
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

-- <<< END parts/04c-ef-bridge-full.sql
