import { Suspense } from "react"
import { Navigate, Route, Routes } from "react-router"
import { MainLayout } from "@/app/layouts/MainLayout"
import { AdminLayout } from "@/app/layouts/admin/AdminLayout"
import { ProtectedRoute } from "@/app/routes/ProtectedRoute"
import { PageLoadingFallback } from "@/components/common/PageLoadingFallback"
import {
  AdminAnnouncementsPage,
  AdminDashboardPage,
  AdminLogsPage,
  AdminSettingsPage,
  AdminTerminalPage,
  BaseYearPage,
  DashboardPage,
  DataInputPage,
  DataRecordsPage,
  DataMonitoringPage,
  EmissionFactorsPage,
  ForgotPasswordPage,
  LoginPage,
  AdminLoginPage,
  ManageOrganizationsPage,
  ManageUsersPage,
  OrganizationSetupPage,
  RegisterPage,
  ResetPasswordPage,
  ReportsLayout,
  ReportsSectionPage,
  ResultsPage,
  SettingsPage,
} from "@/pages/lazyPages"
import { DEFAULT_REPORT_PAGE_SLUG } from "@/lib/reportExportCatalog"

export function AppRouter() {
  return (
    <Routes>
      <Route
        path="/auth/login"
        element={
          <Suspense fallback={<PageLoadingFallback />}>
            <LoginPage />
          </Suspense>
        }
      />
      <Route
        path="/auth/admin/login"
        element={
          <Suspense fallback={<PageLoadingFallback />}>
            <AdminLoginPage />
          </Suspense>
        }
      />
      <Route
        path="/auth/register"
        element={
          <Suspense fallback={<PageLoadingFallback />}>
            <RegisterPage />
          </Suspense>
        }
      />
      <Route
        path="/auth/forgot-password"
        element={
          <Suspense fallback={<PageLoadingFallback />}>
            <ForgotPasswordPage />
          </Suspense>
        }
      />
      <Route
        path="/auth/reset-password"
        element={
          <Suspense fallback={<PageLoadingFallback />}>
            <ResetPasswordPage />
          </Suspense>
        }
      />

      <Route element={<ProtectedRoute allowRole="USER" />}>
        <Route element={<MainLayout />}>
          <Route path="/app" element={<DashboardPage />} />
          <Route path="/app/inventory" element={<Navigate to="/app" replace />} />
          <Route path="/app/reports" element={<ReportsLayout />}>
            <Route index element={<Navigate to={DEFAULT_REPORT_PAGE_SLUG} replace />} />
            <Route path=":reportSlug" element={<ReportsSectionPage />} />
          </Route>
          <Route path="/app/setup/organization" element={<OrganizationSetupPage />} />
          <Route path="/app/setup/base-year" element={<BaseYearPage />} />
          <Route path="/app/data-input" element={<DataInputPage />} />
          <Route path="/app/records" element={<DataRecordsPage />} />
          <Route path="/app/results" element={<ResultsPage />} />
          <Route path="/app/settings" element={<SettingsPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowRole="ADMIN" />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/admin/users" element={<ManageUsersPage />} />
          <Route path="/admin/organizations" element={<ManageOrganizationsPage />} />
          <Route path="/admin/factors" element={<EmissionFactorsPage />} />
          <Route path="/admin/monitoring" element={<DataMonitoringPage />} />
          <Route path="/admin/announcements" element={<AdminAnnouncementsPage />} />
          <Route path="/admin/settings" element={<AdminSettingsPage />} />
          <Route path="/admin/logs" element={<AdminLogsPage />} />
          <Route path="/admin/terminal" element={<AdminTerminalPage />} />
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/auth/login" replace />} />
      <Route path="*" element={<Navigate to="/auth/login" replace />} />
    </Routes>
  )
}
