/** Base URL ว่าง = ใช้ Vite proxy ไปที่ FastAPI (ดู vite.config.ts) */
function getApiBaseUrl(): string {
  return import.meta.env.VITE_API_BASE_URL ?? ""
}

export function apiUrl(path: string): string {
  const base = getApiBaseUrl().replace(/\/$/, "")
  const p = path.startsWith("/") ? path : `/${path}`
  return `${base}${p}`
}
