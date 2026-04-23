import { Navigate, Outlet } from "react-router"
import { useAuthStore, type UserRole } from "@/store/useAuthStore"

interface ProtectedRouteProps {
  allowRole: UserRole
}

export function ProtectedRoute({ allowRole }: ProtectedRouteProps) {
  const { isAuthenticated, role } = useAuthStore()

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />
  }

  if (role !== allowRole) {
    return <Navigate to={role === "ADMIN" ? "/admin" : "/app"} replace />
  }

  return <Outlet />
}
