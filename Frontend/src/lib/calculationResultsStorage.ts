import { getLatestBaseYearSnapshot, getOrganizationStorageId } from "@/lib/organizationBaseYearStorage"
import type { UserProfile } from "@/store/useAuthStore"

export const CONTROL_Z_CALC_RESULTS_UPDATED = "control-z-calc-results-updated"

/** ผลการคำนวณที่บันทึกในเครื่อง (รอ API แทนที่ภายหลัง) */
export type CalculationResultsSnapshot = {
  ranAt: string
  /** ยอดรวม tCO2e ช่วงรายงาน */
  totalTco2e: number
  /** % เปลี่ยนเทียบปีฐาน — null ถ้ายังไม่มีฐานสำหรับเปรียบเทียบ */
  vsBaseYearPercent: number | null
  scope1Tco2e: number
  scope2Tco2e: number
  scope3Tco2e: number
  /** mock = ตัวเลขจำลองจากปุ่มคำนวณ — api = มาจากเซิร์ฟเวอร์ */
  source: "mock" | "api"
}

const key = (orgId: string) => `control-z:calc-results:${orgId}`

function emit(orgId: string) {
  if (typeof window === "undefined") return
  window.dispatchEvent(new CustomEvent(CONTROL_Z_CALC_RESULTS_UPDATED, { detail: { orgId } }))
}

export function loadCalculationResultsSnapshot(orgId: string): CalculationResultsSnapshot | null {
  if (typeof localStorage === "undefined") return null
  try {
    const raw = localStorage.getItem(key(orgId))
    if (!raw) return null
    const o = JSON.parse(raw) as Partial<CalculationResultsSnapshot>
    if (
      typeof o.ranAt !== "string" ||
      typeof o.totalTco2e !== "number" ||
      typeof o.scope1Tco2e !== "number" ||
      typeof o.scope2Tco2e !== "number" ||
      typeof o.scope3Tco2e !== "number"
    ) {
      return null
    }
    return {
      ranAt: o.ranAt,
      totalTco2e: o.totalTco2e,
      vsBaseYearPercent: typeof o.vsBaseYearPercent === "number" ? o.vsBaseYearPercent : null,
      scope1Tco2e: o.scope1Tco2e,
      scope2Tco2e: o.scope2Tco2e,
      scope3Tco2e: o.scope3Tco2e,
      source: o.source === "api" ? "api" : "mock",
    }
  } catch {
    return null
  }
}

export function saveMockCalculationResults(
  user: UserProfile | null,
  opts?: { vsBaseYearPercent?: number | null },
): CalculationResultsSnapshot {
  const orgId = getOrganizationStorageId(user)
  const scope1 = 1520
  const scope2 = 3010
  const scope3 = 7952
  const total = scope1 + scope2 + scope3
  const snap: CalculationResultsSnapshot = {
    ranAt: new Date().toISOString(),
    totalTco2e: total,
    vsBaseYearPercent: opts?.vsBaseYearPercent ?? (getLatestBaseYearSnapshot(orgId) ? -18.4 : null),
    scope1Tco2e: scope1,
    scope2Tco2e: scope2,
    scope3Tco2e: scope3,
    source: "mock",
  }
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(key(orgId), JSON.stringify(snap))
    emit(orgId)
  }
  return snap
}

