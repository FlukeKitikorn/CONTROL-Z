# ออกแบบ API (CONTROL-Z)

เอกสารนี้เสนอ **เส้นทาง REST API** ให้สอดคล้องกับฐานข้อมูลใน [`database-mysql-data-dictionary.md`](./database-mysql-data-dictionary.md) และ **หน้าบ้านปัจจุบัน** (เส้นทาง `/app/*`, `/admin/*`, `/auth/*`)

**สมมติฐานทั่วไป**

- Base URL: `/api/v1`
- รูปแบบข้อมูล: JSON, เวลาเป็น ISO 8601 เมื่อใช้ datetime
- Auth: **Bearer JWT** (access token); refresh token เป็นทางเลือก
- แบ่งสิทธิ์หลัก: **`USER`** (ผู้ใช้องค์กร) และ **`ADMIN`** (ผู้ดูแลระบบ) — map จาก DB ได้โดย `user_privileges.uall = 1` หรือเพิ่มคอลัมน์ `role` ภายหลัง
- ทุก request ของ USER ควร **จำกัดขอบเขตด้วย `organization_id`** ที่ผูกกับผู้ใช้ (ไม่ให้ข้าม org ได้)

---

## 1. Auth และเซสชัน

| Method | Path | คำอธิบาย | หน้าบ้าน / DB |
|--------|------|----------|----------------|
| `POST` | `/auth/register` | ลงทะเบียน (สร้าง `users` + `user_privileges`; อาจสร้าง/ผูก `organizations` ตาม flow) | `RegisterPage` |
| `POST` | `/auth/login` | รับ `uname` (หรือ email) + password → ตรวจ `password_hash` → ออก JWT | `LoginPage` |
| `POST` | `/auth/refresh` | ออก access ใหม่ (ถ้าใช้ refresh token) | — |
| `POST` | `/auth/logout` | revoke refresh / client ลบ token | Layout logout |

**Response login (ตัวอย่าง):** `access_token`, `token_type`, `expires_in`, ออบเจ็กต์ `user` (โปรไฟล์ + `organization_id` + `role`)

---

## 2. ผู้ใช้ปัจจุบัน (Me)

| Method | Path | คำอธิบาย | หน้าบ้าน / DB |
|--------|------|----------|----------------|
| `GET` | `/me` | โปรไฟล์ + สิทธิ์ + org หลัก | hydrate หลัง login, `MainLayout` |
| `PATCH` | `/me` | อัปเดตฟิลด์ใน `users` (prefix, ชื่อ, ที่อยู่, โทร, อีเมล, รูป) | `SettingsPage` |
| `PATCH` | `/me/password` | เปลี่ยนรหัส → อัปเดต `user_privileges.password_hash` | `SettingsPage` |
| `POST` | `/me/avatar` | อัปโหลดรูป → เก็บ path/URL ลง `users.image` | `ProfilePhotoField` |

---

## 3. องค์กร (Organizations)

| Method | Path | คำอธิบาย | หน้าบ้าน / DB |
|--------|------|----------|----------------|
| `GET` | `/organizations/{id}` | รายละเอียดองค์กร (ตรวจสิทธิ์ว่าเป็นสมาชิก org นี้หรือ admin) | `OrganizationSetupPage`, ดีบักการ์ด |
| `PUT` / `PATCH` | `/organizations/{id}` | อัปเดต `organizations` | `OrganizationRegistrationForm` (user) |
| `GET` | `/organizations/{id}/information` | รายการ / ข้อความ `organization_information` | ข้อความยาวใต้ org |
| `PUT` | `/organizations/{id}/information` | แทนที่/เพิ่ม `description` ตาม flow | — |
| `GET` | `/organizations/{id}/collect-information` | ข้อมูลการเก็บ + ปีฐาน (`collect_information`) | แทน/เสริม `BaseYearPage`, `DataInputPage` |
| `POST` | `/organizations/{id}/collect-information` | สร้างแถวใหม่ (รอบรายงาน / ปีฐาน) | `BaseYearPage`, wizard |
| `PATCH` | `/organizations/{id}/collect-information/{ciid}` | แก้ไขรอบเก็บ/ปีฐาน | — |

**หมายเหตุ:** หน้า `BaseYearPage` ตอนนี้เก็บ snapshot ใน `localStorage` — API ด้านบนจะเป็นช่องทางย้ายข้อมูลจริงไป MySQL

---

## 4. ไฟล์แนบ (โลโก้ / แผนที่ / โครงสร้าง)

| Method | Path | คำอธิบาย | DB |
|--------|------|----------|-----|
| `POST` | `/organizations/{id}/assets` | อัปโหลดไฟล์ ระบุประเภท (`logo` \| `map` \| `structure` \| `image`) → ได้ URL → อัปเดตคอลัมน์ใน `organizations` | `logo`, `organization_map`, `organ_structure`, `organization_image` |

---

## 5. ฟอร์ม (Forms) — เทมเพลตและอินสแตนซ์ต่อ org

ในฐานข้อมูล `forms` มี `organization_id` และ `form_id` (เช่น Fr-04)

| Method | Path | คำอธิบาย | หน้าบ้าน |
|--------|------|----------|----------|
| `GET` | `/organizations/{orgId}/forms` | รายการฟอร์มขององค์กร | หัวรายงาน, `ReportsSectionPage` |
| `POST` | `/organizations/{orgId}/forms` | สร้างฟอร์ม (มักใช้ฝั่ง admin หรือตอนเปิดรอบรายงาน) | — |
| `GET` | `/organizations/{orgId}/forms/{fid}` | รายละเอียดฟอร์ม + เมตา | แท็บรายงาน |
| `PATCH` | `/organizations/{orgId}/forms/{fid}` | แก้เวอร์ชัน / วันที่ / `edit_forms` บันทึกผู้แก้ | — |
| `GET` | `/organizations/{orgId}/forms/{fid}/details` | `form_details` | — |
| `POST` | `/organizations/{orgId}/forms/{fid}/details` | เพิ่มหัวข้อย่อยในฟอร์ม | — |

---

## 6. Scope และโครงข้อมูล GHG

| Method | Path | คำอธิบาย | DB |
|--------|------|----------|-----|
| `GET` | `/reference/scopes` | รายการ `scope` (master) | เติม dropdown / wizard |
| `GET` | `/organizations/{orgId}/forms/{fid}/subject-scopes` | `subject_scope` + สรุป | `DataInputPage`, รายงาน |
| `POST` | `/organizations/{orgId}/forms/{fid}/subject-scopes` | สร้างหัวข้อ scope | — |
| `GET` | `/subject-scopes/{subid}/details` | `details_scope` | — |
| `PUT` | `/subject-scopes/{subid}/details` | แทนที่รายละเอียด | — |

---

## 7. ประเด็นพิจารณาและ Category (แบบประเมิน)

| Method | Path | คำอธิบาย | DB |
|--------|------|----------|-----|
| `GET` | `/organizations/{orgId}/forms/{fid}/points-consider` | `points_consider` | Scope 3 significance flow |
| `PUT` | `/organizations/{orgId}/forms/{fid}/points-consider/{pid}` | อัปเดตข้อความประเด็น | — |
| `GET` | `/organizations/{orgId}/forms/{fid}/categories` | `category` | — |
| `GET` | `/organizations/{orgId}/categories/{cid}/answers` | `category_anwser` ต่อ org | — |
| `PUT` | `/organizations/{orgId}/categories/{cid}/answers` | upsert คำตอบ (ตัวเลข / 0-1 + remark) | `DataInputPage` |

---

## 8. FR-04 — รายละเอียดปริมาณและ EF

| Method | Path | คำอธิบาย | DB |
|--------|------|----------|-----|
| `GET` | `/subject-scopes/{subid}/fr04-details` | รายการ / หนึ่งแถว `fr04_1_detail` | `Fr04InventoryReportTemplate` |
| `PUT` | `/subject-scopes/{subid}/fr04-details` | บันทึกทั้งก้อนหรือแถว | — |

(ถ้าหนึ่ง `subid` มีหลายแถว อาจใช้ `.../fr04-details/{fr04wid}` แทน)

---

## 9. อ้างอิง GWP

| Method | Path | คำอธิบาย | DB |
|--------|------|----------|-----|
| `GET` | `/reference/gwp` | รายการ `gwp` (filter query ได้) | คำนวณ / รายงาน |
| `GET` | `/reference/gwp/{gwpid}` | รายการเดียว | — |

---

## 10. การคำนวณและผลลัพธ์ (เสริมจากหน้า Results)

ในสคีมาปัจจุบัน **ยังไม่มีตารางผลคำนวณ** แต่ `ResultsPage` และ `calculationResultsStorage` คาดหวังยอดรวม Scope 1–3

**ทางเลือกออกแบบ**

- **A)** เพิ่มตาราง `calculation_runs` (org, รอบวันที่, ตัวเลขสรุป, `source`) แล้ว map API ด้านล่าง  
- **B)** คำนวณ on-the-fly จาก `fr04_1_detail` + ปัจจัย — ไม่เก็บ snapshot

| Method | Path | คำอธิบาย | หน้าบ้าน |
|--------|------|----------|----------|
| `POST` | `/organizations/{orgId}/calculations/run` | รันคำนวณ (อิงรอบรายงาน/ปีฐาน) → ได้สรุป | `DataInputPage` ปุ่มคำนวณ |
| `GET` | `/organizations/{orgId}/calculations/latest` | ผลล่าสุด | `ResultsPage` |
| `GET` | `/organizations/{orgId}/calculations/history` | ประวัติ (ถ้ามีตาราง snapshot) | — |

---

## 11. รายงานและส่งออก

หน้า `/app/reports/*` ใช้เทมเพลต Fr_01 … Fr_05 — ฝั่ง API อาจให้ **โมเดล JSON** เดียวกับที่ React render หรือส่งออกไฟล์

| Method | Path | คำอธิบาย |
|--------|------|----------|
| `GET` | `/organizations/{orgId}/reports/{formCode}` | ข้อมูลรวมสำหรับรหัสฟอร์ม เช่น `Fr_01`, `Fr_04.1` (query: `fid` หรือรอบรายงาน) |
| `GET` | `/organizations/{orgId}/reports/{formCode}/export` | ส่งออก Excel/PDF (query `format=xlsx|pdf`) |

`formCode` ควร map กับ `forms.form_id` และแคตตาล็อกใน `reportExportCatalog.ts`

---

## 12. ผู้ดูแลระบบ (ADMIN)

| Method | Path | คำอธิบาย | หน้าบ้าน |
|--------|------|----------|----------|
| `GET` | `/admin/users` | รายการผู้ใช้ (pagination, filter) | `ManageUsersPage` |
| `POST` | `/admin/users` | สร้างผู้ใช้ + `user_privileges` | ปุ่มเพิ่มผู้ใช้ |
| `GET` | `/admin/users/{userId}` | รายละเอียด | — |
| `PATCH` | `/admin/users/{userId}` | แก้โปรไฟล์ / ย้าย org | — |
| `PATCH` | `/admin/users/{userId}/privileges` | แก้ `uread`–`uall` หรือ role | — |
| `DELETE` | `/admin/users/{userId}` | ลบ/ปิดใช้งาน | — |
| `GET` | `/admin/organizations` | รายการองค์กรทั้งหมด | แดชบอร์ด admin |
| `POST` | `/admin/organizations` | ลงทะเบียนองค์กร | `ManageOrganizationsPage` |
| `GET` | `/admin/monitoring/submissions` | สถานะการส่งข้อมูล / สรุปต่อ org (อาจ aggregate จาก `forms`, `edit_forms`) | `DataMonitoringPage` |

---

## 13. ปัจจัยการปล่อย (Emission factors)

ในสคีมาปัจจุบันมี **`gwp`** และค่า EF ฝังใน **`fr04_1_detail`** — ยังไม่มีตาราง master ปัจจัยแบบที่ `EmissionFactorsPage` mock

**แนะนำ:** เพิ่มตาราง `emission_factors` (แหล่งที่มา, ค่า, หน่วย, เวอร์ชัน, ประเภทก๊าซ) แล้วเพิ่ม API:

| Method | Path | คำอธิบาย |
|--------|------|----------|
| `GET` | `/admin/emission-factors` | รายการ + filter |
| `POST` | `/admin/emission-factors` | เพิ่ม |
| `PATCH` | `/admin/emission-factors/{id}` | แก้ |
| `GET` | `/reference/emission-factors` | ฝั่ง USER อ่านอย่างเดียว (เวอร์ชันที่ active) |

จนกว่าจะมีตารางนี้ หน้า admin ปัจจัยอาจอ่านเขียนเฉพาะ `gwp` หรือ config คงที่

---

## 14. สรุปการจับคู่หน้าบ้าน → กลุ่ม API

| หน้าบ้าน | API หลักที่ควรเรียก |
|-----------|---------------------|
| `LoginPage` / `RegisterPage` | `/auth/*` |
| `SettingsPage` | `/me`, `/me/password`, `/me/avatar` |
| `OrganizationSetupPage` | `/organizations/{id}`, `/organizations/{id}/assets` |
| `BaseYearPage` | `/organizations/{id}/collect-information` |
| `DataInputPage` | `/forms`, `/subject-scopes`, `/points-consider`, `/categories/.../answers`, `/fr04-details`, `POST .../calculations/run` |
| `ResultsPage` | `/organizations/{id}/calculations/latest` |
| `ReportsSectionPage` | `/organizations/{id}/reports/{formCode}`, export |
| `ManageUsersPage` | `/admin/users` |
| `ManageOrganizationsPage` | `/admin/organizations`, `/organizations/{id}` |
| `EmissionFactorsPage` | `/admin/emission-factors` (+ ตารางใหม่) |
| `DataMonitoringPage` | `/admin/monitoring/submissions` |

---

## 15. รหัสข้อผิดพลาด (แนะนำ)

- `401` — ไม่มีหรือ token หมดอายุ  
- `403` — สิทธิ์ไม่พอ / ไม่ใช่ org นี้  
- `404` — ไม่พบทรัพยากร  
- `422` — validation (body ตาม Pydantic)  
- `409` — ชนกัน (เช่น `uname` ซ้ำ)

---

เอกสารนี้เป็น **แผนเส้นทาง** สำหรับ implement FastAPI ทีละโมดูล; ลำดับที่สมเหตุสมผลคือ **Auth → Me → Organizations → Forms → Scope/FR-04 → Reports** แล้วค่อย **Admin** และ **Calculations**

---

## 16. สถานะการ implement (Backend `app/`)

โค้ดปัจจุบันรองรับเส้นทางหลักดังนี้ (prefix ทั้งหมด `/api/v1`):

| กลุ่ม | เส้นทาง |
|--------|---------|
| Auth | `POST /auth/login`, `register`, `logout` (204), `refresh` (501) |
| Me | `GET/PATCH /me`, `PATCH /me/password`, `POST /me/avatar` |
| Organizations | `GET/PATCH /organizations/{id}`, `.../information`, `.../collect-information`, `POST .../assets` |
| Forms | `GET/POST /organizations/{orgId}/forms`, `GET/PATCH .../{fid}`, `GET/POST .../{fid}/details` |
| Reference | `GET /reference/scopes`, `/reference/gwp`, `/reference/gwp/{id}`, `/reference/emission-factors` (อ่าน + JWT) |
| GHG | `subject-scopes`, `details`, `points-consider`, `categories`, `answers`, `fr04-details` ตามเอกสารข้างบน |
| Calculations | `POST/GET .../calculations/run|latest`, `GET .../history` (ว่าง — ยังไม่มีตาราง snapshot) |
| Reports | `GET .../reports/{formCode}`, `GET .../export` (stub ข้อความ) |
| Admin | `GET/POST/PATCH/DELETE /admin/users`, `GET/POST /admin/organizations`, `GET /admin/monitoring/submissions`, CRUD `/admin/emission-factors` (ผ่านตาราง `gwp`) |

ไฟล์อัปโหลดและรูป avatar ให้บริการที่ **`/static/...`** (โฟลเดอร์ `Backend/uploads/`); ใน dev ใช้ Vite proxy `/static` ไปที่ FastAPI
