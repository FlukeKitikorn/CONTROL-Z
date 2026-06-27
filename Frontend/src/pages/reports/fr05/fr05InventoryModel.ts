import defaultBundle from "@/pages/reports/fr05/fr05ReportBundle.json"

/** ชุดข้อมูลจาก parse `fr_05.htm` (node scripts/parse-fr05-table.mjs) */
export type Fr05ReportFooter = {
  preparedByLabel: string
  preparedBy: string
  completedLabel: string
  completedDate: string
}

export type Fr05ReportSection = {
  rows: string[][]
}

export type Fr05ReportBundle = {
  version: number
  source: string
  current: Fr05ReportSection
  base: Fr05ReportSection
  footer: Fr05ReportFooter
}

export const FR05_REPORT_DEFAULT_BUNDLE = defaultBundle as Fr05ReportBundle

export function resolveFr05ReportBundle(override?: Fr05ReportBundle | null): Fr05ReportBundle {
  if (override != null && override.current?.rows?.length && override.base?.rows?.length) return override
  return FR05_REPORT_DEFAULT_BUNDLE
}

const SCOPE_LABELS = ["ประเภท 1", "ประเภท 2", "ประเภท 3", "อื่น ๆ"] as const

export type Fr05PeriodLine = { title: string; range: string }

export function fr05PeriodFromSection(section: Fr05ReportSection): Fr05PeriodLine {
  const r0 = section.rows[0] || []
  return { title: (r0[0] || "").trim(), range: (r0[1] || "").trim() }
}

/** แถวหัวตารางหลัก (ขอบเขต …) ถึงรวม Scope 1&2&3 */
export function fr05MainTableRows(section: Fr05ReportSection): string[][] {
  const rows = section.rows
  const i0 = rows.findIndex((r) => (r[1] || "").trim() === "ขอบเขต")
  const i1 = rows.findIndex((r) => (r[1] || "").includes("รวม Scope 1 & 2 & 3"))
  if (i0 < 0 || i1 < 0) return []
  return rows.slice(i0, i1 + 1)
}

export function fr05CarbonRows(section: Fr05ReportSection): string[][] {
  const rows = section.rows
  const i1 = rows.findIndex((r) => (r[1] || "").includes("รวม Scope 1 & 2 & 3"))
  if (i1 < 0) return []
  return rows.slice(i1 + 1).filter((r) => (r[1] || "").includes("Carbon intensity"))
}

/** ค่า tonCO2-eq ต่อประเภท (คอลัมน์การปล่อย) — ใช้กราฟแท่งเดี่ยว / เปรียบเทียบ */
export function fr05ScopeBarValues(section: Fr05ReportSection): { label: string; value: number }[] {
  const rows = section.rows
  return SCOPE_LABELS.map((label) => {
    const row = rows.find((r) => (r[1] || "").trim() === label)
    const raw = row?.[2]?.trim() ?? ""
    const n = parseFloat(raw.replace(/,/g, ""))
    return { label, value: Number.isFinite(n) ? n : 0 }
  })
}
