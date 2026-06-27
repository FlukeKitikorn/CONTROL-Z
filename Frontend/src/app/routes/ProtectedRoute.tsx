import { Navigate, Outlet, useLocation } from "react-router"
import { ADMIN_LOGIN_PATH, USER_LOGIN_PATH } from "@/lib/authPaths"
import { isUserProfileComplete } from "@/lib/userProfileComplete"
import { useAuthStore, type UserRole } from "@/store/useAuthStore"

interface ProtectedRouteProps {
  allowRole: UserRole
}

export function ProtectedRoute({ allowRole }: ProtectedRouteProps) {
  const { isAuthenticated, role, user } = useAuthStore()
  const location = useLocation()

  if (!isAuthenticated) {
    const loginPath = allowRole === "ADMIN" ? ADMIN_LOGIN_PATH : USER_LOGIN_PATH
    return <Navigate to={loginPath} replace state={{ from: location.pathname }} />
  }

  if (allowRole === "ADMIN") {
    if (role !== "ADMIN") {
      return <Navigate to="/app" replace />
    }
    return <Outlet />
  }

  // โซน /app — รองรับทั้ง USER และ ADMIN (แอดมินใช้ตั้งค่าโปรไฟล์/แจ้งเตือนแบบเดียวกับผู้ใช้)
  if (allowRole === "USER") {
    if (role !== "USER" && role !== "ADMIN") {
      return <Navigate to={USER_LOGIN_PATH} replace />
    }
    if (role === "USER" && user && !isUserProfileComplete(user)) {
      if (!location.pathname.startsWith("/app/settings")) {
        return <Navigate to="/app/settings" replace state={{ profileIncomplete: true }} />
      }
    }
    return <Outlet />
  }

  return <Navigate to={USER_LOGIN_PATH} replace />
}
