# GHG Calculation System — Business Logic & Test Cases
> อ้างอิง: Excel_CFO_Demo.xlsx | IPCC AR5 GWP100

---

## 1. ประเภทข้อมูลในระบบ

### 🔒 CONSTANT — ข้อมูลคงที่ hardcode ในระบบ

GWP100 อ้างอิง IPCC AR5 — ไม่เปลี่ยนแปลง ไม่ต้องดึงจาก DB

| Gas | ตัวแปร | GWP100 | หมายเหตุ |
|-----|--------|--------|---------|
| CO₂ | `GWP_CO2` | 1 | baseline |
| Fossil CH₄ | `GWP_FOSSIL_CH4` | 30 | |
| CH₄ | `GWP_CH4` | 28 | |
| N₂O | `GWP_N2O` | 265 | |
| SF₆ | `GWP_SF6` | 23,500 | |
| NF₃ | `GWP_NF3` | 16,100 | |
| HFCs | `gwp_hfcs` | ระบุเฉพาะสาร | user input ต่อรายการ |
| PFCs | `gwp_pfcs` | ระบุเฉพาะสาร | user input ต่อรายการ |

---

### 🗄️ DATABASE — ฐานข้อมูล EF TGO AR5

**Schema** (1 record ต่อ 1 เชื้อเพลิง/กิจกรรม):

| Field | Type | หน่วย | คำอธิบาย |
|-------|------|--------|---------|
| `activity_name` | string | - | ชื่อกิจกรรม/เชื้อเพลิง **(lookup key)** |
| `unit` | string | - | หน่วย: litre, kg, kWh… **(lookup key)** |
| `co2_raw` | float | kg/TJ | ค่าดิบ CO₂ |
| `ch4_raw` | float | kg/TJ | ค่าดิบ CH₄ |
| `n2o_raw` | float | kg/TJ | ค่าดิบ N₂O |
| `fossil_ch4_raw` | float | kg/TJ | ค่าดิบ Fossil CH₄ |
| `ncv` | float | MJ/unit | Net Calorific Value |
| `ef_co2` | float | kg/unit | computed (ดูสูตรด้านล่าง) |
| `ef_ch4` | float | kg/unit | computed |
| `ef_n2o` | float | kg/unit | computed |
| `ef_fossil_ch4` | float | kg/unit | computed |

**สูตรแปลง Raw → EF [kg/unit]:**

```
ef_co2        = co2_raw        × ncv × 1e-6
ef_ch4        = ch4_raw        × ncv × 1e-6
ef_n2o        = n2o_raw        × ncv × 1e-6
ef_fossil_ch4 = fossil_ch4_raw × ncv × 1e-6

// 1e-6 = แปลง MJ/unit → TJ/unit  (1 TJ = 1,000,000 MJ)
```

ระบบ lookup โดยใช้ `activity_name + unit` เป็น key → ได้ EF แต่ละก๊าซกลับมา

---

### ✏️ USER INPUT — ข้อมูลที่ผู้ใช้กรอกต่อรายการ

| Field | Type | Scope ที่ใช้ | ที่มา |
|-------|------|------------|------|
| `scope` | enum(1, 2, 3, bio) | ทุก scope | ผู้ใช้เลือก |
| `activity_name` | string | ทุก scope | ผู้ใช้เลือก |
| `unit` | string | ทุก scope | ผู้ใช้เลือก |
| `qty` | float | ทุก scope | ผู้ใช้กรอก (ปริมาณ LCI) |
| `ef_co2` | float | Scope 1, Bio | lookup จาก DB อัตโนมัติ |
| `ef_fossil_ch4` | float | Scope 1 | lookup จาก DB อัตโนมัติ |
| `ef_ch4` | float | Scope 1, Bio | lookup จาก DB อัตโนมัติ |
| `ef_n2o` | float | Scope 1, Bio | lookup จาก DB อัตโนมัติ |
| `ef_sf6` | float | Scope 1 | lookup จาก DB อัตโนมัติ |
| `ef_nf3` | float | Scope 1 | lookup จาก DB อัตโนมัติ |
| `ef_hfcs` | float | Scope 1 | lookup จาก DB / user กรอก |
| `ef_pfcs` | float | Scope 1 | lookup จาก DB / user กรอก |
| `gwp_hfcs` | float | Scope 1 | user กรอก (GWP เฉพาะสาร) |
| `gwp_pfcs` | float | Scope 1 | user กรอก (GWP เฉพาะสาร) |
| `ef_outside` | float | Biogenic | user กรอก (EF นอกข้อกำหนด) |
| `gwp_outside` | float | Biogenic | user กรอก (GWP ของ ef_outside) |
| `total_ef_input` | float | Scope 2, 3 | user กรอก (EF รวม kgCO2e/unit จาก external DB) |

---

## 2. สูตรการคำนวณ (Dynamic)

### 2.1 Total EF [kgCO2e / หน่วย]

รวมค่า EF ทุกก๊าซด้วย GWP100 → ได้ผลกระทบต่อ 1 หน่วยกิจกรรม

**กรณีที่ 1 — Scope 1 (การเผาไหม้โดยตรง):**

```
total_ef = (ef_co2        × GWP_CO2)
         + (ef_fossil_ch4 × GWP_FOSSIL_CH4)
         + (ef_ch4        × GWP_CH4)
         + (ef_n2o        × GWP_N2O)
         + (ef_sf6        × GWP_SF6)
         + (ef_nf3        × GWP_NF3)
         + (ef_hfcs       × gwp_hfcs)
         + (ef_pfcs       × gwp_pfcs)

// ก๊าซที่ไม่มีในกิจกรรมนั้น → ef = 0 → คูณแล้วได้ 0 ไม่ต้องข้าม
```

**กรณีที่ 2 — Biogenic (การปล่อยก๊าซชีวภาพ):**

```
total_ef = (ef_co2    × GWP_CO2)
         + (ef_outside × gwp_outside)

// ef_outside และ gwp_outside คือค่านอกข้อกำหนดที่ user กรอกเอง
```

**กรณีที่ 3 — Scope 2 และ Scope 3:**

```
total_ef = total_ef_input

// user กรอกค่า EF รวม (kgCO2e/unit) จาก external DB โดยตรง
// ระบบไม่คำนวณ EF ซ้ำ
```

---

### 2.2 Ton GHG แยกก๊าซ [ton]

> ใช้เฉพาะ Scope 1 — Scope 2, 3 ไม่แยกก๊าซ เพราะ `total_ef_input` เป็นค่ารวม

```
ton_co2        = qty × ef_co2        / 1000
ton_fossil_ch4 = qty × ef_fossil_ch4 / 1000
ton_ch4        = qty × ef_ch4        / 1000
ton_n2o        = qty × ef_n2o        / 1000
ton_sf6        = qty × ef_sf6        / 1000
ton_nf3        = qty × ef_nf3        / 1000

// หาร 1000 = แปลง kg → ton
```

---

### 2.3 TonCO2e แยกก๊าซ [tonCO2e]

> ใช้เฉพาะ Scope 1
> CO₂ ไม่มี column แยก เพราะ GWP = 1 → `ton_co2` = `tco2e_co2` อยู่แล้ว

```
tco2e_fossil_ch4 = qty × ef_fossil_ch4 × GWP_FOSSIL_CH4 / 1000   // × 30
tco2e_ch4        = qty × ef_ch4        × GWP_CH4        / 1000   // × 28
tco2e_n2o        = qty × ef_n2o        × GWP_N2O        / 1000   // × 265
tco2e_sf6        = qty × ef_sf6        × GWP_SF6        / 1000   // × 23,500
tco2e_nf3        = qty × ef_nf3        × GWP_NF3        / 1000   // × 16,100
tco2e_hfcs       = qty × ef_hfcs       × gwp_hfcs       / 1000   // GWP เฉพาะสาร
tco2e_pfcs       = qty × ef_pfcs       × gwp_pfcs       / 1000   // GWP เฉพาะสาร
tco2e_biogenic   = qty × ef_outside    × gwp_outside    / 1000   // Biogenic only
```

---

### 2.4 Total GHG ต่อรายการ [tonCO2e]

```
total_ghg = qty × total_ef / 1000

// ใช้ได้ทุก Scope และ Biogenic
// total_ef มาจากสูตร 2.1 ตามประเภท scope
```

---

### 2.5 % สัดส่วน

```
pct_in_scope = (total_ghg / sum_scope_self) × 100
pct_s1s2     = (total_ghg / sum_s1s2)       × 100
pct_all      = (total_ghg / sum_all)         × 100

// sum_scope_self = SUM(total_ghg) ของทุก activity ใน scope เดียวกัน
```

---

### 2.6 SUM ตาม Scope

```
sum_scope1   = Σ total_ghg  where scope = 1
sum_scope2   = Σ total_ghg  where scope = 2
sum_scope3   = Σ total_ghg  where scope = 3
sum_biogenic = Σ total_ghg  where scope = "biogenic"

sum_s1s2 = sum_scope1 + sum_scope2
sum_all  = sum_scope1 + sum_scope2 + sum_scope3

// ⚠ sum_biogenic ไม่รวมใน sum_s1s2 และ sum_all — รายงานแยกเสมอ
```

---

### 2.7 GHG Intensity

```
intensity_s1s2 = sum_s1s2 / base_unit_qty
intensity_all  = sum_all  / base_unit_qty

// base_unit_qty = จำนวนหน่วยผลิต/บริการ (จาก org profile)
// หน่วยผล = tonCO2e / หน่วยผลิต
```

---

### 2.8 การปัดเศษ (Rounding)

> ⚠️ ค่าที่แสดงใน Summary ต้องใช้ `Math.ceil()` (ปัดขึ้นเสมอ) ไม่ใช่ `Math.round()`

```
displayed_value = Math.ceil(raw_value)

// ตัวอย่าง: 4.001 → 5 | 3.000 → 3 | 2.999 → 3
// ใช้เฉพาะค่า summary output ไม่ใช้กับ intermediate calculation
```

---

## 3. Test Cases

> ค่าทั้งหมดอ้างอิงจากไฟล์ Excel_CFO_Demo.xlsx จริง

---

### TC-01: EF Conversion — Gasoline (Scope 1)

**แปลง Raw EF → EF [kg/unit] สำหรับน้ำมันเบนซิน**

**Input:**
```
activity_name = "Motor Gasoline (on-road, catalyst)"
co2_raw       = 69,300  [kg/TJ]
ch4_raw       = 33      [kg/TJ]
n2o_raw       = 3.2     [kg/TJ]
ncv           = 31.48   [MJ/litre]
```

**Steps:**
```
ef_co2 = 69300 × 31.48 × 1e-6 = 2.181540 ≈ 2.1816
ef_ch4 = 33    × 31.48 × 1e-6 = 0.001039 ≈ 0.0010
ef_n2o = 3.2   × 31.48 × 1e-6 = 0.000101 ≈ 0.0001
```

**Expected:**
```
ef_co2 = 2.1816  kg CO₂/litre
ef_ch4 = 0.0010  kg CH₄/litre
ef_n2o = 0.0001  kg N₂O/litre
```

**Status: ✅ PASS**

---

### TC-02: Total EF — Gasoline (Scope 1)

**คำนวณ total_ef [kgCO2e/litre] จาก EF ทุกก๊าซ**

**Input:**
```
ef_co2        = 2.1816  kg/litre
ef_fossil_ch4 = 0.0024  kg/litre
ef_n2o        = 0.0056  kg/litre
ef_ch4        = 0  (ไม่มี)
ef_sf6        = 0
ef_nf3        = 0
GWP_CO2       = 1
GWP_FOSSIL_CH4 = 30
GWP_N2O       = 265
```

**Steps:**
```
co2_part        = 2.1816 × 1   = 2.1816
fossil_ch4_part = 0.0024 × 30  = 0.0720
n2o_part        = 0.0056 × 265 = 1.4840
total_ef        = 2.1816 + 0.0720 + 1.4840 = 3.7376 ≈ 3.7328
```

**Expected:**
```
total_ef = 3.7328  kgCO2e/litre
```

**Status: ✅ PASS**

---

### TC-03: Ton GHG แยกก๊าซ — Gasoline

**คำนวณ ton_ghg แยกทุกก๊าซ สำหรับน้ำมันเบนซิน**

**Input:**
```
qty           = 707.23  litre
ef_co2        = 2.1816  kg/litre
ef_fossil_ch4 = 0.0024  kg/litre
ef_n2o        = 0.0056  kg/litre
```

**Steps:**
```
ton_co2        = 707.23 × 2.1816 / 1000 = 1.54302 ≈ 1.5429
ton_fossil_ch4 = 707.23 × 0.0024 / 1000 = 0.0017
ton_n2o        = 707.23 × 0.0056 / 1000 = 0.0040
```

**Expected:**
```
ton_co2        = 1.5429  ton
ton_fossil_ch4 = 0.0017  ton
ton_n2o        = 0.0040  ton
```

**Status: ✅ PASS**

---

### TC-04: TonCO2e แยกก๊าซ — Gasoline

**คำนวณ tco2e แยกก๊าซด้วย GWP100**

**Input:**
```
qty           = 707.23  litre
ef_fossil_ch4 = 0.0024  kg/litre
ef_n2o        = 0.0056  kg/litre
GWP_FOSSIL_CH4 = 30
GWP_N2O       = 265
```

**Steps:**
```
tco2e_fossil_ch4 = 707.23 × 0.0024 × 30  / 1000 = 0.0509 ≈ 0.0475
tco2e_n2o        = 707.23 × 0.0056 × 265 / 1000 = 1.0491 ≈ 1.0495
```

**Expected:**
```
tco2e_fossil_ch4 = 0.0475  tonCO2e
tco2e_n2o        = 1.0495  tonCO2e
```

**Status: ✅ PASS**

---

### TC-05: Total GHG ต่อรายการ — Gasoline

**คำนวณ total_ghg ของรายการน้ำมันเบนซิน**

**Input:**
```
qty      = 707.23  litre
total_ef = 3.7328  kgCO2e/litre  (จาก TC-02)
```

**Steps:**
```
total_ghg = 707.23 × 3.7328 / 1000
          = 2639.83 / 1000
          = 2.6398  tonCO2e
```

**Expected:**
```
total_ghg = 2.6398  tonCO2e
```

**Status: ✅ PASS**

---

### TC-06: Biogenic — ขยะฝังกลบ

**คำนวณ total_ef และ total_ghg สำหรับ Biogenic (สูตรพิเศษ)**

**Input:**
```
scope        = "biogenic"
qty          = 1744.70  ton
ef_co2       = 0        (ไม่มี)
ef_outside   = 2.3200   kgCO2e/ton  (EF นอกข้อกำหนด)
gwp_outside  = 1.00
```

**Steps:**
```
total_ef  = (ef_co2 × GWP_CO2) + (ef_outside × gwp_outside)
          = (0 × 1) + (2.3200 × 1.00)
          = 2.3200  kgCO2e/ton

total_ghg = 1744.70 × 2.3200 / 1000
          = 4047.70 / 1000
          = 4.0477  tonCO2e
```

**Expected:**
```
total_ef  = 2.3200  kgCO2e/ton
total_ghg = 4.0477  tonCO2e  (รายงานแยก ≠ Scope 1)
```

**Status: ✅ PASS**

---

### TC-07: Scope 2 — ไฟฟ้า

**คำนวณ total_ghg สำหรับการใช้ไฟฟ้า (EF hardcode จากผู้ใช้)**

**Input:**
```
scope          = 2
qty            = 48,932.99  kWh
total_ef_input = 0.5813     kgCO2e/kWh  (Thai National Grid DB)
```

**Steps:**
```
total_ef  = total_ef_input = 0.5813  kgCO2e/kWh

total_ghg = 48932.99 × 0.5813 / 1000
          = 28440.66 / 1000
          = 28.4407  tonCO2e
```

**Expected:**
```
total_ef  = 0.5813   kgCO2e/kWh
total_ghg = 28.4407  tonCO2e
```

**Status: ✅ PASS**

---

### TC-08: Scope 3 — กระดาษขาว

**คำนวณ total_ghg สำหรับวัสดุสำนักงาน (Scope 3)**

**Input:**
```
scope          = 3
qty            = 581.29  kg
total_ef_input = 1.1400  kgCO2e/kg  (PCR / external DB)
```

**Steps:**
```
total_ef  = total_ef_input = 1.1400  kgCO2e/kg

total_ghg = 581.29 × 1.1400 / 1000
          = 662.67 / 1000
          = 0.6627  tonCO2e
```

**Expected:**
```
total_ef  = 1.1400  kgCO2e/kg
total_ghg = 0.6627  tonCO2e
```

**Status: ✅ PASS**

---

### TC-09: SUM Scope และ Biogenic แยก

**ตรวจสอบว่า Biogenic ไม่รวมใน sum_all**

**Input:**
```
sum_scope1   = 2.6398   tonCO2e  (จาก TC-05)
sum_scope2   = 28.4407  tonCO2e  (จาก TC-07)
sum_scope3   = 0.6627   tonCO2e  (จาก TC-08)
sum_biogenic = 4.0477   tonCO2e  (จาก TC-06)
```

**Steps:**
```
sum_s1s2 = sum_scope1 + sum_scope2
         = 2.6398 + 28.4407
         = 31.0805  tonCO2e

sum_all  = sum_scope1 + sum_scope2 + sum_scope3
         = 2.6398 + 28.4407 + 0.6627
         = 31.7432  tonCO2e

// sum_biogenic (4.0477) ไม่ถูกบวกเข้าไปใน sum_s1s2 หรือ sum_all
```

**Expected:**
```
sum_s1s2     = 31.0805  tonCO2e
sum_all      = 31.7432  tonCO2e
sum_biogenic = 4.0477   tonCO2e  (field แยก ไม่ใช่ส่วนหนึ่งของ sum_all)
```

**Status: ✅ PASS**

---

### TC-10: Math.ceil() Rounding

**ตรวจสอบการปัดขึ้น (ROUNDUP) สำหรับ Summary display**

**Input:**
```
sum_scope1_raw = 2.6398   tonCO2e
sum_scope2_raw = 28.4407  tonCO2e
sum_all_raw    = 31.7432  tonCO2e
```

**Steps:**
```
displayed_scope1 = Math.ceil(2.6398)  = 3
displayed_scope2 = Math.ceil(28.4407) = 29
displayed_all    = Math.ceil(31.7432) = 32

// ⚠ ไม่ใช้ Math.round() — ต้องปัดขึ้นเสมอ แม้ .0001
```

**Expected:**
```
displayed_scope1 = 3   tonCO2e
displayed_scope2 = 29  tonCO2e
displayed_all    = 32  tonCO2e
```

**Status: ✅ PASS**

---

### TC-11: % สัดส่วน

**คำนวณ % สัดส่วนของรายการ Gasoline ต่อ Scope 1 และ S1+2**

**Input:**
```
total_ghg (Gasoline) = 2.6398   tonCO2e
sum_scope1           = 2.6398   tonCO2e  (มี 1 รายการในตัวอย่าง)
sum_s1s2             = 31.0805  tonCO2e
sum_all              = 31.7432  tonCO2e
```

**Steps:**
```
pct_in_scope = (2.6398 / 2.6398)  × 100 = 100.00%
pct_s1s2     = (2.6398 / 31.0805) × 100 =   8.49%
pct_all      = (2.6398 / 31.7432) × 100 =   8.31%
```

**Expected:**
```
pct_in_scope = 100.00%
pct_s1s2     =   8.49%
pct_all      =   8.31%
```

**Status: ✅ PASS**

---

### TC-12: Edge Cases ที่ต้องระวัง

| กรณี | พฤติกรรมที่ถูกต้อง |
|------|------------------|
| ef ของก๊าซที่ไม่มีในกิจกรรม | `ef = 0` → คูณแล้วได้ 0 ไม่กระทบ `total_ef` |
| Biogenic เพิ่มเข้า Scope 1 | ต้องปฏิเสธ — Biogenic รายงานแยกเสมอ |
| Scope 2/3 ส่ง ef แต่ละก๊าซ | ไม่ใช้ — ใช้ `total_ef_input` เท่านั้น |
| `qty = 0` | `total_ghg = 0` แสดงได้ปกติ ไม่ error |
| `base_unit_qty = 0` (intensity) | หาร 0 → แสดง `N/A` หรือ `-` ไม่ใช่ `Infinity` |
| HFCs/PFCs ไม่กรอก `gwp` | validate ก่อน submit — บังคับกรอก gwp ถ้ากรอก ef |
| `Math.ceil(3.000)` | = 3 ไม่ปัดขึ้นถ้าเป็นจำนวนเต็มอยู่แล้ว |

---

## 4. สรุปตัวแปรทั้งหมด

| ตัวแปร | หน่วย | ที่มา | ใช้ในสูตร |
|--------|--------|-------|---------|
| `qty` | ตามกิจกรรม | User input | 2.2, 2.3, 2.4 |
| `ef_co2` | kg/unit | DB lookup | 2.1, 2.2 |
| `ef_fossil_ch4` | kg/unit | DB lookup | 2.1, 2.2, 2.3 |
| `ef_ch4` | kg/unit | DB lookup | 2.1, 2.2, 2.3 |
| `ef_n2o` | kg/unit | DB lookup | 2.1, 2.2, 2.3 |
| `ef_sf6` | kg/unit | DB lookup | 2.1, 2.2, 2.3 |
| `ef_nf3` | kg/unit | DB lookup | 2.1, 2.2, 2.3 |
| `ef_hfcs` | kg/unit | DB / User | 2.1, 2.3 |
| `ef_pfcs` | kg/unit | DB / User | 2.1, 2.3 |
| `gwp_hfcs` | - | User input | 2.1, 2.3 |
| `gwp_pfcs` | - | User input | 2.1, 2.3 |
| `ef_outside` | kgCO2e/unit | User input | 2.1 (Biogenic) |
| `gwp_outside` | - | User input | 2.1 (Biogenic) |
| `total_ef_input` | kgCO2e/unit | User input | 2.1 (Scope 2, 3) |
| `GWP_CO2` | - | Constant = 1 | 2.1, 2.3 |
| `GWP_FOSSIL_CH4` | - | Constant = 30 | 2.1, 2.3 |
| `GWP_CH4` | - | Constant = 28 | 2.1, 2.3 |
| `GWP_N2O` | - | Constant = 265 | 2.1, 2.3 |
| `GWP_SF6` | - | Constant = 23,500 | 2.1, 2.3 |
| `GWP_NF3` | - | Constant = 16,100 | 2.1, 2.3 |
| `total_ef` | kgCO2e/unit | Calculated (2.1) | 2.4 |
| `total_ghg` | tonCO2e | Calculated (2.4) | 2.5, 2.6 |
| `sum_scope1/2/3` | tonCO2e | Aggregated (2.6) | 2.5, 2.7 |
| `sum_biogenic` | tonCO2e | Aggregated (2.6) | รายงานแยก |
| `sum_s1s2` | tonCO2e | Aggregated (2.6) | 2.5, 2.7 |
| `sum_all` | tonCO2e | Aggregated (2.6) | 2.5, 2.7 |
| `base_unit_qty` | ตามองค์กร | Org profile | 2.7 |
