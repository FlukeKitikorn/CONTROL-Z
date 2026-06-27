# CONTROL-Z — ภาพรวมโปรเจกต์ การทำงาน และการวิเคราะห์ฐานข้อมูล / Seed

เอกสารนี้สรุปจากโค้ดและเอกสารใน repo ณ วันที่จัดทำ เพื่อใช้เป็นฐานวิเคราะห์ต่อยอดสคีมา MySQL และข้อมูล seed

---

## 1. โปรเจกต์คืออะไร

**CONTROL-Z** เป็นระบบเว็บสำหรับ **องค์กร (ผู้ใช้ทั่วไป)** จัดทำและจัดเก็บข้อมูลที่เกี่ยวกับ **คลังก๊าซเรือนกระจก (GHG inventory)** ตามกรอบฟอร์ม เช่น **Fr-04** (สินค้าคงคลังก๊าซ) พร้อมเส้นทางรายงานอื่น (Fr_01 … Fr_05 บนหน้า `/app/reports`) และมี **ผู้ดูแลระบบ (ADMIN)** จัดการผู้ใช้ องค์กร การติดตามข้อมูล ปัจจัยการปล่อย (ผ่าน master `gwp` ในสคีมาปัจจุบัน) และประกาศ

ลักษณะโดเมน:

- ข้อมูลผูกกับ **องค์กร** (`organizations`) และ **ฟอร์ม** (`forms`) ต่อรอบ/เวอร์ชัน
- โครง GHG: **scope** → **subject_scope** → **details_scope**, **points_consider**, **category** / **category_anwser**, และรายละเอียดปริมาณ **fr04_1_detail**
- Master **gwp** ใช้อ้างอิงค่า GWP (เช่น CH₄)

---

## 2. สถาปัตยกรรมแบบย่อ

| ชั้น | เทคโนโลยี | บทบาท |
|------|-----------|--------|
| Frontend | React 19, Vite 8, TypeScript, React Router 7, Ant Design, Tailwind 4, Zustand | SPA เส้นทาง `/auth/*`, `/app/*` (USER), `/admin/*` (ADMIN) |
| Backend | FastAPI, SQLModel/SQLAlchemy, PyMySQL, JWT | REST API prefix **`/api/v1`**, ไฟล์คงที่ที่ **`/static`** (โฟลเดอร์ `Backend/uploads/`) |
| ฐานข้อมูล | MySQL 8 (`control_z`, utf8 / utf8_general_ci) | สคีมาและ seed ใน `docs/mysql-data-dictionary-and-seed.sql` |

**การเชื่อมต่อ dev ทั่วไป**

- Frontend dev server (เช่น พอร์ต **5173**) ตั้ง **Vite proxy** ส่ง `/api` และ `/static` ไป **FastAPI ที่ 127.0.0.1:8000** (`Frontend/vite.config.ts`)
- ค่า CORS ของ API ตั้งใน `Backend/app/core/config.py` / `.env` ให้ตรงกับ origin ของ Vite

**Docker Compose** (`docker-compose.yml`)

- บริการ **MySQL 8** (พอร์ต 3306, database `control_z`) และ **phpMyAdmin** (พอร์ต 8080) — ใช้รันฐานข้อมูลในท้องถิ่น ไม่ได้รวม container ของ FastAPI/React ในไฟล์นี้

---

## 3. การทำงานของแอป (เส้นทางและบทบาท)

จาก `Frontend/src/app/AppRouter.tsx`:

**ผู้ใช้องค์กร (`USER`, `ProtectedRoute allowRole="USER"`)**

- `/app` — แดชบอร์ด
- `/app/reports/:reportSlug` — โมดูลรายงาน (รวมเทมเพลต Fr-04 / Fr-05 ฯลฯ)
- `/app/setup/organization`, `/app/setup/base-year` — ตั้งค่าองค์กรและปีฐาน / ช่วงเก็บข้อมูล
- `/app/data-input` — กรอกข้อมูล GHG ตาม scope / หมวด
- `/app/results` — ผลการคำนวณ (บางส่วนอาจยังอิง client-side storage ตามแผนใน `docs/api-design.md`)
- `/app/settings` — โปรไฟล์ผู้ใช้

**ผู้ดูแลระบบ (`ADMIN`)**

- `/admin` — แดชบอร์ด admin
- `/admin/users`, `/admin/organizations` — จัดการผู้ใช้และองค์กร
- `/admin/factors` — ปัจจัยการปล่อย (ในสคีมาปัจจุบัน API อ้าง **`gwp`** เป็นหลัก)
- `/admin/monitoring`, `/admin/announcements`, `/admin/settings`, `/admin/logs`

**Auth**

- `/auth/login`, `/auth/register`, `/auth/admin/login`

**Backend** รวม router หลักใน `Backend/app/api/v1/router.py`: health, auth, me, organizations, forms, reference, ghg, calculations, reports, admin, announcements — รายละเอียดเส้นทางและสถานะ implement อยู่ใน `docs/api-design.md` หัวข้อ “สถานะการ implement”

---

## 4. โมเดลข้อมูลในโค้ด Backend

คลาส SQLModel สะท้อนสคีมา SQL ใน `Backend/app/models/tables.py` (สอดคล้อง `docs/mysql-data-dictionary-and-seed.sql`) เช่น `Organization`, `User`, `UserPrivilege`, `GhgtForm`, `SubjectScope`, `Fr04Detail`, `Gwp` ฯลฯ

จุดออกแบบสำคัญที่เอกสาร data dictionary เน้น:

- **`users`**: ใช้ `prefix` (แก้จากสะกดเดิม `prifix`), มี `created_at` / `updated_at`
- **`user_privileges`**: `password_hash` (bcrypt), `uname` unique, `uread`–`uall` เป็น `TINYINT`, **`uall = 1`** ใช้แยกสิทธิ์ admin ในแอป

---

## 5. ฐานข้อมูล — ตารางและลำดับ FK

สรุป dependency (จาก `docs/database-mysql-data-dictionary.md`):

```
organizations
  → users → user_privileges
  → edit_forms (ผ่าน users)
  → forms
      → edit_forms, form_details, subject_scope, points_consider, category
  → organization_information, collect_information,
    subject_scope, points_consider, category_anwser
scope → subject_scope → details_scope, fr04_1_detail
category → category_anwser
gwp (อิสระ)
```

**ตารางที่มี `created_at` / `updated_at`:** ระบุใน data dictionary — master `scope`, `gwp` ไม่มีคอลัมน์เวลานี้

**เอกสารอ้างอิงเชิงลึก**

- คำอธิบายคอลัมน์ทุกตาราง: [`database-mysql-data-dictionary.md`](./database-mysql-data-dictionary.md)
- สคริปต์รันครบ: [`mysql-data-dictionary-and-seed.sql`](./mysql-data-dictionary-and-seed.sql)

---

## 6. การวิเคราะห์ Seed (`mysql-data-dictionary-and-seed.sql`)

Seed เป็นข้อมูล **ตัวอย่างสำหรับพัฒนา** ไม่ควรใช้รหัสผ่านเหล่านี้ใน production โดยไม่เปลี่ยน

### 6.1 องค์กรและผู้ใช้

| ลำดับ | ตาราง | ความหมาย |
|--------|--------|----------|
| 1 | `organizations` | org แรก: องค์กรตัวอย่าง (ข้อมูลที่อยู่/โทร/อีเมลตัวอย่าง) |
| 2 | `users` | ผู้ใช้ `user_id = 1` สังกัด `organization_id = 1` |
| 3 | `user_privileges` | `uname` = `user@example.com`, สิทธิ์อ่าน/เขียน/แก้ = 1, **`uall = 0`** (USER) — รหัสผ่านตัวอย่างใน comment: **SecretPass1!** (bcrypt) |
| 4 | `organizations` | org ที่สอง: หน่วยงาน admin |
| 5 | `users` | admin user สังกัด `organization_id = 2` |
| 6 | `user_privileges` | `uname` = `admin@admin.com`, **`uall = 1`** (ADMIN) — รหัสใน comment: **root@#1234** (bcrypt) |

**ข้อควรระวังด้านความปลอดภัย:** แฮชใน seed เป็นของสตริงตัวอย่างที่ระบุใน comment ของสคริปต์ — ควรหมุนรหัสและแฮชใหม่ก่อน deploy

### 6.2 ฟอร์มและโครง GHG / GWP

| ตาราง | ข้อมูลที่ใส่ |
|--------|----------------|
| `forms` | หนึ่งแถว: `form_id = 'Fr-04'`, ชื่อแบบฟอร์มสินค้าคงคลังก๊าซ, `organization_id = 1`, `fid` โดยปกติ = 1 |
| `scope` | หนึ่งแถว: คำอธิบาย `'ประเภท 1'` (`scid` = 1) |
| `subject_scope` | หนึ่งแถว: เชื่อม `scid=1`, `organization_id=1`, `fid=1`, คำอธิบายตัวอย่าง |
| `gwp` | หนึ่งแถว: `GWP100 CH4` = `28` |

**สิ่งที่ seed ยังไม่เติม (แต่สคีมารองรับ):** `organization_information`, `collect_information`, `form_details`, `edit_forms`, `details_scope`, `points_consider`, `category`, `category_anwser`, `fr04_1_detail` — เหมาะสำหรับขยาย seed เมื่อทดสอบ flow ครบ

---

## 7. ช่องว่างออกแบบที่เกี่ยวกับ DB (จากแผน API)

จาก `docs/api-design.md` — ยังเป็นแนวทาง/บางส่วน implement:

- **ผลการคำนวณแบบ snapshot:** ยังไม่มีตารางเช่น `calculation_runs`; ทางเลือกคือคำนวณ on-the-fly หรือเพิ่มตารางเก็บผล
- **ปัจจัยการปล่อย master แยกจาก `gwp`:** หน้า admin ปัจจัยอาจต้องการตาราง `emission_factors` ในอนาคต — ปัจจุบันอ้าง `gwp` และค่าในบรรทัด `fr04_1_detail`

ใช้ข้อนี้เป็น checklist เวลาออกแบบ migration / seed เพิ่ม

---

## 8. ลำดับแนะนำสำหรับงานฐานข้อมูลต่อ

1. รัน `docs/mysql-data-dictionary-and-seed.sql` กับ instance MySQL (หรือผ่าน Docker Compose ใน repo)
2. ตั้ง `DATABASE_URL` ใน `Backend/.env` ให้ตรงกับ user/database จริง (ดูตัวอย่าง `Backend/.env.example`)
3. ทดสอบ login ด้วยบัญชี seed (แล้วเปลี่ยนรหัส) และตรวจว่า `uall` สอดคล้องกับ routing ฝั่ง frontend
4. ขยาย seed ตามตารางที่ยังว่าง ถ้าต้องการ E2E ของ data-input / รายงาน

---

## 9. ไฟล์อ้างอิงหลักใน repo

| ไฟล์ | หน้าที่ |
|------|--------|
| `docker-compose.yml` | MySQL + phpMyAdmin |
| `Backend/app/main.py` | FastAPI app, static `/static` |
| `Backend/app/api/v1/router.py` | รวม API v1 |
| `Backend/app/models/tables.py` | โมเดลตาราง |
| `Frontend/src/app/AppRouter.tsx` | เส้นทาง UI |
| `docs/api-design.md` | สัญญา REST และ mapping หน้าบ้าน |
| `docs/database-mysql-data-dictionary.md` | Data dictionary |
| `docs/mysql-data-dictionary-and-seed.sql` | DDL + INSERT ตัวอย่าง |

---

*เอกสารนี้สร้างเพื่อสนับสนุนการวิเคราะห์และออกแบบฐานข้อมูลต่อเนื่อง ไม่แทนที่ data dictionary และสคริปต์ SQL ฉบับเต็ม*
