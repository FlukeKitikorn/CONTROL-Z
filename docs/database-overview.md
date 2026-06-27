# CONTROL-Z — Database Overview

เอกสารภาพรวมฐานข้อมูล MySQL สำหรับโปรเจกต์ CONTROL-Z  
คู่กับสคริปต์สร้าง DB: [`database-seed.sql`](./database-seed.sql)

| รายการ | ค่า |
|--------|-----|
| ชื่อฐานข้อมูล | `control_z_v2` |
| Charset / Collation | `utf8mb4` / `utf8mb4_unicode_ci` |
| Backend `.env` | `DATABASE_URL=mysql+pymysql://root:root@localhost:3306/control_z_v2` |

---

## 1. วิธีสร้างฐานข้อมูล (ครั้งเดียว)

```powershell
# จาก root โปรเจกต์ — ต้องมี MySQL รันอยู่ (เช่น docker compose up -d mysql)
Get-Content docs/database-seed.sql -Raw | docker exec -i mysql_db mysql -uroot -proot
```

```bash
mysql -u root -p < docs/database-seed.sql
```

คำเตือน: สคริปต์จะ `DROP` ตารางทั้งหมดใน `control_z_v2` แล้วสร้างใหม่ — ข้อมูลเดิมหาย

### บัญชีทดสอบหลัง import

| อีเมล | รหัสผ่าน | สิทธิ์ |
|-------|----------|--------|
| `user@example.com` | `SecretPass1!` | ผู้ใช้ทั่วไป |
| `admin@admin.com` | `root@#1234` | ผู้ดูแลระบบ |

### ตรวจสอบหลัง import

```sql
USE control_z_v2;

SELECT 'ef_categories' AS t, COUNT(*) AS n FROM ef_categories
UNION ALL SELECT 'emission_factors', COUNT(*) FROM emission_factors
UNION ALL SELECT 'ef_ui_options', COUNT(*) FROM ef_ui_options
UNION ALL SELECT 'scope3_ef_catalog', COUNT(*) FROM scope3_ef_catalog;

-- ไฟฟ้า Scope 2 (คาด ~0.475 kgCO2/kWh)
SELECT category_code, ef_value, ef_purpose FROM ef_lookup
WHERE category_code = 'ELEC_GRID_TH_2022_S2';

-- ดีเซล stationary (คาด 3 แถว: CO2, CH4_FOSSIL, N2O)
SELECT option_key, gas_code, ef_value FROM ef_resolve_by_ui
WHERE ui_context = 'stationary_combustion' AND option_key = 'diesel_gas_oil';
```

---

## 2. ภาพรวมสถาปัตยกรรมข้อมูล

```text
organizations ──┬── users ── user_privileges (login)
                ├── forms ──┬── form_details / edit_forms
                │           ├── subject_scope ── details_scope
                │           │                    └── fr04_1_detail (legacy รายแถว Fr-04)
                │           ├── points_consider (Fr_03.2)
                │           └── category ── category_anwser
                ├── collect_information (ปีฐาน / ผลผลิต)
                ├── organization_information
                └── activity_entries (bundle กรอกข้อมูล + snapshot คำนวณ)

scope (1/2/3) ── ef_categories ── emission_factors ── views ef_lookup / ef_resolve_by_ui
                      ▲
              ef_ui_options + scope3_ef_catalog (bridge ไป Frontend)
```

**Flow หลักในแอปปัจจุบัน**

1. ผู้ใช้กรอกข้อมูล → `POST .../annual-report-bundle` → `activity_entries` (`entry_kind = annual_report_bundle`)
2. กดคำนวณ → `ef_resolve_by_ui` + สูตร backend → `activity_entries` (`calculation_snapshot`)
3. หน้ากรอกข้อมูลโหลด EF dropdown จาก `GET /reference/ef-ui-options` (view `ef_ui_options`)

---

## 3. ตารางตามกลุ่ม — มีไว้ทำไม

### 3.1 องค์กรและผู้ใช้

| ตาราง | มีไว้ทำไม | ใช้โดย |
|-------|-----------|--------|
| `organizations` | ข้อมูลหน่วยงาน/ที่อยู่/รูปโลโก้ แผนที่ โครงสร้าง | Settings, หัวรายงาน, Admin |
| `users` | โปรไฟล์ผู้ใช้ (ชื่อ ที่อยู่ รูป) | Auth, Settings, `/me` |
| `user_privileges` | ล็อกอิน (`uname`, `password_hash`) + สิทธิ์ `uread`–`uall` | Login, Admin users |

การออกแบบใหม่เฉพาะ auth: `prefix` (แก้จาก `prifix`), `password_hash` แทน plaintext, สิทธิ์เป็น `TINYINT(1)`, `user_id` และ `uname` ไม่ซ้ำ

### 3.2 ฟอร์มและรอบรายงาน

| ตาราง | มีไว้ทำไม | ใช้โดย |
|-------|-----------|--------|
| `forms` | ฟอร์ม GHG ต่อองค์กร (Fr_xx, เวอร์ชัน) | Reports Fr_03.2, GHG API |
| `form_details` | รายละเอียดแนบฟอร์ม | Forms API |
| `edit_forms` | บันทึกว่าใครแก้ฟอร์มเมื่อไหร่ | Audit การแก้ฟอร์ม |
| `reporting_periods` | รอบรายงานแบบมีโครงสร้าง (รายวัน–รายปี) | อนาคต / sync กับ bundle |
| `collect_information` | ปีฐาน ผลผลิต หน่วย ต่อรอบ | หัวรายงาน, Base year |
| `organization_information` | ข้อมูลองค์กรเสริมต่อฟอร์ม | Org information API |

### 3.3 GHG inventory (โครงสร้าง Fr-04 / Scope)

| ตาราง | มีไว้ทำไม | ใช้โดย |
|-------|-----------|--------|
| `scope` | Master Scope 1 / 2 / 3 | อ้างอิง `scid` |
| `subject_scope` | หัวข้อกิจกรรมต่อ org + ฟอร์ม | รายงาน, legacy calc |
| `details_scope` | รายละเอียดใต้หัวข้อ scope | GHG CRUD API |
| `fr04_1_detail` | แถวปริมาณ + EF แบบเก่า (float ต่อก๊าซ) | Fallback คำนวณ legacy |
| `points_consider` | ข้อความเกณฑ์พิจารณา (Fr_03.2) | รายงาน Fr_03.2 |
| `category` / `category_anwser` | แบบประเมินความสำคัญ Scope 3 | Fr_03.2 / การประเมิน |

### 3.4 กรอกข้อมูลและคำนวณ (v2)

| ตาราง | มีไว้ทำไม | ใช้โดย |
|-------|-----------|--------|
| `activity_entries` | เก็บ JSON bundle รายปี + snapshot ผลคำนวณ | Data input save, Calculations API |

คอลัมน์สำคัญ: `entry_kind` (`annual_report_bundle` | `calculation_snapshot`), `entry_payload` (JSON), `reporting_year`, `fid`

### 3.5 Emission Factors (TGO / IPCC)

| ตาราง | มีไว้ทำไม | ใช้โดย |
|-------|-----------|--------|
| `ef_sources` | แหล่ง EF (TGO_AR5, ThaiLCI, …) | อ้างอิง emission_factors |
| `ef_categories` | หมวดกิจกรรม (hierarchy + scope) | Lookup, bridge |
| `emission_factors` | ค่า EF จริง (หลายแถวต่อกิจกรรม/ก๊าซ) | คำนวณ backend |
| `gas_types` | รหัสก๊าซ (CO2, CH4_FOSSIL, R134A, …) | Multigas formulas |
| `gwp_values` | GWP ต่อก๊าซ + AR period | คูณ CH₄/N₂O |
| `gwp` | Master GWP แบบเก่า (subject/value) | Admin Emission Factors (legacy UI) |
| `fr04_ef_selection` | เชื่อมแถว Fr-04 กับ EF ที่เลือก | อนาคต / รายงาน |

### 3.6 Bridge Frontend ↔ Database

| ตาราง / View | มีไว้ทำไม | ใช้โดย |
|--------------|-----------|--------|
| `ef_ui_options` | แมป `option_key` + `ui_context` → category | `GET /reference/ef-ui-options`, DataInputPage |
| `scope3_ef_catalog` | แมปหมวด Scope 3 ใน UI → `ef_category_code` | Scope 3 คำนวณ / อนาคต UI |
| `unit_aliases` | แปลงหน่วย UI (L, kWh, …) → หน่วย EF | คำนวณ |
| `ui_sector_map` | sector off-road (Agriculture, …) | Off-road EF |
| `ef_lookup` | **View** — EF พร้อมชื่อหมวด/ก๊าซ | Debug, รายงาน |
| `ef_resolve_by_ui` | **View** — แถว EF สำหรับคู่ (scope, context, option_key) | `ef_resolver.py`, คำนวณ |

ทำไมต้องมี bridge: Frontend ใช้คีย์สั้น (`diesel_gas_oil`, `grid`) แต่ DB ใช้ `FUEL_DIESEL`, `ELEC_GRID_TH_2022_S2` — ไม่ต้องเปลี่ยน UI ทั้งหมด

---

## 4. คอลัมน์เวลามาตรฐาน

ตารางธุรกิจส่วนใหญ่มี `created_at`, `updated_at` (`DATETIME(6)`)  
Master `scope`, `gwp` ไม่มี — ตาราง EF master บางตัวมีเฉพาะ `created_at`

---

## 5. สูตรคำนวณ (อ้างอิง backend)

```text
kgCO2e = Σ (activity_qty × ef_value × GWP)
```

- การเผาไหม้: แยกแถว CO2, CH4_FOSSIL, N2O แล้วรวม  
- ไฟฟ้า / สารเย็น / Scope 3 บางหมวด: แถว `kgCO2eq` เดียว  
- รายละเอียด test cases: [`GHG_BusinessLogic_TestCases.md`](./GHG_BusinessLogic_TestCases.md)

---

## 6. สร้าง EF ชุดใหม่จาก Excel

สคริปต์ Python สร้างส่วน EF เต็ม (~256 แถว):

```bash
python docs/scripts/generate_ef_full.py
powershell -File docs/scripts/build-database-seed.ps1
```

จากนั้นรัน `database-seed.sql` ใหม่

---

## 7. เอกสารที่เกี่ยวข้อง (ไม่ใช่ DB)

| เอกสาร | เนื้อหา |
|--------|---------|
| [`api-design.md`](./api-design.md) | REST API |
| [`known-concerns.md`](./known-concerns.md) | ข้อจำกัด / งานค้าง |
| [`GHG_BusinessLogic_TestCases.md`](./GHG_BusinessLogic_TestCases.md) | สูตรและ test cases |

**เอกสาร DB ใช้แค่ 2 ฉบับนี้:** `database-overview.md` + `database-seed.sql`
