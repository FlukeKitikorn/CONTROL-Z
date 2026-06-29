import type { ActivityEntryRead } from "@/lib/api/types"

const ENTRY_KIND_LABELS: Record<string, string> = {
  stationary_combustion: "เผาไหม้อยู่กับที่",
  on_road: "ยานพาหนะ (On-road)",
  off_road: "ยานพาหนะ Off-road",
  industrial_process: "กระบวนการผลิต",
  fugitive: "การปล่อยแบบรั่วซึม",
  electricity: "ไฟฟ้า",
  steam_heat: "ไอน้ำ / ความร้อน",
  scope3_entry: "Scope 3 — รายการกิจกรรม",
  s3_self_assessment: "การประเมินตนเอง Scope 3",
  annual_report_bundle: "ชุดข้อมูลรายปี (bundle)",
  calculation_snapshot: "ผลคำนวณล่าสุด",
}

const SCOPE_LABELS: Record<number, string> = {
  1: "Scope 1",
  2: "Scope 2",
  3: "Scope 3",
}

const SCOPE_COLORS: Record<number, string> = {
  1: "volcano",
  2: "blue",
  3: "purple",
}

export function activityEntryKindLabel(kind: string): string {
  return ENTRY_KIND_LABELS[kind] ?? kind.replaceAll("_", " ")
}

export function activityScopeLabel(scopeId: number): string {
  return SCOPE_LABELS[scopeId] ?? `Scope ${scopeId}`
}

export function activityScopeColor(scopeId: number): string {
  return SCOPE_COLORS[scopeId] ?? "default"
}

function formatQuantity(value: unknown, unit?: unknown): string | null {
  if (value === undefined || value === null || value === "") return null
  const n = typeof value === "number" ? value : Number.parseFloat(String(value))
  const qty = Number.isFinite(n)
    ? new Intl.NumberFormat("th-TH", { maximumFractionDigits: 4 }).format(n)
    : String(value)
  const u = unit != null && String(unit).trim() ? String(unit) : ""
  return u ? `${qty} ${u}` : qty
}

/** สรุปสั้น ๆ สำหรับแสดงในตาราง */
export function activityEntrySummaryLine(entry: ActivityEntryRead): string {
  const p = entry.entry_payload
  const parts: string[] = []

  const year = p.reporting_year ?? p.reportingYear
  if (year != null) parts.push(`ปี ${year}`)

  const period = p.periodLabel ?? p.period_label
  if (period) parts.push(String(period))

  const qty =
    formatQuantity(p.quantity, p.unit) ??
    formatQuantity(p.amount, p.unit) ??
    formatQuantity(p.distanceKm, "km") ??
    formatQuantity(p.energy_kwh, "kWh")

  if (qty) parts.push(qty)

  const fuel = p.fuel ?? p.fuelType ?? p.energyType ?? p.transportMode
  if (fuel) parts.push(String(fuel))

  if (entry.category_code) parts.push(entry.category_code.replaceAll("_", " "))

  if (parts.length === 0) {
    const keys = Object.keys(p).filter(
      (k) => !["reporting_year", "reportingYear", "prepared_at", "preparedAt"].includes(k),
    )
    if (keys.length > 0) return `${keys.length} ฟิลด์`
    return "—"
  }

  return parts.join(" · ")
}

/** คู่ key-value สำหรับ Drawer รายละเอียด (เรียง meta ก่อน) */
export function activityEntryDetailPairs(
  entry: ActivityEntryRead,
): Array<{ key: string; value: string }> {
  const metaKeys = [
    "reporting_year",
    "reportingYear",
    "period_start",
    "period_end",
    "periodLabel",
    "collection_granularity",
    "prepared_at",
    "preparedAt",
  ]
  const p = entry.entry_payload
  const pairs: Array<{ key: string; value: string }> = []

  for (const k of metaKeys) {
    if (p[k] !== undefined && p[k] !== null && p[k] !== "") {
      pairs.push({ key: k, value: formatPayloadValue(p[k]) })
    }
  }

  for (const [k, v] of Object.entries(p)) {
    if (metaKeys.includes(k)) continue
    if (v === undefined || v === null || v === "") continue
    pairs.push({ key: k, value: formatPayloadValue(v) })
  }

  return pairs
}

function formatPayloadValue(v: unknown): string {
  if (v == null) return "—"
  if (typeof v === "object") return JSON.stringify(v, null, 2)
  return String(v)
}
