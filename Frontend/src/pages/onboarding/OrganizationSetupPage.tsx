import { Navigate } from "react-router"
import { OrganizationRegistrationForm } from "@/components/organization/OrganizationRegistrationForm"
import { useAuthStore } from "@/store/useAuthStore"

export function OrganizationSetupPage() {
  const role = useAuthStore((s) => s.role)
  if (role === "ADMIN") {
    return <Navigate to="/admin/organizations" replace />
  }
  return <OrganizationRegistrationForm variant="user" />
}
