import { Navigate } from "react-router"
import { useAuthStore } from "@/store/useAuthStore"

/** Redirect — ปีฐานย้ายไปตั้งค่าบนแดชบอร์ด (`/app#base-year-settings`) */
export function BaseYearPage() {
  const role = useAuthStore((s) => s.role)
  if (role === "ADMIN") {
    return <Navigate to="/admin/organizations" replace />
  }
  return <Navigate to="/app#base-year-settings" replace />
}
