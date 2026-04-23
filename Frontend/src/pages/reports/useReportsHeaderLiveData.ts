import { useMemo } from "react"
import type { Fr04ReportBundle } from "@/pages/reports/fr04/fr04InventoryModel"
import type { Fr05ReportBundle } from "@/pages/reports/fr05/fr05InventoryModel"
import type { UserProfile } from "@/store/useAuthStore"
import { useAuthStore } from "@/store/useAuthStore"

/** ข้อมูลหัวรายงาน Fr_xx — ต่อมา map จาก API / โปรไฟล์องค์กรได้ที่นี่ */
export type ReportsHeaderLiveData = {
  organizationName: string
  agencyName: string
  preparedDate: string
  /** Fr_03.2 — อธิบายหลักเกณฑ์ (ดึงจาก API/ฐานข้อมูล) */
  fr032CriteriaExplanation: string
  /**
   * Fr_04.1 / Fr_04.2 — ชุดข้อมูลจาก API
   * - `undefined` → ใช้ parse จาก `fr_04.htm` → `fr04ReportBundle.json`
   */
  fr04Bundle?: Fr04ReportBundle | null
  /** ตั้ง `true` ระหว่างดึง `fr04Bundle` จาก API */
  fr04TableLoading?: boolean
  /** Fr_05 — ชุดข้อมูลจาก API (undefined = ใช้ parse จาก fr_05.htm → fr05ReportBundle.json) */
  fr05Bundle?: Fr05ReportBundle | null
  fr05TableLoading?: boolean
}

function formatAgencyFromUser(user: UserProfile): string {
  const parts = [user.prefix, user.fname, user.lname].filter(Boolean)
  if (parts.length) return parts.join(" ")
  return user.username || user.email || "{NAME_OF_AGENCY}"
}

export function useReportsHeaderLiveData(): ReportsHeaderLiveData {
  const user = useAuthStore((s) => s.user)

  return useMemo(
    () => ({
      organizationName: "{ORGANIZATION_NAME}",
      agencyName: user ? formatAgencyFromUser(user) : "{NAME_OF_AGENCY}",
      preparedDate: "{DATE}",
      fr032CriteriaExplanation: "",
      fr04Bundle: undefined,
      fr04TableLoading: false,
      fr05Bundle: undefined,
      fr05TableLoading: false,
    }),
    [user],
  )
}
