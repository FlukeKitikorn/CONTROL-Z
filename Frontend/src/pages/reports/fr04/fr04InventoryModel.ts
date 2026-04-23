import defaultBundle from "@/pages/reports/fr04/fr04ReportBundle.json"

export type Fr04ReportFooter = {
  preparedByLabel: string
  preparedBy: string
  completedLabel: string
  completedDate: string
}

/** ชุดข้อมูลจาก parse `fr_04.htm` (node scripts/parse-fr04-table.mjs) */
export type Fr04ReportBundle = {
  version: number
  source: string
  columnCount: number
  headerRowCount: number
  rows: string[][]
  footer: Fr04ReportFooter
}

export const FR04_REPORT_DEFAULT_BUNDLE = defaultBundle as Fr04ReportBundle

export function resolveFr04ReportBundle(override?: Fr04ReportBundle | null): Fr04ReportBundle {
  if (override != null && override.rows != null && override.rows.length > 0) return override
  return FR04_REPORT_DEFAULT_BUNDLE
}

export function fr04BodyRows(bundle: Fr04ReportBundle): string[][] {
  const n = Math.min(Math.max(0, bundle.headerRowCount), bundle.rows.length)
  return bundle.rows.slice(n).filter((r) => r.some((c) => (c ?? "").trim() !== ""))
}

export function fr04HeaderRows(bundle: Fr04ReportBundle): string[][] {
  const n = Math.min(Math.max(0, bundle.headerRowCount), bundle.rows.length)
  return bundle.rows.slice(0, n)
}
