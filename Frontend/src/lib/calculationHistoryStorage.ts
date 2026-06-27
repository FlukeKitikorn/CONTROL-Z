import type { CalculationResultsSnapshot } from "@/lib/calculationResultsStorage"

const HISTORY_LIMIT = 48

function historyKey(orgId: string) {
  return `control-z:calc-history:${orgId}`
}

function isValidSnapshot(o: unknown): o is CalculationResultsSnapshot {
  if (typeof o !== "object" || o === null) return false
  const x = o as Partial<CalculationResultsSnapshot>
  return (
    typeof x.ranAt === "string" &&
    typeof x.totalTco2e === "number" &&
    typeof x.scope1Tco2e === "number" &&
    typeof x.scope2Tco2e === "number" &&
    typeof x.scope3Tco2e === "number" &&
    (x.source === "api" || x.source === "mock")
  )
}

/** ประวัติการคำนวณที่บันทึกในเครื่อง (เติมเมื่อกดคำนวณจากหน้าการคำนวณ) */
export function loadCalculationHistory(orgId: string): CalculationResultsSnapshot[] {
  if (!orgId || typeof localStorage === "undefined") return []
  try {
    const raw = localStorage.getItem(historyKey(orgId))
    if (!raw) return []
    const arr = JSON.parse(raw) as unknown
    if (!Array.isArray(arr)) return []
    return arr.filter(isValidSnapshot).map((x) => ({
      ...x,
      othersTco2e: typeof x.othersTco2e === "number" ? x.othersTco2e : 0,
      vsBaseYearPercent: typeof x.vsBaseYearPercent === "number" ? x.vsBaseYearPercent : null,
    }))
  } catch {
    return []
  }
}

export function appendCalculationHistory(orgId: string, snap: CalculationResultsSnapshot): void {
  if (!orgId || typeof localStorage === "undefined") return
  const prev = loadCalculationHistory(orgId)
  const withoutDup = prev.filter((p) => p.ranAt !== snap.ranAt)
  const next = [{ ...snap, othersTco2e: snap.othersTco2e ?? 0 }, ...withoutDup].slice(0, HISTORY_LIMIT)
  localStorage.setItem(historyKey(orgId), JSON.stringify(next))
}
