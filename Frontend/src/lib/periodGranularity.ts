export type PeriodGranularity = "daily" | "weekly" | "monthly" | "yearly"

export const PERIOD_GRANULARITY_OPTIONS: { value: PeriodGranularity; label: string; hint: string }[] = [
  { value: "daily", label: "รายวัน", hint: "ช่วง 1 วัน — เหมาะกับการติดตามรายวัน" },
  { value: "weekly", label: "รายสัปดาห์", hint: "จันทร์–อาทิตย์ของสัปดาห์ปัจจุบัน" },
  { value: "monthly", label: "รายเดือน", hint: "วันแรก–วันสุดท้ายของเดือน" },
  { value: "yearly", label: "รายปี", hint: "1 ม.ค. – 31 ธ.ค. ของปีปฏิทิน" },
]

const GRANULARITY_KEY = (orgId: string) => `control-z:collection-granularity:${orgId}`

export type PeriodRound = {
  key: string
  label: string
  startIso: string
  endIso: string
}

function startOfWeekMonday(d: Date): Date {
  const x = new Date(d)
  const day = x.getDay()
  const diff = day === 0 ? -6 : 1 - day
  x.setDate(x.getDate() + diff)
  x.setHours(0, 0, 0, 0)
  return x
}

function endOfWeekSunday(start: Date): Date {
  const x = new Date(start)
  x.setDate(x.getDate() + 6)
  x.setHours(23, 59, 59, 999)
  return x
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999)
}

function startOfYear(d: Date): Date {
  return new Date(d.getFullYear(), 0, 1)
}

function endOfYear(d: Date): Date {
  return new Date(d.getFullYear(), 11, 31, 23, 59, 59, 999)
}

/* REFACTOR(CANDIDATE-REMOVAL): ใช้เฉพาะ buildRecentPeriodRounds ที่คอมเมนต์แล้ว
function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function shiftAnchor(anchor: Date, granularity: PeriodGranularity, offset: number): Date {
  const d = new Date(anchor)
  if (granularity === "daily") {
    d.setDate(d.getDate() + offset)
    return d
  }
  if (granularity === "weekly") {
    d.setDate(d.getDate() + offset * 7)
    return d
  }
  if (granularity === "monthly") {
    d.setMonth(d.getMonth() + offset)
    return d
  }
  d.setFullYear(d.getFullYear() + offset)
  return d
}
*/

export function periodRangeForAnchor(granularity: PeriodGranularity, anchor = new Date()): { start: Date; end: Date } {
  if (granularity === "daily") {
    const s = new Date(anchor)
    s.setHours(0, 0, 0, 0)
    const e = new Date(anchor)
    e.setHours(23, 59, 59, 999)
    return { start: s, end: e }
  }
  if (granularity === "weekly") {
    const s = startOfWeekMonday(anchor)
    return { start: s, end: endOfWeekSunday(s) }
  }
  if (granularity === "monthly") {
    const s = startOfMonth(anchor)
    return { start: s, end: endOfMonth(anchor) }
  }
  const s = startOfYear(anchor)
  return { start: s, end: endOfYear(anchor) }
}

export function formatPeriodRoundLabel(granularity: PeriodGranularity, start: Date, end: Date): string {
  const fmt = new Intl.DateTimeFormat("th-TH", { year: "numeric", month: "short", day: "numeric", calendar: "gregory" })
  if (granularity === "daily") return fmt.format(start)
  if (granularity === "yearly") return `ปี ${start.getFullYear()}`
  return `${fmt.format(start)} – ${fmt.format(end)}`
}

/* REFACTOR(CANDIDATE-REMOVAL): ไม่มี caller — Phase A dead-code audit
export function buildRecentPeriodRounds(granularity: PeriodGranularity, count = 8, anchor = new Date()): PeriodRound[] {
  const out: PeriodRound[] = []
  for (let i = 0; i < count; i++) {
    const a = shiftAnchor(anchor, granularity, -i)
    const { start, end } = periodRangeForAnchor(granularity, a)
    const label = formatPeriodRoundLabel(granularity, start, end)
    const key = `${granularity}:${toIsoDate(start)}:${toIsoDate(end)}`
    out.push({ key, label, startIso: toIsoDate(start), endIso: toIsoDate(end) })
  }
  return out
}
*/

export function getPreferredGranularity(orgId: string): PeriodGranularity {
  if (typeof localStorage === "undefined") return "monthly"
  try {
    const raw = localStorage.getItem(GRANULARITY_KEY(orgId))
    if (raw === "daily" || raw === "weekly" || raw === "monthly" || raw === "yearly") return raw
  } catch {
    /* ignore */
  }
  return "monthly"
}

export function setPreferredGranularity(orgId: string, granularity: PeriodGranularity) {
  if (typeof localStorage === "undefined") return
  localStorage.setItem(GRANULARITY_KEY(orgId), granularity)
}
