import { lazy } from "react"

export const DashboardPage = lazy(() =>
  import("@/pages/DashboardPage").then((m) => ({ default: m.DashboardPage })),
)
export const ReportsLayout = lazy(() =>
  import("@/pages/reports/ReportsLayout").then((m) => ({ default: m.ReportsLayout })),
)
export const ReportsSectionPage = lazy(() =>
  import("@/pages/reports/ReportsSectionPage").then((m) => ({ default: m.ReportsSectionPage })),
)
export const SettingsPage = lazy(() =>
  import("@/pages/SettingsPage").then((m) => ({ default: m.SettingsPage })),
)
export const LoginPage = lazy(() =>
  import("@/pages/auth/LoginPage").then((m) => ({ default: m.LoginPage })),
)
export const AdminLoginPage = lazy(() =>
  import("@/pages/admin/AdminLoginPage").then((m) => ({ default: m.AdminLoginPage })),
)
export const RegisterPage = lazy(() =>
  import("@/pages/auth/RegisterPage").then((m) => ({ default: m.RegisterPage })),
)
export const ForgotPasswordPage = lazy(() =>
  import("@/pages/auth/ForgotPasswordPage").then((m) => ({ default: m.ForgotPasswordPage })),
)
export const ResetPasswordPage = lazy(() =>
  import("@/pages/auth/ResetPasswordPage").then((m) => ({ default: m.ResetPasswordPage })),
)
export const OrganizationSetupPage = lazy(() =>
  import("@/pages/onboarding/OrganizationSetupPage").then((m) => ({
    default: m.OrganizationSetupPage,
  })),
)
export const BaseYearPage = lazy(() =>
  import("@/pages/onboarding/BaseYearPage").then((m) => ({ default: m.BaseYearPage })),
)
export const DataInputPage = lazy(() =>
  import("@/pages/DataInputPage").then((m) => ({ default: m.DataInputPage })),
)
export const DataRecordsPage = lazy(() =>
  import("@/pages/DataRecordsPage").then((m) => ({ default: m.DataRecordsPage })),
)
export const ResultsPage = lazy(() =>
  import("@/pages/ResultsPage").then((m) => ({ default: m.ResultsPage })),
)
export const AdminDashboardPage = lazy(() =>
  import("@/pages/admin/AdminDashboardPage").then((m) => ({ default: m.AdminDashboardPage })),
)
export const ManageUsersPage = lazy(() =>
  import("@/pages/admin/ManageUsersPage").then((m) => ({ default: m.ManageUsersPage })),
)
export const ManageOrganizationsPage = lazy(() =>
  import("@/pages/admin/ManageOrganizationsPage").then((m) => ({
    default: m.ManageOrganizationsPage,
  })),
)
export const EmissionFactorsPage = lazy(() =>
  import("@/pages/admin/EmissionFactorsPage").then((m) => ({ default: m.EmissionFactorsPage })),
)
export const DataMonitoringPage = lazy(() =>
  import("@/pages/admin/DataMonitoringPage").then((m) => ({ default: m.DataMonitoringPage })),
)
export const AdminAnnouncementsPage = lazy(() =>
  import("@/pages/admin/AdminAnnouncementsPage").then((m) => ({ default: m.AdminAnnouncementsPage })),
)
export const AdminSettingsPage = lazy(() =>
  import("@/pages/admin/AdminSettingsPage").then((m) => ({ default: m.AdminSettingsPage })),
)
export const AdminLogsPage = lazy(() =>
  import("@/pages/admin/AdminLogsPage").then((m) => ({ default: m.AdminLogsPage })),
)
export const AdminTerminalPage = lazy(() =>
  import("@/pages/admin/AdminTerminalPage").then((m) => ({ default: m.AdminTerminalPage })),
)
