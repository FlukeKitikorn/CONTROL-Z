# Data dictionary และสคริปต์ MySQL (CONTROL-Z)

เอกสารนี้สรุปโครงสร้างฐานข้อมูลตาม **เอกสารวิเคราะห์ฐานข้อมูลเดิม** โดย **ปรับออกแบบเฉพาะตาราง `users` และ `user_privileges`** ส่วนตารางอื่นใช้คอลัมน์ ชนิดข้อมูล และความหมายตามเดิม

- **สคริปต์รันครบ:** [`mysql-data-dictionary-and-seed.sql`](./mysql-data-dictionary-and-seed.sql) (CREATE ทุกตาราง + ตัวอย่าง INSERT)
- **ฐานข้อมูล:** `control_z` — **charset เริ่มต้น:** `utf8` — **collation เริ่มต้น:** `utf8_general_ci`

### คอลัมน์เวลา (มาตรฐานบนตารางข้อมูลที่ผู้ใช้กรอก/แก้)

ตารางต่อไปนี้มี **`created_at`**, **`updated_at`** (`DATETIME(6)`) เพื่อทราบว่าแถวถูกสร้างและแก้ล่าสุดเมื่อไหร่ — **ไม่เก็บ FK ว่าใครเป็นคนสร้าง/แก้** ในตารางเหล่านี้ (ถ้าต้องการรู้ว่า **ใคร** แก้ฟอร์ม ใช้ตาราง **`edit_forms`** ที่มี `user_id` อยู่แล้ว)

`organizations`, `users`, `user_privileges`, `forms`, `form_details`, `organization_information`, `collect_information`, `subject_scope`, `details_scope`, `points_consider`, `category`, `category_anwser`, `fr04_1_detail`

ตาราง master: **`scope`**, **`gwp`** — ไม่มีคอลัมน์เวลานี้

---

## 1. สิ่งที่เปลี่ยนเฉพาะ `users` และ `user_privileges`

| หัวข้อ | เดิม (เอกสาร) | ออกแบบใหม่ |
|--------|----------------|------------|
| ชื่อคอลัมน์คำนำหน้า | `prifix` | `prefix` (แก้สะกด) |
| รหัสผ่าน | `pname` เก็บข้อความตรงๆ | `password_hash` เก็บแฮช (เช่น bcrypt) ความยาว `VARCHAR(255)` |
| สิทธิ์ `uread`–`uall` | `VARCHAR` ค่า 0\|1 | `TINYINT(1)` ค่า 0 หรือ 1 (ชัดเจนและประกาศชนิดถูกต้อง) |
| ความสัมพันธ์ | — | `user_privileges.user_id` **หนึ่งแถวต่อหนึ่งผู้ใช้** (`UNIQUE`) และ `uname` **ไม่ซ้ำ** (`UNIQUE`) |

กติกาเดิมยังใช้ได้: **0 = ไม่มีสิทธิ์, 1 = มีสิทธิ์** สำหรับ `uread`, `uwrite`, `uedit`, `uall`

---

## 2. Data dictionary — `users` (ออกแบบใหม่)

| Column name | Data type | Description | Rule | Reference |
|-------------|-----------|-------------|------|-----------|
| user_id | INT | รหัสผู้ใช้ | AUTO_INCREMENT, PRIMARY KEY | |
| organization_id | INT | รหัสองค์กร | NOT NULL, FOREIGN KEY | organizations |
| prefix | VARCHAR(50) | คำนำหน้าชื่อ (เดิม: prifix) | NOT NULL | |
| firstname | VARCHAR(50) | ชื่อผู้ใช้ | NOT NULL | |
| lastname | VARCHAR(50) | นามสกุลผู้ใช้ | NOT NULL | |
| address | VARCHAR(100) | บ้านเลขที่ผู้ใช้ | NOT NULL | |
| subdistrict | VARCHAR(50) | ตำบล | NOT NULL | |
| district | VARCHAR(50) | อำเภอ | NOT NULL | |
| province | VARCHAR(50) | จังหวัด | NOT NULL | |
| postal_code | VARCHAR(50) | รหัสไปรษณีย์ | NOT NULL | |
| phone | VARCHAR(50) | เบอร์โทรศัพท์ | NULL ได้ | |
| email | VARCHAR(50) | อีเมล | NULL ได้ | |
| image | VARCHAR(100) | path ของรูปภาพ | NULL ได้ | |
| created_at | DATETIME(6) | เวลาสร้างแถว | NOT NULL, DEFAULT | |
| updated_at | DATETIME(6) | เวลาแก้ล่าสุด | NOT NULL, ON UPDATE | |

---

## 3. Data dictionary — `user_privileges` (ออกแบบใหม่)

| Column name | Data type | Description | Rule | Reference |
|-------------|-----------|-------------|------|-----------|
| upid | INT | รหัสกำหนดสิทธิ์ | AUTO_INCREMENT, PRIMARY KEY | |
| user_id | INT | รหัสผู้ใช้ | NOT NULL, UNIQUE, FOREIGN KEY | users |
| uname | VARCHAR(50) | ชื่อผู้ใช้ระบบ (login) | NOT NULL, UNIQUE | |
| password_hash | VARCHAR(255) | รหัสผ่านแฮช | NOT NULL | |
| uread | TINYINT(1) | สิทธิ์ (อ่าน) 0\|1 | NOT NULL, DEFAULT 0 | |
| uwrite | TINYINT(1) | สิทธิ์ (เขียน) 0\|1 | NOT NULL, DEFAULT 0 | |
| uedit | TINYINT(1) | สิทธิ์ (แก้ไข) 0\|1 | NOT NULL, DEFAULT 0 | |
| uall | TINYINT(1) | สิทธิ์ (ทั้งหมด) 0\|1 | NOT NULL, DEFAULT 0 | |
| created_at | DATETIME(6) | เวลาสร้างแถว | NOT NULL, DEFAULT | |
| updated_at | DATETIME(6) | เวลาแก้ล่าสุด | NOT NULL, ON UPDATE | |

---

## 4. Data dictionary — ตารางอื่น (ตามเอกสารเดิม)

### organizations (เก็บข้อมูลองค์กร)

| Column name | Data type | Description | Rule | Reference |
|-------------|-----------|-------------|------|-----------|
| organization_id | INT | รหัสองค์กร | AUTO_INCREMENT, PRIMARY KEY | |
| name_of_agency | VARCHAR(50) | ชื่อหน่วยงาน | NOT NULL | |
| organization_name | VARCHAR(50) | ชื่อองค์กร | NOT NULL | |
| address1 | VARCHAR(100) | บ้านเลขที่ | NOT NULL | |
| subdistrict | VARCHAR(50) | ตำบล | NOT NULL | |
| district | VARCHAR(50) | อำเภอ | NOT NULL | |
| province | VARCHAR(50) | จังหวัด | NOT NULL | |
| postal_code | VARCHAR(50) | รหัสไปรษณีย์ | NOT NULL | |
| phone | VARCHAR(50) | เบอร์โทรศัพท์ | NOT NULL | |
| email | VARCHAR(50) | อีเมล | NOT NULL | |
| logo | VARCHAR(100) | path ของรูป logo | | |
| organization_image | VARCHAR(50) | path ของรูปที่อยู่ | | |
| organization_map | VARCHAR(50) | path ของรูป map | | |
| organ_structure | VARCHAR(50) | path รูปโครงสร้างองค์กร | | |
| registration_date | VARCHAR(50) | วันที่ลงทะเบียน | NOT NULL | |
| created_at | DATETIME(6) | เวลาสร้างแถว | NOT NULL, DEFAULT | |
| updated_at | DATETIME(6) | เวลาแก้ล่าสุด | NOT NULL, ON UPDATE | |

### forms (เก็บข้อมูลฟอร์ม)

| Column name | Data type | Description | Rule | Reference |
|-------------|-----------|-------------|------|-----------|
| fid | INT | รหัสฟอร์ม | AUTO_INCREMENT, PRIMARY KEY | |
| form_id | VARCHAR(50) | รหัสฟอร์ม เช่น Fr-01 | NOT NULL | |
| name | VARCHAR(100) | ชื่อฟอร์ม | NOT NULL | |
| version | VARCHAR(50) | เวอร์ชันฟอร์ม | NOT NULL | |
| version_date | VARCHAR(50) | วันที่ของเวอร์ชัน | NOT NULL | |
| create_date | VARCHAR(50) | วันที่สร้างฟอร์ม | | |
| end_date | VARCHAR(50) | วันที่เสร็จสิ้น | | |
| organization_id | INT | รหัสองค์กร | NOT NULL, FOREIGN KEY | organizations |
| created_at | DATETIME(6) | เวลาสร้างแถว | NOT NULL, DEFAULT | |
| updated_at | DATETIME(6) | เวลาแก้ล่าสุด | NOT NULL, ON UPDATE | |

### edit_forms (เก็บข้อมูลผู้ที่แก้ไขข้อมูลภายในฟอร์ม)

| Column name | Data type | Description | Rule | Reference |
|-------------|-----------|-------------|------|-----------|
| efid | INT | รหัสการแก้ไขฟอร์ม | AUTO_INCREMENT, PRIMARY KEY | |
| fid | INT | รหัสฟอร์ม | FOREIGN KEY | forms |
| user_id | INT | รหัสผู้ใช้แก้ไขฟอร์มล่าสุด | FOREIGN KEY | users |
| edit_date | VARCHAR(50) | วันที่แก้ไขล่าสุด | NOT NULL | |

### form_details (เก็บข้อมูลรายละเอียดอื่นๆ ของฟอร์ม)

| Column name | Data type | Description | Rule | Reference |
|-------------|-----------|-------------|------|-----------|
| fdid | INT | รหัสการรายละเอียดฟอร์ม | AUTO_INCREMENT, PRIMARY KEY | |
| fid | INT | รหัสฟอร์ม | FOREIGN KEY | forms |
| subject | VARCHAR(100) | ชื่อเรื่อง | NOT NULL | |
| description | VARCHAR(150) | รายละเอียดชื่อเรื่อง | NOT NULL | |
| created_at | DATETIME(6) | เวลาสร้างแถว | NOT NULL, DEFAULT | |
| updated_at | DATETIME(6) | เวลาแก้ล่าสุด | NOT NULL, ON UPDATE | |

### organization_information (เก็บรายละเอียดองค์กร)

| Column name | Data type | Description | Rule | Reference |
|-------------|-----------|-------------|------|-----------|
| ogid | INT | รหัสรายละเอียด | AUTO_INCREMENT, PRIMARY KEY | |
| organization_id | INT | รหัสองค์กร | FOREIGN KEY | organizations |
| description | VARCHAR(300) | ชื่อเรื่อง / รายละเอียด | NOT NULL | |
| created_at | DATETIME(6) | เวลาสร้างแถว | NOT NULL, DEFAULT | |
| updated_at | DATETIME(6) | เวลาแก้ล่าสุด | NOT NULL, ON UPDATE | |

### collect_information (เก็บรายละเอียดการเก็บข้อมูล)

| Column name | Data type | Description | Rule | Reference |
|-------------|-----------|-------------|------|-----------|
| ciid | INT | รหัสการเก็บข้อมูล | AUTO_INCREMENT, PRIMARY KEY | |
| organization_id | INT | รหัสองค์กร | FOREIGN KEY | organizations |
| period_collection | VARCHAR(100) | ช่วงวันที่การจัดเก็บข้อมูล | NOT NULL | |
| productivity | FLOAT | ผลผลิต | NOT NULL | |
| unit_productivity | VARCHAR(100) | หน่วยของผลผลิต | NOT NULL | |
| base_year | VARCHAR(100) | ช่วงวันที่ปีฐาน | NOT NULL | |
| base_year_output | FLOAT | ผลผลิตปีฐาน | NOT NULL | |
| unit_base_output | VARCHAR(100) | หน่วยผลผลิตปีฐาน | NOT NULL | |
| created_at | DATETIME(6) | เวลาสร้างแถว | NOT NULL, DEFAULT | |
| updated_at | DATETIME(6) | เวลาแก้ล่าสุด | NOT NULL, ON UPDATE | |

### scope (เก็บข้อมูล scope)

| Column name | Data type | Description | Rule | Reference |
|-------------|-----------|-------------|------|-----------|
| scid | INT | รหัส scope | AUTO_INCREMENT, PRIMARY KEY | |
| description | VARCHAR(100) | scope เช่น ประเภท 1 | NOT NULL | |

### subject_scope (เก็บรายหัวข้อ scope)

| Column name | Data type | Description | Rule | Reference |
|-------------|-----------|-------------|------|-----------|
| subid | INT | รหัสหัวข้อ scope | AUTO_INCREMENT, PRIMARY KEY | |
| scid | INT | รหัส scope | FOREIGN KEY | scope |
| organization_id | INT | รหัสองค์กร | FOREIGN KEY | organizations |
| fid | INT | รหัสฟอร์ม | FOREIGN KEY | forms |
| description | VARCHAR(100) | หัวข้อ scope | NOT NULL | |
| created_at | DATETIME(6) | เวลาสร้างแถว | NOT NULL, DEFAULT | |
| updated_at | DATETIME(6) | เวลาแก้ล่าสุด | NOT NULL, ON UPDATE | |

### details_scope (เก็บรายละเอียดหัวข้อ scope)

| Column name | Data type | Description | Rule | Reference |
|-------------|-----------|-------------|------|-----------|
| osid | INT | รหัสรายละเอียด | AUTO_INCREMENT, PRIMARY KEY | |
| subid | INT | รหัสหัวข้อ scope | FOREIGN KEY | subject_scope |
| description | VARCHAR(300) | รายละเอียดหัวข้อ scope | NOT NULL | |
| created_at | DATETIME(6) | เวลาสร้างแถว | NOT NULL, DEFAULT | |
| updated_at | DATETIME(6) | เวลาแก้ล่าสุด | NOT NULL, ON UPDATE | |

### points_consider (จัดเก็บประเด็นที่ต้องพิจารณา)

| Column name | Data type | Description | Rule | Reference |
|-------------|-----------|-------------|------|-----------|
| pid | INT | รหัสพิจารณา | AUTO_INCREMENT, PRIMARY KEY | |
| organization_id | INT | รหัสองค์กร | FOREIGN KEY | organizations |
| fid | INT | รหัสฟอร์ม | FOREIGN KEY | forms |
| source_GHG | VARCHAR(500) | Source of GHG | NOT NULL | |
| magnitude | VARCHAR(500) | ขนาด (Magnitude or Size) | NOT NULL | |
| influence | VARCHAR(500) | ระดับของแรงจูงใจ | NOT NULL | |
| risk | VARCHAR(500) | ความเสี่ยง | NOT NULL | |
| sector | VARCHAR(500) | Sector Guidance | NOT NULL | |
| outsourcing | VARCHAR(500) | Outsourcing | NOT NULL | |
| engagement | VARCHAR(500) | Employee engagement | NOT NULL | |
| created_at | DATETIME(6) | เวลาสร้างแถว | NOT NULL, DEFAULT | |
| updated_at | DATETIME(6) | เวลาแก้ล่าสุด | NOT NULL, ON UPDATE | |

### category (จัดเก็บ category)

| Column name | Data type | Description | Rule | Reference |
|-------------|-----------|-------------|------|-----------|
| cid | INT | รหัส category | AUTO_INCREMENT, PRIMARY KEY | |
| fid | INT | รหัสฟอร์ม | FOREIGN KEY | forms |
| description | VARCHAR(100) | รายละเอียดหัวข้อ scope | NOT NULL | |
| created_at | DATETIME(6) | เวลาสร้างแถว | NOT NULL, DEFAULT | |
| updated_at | DATETIME(6) | เวลาแก้ล่าสุด | NOT NULL, ON UPDATE | |

### category_anwser (จัดเก็บคำตอบของ category)

| Column name | Data type | Description | Rule | Reference |
|-------------|-----------|-------------|------|-----------|
| caid | INT | รหัสคำตอบ | AUTO_INCREMENT, PRIMARY KEY | |
| cid | INT | รหัส category | FOREIGN KEY | category |
| organization_id | INT | รหัสองค์กร | FOREIGN KEY | organizations |
| source_GHG | INT | คำตอบ 0\|1 | NOT NULL | |
| magnitude | INT | คำตอบเป็นตัวเลข | NOT NULL | |
| influence | INT | คำตอบเป็นตัวเลข | NOT NULL | |
| risk | INT | คำตอบเป็นตัวเลข | NOT NULL | |
| sector | INT | คำตอบเป็นตัวเลข | NOT NULL | |
| outsourcing | INT | คำตอบ 0\|1 | NOT NULL | |
| engagement | INT | คำตอบ 0\|1 | NOT NULL | |
| remark | VARCHAR(300) | คำอธิบาย | | |
| created_at | DATETIME(6) | เวลาสร้างแถว | NOT NULL, DEFAULT | |
| updated_at | DATETIME(6) | เวลาแก้ล่าสุด | NOT NULL, ON UPDATE | |

กติกาเดิม: **0 = ไม่ตอบ, 1 = ตอบ** สำหรับฟิลด์ที่เป็นคำตอบ 0\|1

### fr04_1_detail (เก็บคำตอบในเอกสาร fr04)

| Column name | Data type | Description | Rule | Reference |
|-------------|-----------|-------------|------|-----------|
| fr04wid | INT | รหัสแถว | AUTO_INCREMENT, PRIMARY KEY | |
| subid | INT | รหัสหัวข้อ | FOREIGN KEY | subject_scope |
| value | FLOAT | ปริมาณ | NOT NULL | |
| unit | VARCHAR(10) | หน่วย | NOT NULL | |
| co2_ef | FLOAT | ค่า EF | | |
| fossil_ch4_ef | FLOAT | | | |
| ch4_ef | FLOAT | | | |
| n2o_ef | FLOAT | | | |
| sf6_ef | FLOAT | | | |
| nf3_ef | FLOAT | | | |
| hfcs_ef | FLOAT | | | |
| pfcs_ef | FLOAT | | | |
| hfcs_gwp | FLOAT | | | |
| pfcs_gwp | FLOAT | | | |
| ef_unit | FLOAT | | | |
| gwp_unit | FLOAT | | | |
| kgco2e_total | FLOAT | | | |
| self_collct | INT | | | |
| supplier | INT | | | |
| th_lci_db | INT | | | |
| tgo_ef | INT | คำตอบ 0\|1 | | |
| thai_res | INT | คำตอบ 0\|1 | | |
| int_db | INT | คำตอบ 0\|1 | | |
| Other | INT | คำตอบ 0\|1 | | ใน MySQL ใช้ `` `Other` `` |
| substitute | INT | คำตอบ 0\|1 | | |
| reference | VARCHAR(100) | อ้างอิง | | |
| description | VARCHAR(100) | คำอธิบาย | | |
| created_at | DATETIME(6) | เวลาสร้างแถว | NOT NULL, DEFAULT | |
| updated_at | DATETIME(6) | เวลาแก้ล่าสุด | NOT NULL, ON UPDATE | |

### gwp

| Column name | Data type | Description | Rule | Reference |
|-------------|-----------|-------------|------|-----------|
| gwpid | INT | รหัส | AUTO_INCREMENT, PRIMARY KEY | |
| subject | VARCHAR(100) | หัวข้อ | NOT NULL | |
| value | VARCHAR(100) | ค่าของหัวข้อ | NOT NULL | |

(ในเอกสารเดิมใช้ `VARCHAR2` — บน MySQL ใช้ `VARCHAR`)

---

## 5. คำสั่ง MySQL

สคริปต์ **CREATE TABLE ทั้งหมด** (ลำดับ FK ถูกต้อง), **DROP ถ้ามีของเก่า**, และ **INSERT ตัวอย่าง** อยู่ในไฟล์:

**[`mysql-data-dictionary-and-seed.sql`](./mysql-data-dictionary-and-seed.sql)**

วิธีรัน (ตัวอย่าง):

```bash
mysql -u root -p < docs/mysql-data-dictionary-and-seed.sql
```

สคริปต์จะสร้างฐานข้อมูล `control_z` (ถ้ายังไม่มี) แล้ว `USE control_z` ให้อัตโนมัติ

หมายเหตุ INSERT ตัวอย่าง `user_privileges.password_hash` สำหรับรหัสผ่าน **`SecretPass1!`** — ควรสร้างแฮชใหม่ในแอป (เช่น bcrypt) ก่อนใช้งานจริง

---

## 6. ลำดับ dependency ของตาราง (อ้างอิง FK)

```
organizations
  → users
      → user_privileges
      → edit_forms
  → forms
      → edit_forms, form_details, subject_scope, points_consider, category
  → organization_information, collect_information, subject_scope, points_consider, category_anwser
scope → subject_scope → details_scope, fr04_1_detail
category → category_anwser
gwp (อิสระ)
```
