import type { UserProfile } from "@/store/useAuthStore"

/** ค่าจาก backend ตอนลงทะเบียนแบบย่อ — ถือว่ายังไม่กรอกจริง */
const PLACEHOLDER_MARKERS = new Set(["", "—", "-", "–"])

function isFilledPersonal(s: string | undefined | null): boolean {
  const t = (s ?? "").trim()
  return Boolean(t) && !PLACEHOLDER_MARKERS.has(t)
}

/**
 * โปรไฟล์พร้อมใช้งานระบบ (ไม่รวมรูปประจำตัว)
 * ต้องสอดคล้องกับฟอร์มตั้งค่าที่บังคับกรอก
 */
export function isUserProfileComplete(user: UserProfile | null | undefined): boolean {
  if (!user) return false
  return (
    isFilledPersonal(user.prefix) &&
    isFilledPersonal(user.fname) &&
    isFilledPersonal(user.lname) &&
    isFilledPersonal(user.phone) &&
    isFilledPersonal(user.address) &&
    isFilledPersonal(user.subdistrict) &&
    isFilledPersonal(user.district) &&
    isFilledPersonal(user.province) &&
    isFilledPersonal(user.postal_code)
  )
}
