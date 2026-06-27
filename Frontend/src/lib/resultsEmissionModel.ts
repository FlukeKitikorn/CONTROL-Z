import type { CollectInformationRead } from "@/lib/api/types"
import type { CalculationResultsSnapshot } from "@/lib/calculationResultsStorage"

export type EmissionTableRow = {
  key: string
  category: string
  /** ton CO₂-eq */
  emissionsT: number
  /** สัดส่วนเทียบ (Scope1+2) */
  pctScope12: string | null
  /** สัดส่วนเทียบ (Scope1+2+3 หลัก — ไม่รวมอื่น ๆ ใน分母 ตามแบบรายงาน Excel ตัวอย่าง) */
  pctScope123: string | null
  rowClassName?: string
}

function formatPct(n: number | null, digits: number): string | null {
  if (n == null || Number.isNaN(n)) return null
  return `${new Intl.NumberFormat("th-TH", { maximumFractionDigits: digits, minimumFractionDigits: digits }).format(n)}%`
}

/** ใช้ผลผลิตช่วงรายงานเป็นตัวหารเมื่อหน่วยมี kWh (ความเข้มข้น tCO₂e/kWh) */
export function resolveActivityDivisorKwh(latest: CollectInformationRead | null): number | null {
  if (!latest) return null
  const u = latest.unit_productivity?.trim().toLowerCase() ?? ""
  if (!u.includes("kwh") && !u.includes("kw·h") && !u.includes("กิโลวัตต์")) return null
  const p = latest.productivity
  if (typeof p !== "number" || !Number.isFinite(p) || p <= 0) return null
  return p
}

export function carbonIntensityTPerKwh(totalTco2e: number, kwh: number | null): number | null {
  if (kwh == null || kwh <= 0 || !Number.isFinite(totalTco2e)) return null
  return totalTco2e / kwh
}

export function buildEmissionTableRows(r: CalculationResultsSnapshot): EmissionTableRow[] {
  const s1 = r.scope1Tco2e
  const s2 = r.scope2Tco2e
  const s3 = r.scope3Tco2e
  const others = r.othersTco2e ?? 0
  const total12 = s1 + s2
  const total123Core = s1 + s2 + s3

  const p12 = (v: number) => (total12 > 0 ? formatPct((v / total12) * 100, 2) : null)
  const p123 = (v: number) => (total123Core > 0 ? formatPct((v / total123Core) * 100, 2) : null)

  const rows: EmissionTableRow[] = [
    {
      key: "s1",
      category: "ประเภท 1 (Scope 1)",
      emissionsT: s1,
      pctScope12: p12(s1),
      pctScope123: p123(s1),
    },
    {
      key: "s2",
      category: "ประเภท 2 (Scope 2)",
      emissionsT: s2,
      pctScope12: p12(s2),
      pctScope123: p123(s2),
    },
    {
      key: "s3",
      category: "ประเภท 3 (Scope 3)",
      emissionsT: s3,
      pctScope12: null,
      pctScope123: p123(s3),
    },
  ]

  if (others > 0) {
    rows.push({
      key: "other",
      category: "อื่น ๆ",
      emissionsT: others,
      pctScope12: null,
      pctScope123: null,
    })
  }

  rows.push(
    {
      key: "sum12",
      category: "รวม Scope 1 และ 2",
      emissionsT: total12,
      pctScope12: total12 > 0 ? formatPct(100, 2) : null,
      pctScope123: null,
      rowClassName: "bg-teal-50/80 font-medium",
    },
    {
      key: "sum123",
      category: "รวม Scope 1, 2 และ 3",
      emissionsT: total123Core,
      pctScope12: null,
      pctScope123: total123Core > 0 ? formatPct(100, 2) : null,
      rowClassName: "bg-teal-100/60 font-semibold",
    },
  )

  return rows
}

export function barChartValues(r: CalculationResultsSnapshot): { labels: string[]; values: number[] } {
  const others = r.othersTco2e ?? 0
  const labels = ["ประเภท 1", "ประเภท 2", "ประเภท 3"]
  const values = [r.scope1Tco2e, r.scope2Tco2e, r.scope3Tco2e]
  if (others > 0) {
    labels.push("อื่น ๆ")
    values.push(others)
  }
  return { labels, values }
}
