# ข้อกังวลและข้อจำกัดที่รู้ — CONTROL-Z v2

> อัปเดต: มิถุนายน 2569  
> ใช้คู่กับ [`database-import-plan.md`](database-import-plan.md) และ [`ef-database-update-plan.md`](ef-database-update-plan.md)

เอกสารนี้รวบรวมสิ่งที่ **ทำแล้วแต่ยังไม่สมบูรณ์** หรือ **ต้องระวังตอน dev/production** — ไม่ใช่รายการบั๊กที่ยังไม่รู้

---

## 1. ฐานข้อมูลและ EF

| หัวข้อ | สถานะ | รายละเอียด |
|--------|--------|------------|
| DB แยก `control_z` / `control_z_v2` | เปิด | ข้อมูล org เดิมไม่ได้ migrate อัตโนมัติ — dev ใช้ `user@example.com` / org **1** บน v2 |
| EF ชุดเต็ม (~256 แถว) | ✅ ใน DB | รันผ่าน `02b` + `03c` + `04` + `04c` (ดู import plan) |
| On-road **vehicle_based** | ❌ ไม่มี EF | ฟอร์มเลือกประเภทรถได้ แต่ backend ข้ามการคำนวณ (`option_key` = null) |
| CNG on-road หน่วย m³ vs kg | ⚠️ workaround | `unit_aliases`: `m3 → kg` × 0.72 เป็นค่าประมาณ ไม่ใช่ NCV จริง |
| ก๊าซธรรมชาติ stationary (m³) | ⚠️ | bridge ชี้ `FUEL_NATGAS_NCV_MJ` แต่ UI กรอก m³ — ต้องมี alias/แปลงหน่วยเพิ่มถ้าต้องการความแม่นยำ |
| Off-road เบนซิน | ✅ แก้ bridge | `04c` แยก `activity_subtype` ต่อ sector; resolver กรอง `ef_row_subtype` |
| Scope 3 ใน DB vs การคำนวณ | ⚠️ | `scope3_ef_catalog` มี ~24 รายการ แต่ `ef_calculation.py` map แค่บางหมวด (S1 ซื้อ, S2 ทุน, S3 upstream, S5 ขยะ, S7 เดินทาง) |
| ไฟฟ้า 2016 vs 2022 | มีทั้งคู่ใน EF | bridge Scope 2 ใช้ `ELEC_GRID_TH_2022_S2` + `cfo_scope2` เท่านั้น |
| Re-import `03c` | ลบทั้งหมด | `DELETE FROM emission_factors` — ห้ามรันซ้ำโดยไม่ตั้งใจบน production |

---

## 2. Backend

| หัวข้อ | สถานะ | รายละเอียด |
|--------|--------|------------|
| คำนวณจาก `annual_report_bundle` | ✅ POST `/calculations/run` | ส่ง bundle จากหน้ากรอกข้อมูล |
| `GET /calculations/latest` | ⚠️ ปรับแล้ว | อ่าน snapshot ล่าสุดจาก `activity_entries` (`entry_kind=calculation_snapshot`); ถ้าไม่มีจึง fallback legacy FR04 |
| ประวัติคำนวณ API | ❌ ว่าง | `GET .../calculations/history` คืน `[]` — ฝั่ง UI ใช้ localStorage เป็นหลัก |
| `activity_entries` | ✅ | บันทึกรายการจาก bundle หลังคำนวณ ไม่ได้เก็บ bundle ทั้งก้อน |
| EF resolve | ✅ | `GET /reference/ef-ui-options`, `GET /reference/ef-resolve` |
| Scope 3 catalog API | ✅ | `GET /reference/scope3-ef-catalog` |
| Admin หน้า Emission Factors | legacy | ยังจัดการตาราง `gwp` เก่า ไม่ใช่ `emission_factors` เต็ม |
| Error ใน `run_calculation` | ⚠️ | `except Exception: pass` แล้ว fallback legacy — ควร log ใน production |

---

## 3. Frontend

| หัวข้อ | สถานะ | รายละเอียด |
|--------|--------|------------|
| Auth / session | ✅ API | login, register, `SessionBootstrap` → `GET /me` |
| คำนวณ | ✅ หน้า **การคำนวณ** | `POST .../calculations/run` จาก bundle ที่บันทึกแล้ว |
| บันทึกข้อมูลกรอก | ✅ หน้า **กรอกข้อมูล** | `POST .../annual-report-bundle` (ยังไม่คำนวณ) |
| Dashboard / Results | ✅ API | `getCalculationLatest` (หลังมี snapshot) |
| Scope 2 รายการไฟฟ้า/สารเย็น | ✅ API | โหลดจาก `ef-ui-options` แทน mock delay |
| Scope 1 รายการเชื้อเพลิง | ⚠️ hybrid | label/หน่วยบางส่วนยังจาก static map; คำนวณใช้ EF จริงผ่าน backend |
| Scope 3 ฟอร์ม | static UI | 15 หมวดยัง hardcode; catalog API พร้อมสำหรับขั้นถัดไป |
| Dashboard mock viz | ตั้งใจ | `?mock=1` หรือสวิตช์ — ไม่เรียก API |
| รายงาน Fr_04 / Fr_05 | 404 ได้ | ยังไม่มี bundle ใน DB สำหรับ org นั้น |
| Proxy dev | Vite | `/api` → `127.0.0.1:8000` — production ต้องตั้ง `VITE_API_BASE_URL` |

---

## 4. การเชื่อมต่อ Dev (checklist)

```text
docker compose up -d mysql
# import docs/sql ชุดเต็ม (ดู database-import-plan.md)

Backend/.env
  DATABASE_URL=mysql+pymysql://root:root@127.0.0.1:3306/control_z_v2
  CORS_ORIGINS=http://localhost:5173

cd Backend && uvicorn app.main:app --reload --port 8000
cd Frontend && npm run dev
```

บัญชีทดสอบ v2: `user@example.com` / `SecretPass1!`

---

## 5. ลำดับงานแนะนำ (หลังเอกสารนี้)

1. ขยาย `ef_calculation.py` ให้ครบ `scope3_ef_catalog` ที่ material
2. เพิ่ม unit alias ก๊าซธรรมชาติ/CNG ตามแหล่ง TGO จริง
3. On-road vehicle_based — EF + bridge หรือปิด UI ชั่วคราว
4. ตาราง `calculation_runs` / history API แทน localStorage
5. Admin UI สำหรับ `emission_factors` / `ef_lookup`
6. Migrate org จาก `control_z` → `control_z_v2` (ถ้าต้องการข้อมูลเดิม)

---

## 6. อ้างอิงไฟล์สำคัญ

| บทบาท | ไฟล์ |
|--------|------|
| คำนวณ | `Backend/app/services/ef_calculation.py` |
| EF resolve | `Backend/app/services/ef_resolver.py` |
| บันทึกกิจกรรม | `Backend/app/services/activity_persistence.py` |
| API กรอกข้อมูล | `Frontend/src/pages/DataInputPage.tsx` |
| HTTP client | `Frontend/src/lib/api/http.ts`, `service.ts` |
| EF bridge UI | `Frontend/src/lib/efUiBridge.ts` |
