# แผนอัปเดตข้อมูล Emission Factor — control_z_v2

> **วันที่จัดทำ:** 26 มิถุนายน 2569  
> **ผู้จัดทำ:** วิเคราะห์จากเอกสารอ้างอิง  
> **ฐานข้อมูล:** `control_z_v2`  
> **สถานะ:** ⚠️ ห้ามแก้ไขค่าใดโดยไม่ตรวจสอบกับเอกสารอ้างอิงต้นฉบับก่อน

---

## แหล่งข้อมูลอ้างอิง (Sources)

| รหัส | ชื่อเอกสาร | วันที่ | ใช้ข้อมูลส่วนใด |
|------|-----------|--------|----------------|
| **[PDF]** | ค่า Emission Factor สำหรับ Carbon Footprint องค์กร (อบก.) | อัปเดต กุมภาพันธ์ 2569 · บังคับใช้ 1 ม.ค. 2569 | Scope 1 ทั้งหมด, Scope 2, GWP100, Refrigerants |
| **[XLS-EF]** | Database_EF_II.xlsx — Sheet "EF Scope1-2" | ไม่ระบุวันที่ | ใช้ cross-validate เท่านั้น (ค่าปัดเศษ) |
| **[XLS-ACT]** | Database_EF_II.xlsx — Sheet "Activity" | อ้างอิง TGO CPF EF ก.ค. 2565 / เม.ย. 2565 | Scope 3 ทั้งหมด |
| **[IPCC-AR5]** | IPCC Fifth Assessment Report, WG1 Ch.8 | 2013 | GWP100 |

> **กฎการใช้ข้อมูล:**  
> - Scope 1–2: ใช้ค่าจาก **[PDF]** เสมอ (ละเอียดกว่า, ใหม่กว่า)  
> - Scope 3: ใช้ค่าจาก **[XLS-ACT]** ตามที่องค์กรกรอก  
> - ทุกตัวเลข ef_value ให้ใส่ทศนิยมตามต้นฉบับ **ห้ามปัดเศษ**

---

## ส่วนที่ 0: Schema Changes (DDL — ต้องทำก่อน INSERT ทั้งหมด)

ต้องเพิ่ม 2 column ใน `emission_factors` เพื่อรองรับข้อมูลใหม่:

```sql
ALTER TABLE emission_factors
  ADD COLUMN co2_type   ENUM('fossil','biogenic') NULL
    COMMENT 'NULL = ไม่ใช่ CO2, fossil = CO2 จากเชื้อเพลิงฟอสซิล, biogenic = CO2 จากชีวมวล'
    AFTER activity_subtype,
  ADD COLUMN ef_purpose ENUM('direct','scope3_upstream','cfo_scope2','scope3_elec','cfp') NULL
    COMMENT 'วัตถุประสงค์ EF โดยเฉพาะสำหรับไฟฟ้า/upstream'
    AFTER co2_type;
```

---

## ส่วนที่ 1: ตาราง `gas_types` — เพิ่ม gas ใหม่

**Seed ปัจจุบัน:** gas_id 1=CO2, 2=CH4, 3=N2O, 4=SF6, 5=NF3

### 1.1 gas ที่ต้องเพิ่ม

```sql
INSERT INTO gas_types (gas_code, gas_name, is_kyoto) VALUES
  ('CH4_FOSSIL', 'Methane (Fossil source)',    1),  -- gas_id จะได้ 6
  ('CO2_BIO',   'Carbon dioxide (Biogenic)',   0),  -- gas_id จะได้ 7
  ('R22',       'HCFC-22',                     1),  -- gas_id จะได้ 8
  ('R32',       'HFC-32',                      1),  -- gas_id จะได้ 9
  ('R125',      'HFC-125',                     1),  -- gas_id จะได้ 10
  ('R134',      'HFC-134',                     1),  -- gas_id จะได้ 11
  ('R134A',     'HFC-134a',                    1),  -- gas_id จะได้ 12
  ('R143',      'HFC-143',                     1),  -- gas_id จะได้ 13
  ('R143A',     'HFC-143a',                    1),  -- gas_id จะได้ 14
  ('R404A',     'R-404A (HFC mixture)',         1),  -- gas_id จะได้ 15
  ('R407A',     'R-407A (HFC mixture)',         1),  -- gas_id จะได้ 16
  ('R407C',     'R-407C (HFC mixture)',         1),  -- gas_id จะได้ 17
  ('R410A',     'R-410A (HFC mixture)',         1);  -- gas_id จะได้ 18
```

> **หมายเหตุ:** `CH4` (gas_id=2) = CH4 จากชีวมวล (biogenic, GWP=28)  
> `CH4_FOSSIL` (gas_id=6) = CH4 จากเชื้อเพลิงฟอสซิล (GWP=30)  
> อ้างอิง: [PDF] และ [IPCC-AR5] WG1 Ch.8 p.73–79

---

## ส่วนที่ 2: ตาราง `gwp_values` — เพิ่ม GWP ใหม่

**Seed ปัจจุบัน:** CO2=1.0, CH4=28.0, N2O=265.0 (AR5)

### 2.1 ค่าที่ต้องเพิ่ม

```sql
INSERT INTO gwp_values (gas_id, ar_period, gwp_value, source) VALUES
  -- CH4 Fossil (ยังไม่มีในฐานข้อมูล)
  (6,  'AR5', 30.0000,   'IPCC AR5, WG1 Ch.8 p.73-79 — Fossil CH4'),
  -- CO2 Biogenic (GWP=0 ตามหลักการ IPCC)
  (7,  'AR5',  0.0000,   'IPCC AR5 — Biogenic CO2 (reported separately)'),
  -- Refrigerants — GWP100 from IPCC AR5
  (8,  'AR5', 1760.0000, 'IPCC 2013 AR5'),
  (9,  'AR5',  677.0000, 'IPCC 2013 AR5'),
  (10, 'AR5', 3170.0000, 'IPCC 2013 AR5'),
  (11, 'AR5', 1120.0000, 'IPCC 2013 AR5'),
  (12, 'AR5', 1300.0000, 'IPCC 2013 AR5'),
  (13, 'AR5',  328.0000, 'IPCC 2013 AR5'),
  (14, 'AR5', 4800.0000, 'IPCC 2013 AR5'),
  (15, 'AR5', 3942.8000, 'IPCC 2006 Vol.3 Ch.7 Table 7.8 (HFC-125 44%/HFC-143a 52%/HFC-134a 4%)'),
  (16, 'AR5', 1923.4000, 'IPCC 2006 Vol.3 Ch.7 Table 7.8 (HFC-32 20%/HFC-125 40%/HFC-134a 40%)'),
  (17, 'AR5', 1624.2100, 'IPCC 2006 Vol.3 Ch.7 Table 7.8 (HFC-32 23%/HFC-125 25%/HFC-134a 52%)'),
  (18, 'AR5', 1923.5000, 'IPCC 2006 Vol.3 Ch.7 Table 7.8 (HFC-32 50%/HFC-125 50%)');
```

> **ที่มา:** [PDF] หน้า Refrigerants + [XLS-EF] confirmed R-22=1760, R-134a=1300  
> R-404A/407A/407C/410A มีเฉพาะใน [PDF] — ไม่มีใน [XLS-EF]

---

## ส่วนที่ 3: ตาราง `ef_sources` — เพิ่ม source ใหม่

**Seed ปัจจุบัน:** มี 10 sources (TGO_AR5 ถึง OTHER)

```sql
INSERT INTO ef_sources
  (source_code, source_name, source_name_th, organization, ar_period, source_type, sort_order)
VALUES
  ('TGO_CFP_2565',
   'TGO Carbon Footprint Product EF (July 2022)',
   'ค่า EF สำหรับคาร์บอนฟุตพริ้นท์ผลิตภัณฑ์ — อบก. (ก.ค. 2565)',
   'TGO', NULL, 'national', 11),

  ('USEEIO_V1',
   'USEEIOv1.1 Matrices — US Environmentally-Extended IO',
   'ฐานข้อมูล USEEIOv1.1 (BEA IO Tables)',
   NULL, NULL, 'international', 12),

  ('IPCC_2013_AR5',
   'IPCC 2013 Fifth Assessment Report — GWP100',
   'IPCC AR5 2013 — ค่า GWP100',
   'IPCC', 'AR5', 'international', 13);
```

> **หมายเหตุ:** `TGO_AR5` (source_id=1) ที่มีอยู่แล้วจะใช้สำหรับ Scope 1–2 จาก [PDF]  
> `TGO_CFP_2565` ใช้สำหรับ Scope 3 จาก [XLS-ACT]

---

## ส่วนที่ 4: ตาราง `ef_categories` — เพิ่ม categories ใหม่

### 4.1 Scope 1 — Stationary Combustion (parent_id=1)

```sql
INSERT INTO ef_categories (parent_id, category_code, name_th, name_en, scope_id, unit_activity, sort_order) VALUES
  (1, 'FUEL_NATGAS_NCV_SCF',  'ก๊าซธรรมชาติ NCV (scf)',         'Natural Gas NCV (scf)',          1, 'scf',   101),
  (1, 'FUEL_NATGAS_NCV_MJ',   'ก๊าซธรรมชาติ NCV (MJ)',          'Natural Gas NCV (MJ)',           1, 'MJ',    102),
  (1, 'FUEL_NATGAS_HHV_MJ',   'ก๊าซธรรมชาติ HHV (MJ)',          'Natural Gas HHV (MJ)',           1, 'MJ',    103),
  (1, 'FUEL_NATGAS_HHV_MMBTU','ก๊าซธรรมชาติ HHV (MMBTU)',       'Natural Gas HHV (MMBTU)',        1, 'MMBTU', 104),
  (1, 'FUEL_LPG_LITRE',       'LPG (ลิตร)',                      'LPG (litre)',                    1, 'litre', 105),
  (1, 'FUEL_LPG_KG',          'LPG (กก.)',                       'LPG (kg)',                       1, 'kg',    106),
  (1, 'FUEL_ACETYLENE',       'ก๊าซอะเซทิลีน',                  'Acetylene',                      1, 'kg',    107),
  (1, 'FUEL_ETHANE',          'ก๊าซอีเทน',                      'Ethane',                         1, 'kg',    108),
  (1, 'FUEL_PROPANE',         'ก๊าซโพรเพน',                     'Propane',                        1, 'kg',    109),
  (1, 'FUEL_BUTANE',          'ก๊าซบิวเทน',                     'Butane',                         1, 'kg',    110),
  (1, 'FUEL_FUELOIL_A',       'น้ำมันเตา A (Fuel Oil A)',        'Fuel Oil A',                     1, 'litre', 111),
  (1, 'FUEL_FUELOIL_C',       'น้ำมันเตา C (Fuel Oil C)',        'Fuel Oil C',                     1, 'litre', 112),
  (1, 'FUEL_KEROSENE_JET',    'น้ำมันก๊าด Jet Kerosene',         'Jet Kerosene',                   1, 'litre', 113),
  (1, 'FUEL_KEROSENE_OTHER',  'น้ำมันก๊าด Other Kerosene',       'Other Kerosene',                 1, 'litre', 114),
  (1, 'FUEL_BIODIESEL',       'ไบโอดีเซล',                      'Biodiesel',                      1, 'litre', 115),
  (1, 'FUEL_BIOGASOLINE',     'ไบโอแก๊สโซลีน (Ethanol)',         'Bio-gasoline (Ethanol)',         1, 'litre', 116),
  (1, 'FUEL_DIESEL_B7',       'ดีเซล B7 (Fossil Scope 1)',       'Diesel B7 — Scope 1 fossil',     1, 'litre', 117),
  (1, 'FUEL_DIESEL_B7_BIO',   'ดีเซล B7 (Biogenic CO2)',        'Diesel B7 — Biogenic CO2',       1, 'litre', 118),
  (1, 'FUEL_DIESEL_B20',      'ดีเซล B20 (Fossil Scope 1)',      'Diesel B20 — Scope 1 fossil',    1, 'litre', 119),
  (1, 'FUEL_DIESEL_B20_BIO',  'ดีเซล B20 (Biogenic CO2)',       'Diesel B20 — Biogenic CO2',      1, 'litre', 120),
  (1, 'FUEL_GASOHOL_E10',     'แก๊สโซฮอล์ E10 (Fossil Scope 1)','Gasohol E10 — Scope 1 fossil',   1, 'litre', 121),
  (1, 'FUEL_GASOHOL_E10_BIO', 'แก๊สโซฮอล์ E10 (Biogenic CO2)', 'Gasohol E10 — Biogenic CO2',     1, 'litre', 122),
  (1, 'FUEL_GASOHOL_E20',     'แก๊สโซฮอล์ E20 (Fossil Scope 1)','Gasohol E20 — Scope 1 fossil',   1, 'litre', 123),
  (1, 'FUEL_GASOHOL_E20_BIO', 'แก๊สโซฮอล์ E20 (Biogenic CO2)', 'Gasohol E20 — Biogenic CO2',     1, 'litre', 124),
  (1, 'FUEL_GASOHOL_E85',     'แก๊สโซฮอล์ E85 (Fossil Scope 1)','Gasohol E85 — Scope 1 fossil',   1, 'litre', 125),
  (1, 'FUEL_GASOHOL_E85_BIO', 'แก๊สโซฮอล์ E85 (Biogenic CO2)', 'Gasohol E85 — Biogenic CO2',     1, 'litre', 126),
  (1, 'FUEL_LIGNITE',         'ถ่านหินลิกไนต์',                 'Lignite',                        1, 'kg',    127),
  (1, 'FUEL_ANTHRACITE',      'ถ่านหินแอนทราไซต์',              'Anthracite',                     1, 'kg',    128),
  (1, 'FUEL_COAL_BITUMINOUS', 'ถ่านหิน Bituminous',             'Bituminous Coal',                1, 'kg',    129),
  (1, 'FUEL_COAL_COKING',     'ถ่านหิน Coking',                 'Coking Coal',                    1, 'kg',    130),
  (1, 'FUEL_COAL_SUBBIT',     'ถ่านหิน Sub-bituminous',         'Sub-bituminous Coal',            1, 'kg',    131),
  (1, 'FUEL_WOOD',            'ฟืน (CH4+N2O เท่านั้น)',          'Fuel wood — Scope 1 (CH4+N2O)',  1, 'kg',    132),
  (1, 'FUEL_WOOD_BIO',        'ฟืน (Biogenic CO2)',             'Fuel wood — Biogenic CO2',       1, 'kg',    133),
  (1, 'FUEL_SAWDUST',         'ขี้เลื่อย (CH4+N2O เท่านั้น)',   'Saw dust — Scope 1 (CH4+N2O)',   1, 'kg',    134),
  (1, 'FUEL_SAWDUST_BIO',     'ขี้เลื่อย (Biogenic CO2)',       'Saw dust — Biogenic CO2',        1, 'kg',    135),
  (1, 'FUEL_CHARCOAL',        'ถ่านไม้ (CH4+N2O เท่านั้น)',     'Charcoal — Scope 1 (CH4+N2O)',   1, 'kg',    136),
  (1, 'FUEL_CHARCOAL_BIO',    'ถ่านไม้ (Biogenic CO2)',         'Charcoal — Biogenic CO2',        1, 'kg',    137),
  (1, 'FUEL_PADDYHUSK',       'แกลบ (CH4+N2O เท่านั้น)',        'Paddy husk — Scope 1 (CH4+N2O)', 1, 'kg',    138),
  (1, 'FUEL_PADDYHUSK_BIO',   'แกลบ (Biogenic CO2)',            'Paddy husk — Biogenic CO2',      1, 'kg',    139),
  (1, 'FUEL_BAGASSE',         'กากอ้อย (CH4+N2O เท่านั้น)',     'Bagasse — Scope 1 (CH4+N2O)',    1, 'kg',    140),
  (1, 'FUEL_BAGASSE_BIO',     'กากอ้อย (Biogenic CO2)',         'Bagasse — Biogenic CO2',         1, 'kg',    141),
  (1, 'FUEL_PALMSHELL',       'กะลาปาล์ม (CH4+N2O เท่านั้น)',  'Palm kernel shell — Scope 1',    1, 'kg',    142),
  (1, 'FUEL_PALMSHELL_BIO',   'กะลาปาล์ม (Biogenic CO2)',      'Palm kernel shell — Biogenic',   1, 'kg',    143),
  (1, 'FUEL_COB',             'ซังข้าวโพด (CH4+N2O เท่านั้น)', 'Cob — Scope 1 (CH4+N2O)',        1, 'kg',    144),
  (1, 'FUEL_COB_BIO',         'ซังข้าวโพด (Biogenic CO2)',      'Cob — Biogenic CO2',             1, 'kg',    145),
  (1, 'FUEL_BIOGAS',          'ก๊าซชีวภาพ (CH4+N2O เท่านั้น)', 'Biogas — Scope 1 (CH4+N2O)',     1, 'm3',    146),
  (1, 'FUEL_BIOGAS_BIO',      'ก๊าซชีวภาพ (Biogenic CO2)',     'Biogas — Biogenic CO2',          1, 'm3',    147);
```

### 4.2 Scope 1 — Mobile Combustion On-road (parent_id=2)

```sql
INSERT INTO ef_categories (parent_id, category_code, name_th, name_en, scope_id, unit_activity, sort_order) VALUES
  (2, 'MOBILE_ONROAD_CNG',         'CNG (ยานพาหนะบนถนน)',                'On-road CNG',                         1, 'kg',    201),
  (2, 'MOBILE_ONROAD_LPG_L',       'LPG (ยานพาหนะบนถนน, ลิตร)',         'On-road LPG (litre)',                  1, 'litre', 202),
  (2, 'MOBILE_ONROAD_LPG_KG',      'LPG (ยานพาหนะบนถนน, กก.)',          'On-road LPG (kg)',                     1, 'kg',    203),
  (2, 'MOBILE_ONROAD_DIESEL',      'ดีเซล (ยานพาหนะบนถนน)',             'On-road Diesel',                      1, 'litre', 204),
  (2, 'MOBILE_ONROAD_GAS_UNCNTRL', 'น้ำมันเบนซิน (ไม่มีตัวเร่งปฏิกิริยา)', 'Motor Gasoline — uncontrolled',  1, 'litre', 205),
  (2, 'MOBILE_ONROAD_GAS_OXCAT',   'น้ำมันเบนซิน (oxidation catalyst)',  'Motor Gasoline — oxidation catalyst', 1, 'litre', 206),
  (2, 'MOBILE_ONROAD_GAS_LOWM',    'น้ำมันเบนซิน (low mileage ≥1995)',   'Motor Gasoline — low mileage ≥1995',  1, 'litre', 207),
  (2, 'MOBILE_ONROAD_BIODIESEL',   'ไบโอดีเซล (ยานพาหนะบนถนน)',        'On-road Biodiesel',                   1, 'litre', 208),
  (2, 'MOBILE_ONROAD_ETHANOL',     'เอทานอล (ยานพาหนะบนถนน)',           'On-road Ethanol (Bio-gasoline)',       1, 'litre', 209),
  (2, 'MOBILE_ONROAD_B7',          'ดีเซล B7 บนถนน (Fossil)',            'On-road Diesel B7 — Scope 1',         1, 'litre', 210),
  (2, 'MOBILE_ONROAD_B7_BIO',      'ดีเซล B7 บนถนน (Biogenic)',          'On-road Diesel B7 — Biogenic CO2',    1, 'litre', 211),
  (2, 'MOBILE_ONROAD_B20',         'ดีเซล B20 บนถนน (Fossil)',           'On-road Diesel B20 — Scope 1',        1, 'litre', 212),
  (2, 'MOBILE_ONROAD_B20_BIO',     'ดีเซล B20 บนถนน (Biogenic)',         'On-road Diesel B20 — Biogenic CO2',   1, 'litre', 213),
  (2, 'MOBILE_ONROAD_E10_OXCAT',   'แก๊สโซฮอล์ E10 (oxidation catalyst)', 'On-road Gasohol E10 oxcat',         1, 'litre', 214),
  (2, 'MOBILE_ONROAD_E10_OXCAT_BIO','E10 oxcat (Biogenic)',               'On-road Gasohol E10 oxcat — Biogenic',1, 'litre', 215),
  (2, 'MOBILE_ONROAD_E20_OXCAT',   'แก๊สโซฮอล์ E20 (oxidation catalyst)', 'On-road Gasohol E20 oxcat',         1, 'litre', 216),
  (2, 'MOBILE_ONROAD_E20_OXCAT_BIO','E20 oxcat (Biogenic)',               'On-road Gasohol E20 oxcat — Biogenic',1, 'litre', 217),
  (2, 'MOBILE_ONROAD_E85_OXCAT',   'แก๊สโซฮอล์ E85 (oxidation catalyst)', 'On-road Gasohol E85 oxcat',         1, 'litre', 218),
  (2, 'MOBILE_ONROAD_E85_OXCAT_BIO','E85 oxcat (Biogenic)',               'On-road Gasohol E85 oxcat — Biogenic',1, 'litre', 219),
  (2, 'MOBILE_ONROAD_E10_LOWM',    'แก๊สโซฮอล์ E10 (low mileage ≥1995)','On-road Gasohol E10 low mileage',     1, 'litre', 220),
  (2, 'MOBILE_ONROAD_E10_LOWM_BIO','E10 low mileage (Biogenic)',          'On-road Gasohol E10 low mileage — Biogenic',1,'litre',221),
  (2, 'MOBILE_ONROAD_E20_LOWM',    'แก๊สโซฮอล์ E20 (low mileage ≥1995)','On-road Gasohol E20 low mileage',     1, 'litre', 222),
  (2, 'MOBILE_ONROAD_E20_LOWM_BIO','E20 low mileage (Biogenic)',          'On-road Gasohol E20 low mileage — Biogenic',1,'litre',223),
  (2, 'MOBILE_ONROAD_E85_LOWM',    'แก๊สโซฮอล์ E85 (low mileage ≥1995)','On-road Gasohol E85 low mileage',     1, 'litre', 224),
  (2, 'MOBILE_ONROAD_E85_LOWM_BIO','E85 low mileage (Biogenic)',          'On-road Gasohol E85 low mileage — Biogenic',1,'litre',225);
```

### 4.3 Scope 1 — Mobile Combustion Off-road (parent_id=2)

```sql
INSERT INTO ef_categories (parent_id, category_code, name_th, name_en, scope_id, unit_activity, sort_order) VALUES
  (2, 'MOBILE_OFFROAD_LPG_KG',       'LPG (ยานพาหนะนอกถนน, กก.)',          'Off-road LPG (kg)',               1, 'kg',    301),
  (2, 'MOBILE_OFFROAD_DIESEL',       'ดีเซล (ยานพาหนะนอกถนน)',             'Off-road Diesel',                 1, 'litre', 302),
  (2, 'MOBILE_OFFROAD_BIODIESEL',    'ไบโอดีเซล (ยานพาหนะนอกถนน)',        'Off-road Biodiesel',              1, 'litre', 303),
  (2, 'MOBILE_OFFROAD_ETHANOL',      'เอทานอล (ยานพาหนะนอกถนน)',           'Off-road Ethanol',                1, 'litre', 304),
  (2, 'MOBILE_OFFROAD_GAS2ST',       'น้ำมันเบนซิน 2-stroke (นอกถนน)',     'Off-road Motor Gasoline 2-stroke', 1, 'litre', 305),
  (2, 'MOBILE_OFFROAD_GAS4ST',       'น้ำมันเบนซิน 4-stroke (นอกถนน)',     'Off-road Motor Gasoline 4-stroke', 1, 'litre', 306),
  (2, 'MOBILE_OFFROAD_B7',           'ดีเซล B7 (นอกถนน, Fossil)',           'Off-road Diesel B7 — Scope 1',    1, 'litre', 307),
  (2, 'MOBILE_OFFROAD_B7_BIO',       'ดีเซล B7 (นอกถนน, Biogenic)',        'Off-road Diesel B7 — Biogenic',   1, 'litre', 308);
```

### 4.4 Scope 1 — Fugitive (parent_id=4)

```sql
INSERT INTO ef_categories (parent_id, category_code, name_th, name_en, scope_id, unit_activity, sort_order) VALUES
  (4, 'FUGITIVE_R22',   'สารทำความเย็น R-22',   'Refrigerant R-22 (HCFC-22)', 1, 'kg', 401),
  (4, 'FUGITIVE_R32',   'สารทำความเย็น R-32',   'Refrigerant R-32',           1, 'kg', 402),
  (4, 'FUGITIVE_R125',  'สารทำความเย็น R-125',  'Refrigerant R-125',          1, 'kg', 403),
  (4, 'FUGITIVE_R134',  'สารทำความเย็น R-134',  'Refrigerant R-134',          1, 'kg', 404),
  (4, 'FUGITIVE_R134A', 'สารทำความเย็น R-134a', 'Refrigerant R-134a',         1, 'kg', 405),
  (4, 'FUGITIVE_R143',  'สารทำความเย็น R-143',  'Refrigerant R-143',          1, 'kg', 406),
  (4, 'FUGITIVE_R143A', 'สารทำความเย็น R-143a', 'Refrigerant R-143a',         1, 'kg', 407),
  (4, 'FUGITIVE_R404A', 'สารทำความเย็น R-404A', 'Refrigerant R-404A',         1, 'kg', 408),
  (4, 'FUGITIVE_R407A', 'สารทำความเย็น R-407A', 'Refrigerant R-407A',         1, 'kg', 409),
  (4, 'FUGITIVE_R407C', 'สารทำความเย็น R-407C', 'Refrigerant R-407C',         1, 'kg', 410),
  (4, 'FUGITIVE_R410A', 'สารทำความเย็น R-410A', 'Refrigerant R-410A',         1, 'kg', 411);
```

### 4.5 Scope 2 — Electricity (parent_id=5)

```sql
INSERT INTO ef_categories (parent_id, category_code, name_th, name_en, scope_id, unit_activity, sort_order) VALUES
  (5, 'ELEC_GRID_TH_2016_S2',   'ไฟฟ้าระบบสายส่ง ปี 2016-2018 (CFO Scope2)', 'Grid Electricity 2016-2018 (CFO Scope2)', 2, 'kWh', 501),
  (5, 'ELEC_GRID_TH_2016_S3',   'ไฟฟ้าระบบสายส่ง ปี 2016-2018 (Scope3 upstream)', 'Grid Electricity 2016-2018 (Scope3)', 2, 'kWh', 502),
  (5, 'ELEC_GRID_TH_2016_CFP',  'ไฟฟ้าระบบสายส่ง ปี 2016-2018 (CFP)',        'Grid Electricity 2016-2018 (CFP)',        2, 'kWh', 503),
  (5, 'ELEC_GRID_TH_2022_S2',   'ไฟฟ้าระบบสายส่ง ปี 2022-2024 (CFO Scope2)', 'Grid Electricity 2022-2024 (CFO Scope2)', 2, 'kWh', 504),
  (5, 'ELEC_GRID_TH_2022_S3',   'ไฟฟ้าระบบสายส่ง ปี 2022-2024 (Scope3 upstream)', 'Grid Electricity 2022-2024 (Scope3)', 2, 'kWh', 505),
  (5, 'ELEC_GRID_TH_2022_CFP',  'ไฟฟ้าระบบสายส่ง ปี 2022-2024 (CFP)',        'Grid Electricity 2022-2024 (CFP)',        2, 'kWh', 506);
```

### 4.6 Scope 3 Categories (parent_id = category_id ของ SCOPE3_UPSTREAM)

```sql
INSERT INTO ef_categories (parent_id, category_code, name_th, name_en, scope_id, unit_activity, sort_order) VALUES
  -- Cat 1: Purchased goods
  (7, 'S3C1_PAPER',         'กระดาษ',                         'Paper',                     3, 'kg',   601),
  (7, 'S3C1_INK',           'หมึกพิมพ์',                      'Ink / Toner',               3, 'kg',   602),
  (7, 'S3C1_WATER',         'น้ำประปา',                       'Tap water',                 3, 'm3',   603),
  -- Cat 2: Capital goods
  (7, 'S3C2_BUILDING',      'อาคาร / สิ่งปรับปรุงอาคาร',     'Building / Renovation',     3, 'THB',  611),
  (7, 'S3C2_OFFICE_EQUIP',  'อุปกรณ์สำนักงาน (ไม่รวมกระดาษ)','Office equipment',          3, 'THB',  612),
  (7, 'S3C2_COMPUTER',      'คอมพิวเตอร์',                    'Computers',                 3, 'THB',  613),
  (7, 'S3C2_SOFTWARE',      'ซอฟต์แวร์ / โปรแกรมคอมพิวเตอร์','Software',                  3, 'THB',  614),
  (7, 'S3C2_VEHICLE_CAP',   'ยานพาหนะ (สินทรัพย์ทุน)',        'Vehicles (capital goods)',   3, 'THB',  615),
  -- Cat 3: Fuel & energy related
  (7, 'S3C3_DIESEL_UPS',    'การได้มาของน้ำมันดีเซล (upstream)','Diesel acquisition (upstream)',  3, 'kg',  621),
  (7, 'S3C3_GASOLINE_UPS',  'การได้มาของน้ำมันเบนซิน (upstream)','Gasoline acquisition (upstream)',3, 'kg',  622),
  (7, 'S3C3_ELEC_UPS',      'การได้มาของไฟฟ้า (upstream)',     'Electricity acquisition (upstream)',3,'kWh', 623),
  (7, 'S3C3_LPG_UPS',       'การได้มาของ LPG (upstream)',      'LPG acquisition (upstream)',      3, 'kg',  624),
  (7, 'S3C3_ETHANOL_UPS',   'การได้มาของเอทานอล (upstream)',   'Ethanol acquisition (upstream)',   3, 'kg',  625),
  -- Cat 5: Waste
  (7, 'S3C5_WASTE_LANDFILL','ขยะทั่วไป (ฝังกลบ)',              'General waste — landfill',    3, 'kg',  631),
  (7, 'S3C5_WASTE_INCIN',   'ขยะอันตราย (เผาทำลาย)',           'Hazardous waste — incineration',3,'kg', 632),
  (7, 'S3C5_SLUDGE',        'กากตะกอน (ฝังกลบ)',              'Sludge — landfill',           3, 'ton', 633),
  (7, 'S3C5_TRANSPORT_TKM', 'การขนส่งของเสีย (tkm)',           'Waste transport (tkm)',        3, 'tkm', 634),
  (7, 'S3C5_TRANSPORT_KM',  'การขนส่งของเสีย (km)',            'Waste transport (km)',         3, 'km',  635),
  (7, 'S3C5_EXCAVATOR',     'รถแบคโฮ/รถขุด (Diesel off-road)', 'Excavator — Diesel off-road', 3, 'litre',636),
  -- Cat 7: Employee commuting
  (8, 'S3C7_COMMUTE_DIESEL','เดินทางพนักงาน/ลูกค้า — Diesel', 'Commuting/Customer — Diesel', 3, 'litre',641),
  (8, 'S3C7_COMMUTE_GAS',   'เดินทางพนักงาน/ลูกค้า — Gasoline','Commuting/Customer — Gasoline',3,'litre',642),
  (8, 'S3C7_COMMUTE_LPG',   'เดินทางพนักงาน — LPG (kg)',       'Commuting — LPG (kg)',        3, 'kg',  643),
  (8, 'S3C7_COMMUTE_EV',    'เดินทางพนักงาน — รถไฟฟ้า',       'Commuting — EV (kWh)',        3, 'kWh', 644),
  (8, 'S3C7_COMMUTE_CNG',   'เดินทางพนักงาน/ลูกค้า — CNG',    'Commuting/Customer — CNG',    3, 'kg',  645);
```

---

## ส่วนที่ 5: UPDATE `emission_factors` ที่มีอยู่แล้ว (ค่าเก่า/ผิด)

**วิธีการ:** ไม่ลบ record เดิม แต่ปิดด้วย `effective_until` เพื่อเก็บประวัติ

```sql
-- ปิด records เดิมทั้งหมดใน seed (ef_id 1–6)
UPDATE emission_factors
SET    effective_until = '2025-12-31',
       is_default      = 0,
       notes           = CONCAT(IFNULL(notes,''), ' [superseded 2026-01-01]')
WHERE  ef_id IN (1, 2, 3, 4, 5, 6);
```

| ef_id | activity | ค่าเดิม | ค่าใหม่จาก PDF | เหตุผล |
|-------|----------|---------|----------------|--------|
| 1 | Electricity grid TH | 0.5813 | 0.4999 / 0.4750 | PDF ปรับใหม่ |
| 2 | Diesel CO₂ | 2.6580 | 2.6987 | ไม่ตรงกับ PDF 2569 |
| 3 | Diesel CH₄ | 0.00012600 | 0.00010900 | ใช้ค่าจาก [XLS-EF] |
| 4 | Diesel N₂O | 0.00001260 | 0.00002190 | ใช้ค่าจาก [XLS-EF] |
| 5 | Gasoline CO₂ | 2.3558 | 2.1816 | ไม่ตรงกับ PDF 2569 |
| 6 | LPG CO₂ (kg) | 2.9942 | 3.1106 | ไม่ตรงกับ PDF 2569 |

---

## ส่วนที่ 6: INSERT `emission_factors` — Scope 1 Stationary Combustion

> **source_id = 1** (TGO_AR5) · **effective_from = '2026-01-01'** · **region = 'Thailand'**  
> **อ้างอิง:** [PDF] IPCC defaults (2006) Vol.2 Ch.2 Table 2.3 + TGO conversion  
> **วิธีอ่านตาราง:** แต่ละแถว = 1 row ใน emission_factors  
> `gas_id`: 1=CO₂, 2=CH₄(biogenic), 3=N₂O, 6=CH₄_FOSSIL

### 6.1 เชื้อเพลิงฟอสซิล — CO₂ + Fossil CH₄ + N₂O

| category_code | gas_id | ef_value | ef_unit | ef_unit_num | ef_unit_den | notes |
|---|---|---|---|---|---|---|
| FUEL_NATGAS_NCV_SCF | 1 | 0.05720000 | kgCO2/scf | kgCO2 | scf | CO₂ fossil |
| FUEL_NATGAS_NCV_SCF | 6 | 0.00000102 | kgCH4/scf | kgCH4 | scf | Fossil CH₄ |
| FUEL_NATGAS_NCV_SCF | 3 | 0.00000010 | kgN2O/scf | kgN2O | scf | N₂O |
| FUEL_NATGAS_NCV_MJ | 1 | 0.05610000 | kgCO2/MJ | kgCO2 | MJ | CO₂ fossil |
| FUEL_NATGAS_NCV_MJ | 6 | 0.00000100 | kgCH4/MJ | kgCH4 | MJ | Fossil CH₄ |
| FUEL_NATGAS_NCV_MJ | 3 | 0.00000010 | kgN2O/MJ | kgN2O | MJ | N₂O |
| FUEL_NATGAS_HHV_MJ | 1 | 0.05010000 | kgCO2/MJ | kgCO2 | MJ | CO₂ fossil |
| FUEL_NATGAS_HHV_MJ | 6 | 0.00000100 | kgCH4/MJ | kgCH4 | MJ | Fossil CH₄ (ประมาณ) |
| FUEL_NATGAS_HHV_MJ | 3 | 0.00000010 | kgN2O/MJ | kgN2O | MJ | N₂O |
| FUEL_NATGAS_HHV_MMBTU | 1 | 52.90000000 | kgCO2/MMBTU | kgCO2 | MMBTU | CO₂ fossil |
| FUEL_NATGAS_HHV_MMBTU | 6 | 0.00100000 | kgCH4/MMBTU | kgCH4 | MMBTU | Fossil CH₄ |
| FUEL_NATGAS_HHV_MMBTU | 3 | 0.00010000 | kgN2O/MMBTU | kgN2O | MMBTU | N₂O |
| FUEL_LPG_LITRE | 1 | 1.67970000 | kgCO2/litre | kgCO2 | litre | CO₂ fossil |
| FUEL_LPG_LITRE | 6 | 0.00002660 | kgCH4/litre | kgCH4 | litre | Fossil CH₄ |
| FUEL_LPG_LITRE | 3 | 0.00000266 | kgN2O/litre | kgN2O | litre | N₂O |
| FUEL_LPG_KG | 1 | 3.11060000 | kgCO2/kg | kgCO2 | kg | CO₂ fossil |
| FUEL_LPG_KG | 6 | 0.00004930 | kgCH4/kg | kgCH4 | kg | Fossil CH₄ |
| FUEL_LPG_KG | 3 | 0.00000493 | kgN2O/kg | kgN2O | kg | N₂O |
| FUEL_ACETYLENE | 1 | 3.38460000 | kgCO2/kg | kgCO2 | kg | CO₂ fossil; 2C₂H₂+5O₂→4CO₂+2H₂O |
| FUEL_ETHANE | 1 | 3.14290000 | kgCO2/kg | kgCO2 | kg | CO₂ fossil; C₂H₄+3O₂→2CO₂+2H₂O |
| FUEL_PROPANE | 1 | 3.00000000 | kgCO2/kg | kgCO2 | kg | CO₂ fossil; C₃H₈+5O₂→3CO₂+4H₂O |
| FUEL_BUTANE | 1 | 3.03450000 | kgCO2/kg | kgCO2 | kg | CO₂ fossil; 2C₄H₁₀+13O₂→8CO₂+10H₂O |
| FUEL_FUELOIL_A | 1 | 3.20970000 | kgCO2/litre | kgCO2 | litre | CO₂ fossil |
| FUEL_FUELOIL_A | 6 | 0.00012400 | kgCH4/litre | kgCH4 | litre | Fossil CH₄ |
| FUEL_FUELOIL_A | 3 | 0.00002490 | kgN2O/litre | kgN2O | litre | N₂O |
| FUEL_FUELOIL_C | 1 | 3.23530000 | kgCO2/litre | kgCO2 | litre | CO₂ fossil |
| FUEL_FUELOIL_C | 6 | 0.00012500 | kgCH4/litre | kgCH4 | litre | Fossil CH₄ |
| FUEL_FUELOIL_C | 3 | 0.00002510 | kgN2O/litre | kgN2O | litre | N₂O |
| FUEL_KEROSENE_JET | 1 | 2.46890000 | kgCO2/litre | kgCO2 | litre | CO₂ fossil |
| FUEL_KEROSENE_JET | 6 | 0.00010400 | kgCH4/litre | kgCH4 | litre | Fossil CH₄ |
| FUEL_KEROSENE_JET | 3 | 0.00002070 | kgN2O/litre | kgN2O | litre | N₂O |
| FUEL_KEROSENE_OTHER | 1 | 2.48270000 | kgCO2/litre | kgCO2 | litre | CO₂ fossil |
| FUEL_KEROSENE_OTHER | 6 | 0.00010400 | kgCH4/litre | kgCH4 | litre | Fossil CH₄ |
| FUEL_KEROSENE_OTHER | 3 | 0.00002070 | kgN2O/litre | kgN2O | litre | N₂O |
| FUEL_DIESEL | 1 | 2.69870000 | kgCO2/litre | kgCO2 | litre | CO₂ fossil |
| FUEL_DIESEL | 6 | 0.00010900 | kgCH4/litre | kgCH4 | litre | Fossil CH₄ |
| FUEL_DIESEL | 3 | 0.00002190 | kgN2O/litre | kgN2O | litre | N₂O |
| FUEL_GASOLINE | 1 | 2.18160000 | kgCO2/litre | kgCO2 | litre | CO₂ fossil |
| FUEL_GASOLINE | 6 | 0.00009440 | kgCH4/litre | kgCH4 | litre | Fossil CH₄ |
| FUEL_GASOLINE | 3 | 0.00001890 | kgN2O/litre | kgN2O | litre | N₂O |
| FUEL_LIGNITE | 1 | 1.20190000 | kgCO2/kg | kgCO2 | kg | CO₂ fossil |
| FUEL_LIGNITE | 6 | 0.00010500 | kgCH4/kg | kgCH4 | kg | Fossil CH₄ |
| FUEL_LIGNITE | 3 | 0.00001570 | kgN2O/kg | kgN2O | kg | N₂O |
| FUEL_ANTHRACITE | 1 | 3.08660000 | kgCO2/kg | kgCO2 | kg | CO₂ fossil |
| FUEL_ANTHRACITE | 6 | 0.00031400 | kgCH4/kg | kgCH4 | kg | Fossil CH₄ |
| FUEL_ANTHRACITE | 3 | 0.00004710 | kgN2O/kg | kgN2O | kg | N₂O |
| FUEL_COAL_BITUMINOUS | 1 | 2.49460000 | kgCO2/kg | kgCO2 | kg | CO₂ fossil |
| FUEL_COAL_BITUMINOUS | 6 | 0.00030000 | kgCH4/kg | kgCH4 | kg | Fossil CH₄ |
| FUEL_COAL_BITUMINOUS | 3 | 0.00000000 | kgN2O/kg | kgN2O | kg | N₂O (trace) |
| FUEL_COAL_COKING | 1 | 2.61380000 | kgCO2/kg | kgCO2 | kg | CO₂ fossil |
| FUEL_COAL_COKING | 6 | 0.00030000 | kgCH4/kg | kgCH4 | kg | Fossil CH₄ |
| FUEL_COAL_COKING | 3 | 0.00000000 | kgN2O/kg | kgN2O | kg | N₂O (trace) |
| FUEL_COAL_SUBBIT | 1 | 2.53000000 | kgCO2/kg | kgCO2 | kg | CO₂ fossil; จาก [XLS-EF] |
| FUEL_COAL_SUBBIT | 6 | 0.00002640 | kgCH4/kg | kgCH4 | kg | Fossil CH₄; [XLS-EF] |
| FUEL_COAL_SUBBIT | 3 | 0.00003960 | kgN2O/kg | kgN2O | kg | N₂O; [XLS-EF] |

> ⚠️ `FUEL_COAL_SUBBIT` ใช้ค่าจาก [XLS-EF] (Sub-bituminous) ไม่มีใน [PDF]  
> ⚠️ Bituminous / Coking coal ค่า N₂O ใน [PDF] ระบุเป็น 0.0000 แต่ Total ต่างจาก CO₂  
>   → PDF บอก Bituminous Total = 2.5125, CO₂ = 2.4946 → diff = 0.0179 มาจาก CH₄ (0.0003 × 28 = 0.0084)  
>   ยังขาดอีก → น่าจะ N₂O trace ที่ PDF ปัดทิ้ง ให้ใส่ N₂O = 0.00000000 ตามนั้น

### 6.2 เชื้อเพลิงชีวมวล (Biomass / Biofuel) — Scope 1 part

| category_code | gas_id | ef_value | ef_unit | หมายเหตุ |
|---|---|---|---|---|
| FUEL_BIODIESEL | 1 | 1.64400000 | kgCO2/litre | CO₂ fossil ส่วนที่ไม่ใช่ชีวมวล |
| FUEL_BIODIESEL | 2 | 0.00010000 | kgCH4/litre | CH₄ biogenic |
| FUEL_BIODIESEL | 3 | 0.00000000 | kgN2O/litre | N₂O |
| FUEL_BIOGASOLINE | 1 | 1.49680000 | kgCO2/litre | CO₂ fossil |
| FUEL_BIOGASOLINE | 2 | 0.00010000 | kgCH4/litre | CH₄ biogenic |
| FUEL_BIOGASOLINE | 3 | 0.00000000 | kgN2O/litre | N₂O |
| FUEL_WOOD | 2 | 0.00048000 | kgCH4/kg | CH₄ biogenic; รายงาน Scope 1 |
| FUEL_WOOD | 3 | 0.00006400 | kgN2O/kg | N₂O; รายงาน Scope 1 |
| FUEL_WOOD_BIO | 7 | 1.79090000 | kgCO2bio/kg | Biogenic CO₂ รายงานแยก |
| FUEL_SAWDUST | 2 | 0.00030000 | kgCH4/kg | CH₄ biogenic |
| FUEL_SAWDUST | 3 | 0.00000000 | kgN2O/kg | N₂O |
| FUEL_SAWDUST_BIO | 7 | 1.21860000 | kgCO2bio/kg | Biogenic CO₂ |
| FUEL_CHARCOAL | 2 | 0.00580000 | kgCH4/kg | CH₄ biogenic |
| FUEL_CHARCOAL | 3 | 0.00010000 | kgN2O/kg | N₂O |
| FUEL_CHARCOAL_BIO | 7 | 3.23460000 | kgCO2bio/kg | Biogenic CO₂ |
| FUEL_PADDYHUSK | 2 | 0.00040000 | kgCH4/kg | CH₄ biogenic |
| FUEL_PADDYHUSK | 3 | 0.00010000 | kgN2O/kg | N₂O |
| FUEL_PADDYHUSK_BIO | 7 | 1.44000000 | kgCO2bio/kg | Biogenic CO₂ |
| FUEL_BAGASSE | 2 | 0.00022600 | kgCH4/kg | CH₄ biogenic |
| FUEL_BAGASSE | 3 | 0.00003010 | kgN2O/kg | N₂O |
| FUEL_BAGASSE_BIO | 7 | 0.75300000 | kgCO2bio/kg | Biogenic CO₂ |
| FUEL_PALMSHELL | 2 | 0.00055600 | kgCH4/kg | CH₄ biogenic |
| FUEL_PALMSHELL | 3 | 0.00007410 | kgN2O/kg | N₂O |
| FUEL_PALMSHELL_BIO | 7 | 1.85300000 | kgCO2bio/kg | Biogenic CO₂ |
| FUEL_COB | 2 | 0.00050300 | kgCH4/kg | CH₄ biogenic |
| FUEL_COB | 3 | 0.00006710 | kgN2O/kg | N₂O |
| FUEL_COB_BIO | 7 | 1.67800000 | kgCO2bio/kg | Biogenic CO₂ ⚠️ดูหมายเหตุ |
| FUEL_BIOGAS | 2 | 0.00002090 | kgCH4/m3 | CH₄ biogenic |
| FUEL_BIOGAS | 3 | 0.00000209 | kgN2O/m3 | N₂O |
| FUEL_BIOGAS_BIO | 7 | 1.14280000 | kgCO2bio/m3 | Biogenic CO₂ |

> ⚠️ **Cob Biogenic CO₂:** [PDF] = 1.6780, [XLS-EF] แสดง CO₂=1.85 แต่ Total=1.678 → ให้ใช้ **1.67800000** ตาม [PDF] และ Total ใน [XLS-EF]  
> ⚠️ **Bagasse Scope 1:** [PDF] ระบุ Fossil CH₄ = "-" แต่ [XLS-EF] มี CH₄=2.26E-4 → ใช้ค่าจาก [XLS-EF] เพราะ [PDF] น่าจะเป็น typo

### 6.3 เชื้อเพลิงผสม (Blended Fuels) — Scope 1 stationary

> **ที่มา:** [PDF] ทั้งหมด · มีเฉพาะใน [PDF] ไม่มีใน [XLS-EF]

| category_code | gas_id | ef_value | ef_unit | หมายเหตุ |
|---|---|---|---|---|
| FUEL_DIESEL_B7 | 1 | 2.50980000 | kgCO2/litre | Scope 1 fossil (7% biodiesel) |
| FUEL_DIESEL_B7 | 6 | 0.00010000 | kgCH4/litre | Fossil CH₄ |
| FUEL_DIESEL_B7 | 3 | 0.00000000 | kgN2O/litre | N₂O |
| FUEL_DIESEL_B7_BIO | 7 | 0.11510000 | kgCO2bio/litre | Biogenic CO₂ รายงานแยก |
| FUEL_DIESEL_B20 | 1 | 2.15900000 | kgCO2/litre | Scope 1 fossil (20% biodiesel) |
| FUEL_DIESEL_B20 | 6 | 0.00010000 | kgCH4/litre | Fossil CH₄ |
| FUEL_DIESEL_B20 | 3 | 0.00000000 | kgN2O/litre | N₂O |
| FUEL_DIESEL_B20_BIO | 7 | 0.32880000 | kgCO2bio/litre | Biogenic CO₂ รายงานแยก |
| FUEL_GASOHOL_E10 | 1 | 1.96340000 | kgCO2/litre | Scope 1 fossil (10% ethanol) |
| FUEL_GASOHOL_E10 | 6 | 0.00010000 | kgCH4/litre | Fossil CH₄ |
| FUEL_GASOHOL_E10 | 3 | 0.00000000 | kgN2O/litre | N₂O |
| FUEL_GASOHOL_E10_BIO | 7 | 0.14970000 | kgCO2bio/litre | Biogenic CO₂ รายงานแยก |
| FUEL_GASOHOL_E20 | 1 | 1.74530000 | kgCO2/litre | Scope 1 fossil (20% ethanol) |
| FUEL_GASOHOL_E20 | 6 | 0.00010000 | kgCH4/litre | Fossil CH₄ |
| FUEL_GASOHOL_E20 | 3 | 0.00000000 | kgN2O/litre | N₂O |
| FUEL_GASOHOL_E20_BIO | 7 | 0.29940000 | kgCO2bio/litre | Biogenic CO₂ รายงานแยก |
| FUEL_GASOHOL_E85 | 1 | 0.32720000 | kgCO2/litre | Scope 1 fossil (85% ethanol) |
| FUEL_GASOHOL_E85 | 6 | 0.00010000 | kgCH4/litre | Fossil CH₄ |
| FUEL_GASOHOL_E85 | 3 | 0.00000000 | kgN2O/litre | N₂O |
| FUEL_GASOHOL_E85_BIO | 7 | 1.27230000 | kgCO2bio/litre | Biogenic CO₂ รายงานแยก |

---

## ส่วนที่ 7: INSERT `emission_factors` — Scope 1 Mobile Combustion (On-road)

> **source_id = 1** (TGO_AR5) · **effective_from = '2026-01-01'**  
> **อ้างอิง:** [PDF] IPCC defaults (2006) Vol.2 Ch.3 Table 3.2.1 & 3.2.2  
> ✅ cross-validated กับ [XLS-EF] — ค่าตรงกัน

| category_code | activity_subtype | gas_id | ef_value | ef_unit |
|---|---|---|---|---|
| MOBILE_ONROAD_CNG | — | 1 | 2.12620000 | kgCO2/kg |
| MOBILE_ONROAD_CNG | — | 6 | 0.00349000 | kgCH4/kg |
| MOBILE_ONROAD_CNG | — | 3 | 0.00011400 | kgN2O/kg |
| MOBILE_ONROAD_LPG_KG | — | 1 | 3.11060000 | kgCO2/kg |
| MOBILE_ONROAD_LPG_KG | — | 6 | 0.00306000 | kgCH4/kg |
| MOBILE_ONROAD_LPG_KG | — | 3 | 0.00000986 | kgN2O/kg |
| MOBILE_ONROAD_LPG_L | — | 1 | 1.67970000 | kgCO2/litre |
| MOBILE_ONROAD_LPG_L | — | 6 | 0.00165000 | kgCH4/litre |
| MOBILE_ONROAD_LPG_L | — | 3 | 0.00000532 | kgN2O/litre |
| MOBILE_ONROAD_DIESEL | — | 1 | 2.69870000 | kgCO2/litre |
| MOBILE_ONROAD_DIESEL | — | 6 | 0.00014200 | kgCH4/litre |
| MOBILE_ONROAD_DIESEL | — | 3 | 0.00014200 | kgN2O/litre |
| MOBILE_ONROAD_GAS_UNCNTRL | — | 1 | 2.18160000 | kgCO2/litre |
| MOBILE_ONROAD_GAS_UNCNTRL | — | 6 | 0.00104000 | kgCH4/litre |
| MOBILE_ONROAD_GAS_UNCNTRL | — | 3 | 0.00010100 | kgN2O/litre |
| MOBILE_ONROAD_GAS_OXCAT | — | 1 | 2.18160000 | kgCO2/litre |
| MOBILE_ONROAD_GAS_OXCAT | — | 6 | 0.00078700 | kgCH4/litre |
| MOBILE_ONROAD_GAS_OXCAT | — | 3 | 0.00025200 | kgN2O/litre |
| MOBILE_ONROAD_GAS_LOWM | — | 1 | 2.18160000 | kgCO2/litre |
| MOBILE_ONROAD_GAS_LOWM | — | 6 | 0.00012000 | kgCH4/litre |
| MOBILE_ONROAD_GAS_LOWM | — | 3 | 0.00017900 | kgN2O/litre |
| MOBILE_ONROAD_BIODIESEL | — | 1 | 1.64400000 | kgCO2/litre |
| MOBILE_ONROAD_BIODIESEL | — | 6 | 0.00010000 | kgCH4/litre |
| MOBILE_ONROAD_BIODIESEL | — | 3 | 0.00010000 | kgN2O/litre |
| MOBILE_ONROAD_ETHANOL | — | 1 | 1.49680000 | kgCO2/litre |
| MOBILE_ONROAD_ETHANOL | — | 2 | 0.00040000 | kgCH4/litre |
| MOBILE_ONROAD_B7 | — | 1 | 2.50980000 | kgCO2/litre |
| MOBILE_ONROAD_B7 | — | 6 | 0.00010000 | kgCH4/litre |
| MOBILE_ONROAD_B7 | — | 3 | 0.00010000 | kgN2O/litre |
| MOBILE_ONROAD_B7_BIO | — | 7 | 0.11510000 | kgCO2bio/litre |
| MOBILE_ONROAD_B20 | — | 1 | 2.15900000 | kgCO2/litre |
| MOBILE_ONROAD_B20 | — | 6 | 0.00010000 | kgCH4/litre |
| MOBILE_ONROAD_B20 | — | 3 | 0.00010000 | kgN2O/litre |
| MOBILE_ONROAD_B20_BIO | — | 7 | 0.32880000 | kgCO2bio/litre |
| MOBILE_ONROAD_E10_OXCAT | — | 1 | 1.96340000 | kgCO2/litre |
| MOBILE_ONROAD_E10_OXCAT | — | 6 | 0.00070000 | kgCH4/litre |
| MOBILE_ONROAD_E10_OXCAT | — | 3 | 0.00020000 | kgN2O/litre |
| MOBILE_ONROAD_E10_OXCAT_BIO | — | 7 | 0.14970000 | kgCO2bio/litre |
| MOBILE_ONROAD_E20_OXCAT | — | 1 | 1.74530000 | kgCO2/litre |
| MOBILE_ONROAD_E20_OXCAT | — | 6 | 0.00070000 | kgCH4/litre |
| MOBILE_ONROAD_E20_OXCAT | — | 3 | 0.00020000 | kgN2O/litre |
| MOBILE_ONROAD_E20_OXCAT_BIO | — | 7 | 0.29940000 | kgCO2bio/litre |
| MOBILE_ONROAD_E85_OXCAT | — | 1 | 0.32720000 | kgCO2/litre |
| MOBILE_ONROAD_E85_OXCAT | — | 6 | 0.00040000 | kgCH4/litre |
| MOBILE_ONROAD_E85_OXCAT | — | 3 | 0.00000000 | kgN2O/litre |
| MOBILE_ONROAD_E85_OXCAT_BIO | — | 7 | 1.27230000 | kgCO2bio/litre |
| MOBILE_ONROAD_E10_LOWM | — | 1 | 1.96340000 | kgCO2/litre |
| MOBILE_ONROAD_E10_LOWM | — | 6 | 0.00010000 | kgCH4/litre |
| MOBILE_ONROAD_E10_LOWM | — | 3 | 0.00020000 | kgN2O/litre |
| MOBILE_ONROAD_E10_LOWM_BIO | — | 7 | 0.14970000 | kgCO2bio/litre |
| MOBILE_ONROAD_E20_LOWM | — | 1 | 1.74530000 | kgCO2/litre |
| MOBILE_ONROAD_E20_LOWM | — | 6 | 0.00020000 | kgCH4/litre |
| MOBILE_ONROAD_E20_LOWM | — | 3 | 0.00010000 | kgN2O/litre |
| MOBILE_ONROAD_E20_LOWM_BIO | — | 7 | 0.29940000 | kgCO2bio/litre |
| MOBILE_ONROAD_E85_LOWM | — | 1 | 0.32720000 | kgCO2/litre |
| MOBILE_ONROAD_E85_LOWM | — | 6 | 0.00030000 | kgCH4/litre |
| MOBILE_ONROAD_E85_LOWM | — | 3 | 0.00000000 | kgN2O/litre |
| MOBILE_ONROAD_E85_LOWM_BIO | — | 7 | 1.27230000 | kgCO2bio/litre |

---

## ส่วนที่ 8: INSERT `emission_factors` — Scope 1 Mobile Combustion (Off-road)

> **source_id = 1** (TGO_AR5) · **effective_from = '2026-01-01'**  
> **อ้างอิง:** [PDF] IPCC defaults (2006) Vol.2 Ch.3 Table 3.3.1  
> **activity_subtype** = sector ย่อย (Agriculture / Forestry / Industry / Household)

| category_code | activity_subtype | gas_id | ef_value | ef_unit |
|---|---|---|---|---|
| MOBILE_OFFROAD_LPG_KG | — | 1 | 3.11060000 | kgCO2/kg |
| MOBILE_OFFROAD_LPG_KG | — | 6 | 0.00250000 | kgCH4/kg |
| MOBILE_OFFROAD_LPG_KG | — | 3 | 0.00010000 | kgN2O/kg |
| MOBILE_OFFROAD_DIESEL | Agriculture | 1 | 2.69870000 | kgCO2/litre |
| MOBILE_OFFROAD_DIESEL | Agriculture | 6 | 0.00015100 | kgCH4/litre |
| MOBILE_OFFROAD_DIESEL | Agriculture | 3 | 0.00104000 | kgN2O/litre |
| MOBILE_OFFROAD_DIESEL | Forestry | 1 | 2.69870000 | kgCO2/litre |
| MOBILE_OFFROAD_DIESEL | Forestry | 6 | 0.00015100 | kgCH4/litre |
| MOBILE_OFFROAD_DIESEL | Forestry | 3 | 0.00104000 | kgN2O/litre |
| MOBILE_OFFROAD_DIESEL | Industry | 1 | 2.69870000 | kgCO2/litre |
| MOBILE_OFFROAD_DIESEL | Industry | 6 | 0.00015100 | kgCH4/litre |
| MOBILE_OFFROAD_DIESEL | Industry | 3 | 0.00104000 | kgN2O/litre |
| MOBILE_OFFROAD_DIESEL | Household | 1 | 2.69870000 | kgCO2/litre |
| MOBILE_OFFROAD_DIESEL | Household | 6 | 0.00015100 | kgCH4/litre |
| MOBILE_OFFROAD_DIESEL | Household | 3 | 0.00104000 | kgN2O/litre |
| MOBILE_OFFROAD_BIODIESEL | — | 1 | 1.64400000 | kgCO2/litre |
| MOBILE_OFFROAD_ETHANOL | — | 1 | 1.49680000 | kgCO2/litre |
| MOBILE_OFFROAD_GAS4ST | Agriculture | 1 | 2.18160000 | kgCO2/litre |
| MOBILE_OFFROAD_GAS4ST | Agriculture | 6 | 0.00252000 | kgCH4/litre |
| MOBILE_OFFROAD_GAS4ST | Agriculture | 3 | 0.00006300 | kgN2O/litre |
| MOBILE_OFFROAD_GAS4ST | Forestry | 1 | 2.18160000 | kgCO2/litre |
| MOBILE_OFFROAD_GAS4ST | Forestry | 6 | 0.00000000 | kgCH4/litre |
| MOBILE_OFFROAD_GAS4ST | Forestry | 3 | 0.00000000 | kgN2O/litre |
| MOBILE_OFFROAD_GAS4ST | Industry | 1 | 2.18160000 | kgCO2/litre |
| MOBILE_OFFROAD_GAS4ST | Industry | 6 | 0.00157000 | kgCH4/litre |
| MOBILE_OFFROAD_GAS4ST | Industry | 3 | 0.00006300 | kgN2O/litre |
| MOBILE_OFFROAD_GAS4ST | Household | 1 | 2.18160000 | kgCO2/litre |
| MOBILE_OFFROAD_GAS4ST | Household | 6 | 0.00378000 | kgCH4/litre |
| MOBILE_OFFROAD_GAS4ST | Household | 3 | 0.00006300 | kgN2O/litre |
| MOBILE_OFFROAD_GAS2ST | Agriculture | 1 | 2.18160000 | kgCO2/litre |
| MOBILE_OFFROAD_GAS2ST | Agriculture | 6 | 0.00441000 | kgCH4/litre |
| MOBILE_OFFROAD_GAS2ST | Agriculture | 3 | 0.00001260 | kgN2O/litre |
| MOBILE_OFFROAD_GAS2ST | Forestry | 1 | 2.18160000 | kgCO2/litre |
| MOBILE_OFFROAD_GAS2ST | Forestry | 6 | 0.00535000 | kgCH4/litre |
| MOBILE_OFFROAD_GAS2ST | Forestry | 3 | 0.00001260 | kgN2O/litre |
| MOBILE_OFFROAD_GAS2ST | Industry | 1 | 2.18160000 | kgCO2/litre |
| MOBILE_OFFROAD_GAS2ST | Industry | 6 | 0.00409000 | kgCH4/litre |
| MOBILE_OFFROAD_GAS2ST | Industry | 3 | 0.00001260 | kgN2O/litre |
| MOBILE_OFFROAD_GAS2ST | Household | 1 | 2.18160000 | kgCO2/litre |
| MOBILE_OFFROAD_GAS2ST | Household | 6 | 0.00567000 | kgCH4/litre |
| MOBILE_OFFROAD_GAS2ST | Household | 3 | 0.00001260 | kgN2O/litre |
| MOBILE_OFFROAD_B7 | — | 1 | 2.50980000 | kgCO2/litre |
| MOBILE_OFFROAD_B7 | — | 6 | 0.00020000 | kgCH4/litre |
| MOBILE_OFFROAD_B7 | — | 3 | 0.00100000 | kgN2O/litre |
| MOBILE_OFFROAD_B7_BIO | — | 7 | 0.11510000 | kgCO2bio/litre |

---

## ส่วนที่ 9: INSERT `emission_factors` — Scope 1 Fugitive (Refrigerants)

> **source_id = 13** (IPCC_2013_AR5) · **effective_from = '2026-01-01'**  
> EF ของ Refrigerant = GWP100 โดยตรง (kg CO₂eq/kg สารทำความเย็น)  
> ✅ [PDF] confirmed · ✅ [XLS-EF] confirmed (R-22 ถึง R-143a)  
> R-404A/407A/407C/410A มีเฉพาะใน [PDF]

| category_code | gas_id | ef_value | ef_unit | ที่มา |
|---|---|---|---|---|
| FUGITIVE_R22 | 8 | 1760.00000000 | kgCO2eq/kg | [PDF]+[XLS-EF] |
| FUGITIVE_R32 | 9 | 677.00000000 | kgCO2eq/kg | [PDF]+[XLS-EF] |
| FUGITIVE_R125 | 10 | 3170.00000000 | kgCO2eq/kg | [PDF]+[XLS-EF] |
| FUGITIVE_R134 | 11 | 1120.00000000 | kgCO2eq/kg | [PDF]+[XLS-EF] |
| FUGITIVE_R134A | 12 | 1300.00000000 | kgCO2eq/kg | [PDF]+[XLS-EF] |
| FUGITIVE_R143 | 13 | 328.00000000 | kgCO2eq/kg | [PDF]+[XLS-EF] |
| FUGITIVE_R143A | 14 | 4800.00000000 | kgCO2eq/kg | [PDF]+[XLS-EF] |
| FUGITIVE_R404A | 15 | 3942.80000000 | kgCO2eq/kg | [PDF] เท่านั้น |
| FUGITIVE_R407A | 16 | 1923.40000000 | kgCO2eq/kg | [PDF] เท่านั้น |
| FUGITIVE_R407C | 17 | 1624.21000000 | kgCO2eq/kg | [PDF] เท่านั้น |
| FUGITIVE_R410A | 18 | 1923.50000000 | kgCO2eq/kg | [PDF] เท่านั้น |

---

## ส่วนที่ 10: INSERT `emission_factors` — Scope 2 Electricity

> **source_id = 3** (THAI_LCI) · **ef_purpose** ใช้ column ใหม่ที่เพิ่มใน DDL  
> **อ้างอิง:** [PDF] Thai National LCI Database, TIIS-MTEC-NSTDA, AR5  
> ✅ [XLS-EF] confirmed 0.4999 (2016-2018)

### ค่า EF ไฟฟ้า grid mix ที่ต้องมีใน DB

| category_code | ef_purpose | ef_value | ef_unit | ช่วงปีข้อมูล | หมายเหตุ (effective_until) |
|---|---|---|---|---|---|
| ELEC_GRID_TH_2016_S2 | cfo_scope2 | 0.49990000 | kgCO2/kWh | 2016–2018 | ใช้ได้ถึง 31 มี.ค. 2569 → **effective_until = '2026-03-31'** |
| ELEC_GRID_TH_2016_S3 | scope3_elec | 0.09870000 | kgCO2/kWh | 2016–2018 | ใช้ได้ถึง 31 มี.ค. 2569 → **effective_until = '2026-03-31'** |
| ELEC_GRID_TH_2016_CFP | cfp | 0.59860000 | kgCO2/kWh | 2016–2018 | ไม่มีกำหนดหมดอายุ |
| ELEC_GRID_TH_2022_S2 | cfo_scope2 | 0.47500000 | kgCO2/kWh | 2022–2024 | ชุดใหม่ ไม่มีกำหนดหมดอายุ |
| ELEC_GRID_TH_2022_S3 | scope3_elec | 0.08120000 | kgCO2/kWh | 2022–2024 | ชุดใหม่ ไม่มีกำหนดหมดอายุ |
| ELEC_GRID_TH_2022_CFP | cfp | 0.55620000 | kgCO2/kWh | 2022–2024 | ชุดใหม่ ไม่มีกำหนดหมดอายุ |

> ⚠️ **สำคัญ:** ชุด 2016-2018 ที่มี `effective_until = '2026-03-31'` จะไม่ปรากฏใน `ef_lookup` view หลังจากวันนั้น  
> ให้ set `is_default = 0` สำหรับชุด 2016-2018, `is_default = 1` สำหรับชุด 2022-2024  
> gas_id = 1 (CO₂) ทั้งหมด

```sql
INSERT INTO emission_factors (
  source_id, category_id, gas_id,
  activity_name_th, activity_name_en,
  ef_value, ef_unit, ef_unit_numerator, ef_unit_denominator,
  ef_purpose, region, is_default, effective_from, effective_until, notes
) VALUES
  (3, (SELECT category_id FROM ef_categories WHERE category_code='ELEC_GRID_TH_2016_S2'), 1,
   'ไฟฟ้า grid mix ปี 2016-2018 (CFO Scope2)', 'Grid electricity 2016-2018 (CFO Scope2)',
   0.49990000, 'kgCO2/kWh', 'kgCO2', 'kWh',
   'cfo_scope2', 'Thailand', 0, '2026-01-01', '2026-03-31',
   'Thai National LCI DB, TIIS-MTEC-NSTDA, IPCC 2013 GWP100a V1.03'),

  (3, (SELECT category_id FROM ef_categories WHERE category_code='ELEC_GRID_TH_2016_S3'), 1,
   'ไฟฟ้า grid mix ปี 2016-2018 (Scope3 upstream)', 'Grid electricity 2016-2018 (Scope3)',
   0.09870000, 'kgCO2/kWh', 'kgCO2', 'kWh',
   'scope3_elec', 'Thailand', 0, '2026-01-01', '2026-03-31',
   'Thai National LCI DB, TIIS-MTEC-NSTDA — fuel acquisition + transport'),

  (3, (SELECT category_id FROM ef_categories WHERE category_code='ELEC_GRID_TH_2016_CFP'), 1,
   'ไฟฟ้า grid mix ปี 2016-2018 (CFP)', 'Grid electricity 2016-2018 (CFP)',
   0.59860000, 'kgCO2/kWh', 'kgCO2', 'kWh',
   'cfp', 'Thailand', 0, '2026-01-01', NULL,
   'Thai National LCI DB, TIIS-MTEC-NSTDA, IPCC 2013 GWP100a V1.03'),

  (3, (SELECT category_id FROM ef_categories WHERE category_code='ELEC_GRID_TH_2022_S2'), 1,
   'ไฟฟ้า grid mix ปี 2022-2024 (CFO Scope2)', 'Grid electricity 2022-2024 (CFO Scope2)',
   0.47500000, 'kgCO2/kWh', 'kgCO2', 'kWh',
   'cfo_scope2', 'Thailand', 1, '2026-01-01', NULL,
   'Thai National LCI DB, TIIS-MTEC-NSTDA, IPCC 2013 GWP100a V1.03'),

  (3, (SELECT category_id FROM ef_categories WHERE category_code='ELEC_GRID_TH_2022_S3'), 1,
   'ไฟฟ้า grid mix ปี 2022-2024 (Scope3 upstream)', 'Grid electricity 2022-2024 (Scope3)',
   0.08120000, 'kgCO2/kWh', 'kgCO2', 'kWh',
   'scope3_elec', 'Thailand', 1, '2026-01-01', NULL,
   'Thai National LCI DB, TIIS-MTEC-NSTDA — fuel acquisition + transport'),

  (3, (SELECT category_id FROM ef_categories WHERE category_code='ELEC_GRID_TH_2022_CFP'), 1,
   'ไฟฟ้า grid mix ปี 2022-2024 (CFP)', 'Grid electricity 2022-2024 (CFP)',
   0.55620000, 'kgCO2/kWh', 'kgCO2', 'kWh',
   'cfp', 'Thailand', 1, '2026-01-01', NULL,
   'Thai National LCI DB, TIIS-MTEC-NSTDA, IPCC 2013 GWP100a V1.03');
```

---

## ส่วนที่ 11: INSERT `emission_factors` — Scope 3 (จาก Activity Sheet)

> **source_id:** ดูตามคอลัมน์ Reference  
> **effective_from = '2022-07-01'** (วันที่ TGO CPF EF ก.ค. 2565)  
> **ที่มาหลัก:** [XLS-ACT] — Sheet Activity  
> gas_id = 1 ทั้งหมด (รายงานเป็น kgCO₂eq รวม)

### 11.1 Cat 1 — Purchased Goods and Services

| category_code | activity_name_th | ef_value | ef_unit | source_id | ที่มา (Reference ใน Sheet) |
|---|---|---|---|---|---|
| S3C1_PAPER | กระดาษ | 2.10200000 | kgCO2eq/kg | TGO_CFP_2565 | TGO CFP EF (ก.ค. 2565) ลำดับที่ 592 กระดาษพิมพ์เขียนแบบไม่เคลือบผิว |
| S3C1_INK | หมึกพิมพ์ / หมึกทั่วไป | 4.52000000 | kgCO2eq/kg | TGO_CFP_2565 | PCR ข้อกำหนดเฉพาะผลิตภัณฑ์งานก่อนพิมพ์ |
| S3C1_WATER | น้ำประปา | 0.54100000 | kgCO2eq/m3 | TGO_CFP_2565 | TGO CFP EF (ก.ค. 2565) ลำดับที่ 61 น้ำประปา-การประปาส่วนภูมิภาค |

### 11.2 Cat 2 — Capital Goods

> **source_id = USEEIO_V1** · หน่วยเป็น **Baht (THB)** · เป็น kgCO₂eq/THB

| category_code | activity_name_th | ef_value | ef_unit | ที่มา (USEEIOv1.1 code) |
|---|---|---|---|---|
| S3C2_BUILDING | อาคาร | 0.22920000 | kgCO2eq/THB | BEAtoUSEEIONames: 233230 / U5: AC |
| S3C2_BUILDING | สิ่งปรับปรุงอาคาร | 0.22920000 | kgCO2eq/THB | BEAtoUSEEIONames: 233230 / U5: AC |
| S3C2_OFFICE_EQUIP | อุปกรณ์สำนักงาน (เครื่องมือ, อุปกรณ์ตกแต่ง) | 0.35740000 | kgCO2eq/THB | BEAtoUSEEIONames: 339940 / U5: JL |
| S3C2_COMPUTER | คอมพิวเตอร์ | 0.14600000 | kgCO2eq/THB | BEAtoUSEEIONames: 334111 / U5: GL |
| S3C2_SOFTWARE | โปรแกรมคอมพิวเตอร์ (ซอฟต์แวร์ระบบงาน) | 0.03980000 | kgCO2eq/THB | BEAtoUSEEIONames: 541511 / U5: LJ |
| S3C2_VEHICLE_CAP | ยานพาหนะ (Pickup trucks, vans, SUVs) | 0.40860000 | kgCO2eq/THB | BEAtoUSEEIONames: 336112 / U5: HX |

> ⚠️ อาคาร และ สิ่งปรับปรุงอาคาร ใช้ EF เดียวกัน 0.2292 → INSERT 2 rows แยก activity_name_th  
> ⚠️ activity_name_en ให้ระบุ USEEIO code ด้วยเพื่อการ audit

### 11.3 Cat 3 — Fuel- and Energy-Related Activities (Upstream)

> **source_id = TGO_CFP_2565** · ค่านี้ **ต่างจาก Scope 1** (เป็น upstream acquisition EF)

| category_code | activity_name_th | ef_value | ef_unit | ลำดับ TGO CFP | หมายเหตุ |
|---|---|---|---|---|---|
| S3C3_DIESEL_UPS | การได้มาของน้ำมันดีเซล | 0.35220000 | kgCO2eq/kg | ลำดับที่ 55 | หน่วย kg ≠ litre |
| S3C3_GASOLINE_UPS | การได้มาของน้ำมันเบนซิน | 0.40240000 | kgCO2eq/kg | ลำดับที่ 52 | หน่วย kg ≠ litre |
| S3C3_ELEC_UPS | การได้มาของไฟฟ้า | 0.09870000 | kgCO2eq/kWh | ลำดับที่ 59 | = Electricity Scope3 upstream 2016-2018 |
| S3C3_LPG_UPS | การได้มาของ LPG | 0.85820000 | kgCO2eq/kg | ลำดับที่ 49 | LPG Mixed |
| S3C3_ETHANOL_UPS | การได้มาของเอทานอล | 0.39620000 | kgCO2eq/kg | ลำดับที่ 622 | ⚠️ ดูหมายเหตุ |

> ⚠️ **Ethanol upstream:** ใน [XLS-ACT] row นี้ไม่มี activity_name_th ที่ชัดเจน (cell ว่าง)  
> ค่า 0.3962 และ reference ลำดับที่ 622 → ให้ใช้ชื่อ "การได้มาของเอทานอล (Ethanol acquisition)"

### 11.4 Cat 5 — Waste Generated in Operations

| category_code | activity_name_th | ef_value | ef_unit | source | ลำดับ TGO / อ้างอิง |
|---|---|---|---|---|---|
| S3C5_WASTE_LANDFILL | ขยะทั่วไป (กำจัดด้วยวิธีฝังกลบ) | 0.79330000 | kgCO2eq/kg | TGO_CFP_2565 | ลำดับ 575 การฝังกลบขยะมูลฝอยชุมชนแบบถูกหลักสุขาภิบาล |
| S3C5_WASTE_INCIN | ขยะอันตราย (กำจัดด้วยวิธีเผาทำลาย) | 1.21000000 | kgCO2eq/kg | TGO_CFP_2565 | TGO CFP Y21-059-274 บริการเผาทำลายของเสีย B2B |
| S3C5_SLUDGE | กากตะกอน (ส่วนที่นำไปฝังกลบ) | 0.98280000 | kgCO2eq/ton | IPCC_AR5 | IPCC Good Practice Guidance — GHG Inventories |
| S3C5_TRANSPORT_TKM | รถบรรทุกขยะ 6 ล้อ (0% Loading) | 0.04750000 | kgCO2eq/tkm | TGO_CFP_2565 | ลำดับที่ 234 รถบรรทุกขยะ 6 ล้อ 0% Loading |
| S3C5_TRANSPORT_KM | รถบรรทุกขยะ 6 ล้อ (100% Loading) | 0.49230000 | kgCO2eq/km | TGO_CFP_2565 | ลำดับที่ 237 รถบรรทุกขยะ 6 ล้อ 100% Loading |
| S3C5_TRANSPORT_TKM | รถบรรทุกขยะรีไซเคิล 4 ล้อ (100% Loading) | 0.21540000 | kgCO2eq/tkm | TGO_CFP_2565 | ลำดับที่ 69 รถบรรทุกขยะ 4 ล้อ 100% Loading |
| S3C5_TRANSPORT_KM | รถบรรทุกขยะรีไซเคิล 4 ล้อ (0% Loading) | 0.24150000 | kgCO2eq/km | TGO_CFP_2565 | ลำดับที่ 66 รถบรรทุกขยะ 4 ล้อ 0% Loading |
| S3C5_TRANSPORT_TKM | รถขนส่งกากตะกอน 10 ล้อ (100% Loading) | 0.05330000 | kgCO2eq/tkm | TGO_CFP_2565 | ลำดับที่ 141 รถบรรทุก 10 ล้อ 100% Loading |
| S3C5_TRANSPORT_KM | รถขนส่งกากตะกอน 10 ล้อ (0% Loading) | 0.59000000 | kgCO2eq/km | TGO_CFP_2565 | ลำดับที่ 138 รถบรรทุก 10 ล้อ 0% Loading |
| S3C5_EXCAVATOR | รถแบคโฮ/รถขุด ดีเซล (off-road) | 2.97930000 | kgCO2eq/litre | TGO_CFP_2565 | ลำดับที่ 32 Diesel Mobile Combustion Off road |

> ⚠️ **S3C5_TRANSPORT_TKM และ S3C5_TRANSPORT_KM** มีหลาย rows ต่อ category_code เดียวกัน  
> ต้องใช้ `activity_name_th` ต่างกัน (ระบุประเภทรถและ loading%) เพื่อให้ UNIQUE KEY  
> `uq_ef_source_cat_gas_activity (source_id, category_id, gas_id, activity_name_th, region)` ไม่ชน

### 11.5 Cat 7 — Employee Commuting และ Customer Travel

> **source_id = TGO_CFP_2565** · **อ้างอิง:** TGO CPO EF (เม.ย. 2565)

| category_code | activity_name_th | ef_value | ef_unit | ลำดับ TGO |
|---|---|---|---|---|
| S3C7_COMMUTE_DIESEL | รถกระบะ/รถยนต์/รถเมล์ (Diesel) | 2.74060000 | kgCO2eq/litre | ลำดับที่ 26 — Diesel Mobile Combustion On-road |
| S3C7_COMMUTE_GAS | รถยนต์/รถจักรยานยนต์ (Gasoline) | 2.23940000 | kgCO2eq/litre | ลำดับที่ 23 — Gasoline Mobile Combustion On-road |
| S3C7_COMMUTE_LPG | รถยนต์ส่วนบุคคล (LPG) | 3.20490000 | kgCO2eq/kg | ลำดับที่ 29 — LPG Mobile Combustion On-road ⚠️ |
| S3C7_COMMUTE_EV | รถยนต์ไฟฟ้า (EV) | 0.49990000 | kgCO2eq/kWh | ลำดับที่ 42 — Electricity grid mix 2016-2018 |
| S3C7_COMMUTE_CNG | รถ Taxi (CNG) | 2.60900000 | kgCO2eq/kg | ลำดับที่ 27 — CNG Mobile Combustion On-road |
| S3C7_COMMUTE_DIESEL | การเดินทางของลูกค้า (Diesel) | 2.74060000 | kgCO2eq/litre | ลำดับที่ 26 (ซ้ำ — แยก activity_name_th) |
| S3C7_COMMUTE_GAS | การเดินทางของลูกค้า (Gasoline) | 2.23940000 | kgCO2eq/litre | ลำดับที่ 23 (ซ้ำ — แยก activity_name_th) |
| S3C7_COMMUTE_CNG | การเดินทางของลูกค้า (CNG) | 2.60900000 | kgCO2eq/kg | ลำดับที่ 27 (ซ้ำ — แยก activity_name_th) |

---

## ส่วนที่ 12: ประเด็นคุณภาพข้อมูล (Data Quality Issues)

### 12.1 🔴 ต้องยืนยันก่อน INSERT

| รายการ | ปัญหา | ค่าใน Sheet | ค่าที่น่าจะถูก | Action |
|---|---|---|---|---|
| **LPG Cat 7 (Employee commuting)** | Sheet ระบุ Unit = "Litre" แต่ EF = 3.2049 ซึ่งตรงกับ LPG **kg** on-road | Litre / 3.2049 | kg / 3.2049 หรือ litre / 1.7306 | **ตรวจสอบ source ก่อน INSERT** — ถ้าหน่วยจริงเป็น Litre ต้องแก้ ef_value เป็น 1.7306 |
| **Cob CO₂ (stationary)** | [XLS-EF] CO₂ = 1.85 แต่ Total = 1.678 ซึ่งตรงกับ [PDF] | 1.85 (CO₂) / 1.678 (Total) | **1.6780** ตาม [PDF] | ใช้ 1.67800000 |

### 12.2 🟡 ข้อมูลที่ยังขาดอยู่

| รายการ | เหตุผล |
|---|---|
| Gasohol E10/E20/E85 off-road (stationary) | [PDF] มีเฉพาะ B7 off-road; E10/E20/E85 off-road ไม่ปรากฏใน [PDF] |
| **Natural Gas HHV Fossil CH₄, N₂O** | [PDF] มีค่า Total = 52.9545 แต่ไม่ระบุ CH₄/N₂O แยก → ใช้สัดส่วนจาก NCV ประมาณได้ |
| Category 4, 6, 8–15 (Scope 3) | [XLS-ACT] ว่าง — ไม่มี activity ขององค์กรนี้ → **ไม่ต้อง INSERT EF ตอนนี้** |
| **Sub-bituminous coal** ใน [PDF] | [PDF] มี Bituminous + Coking + Lignite + Anthracite แต่ไม่มี Sub-bituminous → [XLS-EF] มีเพิ่มเติม |

### 12.3 🟢 ข้อสังเกตสำคัญสำหรับ developer

1. **UNIQUE KEY constraint:** `uq_ef_source_cat_gas_activity` จะบังคับให้ `(source_id, category_id, gas_id, activity_name_th, region)` ไม่ซ้ำ ต้องระวังเรื่อง waste transport หลาย rows ใน category เดียว
2. **gas_id ที่ auto_increment:** ค่า gas_id ที่แนะนำ (6–18) อิงจาก seed ปัจจุบัน (1–5) แต่ถ้า DB มี id อื่นแล้ว ให้ query `SELECT gas_id FROM gas_types ORDER BY gas_id DESC LIMIT 1` ก่อน
3. **category_id ใช้ subquery:** ทุก INSERT ใน emission_factors ที่อ้าง category_id ให้ใช้ `(SELECT category_id FROM ef_categories WHERE category_code = '...')` ป้องกัน hardcode ผิด
4. **ef_purpose column:** ต้อง ALTER TABLE ก่อนทุกอย่าง — ถ้า ALTER ล้มเหลว INSERT ไฟฟ้าจะไม่สมบูรณ์
5. **Biogenic CO₂ (gas_id=7):** GWP = 0 ตามหลัก IPCC แต่ต้องรายงานแยก → ef_value ใน emission_factors คือ kgCO₂bio/unit ไม่ใช่ kgCO₂eq

---

## สรุปจำนวน Records ที่ต้องเปลี่ยนแปลง

| ตาราง | UPDATE | INSERT ใหม่ | หมายเหตุ |
|---|---|---|---|
| `emission_factors` (schema) | ALTER (2 columns) | — | ทำก่อนทุกอย่าง |
| `gas_types` | 0 | 13 | gas_id 6–18 |
| `gwp_values` | 0 | 13 | รวม refrigerants |
| `ef_sources` | 0 | 3 | TGO_CFP_2565, USEEIO_V1, IPCC_2013_AR5 |
| `ef_categories` | 0 | ~90 | Scope 1-2-3 ทั้งหมด |
| `emission_factors` | 6 (ปิดของเดิม) | ~190 | ครอบคลุมทุก fuel/gas/sector |
