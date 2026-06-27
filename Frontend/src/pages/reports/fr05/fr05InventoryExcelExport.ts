import type { Fr05ReportBundle } from "@/pages/reports/fr05/fr05InventoryModel"

export type Fr05ExcelExportPayload = {
  bundle: Fr05ReportBundle
  /** ชื่อไฟล์เมื่อบันทึก เช่น Fr_05_2567.xlsx */
  fileName?: string
}

/**
 * สร้าง payload สำหรับส่งออก Excel — ใช้ชุดข้อมูลเดียวกับที่แสดงใน UI
 */
export function buildFr05ExcelExportPayload(
  bundle: Fr05ReportBundle,
  fileName = "Fr_05.xlsx",
): Fr05ExcelExportPayload {
  return { bundle, fileName }
}

/**
 * ส่งออกเป็นไฟล์ .xlsx — **ยังไม่ implement**
 */
export async function exportFr05ToExcelFile(payload: Fr05ExcelExportPayload): Promise<void> {
  void payload
  await Promise.resolve()
  throw new Error("ยังไม่ได้ติดตั้ง xlsx/exceljs — implement ที่ fr05InventoryExcelExport.ts")
}
