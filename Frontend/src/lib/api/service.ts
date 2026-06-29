import { apiUrl } from "@/lib/apiBase"
import { ApiError, apiRequest } from "@/lib/api/http"
import { getAccessToken } from "@/lib/authToken"
import type {
  ActivityEntryListParams,
  ActivityEntryListResponse,
  AdminAuditEntryRead,
  AdminUserListItem,
  AnnouncementRead,
  CalculationRunResponse,
  CollectInformationRead,
  AnnualReportingBundleRead,
  EfUiOptionRead,
  GhgtFormRead,
  GwpRead,
  MeResponse,
  MonitorCommandRead,
  MonitoringOrgRow,
  OrganizationRead,
  PaginatedUsers,
  PointsConsiderRead,
  ReportBundleResponse,
} from "@/lib/api/types"

export async function getMe(): Promise<MeResponse> {
  return apiRequest<MeResponse>("/api/v1/me")
}

export async function getAuthSession(): Promise<{
  authenticated: boolean
  user: MeResponse | null
  sessions_server_side: boolean
}> {
  return apiRequest("/api/v1/auth/session")
}

export async function postAuthLogout(): Promise<void> {
  await apiRequest<void>("/api/v1/auth/logout", { method: "POST" })
}

export async function patchMe(body: Record<string, unknown>): Promise<MeResponse> {
  return apiRequest<MeResponse>("/api/v1/me", { method: "PATCH", json: body })
}

/* REFACTOR(CANDIDATE-REMOVAL): API client ยังไม่มี caller — Phase A dead-code audit
export async function patchMePassword(current_password: string, new_password: string): Promise<MeResponse> {
  return apiRequest<MeResponse>("/api/v1/me/password", {
    method: "PATCH",
    json: { current_password, new_password },
  })
}
*/

export async function postMeAvatar(file: File): Promise<MeResponse> {
  const token = getAccessToken()
  const fd = new FormData()
  fd.append("file", file)
  const headers: HeadersInit = {}
  if (token) headers.Authorization = `Bearer ${token}`
  const res = await fetch(apiUrl("/api/v1/me/avatar"), { method: "POST", headers, body: fd })
  const data = (await res.json().catch(() => ({}))) as MeResponse & { detail?: unknown }
  if (!res.ok) {
    const d = data.detail
    const msg = typeof d === "string" ? d : "อัปโหลดรูปไม่สำเร็จ"
    throw new ApiError(res.status, msg)
  }
  return data as MeResponse
}

export async function getOrganization(orgId: number): Promise<OrganizationRead> {
  return apiRequest<OrganizationRead>(`/api/v1/organizations/${orgId}`)
}

export async function listActivityEntries(
  orgId: number,
  params: ActivityEntryListParams = {},
): Promise<ActivityEntryListResponse> {
  const qs = new URLSearchParams()
  if (params.page != null) qs.set("page", String(params.page))
  if (params.page_size != null) qs.set("page_size", String(params.page_size))
  if (params.reporting_year != null) qs.set("reporting_year", String(params.reporting_year))
  if (params.scope_scid != null) qs.set("scope_scid", String(params.scope_scid))
  if (params.entry_kind) qs.set("entry_kind", params.entry_kind)
  if (params.q) qs.set("q", params.q)
  const query = qs.toString()
  return apiRequest<ActivityEntryListResponse>(
    `/api/v1/organizations/${orgId}/activity-entries${query ? `?${query}` : ""}`,
  )
}

/* REFACTOR(CANDIDATE-REMOVAL): API client ยังไม่มี caller — Phase A dead-code audit
export async function patchOrganization(orgId: number, body: Record<string, unknown>): Promise<OrganizationRead> {
  return apiRequest<OrganizationRead>(`/api/v1/organizations/${orgId}`, { method: "PATCH", json: body })
}
*/

export async function listCollectInformation(orgId: number): Promise<CollectInformationRead[]> {
  return apiRequest<CollectInformationRead[]>(`/api/v1/organizations/${orgId}/collect-information`)
}

/* REFACTOR(CANDIDATE-REMOVAL): API client ยังไม่มี caller — Phase A dead-code audit
export async function createCollectInformation(
  orgId: number,
  body: {
    period_collection: string
    productivity: number
    unit_productivity: string
    base_year: string
    base_year_output: number
    unit_base_output: string
  },
): Promise<CollectInformationRead> {
  return apiRequest<CollectInformationRead>(`/api/v1/organizations/${orgId}/collect-information`, {
    method: "POST",
    json: body,
  })
}
*/

export async function getCalculationLatest(orgId: number): Promise<CalculationRunResponse> {
  return apiRequest<CalculationRunResponse>(`/api/v1/organizations/${orgId}/calculations/latest`)
}

export async function postCalculationRun(
  orgId: number,
  body?: { annual_report_bundle?: Record<string, unknown> },
): Promise<CalculationRunResponse> {
  return apiRequest<CalculationRunResponse>(`/api/v1/organizations/${orgId}/calculations/run`, {
    method: "POST",
    json: body ?? {},
  })
}

export async function saveAnnualReportBundle(
  orgId: number,
  bundle: Record<string, unknown>,
): Promise<AnnualReportingBundleRead> {
  return apiRequest<AnnualReportingBundleRead>(`/api/v1/organizations/${orgId}/annual-report-bundle`, {
    method: "POST",
    json: bundle,
  })
}

export async function getAnnualReportBundleLatest(orgId: number): Promise<AnnualReportingBundleRead> {
  return apiRequest<AnnualReportingBundleRead>(`/api/v1/organizations/${orgId}/annual-report-bundle/latest`)
}

export async function getReportBundle(orgId: number, formCode: string): Promise<ReportBundleResponse> {
  const enc = encodeURIComponent(formCode)
  return apiRequest<ReportBundleResponse>(`/api/v1/organizations/${orgId}/reports/${enc}`)
}

export async function listForms(orgId: number): Promise<GhgtFormRead[]> {
  return apiRequest<GhgtFormRead[]>(`/api/v1/organizations/${orgId}/forms`)
}

export async function listPointsConsider(orgId: number, fid: number): Promise<PointsConsiderRead[]> {
  return apiRequest<PointsConsiderRead[]>(
    `/api/v1/organizations/${orgId}/forms/${fid}/points-consider`,
  )
}

export async function adminListUsers(skip = 0, limit = 200): Promise<PaginatedUsers> {
  return apiRequest<PaginatedUsers>(`/api/v1/admin/users?skip=${skip}&limit=${limit}`)
}

export async function adminListOrganizations(): Promise<OrganizationRead[]> {
  return apiRequest<OrganizationRead[]>("/api/v1/admin/organizations")
}

/* REFACTOR(CANDIDATE-REMOVAL): API client ยังไม่มี caller — Phase A dead-code audit
export async function adminCreateOrganization(body: {
  name_of_agency: string
  organization_name: string
  address1: string
  subdistrict: string
  district: string
  province: string
  postal_code: string
  phone: string
  email: string
  registration_date: string
}): Promise<OrganizationRead> {
  return apiRequest<OrganizationRead>("/api/v1/admin/organizations", { method: "POST", json: body })
}
*/

export type AdminUserPatchBody = {
  organization_id?: number
  prefix?: string
  firstname?: string
  lastname?: string
  address?: string
  subdistrict?: string
  district?: string
  province?: string
  postal_code?: string
  phone?: string
  email?: string
}

export async function adminPatchUser(userId: number, body: AdminUserPatchBody): Promise<AdminUserListItem> {
  return apiRequest<AdminUserListItem>(`/api/v1/admin/users/${userId}`, { method: "PATCH", json: body })
}

export async function adminDeleteUser(userId: number): Promise<void> {
  await apiRequest<void>(`/api/v1/admin/users/${userId}`, { method: "DELETE" })
}

export type AdminUserPrivilegesPatchBody = {
  uread?: number
  uwrite?: number
  uedit?: number
  uall?: number
}

export async function adminPatchUserPrivileges(
  userId: number,
  body: AdminUserPrivilegesPatchBody,
): Promise<AdminUserListItem> {
  return apiRequest<AdminUserListItem>(`/api/v1/admin/users/${userId}/privileges`, {
    method: "PATCH",
    json: body,
  })
}

export type OrganizationPatchBody = Partial<{
  name_of_agency: string
  organization_name: string
  address1: string
  subdistrict: string
  district: string
  province: string
  postal_code: string
  phone: string
  email: string
  logo: string | null
  organization_image: string | null
  organization_map: string | null
  organ_structure: string | null
  registration_date: string
}>

export async function adminPatchOrganization(orgId: number, body: OrganizationPatchBody): Promise<OrganizationRead> {
  return apiRequest<OrganizationRead>(`/api/v1/admin/organizations/${orgId}`, { method: "PATCH", json: body })
}

export async function adminDeleteOrganization(orgId: number): Promise<void> {
  await apiRequest<void>(`/api/v1/admin/organizations/${orgId}`, { method: "DELETE" })
}

export async function adminMonitoring(): Promise<MonitoringOrgRow[]> {
  return apiRequest<MonitoringOrgRow[]>("/api/v1/admin/monitoring/submissions")
}

export async function listGwp(): Promise<GwpRead[]> {
  return apiRequest<GwpRead[]>("/api/v1/reference/gwp")
}

export async function listEfUiOptions(params?: {
  scope_scid?: number
  ui_context?: string
}): Promise<EfUiOptionRead[]> {
  const q = new URLSearchParams()
  if (params?.scope_scid != null) q.set("scope_scid", String(params.scope_scid))
  if (params?.ui_context) q.set("ui_context", params.ui_context)
  const qs = q.toString()
  return apiRequest<EfUiOptionRead[]>(`/api/v1/reference/ef-ui-options${qs ? `?${qs}` : ""}`)
}

/* REFACTOR(CANDIDATE-REMOVAL): API client ยังไม่มี caller — Phase A dead-code audit
export async function resolveEf(params: {
  scope_scid: number
  ui_context: string
  option_key: string
  activity_subtype?: string | null
}): Promise<EfResolveRow[]> {
  const q = new URLSearchParams({
    scope_scid: String(params.scope_scid),
    ui_context: params.ui_context,
    option_key: params.option_key,
  })
  if (params.activity_subtype) q.set("activity_subtype", params.activity_subtype)
  return apiRequest<EfResolveRow[]>(`/api/v1/reference/ef-resolve?${q}`)
}

export async function listScope3EfCatalog(scope3CategoryCode?: string): Promise<Scope3EfCatalogRead[]> {
  const q = scope3CategoryCode
    ? `?scope3_category_code=${encodeURIComponent(scope3CategoryCode)}`
    : ""
  return apiRequest<Scope3EfCatalogRead[]>(`/api/v1/reference/scope3-ef-catalog${q}`)
}
*/

export async function createGwp(body: { subject: string; value: string }): Promise<GwpRead> {
  return apiRequest<GwpRead>("/api/v1/reference/gwp", { method: "POST", json: body })
}

export async function patchGwp(gwpid: number, body: { subject?: string; value?: string }): Promise<GwpRead> {
  return apiRequest<GwpRead>(`/api/v1/reference/gwp/${gwpid}`, { method: "PATCH", json: body })
}

export async function deleteGwp(gwpid: number): Promise<void> {
  await apiRequest<void>(`/api/v1/reference/gwp/${gwpid}`, { method: "DELETE" })
}

/** ประกาศที่เผยแพร่ (ไม่ต้องล็อกอิน) */
export async function getAnnouncements(): Promise<AnnouncementRead[]> {
  return apiRequest<AnnouncementRead[]>("/api/v1/announcements")
}

export async function adminListAnnouncements(): Promise<AnnouncementRead[]> {
  return apiRequest<AnnouncementRead[]>("/api/v1/admin/announcements")
}

export async function adminCreateAnnouncement(body: {
  title: string
  body: string
  active: boolean
  priority: number
}): Promise<AnnouncementRead> {
  return apiRequest<AnnouncementRead>("/api/v1/admin/announcements", { method: "POST", json: body })
}

export async function adminPatchAnnouncement(
  id: string,
  body: { title?: string; body?: string; active?: boolean; priority?: number },
): Promise<AnnouncementRead> {
  return apiRequest<AnnouncementRead>(`/api/v1/admin/announcements/${encodeURIComponent(id)}`, {
    method: "PATCH",
    json: body,
  })
}

export async function adminDeleteAnnouncement(id: string): Promise<void> {
  await apiRequest<void>(`/api/v1/admin/announcements/${encodeURIComponent(id)}`, { method: "DELETE" })
}

export async function adminAuditLog(limit = 200): Promise<AdminAuditEntryRead[]> {
  return apiRequest<AdminAuditEntryRead[]>(`/api/v1/admin/audit-log?limit=${limit}`)
}

export async function adminMonitorCommands(): Promise<MonitorCommandRead[]> {
  return apiRequest<MonitorCommandRead[]>("/api/v1/admin/diagnostics/monitor-commands")
}
