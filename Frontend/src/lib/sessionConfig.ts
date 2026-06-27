/**
 * การตั้งค่าเซสชัน/auth ฝั่ง Frontend — รองรับ Redis server-side sessions ในอนาคต
 *
 * VITE_AUTH_TRANSPORT=bearer (ค่าเริ่มต้น)
 *   - ส่ง Authorization: Bearer จาก localStorage เหมือนเดิม
 *
 * VITE_AUTH_TRANSPORT=cookie (เมื่อ Backend ตั้งคุกกี้ HttpOnly)
 *   - ใช้ credentials: "include" ทุก request
 *   - ไม่เก็บ access token ใน localStorage
 */

export type AuthTransport = "bearer" | "cookie"

function readAuthTransport(): AuthTransport {
  const raw = (import.meta.env.VITE_AUTH_TRANSPORT ?? "bearer").toLowerCase()
  return raw === "cookie" ? "cookie" : "bearer"
}

export const sessionConfig = {
  /** bearer = JWT ใน localStorage | cookie = HttpOnly session cookie จาก API */
  authTransport: readAuthTransport(),
  /** เปิดเมื่อ Backend ใช้ REDIS_SESSIONS_ENABLED — FE จะเรียก POST /auth/logout ก่อนล้าง local */
  serverSessions: import.meta.env.VITE_SERVER_SESSIONS === "true",
  /** path สำหรับตรวจสถานะเซสชัน (ใช้เมื่อ cookie mode) */
  sessionStatusPath: "/api/v1/auth/session",
  refreshPath: "/api/v1/auth/refresh",
} as const

export function apiFetchCredentials(): RequestCredentials {
  return sessionConfig.authTransport === "cookie" ? "include" : "same-origin"
}

export function usesBearerToken(): boolean {
  return sessionConfig.authTransport === "bearer"
}
