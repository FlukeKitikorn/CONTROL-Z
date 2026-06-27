import type { UserProfile } from "@/store/useAuthStore"

export const CONTROL_Z_BASE_YEAR_UPDATED = "control-z-base-year-updated"

const SNAPSHOTS_KEY = (orgId: string) => `control-z:base-year-snapshots:${orgId}`
const PREFERRED_YEAR_KEY = (orgId: string) => `control-z:preferred-base-year-year:${orgId}`

const MAX_SNAPSHOTS = 80

export interface BaseYearSnapshot {
  id: string
  savedAt: string
  dat_start: string
  dat_end: string
  vx_create?: string
  unity?: string
  unityLabel?: string
}

export function getOrganizationStorageId(user: UserProfile | null): string {
  if (!user) return "anonymous"
  return String(user.organization_id ?? user.email ?? user.username ?? "anonymous")
}

function emitUpdated(orgId: string) {
  if (typeof window === "undefined") return
  window.dispatchEvent(new CustomEvent(CONTROL_Z_BASE_YEAR_UPDATED, { detail: { orgId } }))
}

/* REFACTOR(CANDIDATE-REMOVAL): ใช้เฉพาะ appendBaseYearSnapshotFromFormValues ที่คอมเมนต์แล้ว
function serializeBoundaryDate(v: unknown): string | undefined {
  if (v == null) return undefined
  if (typeof v === "string") return v
  const o = v as { toISOString?: () => string; format?: (f: string) => string }
  if (typeof o.toISOString === "function") return o.toISOString()
  if (typeof o.format === "function") return o.format("YYYY-MM-DD")
  return undefined
}
*/

export function loadBaseYearSnapshots(orgId: string): BaseYearSnapshot[] {
  if (typeof localStorage === "undefined") return []
  try {
    const raw = localStorage.getItem(SNAPSHOTS_KEY(orgId))
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (x): x is BaseYearSnapshot =>
        typeof x === "object" &&
        x !== null &&
        typeof (x as BaseYearSnapshot).id === "string" &&
        typeof (x as BaseYearSnapshot).savedAt === "string" &&
        typeof (x as BaseYearSnapshot).dat_start === "string" &&
        typeof (x as BaseYearSnapshot).dat_end === "string",
    )
  } catch {
    return []
  }
}

export function getLatestBaseYearSnapshot(orgId: string): BaseYearSnapshot | null {
  const list = loadBaseYearSnapshots(orgId)
  if (!list.length) return null
  return [...list].sort((a, b) => (a.savedAt < b.savedAt ? 1 : -1))[0] ?? null
}

export function defaultYearFromSnapshot(s: BaseYearSnapshot): number {
  const yStart = new Date(s.dat_start).getFullYear()
  const yEnd = new Date(s.dat_end).getFullYear()
  return Math.max(yStart, yEnd)
}

export function appendBaseYearSnapshot(
  orgId: string,
  partial: Omit<BaseYearSnapshot, "id" | "savedAt"> & { id?: string; savedAt?: string },
): BaseYearSnapshot {
  const datStart = partial.dat_start
  const datEnd = partial.dat_end
  if (!datStart || !datEnd) {
    throw new Error("dat_start และ dat_end จำเป็นสำหรับ snapshot ปีฐาน")
  }

  const snapshot: BaseYearSnapshot = {
    id: partial.id ?? (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`),
    savedAt: partial.savedAt ?? new Date().toISOString(),
    dat_start: datStart,
    dat_end: datEnd,
    vx_create: partial.vx_create,
    unity: partial.unity,
    unityLabel: partial.unityLabel,
  }

  const prev = loadBaseYearSnapshots(orgId)
  const next = [snapshot, ...prev].slice(0, MAX_SNAPSHOTS)
  localStorage.setItem(SNAPSHOTS_KEY(orgId), JSON.stringify(next))
  emitUpdated(orgId)
  return snapshot
}

/** ดึงค่าจากฟอร์มกรอกข้อมูล (ขั้นข้อมูลทั่วไป) แล้วบันทึก snapshot */
/* REFACTOR(CANDIDATE-REMOVAL): ไม่มี caller — Phase A dead-code audit
export function appendBaseYearSnapshotFromFormValues(
  orgId: string,
  values: Record<string, unknown>,
  unityLabelResolver?: (code: string | undefined) => string | undefined,
): BaseYearSnapshot | null {
  const datStart = serializeBoundaryDate(values.dat_start)
  const datEnd = serializeBoundaryDate(values.dat_end)
  if (!datStart || !datEnd) return null

  const unity = values.unity != null ? String(values.unity) : undefined
  const vxCreate = values.vx_create != null ? String(values.vx_create) : undefined

  const latest = getLatestBaseYearSnapshot(orgId)
  if (
    latest &&
    latest.dat_start === datStart &&
    latest.dat_end === datEnd &&
    (latest.vx_create ?? "") === (vxCreate ?? "") &&
    (latest.unity ?? "") === (unity ?? "")
  ) {
    return latest
  }

  return appendBaseYearSnapshot(orgId, {
    dat_start: datStart,
    dat_end: datEnd,
    vx_create: vxCreate,
    unity,
    unityLabel: unityLabelResolver?.(unity),
  })
}
*/

export function getPreferredBaseYearYear(orgId: string, latest: BaseYearSnapshot | null): number | null {
  if (typeof localStorage === "undefined") return latest ? defaultYearFromSnapshot(latest) : null
  try {
    const raw = localStorage.getItem(PREFERRED_YEAR_KEY(orgId))
    if (raw != null && raw !== "") {
      const n = Number.parseInt(raw, 10)
      if (!Number.isNaN(n) && n >= 1900 && n <= 2200) return n
    }
  } catch {
    /* ignore */
  }
  if (!latest) return null
  return defaultYearFromSnapshot(latest)
}

export function setPreferredBaseYearYear(orgId: string, year: number) {
  if (typeof localStorage === "undefined") return
  localStorage.setItem(PREFERRED_YEAR_KEY(orgId), String(year))
  emitUpdated(orgId)
}

export function formatDateRangeTh(isoStart: string, isoEnd: string): string {
  const fmt = new Intl.DateTimeFormat("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    calendar: "gregory",
  })
  try {
    const a = new Date(isoStart)
    const b = new Date(isoEnd)
    if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return `${isoStart} – ${isoEnd}`
    return `${fmt.format(a)} – ${fmt.format(b)}`
  } catch {
    return `${isoStart} – ${isoEnd}`
  }
}
