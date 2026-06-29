import { apiUrl } from "@/lib/apiBase"

/**
 * แปลง path จาก API (/uploads/... หรือ /static/... เก่า) เป็น URL ที่โหลดได้ในเบราว์เซอร์
 * รูปที่เก็บเป็น WebP คุณภาพสูง — แสดงเต็มความละเอียดที่บันทึกไว้
 */
export function resolveMediaUrl(path?: string | null): string | undefined {
  if (!path?.trim()) return undefined
  const p = path.trim()
  if (p.startsWith("data:") || p.startsWith("http://") || p.startsWith("https://")) {
    return p
  }
  if (p.startsWith("/uploads/") || p.startsWith("/static/")) {
    return apiUrl(p)
  }
  return apiUrl(`/uploads/${p.replace(/^\/+/, "")}`)
}
