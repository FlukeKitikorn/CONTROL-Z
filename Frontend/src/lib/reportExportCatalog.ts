/**

 * แคตตาล็อกรูปแบบรายงาน/ส่งออกตามรหัส Fr_xx

 * เทมเพลตถูกล็อคตามรูปแบบทางการ — ฝั่งเว็บจะ map รหัสนี้ไปยัง template ที่ render คงที่

 */



export const REPORT_TEMPLATE_CODES = [

  "Fr_01",

  "Fr_02",

  "Fr_03.1",

  "Fr_03.2",

  "Fr_04.1",

  "Fr_04.2",

  "Fr_05",

] as const



export type ReportTemplateCode = (typeof REPORT_TEMPLATE_CODES)[number]



/** ค่าเริ่มต้นของ path แท็บ เช่น /app/reports/Fr_01 */

export const DEFAULT_REPORT_PAGE_SLUG: ReportTemplateCode = "Fr_01"



export type ReportExportCatalogItem = {

  code: ReportTemplateCode

  /** จัดกลุ่มเนื้อหา (ไม่ใช่แท็บรวมแล้ว — แท็บแยกตาม code) */

  section: string

  title: string

  summary: string

  detail: string

  /** คำนำท้ายแต่ละหน้า (แท็บตามรหัส) */

  pageIntro: string

  /** มุมขวาของหัวเขียว (บรรทัดแรก) */

  reportReferenceCode: string

  /** มุมขวาของหัวเขียว (บรรทัดสอง — เวอร์ชันแบบฟอร์ม) */

  reportReferenceVersion: string

  /** แสดงในแถว "รหัสฟอร์ม" (เช่น Fr-01) */

  displayFormCode: string

  /** แสดงในแถว "ชื่อฟอร์ม" */

  lockedFormNameValue: string

  /** หมายเลขในแถวเมตา "หน้าที่" (fr_02.html ใช้ 2 สำหรับ Fr-02) */

  formMetaPageNumber: string

}



export const REPORT_EXPORT_CATALOG: readonly ReportExportCatalogItem[] = [

  {

    code: "Fr_01",

    section: "ชุด Fr_01 – Fr_02",

    title: "แบบ Fr_01",

    summary: "เอกสารชุดแรกตามโครงสร้างที่กำหนด — เทมเพลตล็อคบนเว็บ",

    detail: "ข้อมูลตารางด้านล่างจำลองจากเทมเพลต Fr_01 เท่านั้น",

    pageIntro:

      "หน้านี้แสดงแบบฟอร์ม Fr_01 เป็น React + Ant Design + Tailwind + Chart.js ตามดีไซน์ fr_01.html — ดึงข้อมูลผ่าน props/model ได้ที่ Fr01ReportTemplate — ดาวน์โหลดครบชุดใช้ปุ่มมุมบนขวา",

    reportReferenceCode: "TCFO_R_01",

    reportReferenceVersion: "Version 04 : 21/2/2020",

    displayFormCode: "Fr-01",

    lockedFormNameValue: "บัญชีรายการก๊าซเรือนกระจก",

    formMetaPageNumber: "1",

  },

  {

    code: "Fr_02",

    section: "ชุด Fr_01 – Fr_02",

    title: "แบบ Fr_02",

    summary: "เอกสารชุดที่สอง — ใช้รหัสเดียวกับชุดเอกสารฝั่ง backend",

    detail: "เทมเพลต Fr_02 แยกจาก Fr_01 ชัดเจน",

    pageIntro: "หน้า Fr_02 — แผนภาพองค์กรตามดีไซน์ fr_02.html (แสดงผลจาก DB)",

    reportReferenceCode: "TCFO_R_02",

    reportReferenceVersion: "Version 04 : 21/2/2020",

    displayFormCode: "Fr-02",

    lockedFormNameValue: "บัญชีรายการก๊าซเรือนกระจก (Scope 3)",

    formMetaPageNumber: "2",

  },

  {

    code: "Fr_03.1",

    section: "ชุด Fr_03",

    title: "แบบ Fr_03.1",

    summary: "หมวดย่อย 3.1 — แยกจาก 3.2 ตามรูปแบบล็อค",

    detail: "ส่วนประกอบแรกของ Fr_03",

    pageIntro:

      "หน้า Fr_03.1 — เลย์เอาต์เดียวกับ Fr_02 ต่างเฉพาะหัวข้อแผนภาพ (แสดงผลจาก DB)",

    reportReferenceCode: "TCFO_R_03_1",

    reportReferenceVersion: "Version 04 : 21/2/2020",

    displayFormCode: "Fr-03.1",

    lockedFormNameValue: "บัญชีรายการก๊าซเรือนกระจก (Scope 3)",

    formMetaPageNumber: "3",

  },

  {

    code: "Fr_03.2",

    section: "ชุด Fr_03",

    title: "แบบ Fr_03.2",

    summary: "หมวดย่อย 3.2 — คู่กับ 3.1 ในการส่งออก",

    detail: "ส่วนประกอบที่สองของ Fr_03",

    pageIntro: "หน้า Fr_03.2 — แยกจาก 3.1 หัวรายงานและเมตาใช้ชุดเดียวกับแบบฟอร์มอื่น",

    reportReferenceCode: "TCFO_R_03_2",

    reportReferenceVersion: "Version 04 : 21/2/2020",

    displayFormCode: "Fr-03.2",

    lockedFormNameValue: "ประเมินความมีนัยสำคัญ Scope3",

    formMetaPageNumber: "1",

  },

  {

    code: "Fr_04.1",

    section: "ชุด Fr_04",

    title: "แบบ Fr_04.1",

    summary: "หมวดย่อย 4.1",

    detail: "แบบแรกของคู่ 4.1 / 4.2",

    pageIntro:

      "หน้า Fr_04.1 — ตารางจาก fr_04.htm (parse → fr04ReportBundle.json) + เลย์เอาต์ใหม่",

    reportReferenceCode: "TCFO_R_04_1",

    reportReferenceVersion: "Version 04 : 21/2/2020",

    displayFormCode: "Fr-04.1",

    lockedFormNameValue: "แบบฟอร์มรายงาน Fr_04.1",

    formMetaPageNumber: "1",

  },

  {

    code: "Fr_04.2",

    section: "ชุด Fr_04",

    title: "แบบ Fr_04.2",

    summary: "หมวดย่อย 4.2",

    detail: "แบบที่สองของชุด Fr_04",

    pageIntro:

      "หน้า Fr_04.2 — โครงเดียวกับ Fr_04.1; แถบปีฐานจากระบบ + ข้อมูลตารางเดียวกัน",

    reportReferenceCode: "TCFO_R_04_2",

    reportReferenceVersion: "Version 04 : 21/2/2020",

    displayFormCode: "Fr-04.2",

    lockedFormNameValue: "แบบฟอร์มรายงาน Fr_04.2",

    formMetaPageNumber: "1",

  },

  {

    code: "Fr_05",

    section: "ชุด Fr_05",

    title: "แบบ Fr_05",

    summary: "เอกสารชุดสุดท้ายในลิสต์มาตรฐาน",

    detail: "เทมเพลตเดี่ยว Fr_05",

    pageIntro:

      "หน้า Fr_05 — ตารางจาก fr_05.htm (parse → fr05ReportBundle.json) + กราฟ Chart.js; ส่งออก Excel ผ่าน export stub จนกว่าจะติดตั้ง xlsx",

    reportReferenceCode: "TCFO_R_05",

    reportReferenceVersion: "Version 04 : 21/2/2020",

    displayFormCode: "Fr-05",

    lockedFormNameValue: "แบบฟอร์มรายงาน Fr_05",

    formMetaPageNumber: "1",

  },

] as const



/** หัวข้อแผนภาพ Fr_02 (fr_02.html) */

export const FR_02_ORGANIZATION_MAP_DIAGRAM_TITLE = "แผนภาพองค์กร"



/** หัวข้อแผนภาพ Fr_03.1 — เลย์เอาต์เดียวกับ Fr_02 */

export const FR_03_1_ORGANIZATION_MAP_DIAGRAM_TITLE =

  "แผนภาพแสดงโครงสร้างขององค์กรและหน้าที่ความรับผิดชอบ"



export function isOrganizationMapReportPage(code: ReportTemplateCode): boolean {

  return code === "Fr_02" || code === "Fr_03.1"

}



export function organizationMapDiagramTitle(code: ReportTemplateCode): string {

  if (code === "Fr_02") return FR_02_ORGANIZATION_MAP_DIAGRAM_TITLE

  if (code === "Fr_03.1") return FR_03_1_ORGANIZATION_MAP_DIAGRAM_TITLE

  return ""

}



export function isReportTemplateCode(value: string): value is ReportTemplateCode {

  return (REPORT_TEMPLATE_CODES as readonly string[]).includes(value)

}



/** slug ใน URL ตรงกับรหัส Fr_xx (เช่น Fr_03.1) */

export function isValidReportPageSlug(slug: string): slug is ReportTemplateCode {

  return isReportTemplateCode(slug)

}



export function catalogItemByCode(code: ReportTemplateCode): ReportExportCatalogItem | undefined {

  return REPORT_EXPORT_CATALOG.find((x) => x.code === code)

}



export function reportTemplateKey(code: ReportTemplateCode): string {

  return code

}



export function listCatalogBySection(section: string): readonly ReportExportCatalogItem[] {

  return REPORT_EXPORT_CATALOG.filter((x) => x.section === section)

}



export function codesInSection(section: string): ReportTemplateCode[] {

  return listCatalogBySection(section).map((x) => x.code)

}



export function getLockedTemplatePlaceholder(_code: ReportTemplateCode): null {

  return null

}

