# แผนนำเข้าฐานข้อมูล CONTROL-Z v2

> **ฉบับล่าสุด:** มิถุนายน 2569  
> **ฐานข้อมูลเป้าหมาย:** `control_z_v2` (แยกจาก `control_z` เดิมเพื่อเทียบและทดสอบ)

---

## 1. ภาพรวม

ชุด SQL แยกเป็น 4 ขั้นใน `docs/sql/` เพื่อให้:

- รีเซ็ต schema + seed แอปได้โดยไม่ต้องโหลด EF ทั้งหมดทุกครั้ง
- เติมค่า EF จาก TGO 2569 ทีละชุด (priority → full)
- แมปคีย์ Frontend (`diesel_gas_oil`, `grid`, …) กับ `ef_categories` ผ่าน bridge tables

| ลำดับ | ไฟล์ | เนื้อหา |
|------|------|---------|
| **01** | [`sql/01-core-schema-seed.sql`](sql/01-core-schema-seed.sql) | DROP/CREATE ตารางทั้งหมด, seed แอป + bridge tables |
| **02** | [`sql/02-ef-masters-categories.sql`](sql/02-ef-masters-categories.sql) | gas_types, gwp, ef_categories |
| **03** | [`sql/03-ef-emission-factors.sql`](sql/03-ef-emission-factors.sql) | EF ชุด priority |
| **03b** | [`sql/03b-ef-emission-factors-extended.sql`](sql/03b-ef-emission-factors-extended.sql) | EF ขยาย (priority path เท่านั้น) |
| **02b** | [`sql/02b-ef-categories-full.sql`](sql/02b-ef-categories-full.sql) | หมวด EF เพิ่ม (~78) — **ชุดเต็ม** |
| **03c** | [`sql/03c-ef-emission-factors-full.sql`](sql/03c-ef-emission-factors-full.sql) | EF TGO 2569 เต็ม (~256 แถว) — **แทน 03+03b** |
| **04** | [`sql/04-ef-frontend-bridge.sql`](sql/04-ef-frontend-bridge.sql) | bridge + views |
| **04b** | [`sql/04b-ef-bridge-extensions.sql`](sql/04b-ef-bridge-extensions.sql) | off-road gasoline (legacy), unit alias CNG |
| **04c** | [`sql/04c-ef-bridge-full.sql`](sql/04c-ef-bridge-full.sql) | bridge เต็ม + scope3 catalog ขยาย |

### เอกสารอ้างอิง

| เอกสาร | บทบาท |
|--------|--------|
| [`data-input-db-source-analysis.md`](data-input-db-source-analysis.md) | map หน้ากรอกข้อมูล ↔ ตาราง DB |
| [`known-concerns.md`](known-concerns.md) | ข้อจำกัด / งานค้าง / สิ่งที่ต้องระวัง |
| [`ef-frontend-bridge-migration.sql`](ef-frontend-bridge-migration.sql) | **legacy** — ใช้ ALTER บน DB เดิม; โปรเจกต์ใหม่ใช้ 01+04 แทน |

### ไฟล์รวมเดิม (deprecated)

[`mysql-data-input-seed.sql`](mysql-data-input-seed.sql) — monolith เดิม; **ไม่แนะนำ** สำหรับงาน EF ใหม่ ให้ใช้ `docs/sql/01`–`04` แทน

---

## 2. ขั้นตอนนำเข้า (Dev)

### 2.1 เตรียม MySQL

```powershell
# จาก root โปรเจกต์
docker compose up -d mysql
```

ค่าเริ่มต้น Docker: `root` / `root`, port `3306`

### 2.2 รัน SQL ตามลำดับ (บังคับ)

**ชุด priority (เร็ว, ~81 EF):**

```powershell
Get-Content docs/sql/01-core-schema-seed.sql -Raw | docker exec -i mysql_db mysql -uroot -proot
Get-Content docs/sql/02-ef-masters-categories.sql -Raw | docker exec -i mysql_db mysql -uroot -proot
Get-Content docs/sql/03-ef-emission-factors.sql -Raw | docker exec -i mysql_db mysql -uroot -proot
Get-Content docs/sql/03b-ef-emission-factors-extended.sql -Raw | docker exec -i mysql_db mysql -uroot -proot
Get-Content docs/sql/04-ef-frontend-bridge.sql -Raw | docker exec -i mysql_db mysql -uroot -proot
Get-Content docs/sql/04b-ef-bridge-extensions.sql -Raw | docker exec -i mysql_db mysql -uroot -proot
```

**ชุดเต็ม TGO 2569 (~256 EF) — แนะนำ:**

```powershell
Get-Content docs/sql/01-core-schema-seed.sql -Raw | docker exec -i mysql_db mysql -uroot -proot
Get-Content docs/sql/02-ef-masters-categories.sql -Raw | docker exec -i mysql_db mysql -uroot -proot
Get-Content docs/sql/02b-ef-categories-full.sql -Raw | docker exec -i mysql_db mysql -uroot -proot
Get-Content docs/sql/03c-ef-emission-factors-full.sql -Raw | docker exec -i mysql_db mysql -uroot -proot
Get-Content docs/sql/04-ef-frontend-bridge.sql -Raw | docker exec -i mysql_db mysql -uroot -proot
Get-Content docs/sql/04c-ef-bridge-full.sql -Raw | docker exec -i mysql_db mysql -uroot -proot
```

> `03c` จะ `DELETE FROM emission_factors` แล้ว INSERT ใหม่ทั้งหมด — **ไม่ต้อง** รัน 03/03b หลัง 03c  
> สร้าง 02b/03c ใหม่: `python docs/sql/generate_ef_full.py`

> **คำเตือน:** ไฟล์ `01` จะ `DROP` ตารางใน `control_z_v2` ทั้งหมด — ข้อมูลเดิมหาย

### 2.3 บัญชีทดสอบ

| อีเมล | รหัสผ่าน | สิทธิ์ |
|-------|----------|--------|
| `user@example.com` | `SecretPass1!` | ผู้ใช้ทั่วไป |
| `admin@admin.com` | `root@#1234` | แอดมิน |

### 2.4 ตั้งค่า Backend

ใน `Backend/.env`:

```env
DATABASE_URL=mysql+pymysql://root:root@localhost:3306/control_z_v2
```

---

## 3. Checklist ตรวจสอบหลัง import

รันใน phpMyAdmin (`http://localhost:8080`) หรือ `mysql` CLI:

```sql
USE control_z_v2;

-- จำนวนตารางหลัก
SELECT 'ef_categories' AS t, COUNT(*) AS n FROM ef_categories
UNION ALL SELECT 'emission_factors', COUNT(*) FROM emission_factors
UNION ALL SELECT 'ef_ui_options', COUNT(*) FROM ef_ui_options
UNION ALL SELECT 'scope3_ef_catalog', COUNT(*) FROM scope3_ef_catalog;

-- ไฟฟ้า Scope 2 (ต้องได้ 0.4750 kgCO2/kWh)
SELECT category_code, ef_value, ef_purpose
FROM ef_lookup
WHERE category_code = 'ELEC_GRID_TH_2022_S2';

-- Resolve ดีเซล stationary (ต้องได้ 3 แถว: CO2, CH4_FOSSIL, N2O)
SELECT option_key, gas_code, ef_value, ef_unit
FROM ef_resolve_by_ui
WHERE ui_context = 'stationary_combustion' AND option_key = 'diesel_gas_oil'
ORDER BY gas_code;

-- Resolve ไฟฟ้า grid
SELECT option_key, ef_value, ef_unit, ef_row_purpose
FROM ef_resolve_by_ui
WHERE ui_context = 'electricity' AND option_key = 'grid';

-- Off-road diesel ทุก sector (EF ชุด priority ใช้ activity_subtype NULL)
SELECT option_key, activity_subtype, gas_code, ef_value
FROM ef_resolve_by_ui
WHERE ui_context = 'off_road' AND option_key = 'diesel';
```

**เกณฑ์ผ่าน (ชุด priority):**

| รายการ | ค่าที่คาด |
|--------|-----------|
| `ef_categories` | ≥ 40 |
| `emission_factors` | ≥ 50 |
| `ef_ui_options` | ≥ 30 |
| ดีเซล stationary CO2 | `2.6987` kgCO2/litre |
| ไฟฟ้า grid | `0.475` kgCO2/kWh, `ef_purpose=cfo_scope2` |
| R-134a | GWP ≈ `1300` kgCO2eq/kg |

**เกณฑ์ผ่าน (ชุดเต็ม 03c):**

| รายการ | ค่าที่คาด |
|--------|-----------|
| `ef_categories` | ≥ 120 |
| `emission_factors` | ≥ 250 |
| `scope3_ef_catalog` | ≥ 20 |
| leaf category ไม่มี EF | `0` |
| LPG stationary | `1.6797` kgCO2/litre |
| off-road gasoline Agriculture | 3 แถว (CO2, CH4_FOSSIL, N2O) |

---

## 4. สถาปัตยกรรม Bridge (Frontend → EF)

```
DataInputPage (option_key)
        │
        ▼
  ef_ui_options  ──► ef_category_code + activity_subtype + ef_purpose
        │
        ▼
  emission_factors (หลายแถวต่อกิจกรรม: CO2, CH4_FOSSIL, N2O หรือ kgCO2eq)
        │
        ▼
  Backend: SELECT * FROM ef_resolve_by_ui WHERE option_key=? AND ui_context=?
           → คูณ activity × ef × GWP → kgCO2e
```

**ทำไมต้องมี bridge?**  
Frontend ใช้คีย์สั้น เช่น `diesel_gas_oil` แต่ DB ใช้ `FUEL_DIESEL` / `MOBILE_ONROAD_DIESEL` — ไม่ควรเปลี่ยน UI ทั้งหมดในครั้งเดียว

**Scope 3:** ใช้ `scope3_ef_catalog.line_code` แมปกับ `annual_report_bundle` ใน payload

---

## 5. ขั้นตอนถัดไป

### 5.1 ขยาย EF ชุดเต็ม — ✅ ทำแล้ว

1. `docs/sql/generate_ef_full.py` → `02b` + `03c`
2. Import ตามลำดับชุดเต็ม (§2.2)
3. Bridge เต็ม: `04c-ef-bridge-full.sql`

### 5.2 Backend

| งาน | สถานะ | ไฟล์ |
|-----|--------|------|
| `GET /reference/ef-resolve` | ✅ | `reference_controller.py` |
| `GET /reference/ef-ui-options` | ✅ | `reference_controller.py` |
| คำนวณจาก `annual_report_bundle` | ✅ (subset) | `ef_calculation.py`, `calculations_controller.py` |
| SQLModel ตาราง EF | ใช้ raw SQL + views | `ef_resolver.py` |
| แทน mock Scope 2 | ยังไม่ทำ | `DataInputPage` → persist `activity_entries` |
| บันทึก `activity_entries` ตอนคำนวณ | ✅ | `activity_persistence.py` |
| `GET .../activity-entries` | ✅ | `ghg_controller.py` |

### 5.3 สูตรคำนวณ (multigas combustion)

```
kgCO2e = Σ (activity_qty × ef_value × GWP100)
```

- แถว `co2_type='fossil'` → นับ CO2  
- `CH4_FOSSIL` → GWP 30 (AR5)  
- `N2O` → GWP 265  
- Refrigerant / Scope 3 single EF → `calc_mode` ใน `ef_ui_options`

---

## 6. แผนภาพลำดับงาน

```mermaid
flowchart LR
  A[01 Core schema + app seed] --> B[02 EF masters + categories]
  B --> C[03 Emission factors]
  C --> D[04 Bridge + views]
  D --> E[Verify ef_resolve_by_ui]
  E --> F[Backend EF resolver API]
  F --> G[Calculations from bundle]
```

---

## 7. การแก้ปัญหา

| อาการ | สาเหตุที่พบบ่อย | แก้ |
|-------|-----------------|-----|
| `ef_resolve_by_ui` ว่างสำหรับ option | ยังไม่รัน 03 หรือ category_code ไม่ตรง | ตรวจ `ef_ui_options.ef_category_code` vs `ef_categories` |
| Off-road ไม่ resolve | EF มี `activity_subtype` แต่ bridge ระบุ sector อื่น | ใช้ `NULL` subtype หรือเพิ่มแถวต่อ sector |
| ไฟฟ้าได้หลายแถว | มีทั้ง 2016 และ 2022 | bridge ตั้ง `ef_purpose='cfo_scope2'` |
| Duplicate EF | รัน 03 ซ้ำโดยไม่ลบ | re-run 01 หรือ `DELETE FROM emission_factors` ก่อน 03 |

---

## 8. สรุปไฟล์ใน `docs/sql/`

```
docs/sql/
├── 01-core-schema-seed.sql
├── 02-ef-masters-categories.sql
├── 02b-ef-categories-full.sql      # หมวดเพิ่ม (ชุดเต็ม)
├── 03-ef-emission-factors.sql      # priority
├── 03b-ef-emission-factors-extended.sql
├── 03c-ef-emission-factors-full.sql # EF เต็ม (~256)
├── 04-ef-frontend-bridge.sql
├── 04b-ef-bridge-extensions.sql
├── 04c-ef-bridge-full.sql
└── generate_ef_full.py             # สร้าง 02b + 03c
```
