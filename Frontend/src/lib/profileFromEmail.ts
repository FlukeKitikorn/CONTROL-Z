/** สร้างชื่อ–นามสกุลจากส่วน local ของอีเมลเมื่อยังไม่มีข้อมูลจริงจากระบบ */
export function profileFromEmail(email: string): { firstName: string; lastName: string } {
  const trimmed = email.trim()
  const local = (trimmed.split("@")[0] ?? "user").replace(/\+.*$/, "")
  const segments = local.split(/[._\-\s]+/).filter(Boolean)
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
  const firstName = segments[0] ? cap(segments[0]) : "ผู้ใช้"
  const lastName =
    segments.length > 1 ? segments.slice(1).map(cap).join(" ") : "—"
  return { firstName, lastName }
}
