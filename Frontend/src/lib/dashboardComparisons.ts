import type { CalculationResultsSnapshot } from "@/lib/calculationResultsStorage"

export type CompareMode = "base_year" | "yoy" | "mom"

export const COMPARE_MODE_OPTIONS: { value: CompareMode; label: string; short: string }[] = [
  { value: "base_year", label: "เทียบปีฐาน", short: "ปีฐาน" },
  { value: "yoy", label: "YoY (เทียบปีก่อน)", short: "YoY" },
  { value: "mom", label: "MoM (เทียบเดือนก่อน)", short: "MoM" },
]

// REFACTOR: ใช้ภายในไฟล์เท่านั้น (ไม่มี external caller)
function percentChange(current: number, previous: number): number | null {
  if (!Number.isFinite(current) || !Number.isFinite(previous) || previous === 0) return null
  return ((current - previous) / previous) * 100
}

function daysBetween(a: Date, b: Date): number {
  return Math.abs(a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24)
}

/** เลือก snapshot ในอดีตที่ใกล้เป้าหมายมากที่สุด (YoY ~365 วัน, MoM ~30 วัน) */
function pickHistorySnapshot(
  history: CalculationResultsSnapshot[],
  mode: "yoy" | "mom",
  reference = new Date(),
): CalculationResultsSnapshot | null {
  if (!history.length) return null
  const targetDays = mode === "yoy" ? 365 : 30
  const refMs = reference.getTime()
  let best: CalculationResultsSnapshot | null = null
  let bestDiff = Infinity
  for (const snap of history) {
    const d = new Date(snap.ranAt)
    if (!Number.isFinite(d.getTime()) || d.getTime() >= refMs) continue
    const diff = Math.abs(daysBetween(d, reference) - targetDays)
    if (diff < bestDiff) {
      bestDiff = diff
      best = snap
    }
  }
  return best
}

export function compareDeltaPercent(
  currentTotal: number,
  mode: CompareMode,
  opts: {
    vsBaseYearPercent: number | null
    history: CalculationResultsSnapshot[]
    referenceDate?: Date
  },
): { percent: number | null; label: string; detail: string | null } {
  if (mode === "base_year") {
    return {
      percent: opts.vsBaseYearPercent,
      label: "เทียบปีฐาน",
      detail: opts.vsBaseYearPercent != null ? "จากผลคำนวณล่าสุด" : null,
    }
  }
  const prev = pickHistorySnapshot(opts.history, mode, opts.referenceDate)
  if (!prev) {
    return { percent: null, label: mode === "yoy" ? "YoY" : "MoM", detail: "ยังไม่มีประวัติคำนวณเพียงพอ" }
  }
  const pct = percentChange(currentTotal, prev.totalTco2e)
  const when = new Intl.DateTimeFormat("th-TH", { dateStyle: "medium" }).format(new Date(prev.ranAt))
  return {
    percent: pct,
    label: mode === "yoy" ? "YoY" : "MoM",
    detail: `เทียบกับ ${formatThNumber(prev.totalTco2e, 2)} tCO₂e (${when})`,
  }
}

function formatThNumber(n: number, fraction = 0): string {
  return new Intl.NumberFormat("th-TH", {
    maximumFractionDigits: fraction,
    minimumFractionDigits: fraction,
  }).format(n)
}
