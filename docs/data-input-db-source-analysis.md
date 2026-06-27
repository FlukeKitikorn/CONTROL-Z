# วิเคราะห์แหล่งข้อมูลหน้า «กรอกข้อมูล» vs ฐานข้อมูล

เอกสารนี้สรุปว่าข้อมูลบนหน้า **กรอกข้อมูล** (`DataInputPage`) ควรดึงจาก MySQL หรือแสดงจาก Frontend (คงที่ / mock) เพื่อเตรียมเชื่อม API และบันทึกจริง

---

## หลักการรวมข้อมูลรายปี

- ผู้ใช้กรอกตาม **รอบย่อย** (รายวัน / สัปดาห์ / เดือน / ปี) ผ่าน `collection_granularity` + ปฏิทิน
- ระบบเก็บ `date_start`, `date_end`, `reporting_year` และสร้าง `annual_report_bundle` ก่อนคำนวณ
- **Backend ต้อง aggregate** ค่าจากรอบย่อยเข้า **ปีรายงานเดียว** (`reporting_year`) ก่อนส่งสูตรคำนวณ — ไม่ว่า input จะเป็นรายวันหรือรายเดือน

---

## 1. ควรดึงจากฐานข้อมูล (ต่อองค์กร / ฟอร์ม)

| ข้อมูลบนหน้า | ตารางที่เกี่ยวข้อง | หมายเหตุ |
|--------------|-------------------|----------|
| ชื่อผู้จัดทำ (ค่าเริ่มต้น) | `users` | ดึง `firstname` / `lastname` ตอนเปิดหน้า; ค่าที่แก้ในเอกสารอาจเก็บใน `edit_forms` หรือ snapshot ฟอร์ม |
| องค์กร / รหัสองค์กร | `organizations` | ใช้ `organization_id` จาก session |
| รอบเก็บข้อมูล + ผลผลิต + ปีฐาน | `collect_information` | `period_collection`, `productivity`, `unit_productivity`, `base_year`, … |
| รายการ Scope 1–2 ที่กรอกแล้ว | `subject_scope` + `details_scope` | หัวข้อต่อ scope + รายละเอียดปริมาณ (คำอธิบายใน `description`) |
| แบบประเมิน Scope 3 (15 หมวด) | `category` + `category_anwser` | หมวดจาก `category`; คำตอบ `source_GHG`, `magnitude`, `influence`, `risk`, … |
| ประเด็นพิจารณาเพิ่ม (ถ้าใช้) | `points_consider` | สอดคล้องฟิลด์ sector / outsourcing / engagement |
| ผลการคำนวณล่าสุด | API `calculations/latest` | มีอยู่แล้วบน Dashboard / Results |
| ปัจจัยการปล่อย / หน่วย (อนาคต) | master + emission factor tables | ยังไม่ครบใน schema ปัจจุบัน — ต้องออกแบบเพิ่มหรือ map จาก `details_scope` |

### API ที่ควรมี (แนะนำ)

- `GET/PUT /organizations/{id}/collect-information` — โหลด/บันทึกข้อมูลทั่วไป + รอบ
- `GET/PUT /organizations/{id}/forms/{fid}/scope-entries` — Scope 1–2 รายการ
- `GET/PUT /organizations/{id}/forms/{fid}/scope3-assessments` — 15 หมวดประเมิน
- `GET/PUT /organizations/{id}/forms/{fid}/scope3-entries` — รายละเอียด Material Topic
- `POST /organizations/{id}/calculations/run` — รับ `annual_report_bundle` รวมรายปี

---

## 2. แสดงที่ Frontend ได้เลย (ไม่ต้อง query)

| ข้อมูล | ที่มาในโค้ด | เหตุผล |
|--------|-------------|--------|
| รายการหมวด Scope 1 (stationary / on-road / off-road / ไม่มี) | `SCOPE1_MAIN_CATEGORIES` | โครงสร้างฟอร์มคงที่ตาม GHG Protocol |
| เชื้อเพลิง / ประเภทรถ / หน่วย Scope 1 | `SCOPE1_FUELS_BY_CATEGORY`, `SCOPE1_ONROAD_*` | master ฝั่ง UI จนกว่าจะมีตาราง emission factor ใน DB |
| หมวด Scope 2 (ไฟฟ้า / สารเย็น / ไม่มี) | `SCOPE2_ENERGY_TYPES` | โครงสร้างคงที่ |
| รายการสารเย็น | `SCOPE2_REFRIGERANT_OPTIONS` | รายชื่อ master (ควรย้ายไป DB ภายหลัง) |
| 15 หมวด Scope 3 + label ประเมิน | `SCOPE3_ASSESSMENT_CATEGORIES` | ตามมาตรฐาน Corporate Value Chain |
| เกณฑ์ %GHG / คะแนน Material Topic | `scope3MaterialTopic.ts` | สูตรธุรกิจคงที่ |
| ตัวเลือกอิทธิพล / ความเสี่ยง / โอกาส | `SCOPE3_*_OPTIONS` | label UI |
| หน่วยผลผลิต | `PRODUCT_UNIT_OPTIONS` | รายการหน่วยทั่วไป |
| ความถี่รอบเก็บ + label ปฏิทิน | `periodGranularity.ts`, `periodPicker.ts` | พฤติกรรม UI |
| ขั้นตอน wizard (5 steps) | `MAIN_STEP_LABELS` | navigation |
| ฟิลด์กรอกรายละเอียดแต่ละหมวด Scope 3 | `Scope3CategoryEntryRowBody` | layout ต่อหมวด — **ค่าที่กรอก** ต้องลง DB |

---

## 3. สถานะปัจจุบัน (mock / local)

| ส่วน | สถานะ |
|------|--------|
| Scope 2 รายการไฟฟ้า / สารเย็น | `getScope2DataPayload()` mock ใน Frontend |
| บันทึกร่าง | แจ้ง success เท่านั้น ยังไม่ persist |
| คำนวณ | `POST calculations/run` มีแล้ว แต่ยังไม่รับ payload ฟอร์มเต็ม |
| `annual_report_bundle` | สร้างใน form ก่อนเรียก API — รอ backend รองรับ |

---

## 4. แผน map ข้อมูลลง schema เดิม

```
collect_information
  ← ข้อมูลทั่วไป, รอบ, ผลผลิต, reporting_year (ขยาย period_collection ให้เก็บ JSON หรือแยกคอลัมน์ granularity)

subject_scope (ต่อ organization + form + scid=1|2|3)
  ← หนึ่งแถวต่อหัวข้อที่เลือก (เช่น Scope1-on_road)

details_scope
  ← แต่ละรายการใน scope1_entries / scope2_batches (serialize ปริมาณ+หน่วย)

category (seed 15 หมวด Scope 3 ต่อ form)
category_anwser
  ← s3_self_assessments[]

details_scope หรือตารางใหม่ scope3_entry_lines
  ← scope3_cat_entries[catId][]
```

**แนะนำเพิ่มตาราง** (ถ้า `details_scope.description` เป็น VARCHAR สั้น):

- `activity_entries` — เก็บ JSON หรือคอลัมน์แยก: scope, category, period, quantity, unit, metadata
- `reporting_periods` — ผูก `reporting_year` + granularity + start/end

---

## 5. ลำดับ implement แนะนำ

1. บันทึก `collect_information` + รอบปฏิทิน + `reporting_year`
2. CRUD Scope 1–2 entries → `subject_scope` / `details_scope`
3. บันทึก `category_anwser` จากแบบประเมิน
4. บันทึก Scope 3 เฉพาะ Material Topic
5. ปรับ `calculations/run` ให้รับ `annual_report_bundle` และ aggregate รายปี
6. ย้าย master (เชื้อเพลิง, สารเย็น, emission factors) จาก Frontend → DB + API reference
