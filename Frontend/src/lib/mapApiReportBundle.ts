import type { ReportBundleResponse } from "@/lib/api/types"
import type { Fr04ReportBundle } from "@/pages/reports/fr04/fr04InventoryModel"
import type { Fr05ReportBundle } from "@/pages/reports/fr05/fr05InventoryModel"

type SubjectScopeRow = { subid?: number; scid?: number; description?: string }

function subjectsFromApi(data: Record<string, unknown>): SubjectScopeRow[] {
  const raw = data.subject_scopes
  if (!Array.isArray(raw)) return []
  return raw.filter((x): x is SubjectScopeRow => typeof x === "object" && x !== null)
}

/** สร้างตาราง placeholder จาก bundle ของ API (ไม่ใช่ parse จาก fr_04.htm) */
export function apiReportToFr04Bundle(api: ReportBundleResponse): Fr04ReportBundle {
  const subjects = subjectsFromApi(api.data)
  const header = ["ลำดับ", "รายละเอียดหัวข้อ (จากระบบ)"]
  const body: string[][] = subjects.map((s, i) => [String(i + 1), (s.description ?? "").trim() || "—"])
  const rows = [header, ...body]
  return {
    version: 1,
    source: `api:${api.form_code}`,
    columnCount: header.length,
    headerRowCount: 1,
    rows,
    footer: {
      preparedByLabel: "จัดทำโดย",
      preparedBy: "",
      completedLabel: "เสร็จสิ้นวันที่",
      completedDate: "",
    },
  }
}

export function apiReportToFr05Bundle(api: ReportBundleResponse): Fr05ReportBundle {
  const subjects = subjectsFromApi(api.data)
  const form = api.data.form as { name?: string } | undefined
  const formName = typeof form?.name === "string" ? form.name : api.form_code
  const rows: string[][] = [
    ["แบบฟอร์ม", formName],
    ["รหัสฟอร์ม", api.form_code],
    ["องค์กร (organization_id)", String(api.organization_id)],
    ["จำนวนหัวข้อ (subject_scope)", String(subjects.length)],
    ...subjects.map((s, i) => [String(i + 1), (s.description ?? "").trim() || "—"]),
  ]
  return {
    version: 1,
    source: `api:${api.form_code}`,
    current: { rows },
    base: { rows: rows.map((r) => [...r]) },
    footer: {
      preparedByLabel: "จัดทำโดย",
      preparedBy: "",
      completedLabel: "เสร็จสิ้นวันที่",
      completedDate: "",
    },
  }
}
