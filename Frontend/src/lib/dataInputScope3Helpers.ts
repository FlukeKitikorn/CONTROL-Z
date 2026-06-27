export function isScope3EntryRowMeaningful(row: unknown): boolean {
  if (!row || typeof row !== "object") return false
  return Object.values(row as Record<string, unknown>).some((v) => {
    if (v === undefined || v === null || v === "") return false
    if (typeof v === "number" && Number.isFinite(v)) return true
    if (typeof v === "string" && v.trim().length > 0) return true
    return false
  })
}
