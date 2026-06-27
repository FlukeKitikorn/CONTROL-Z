/** รูปแบบ JSON จาก FastAPI (snake_case) */

export type MeResponse = {
  user_id: number
  fname: string
  lname: string
  prefix?: string | null
  email: string
  username: string
  role: "USER" | "ADMIN"
  organization_id: number
  address?: string | null
  subdistrict?: string | null
  district?: string | null
  province?: string | null
  postal_code?: string | null
  phone?: string | null
  imageprofile?: string | null
}

export type OrganizationRead = {
  organization_id: number
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
}

export type CollectInformationRead = {
  ciid: number
  organization_id: number
  period_collection: string
  productivity: number
  unit_productivity: string
  base_year: string
  base_year_output: number
  unit_base_output: string
}

export type CalculationRunResponse = {
  ran_at: string
  total_tco2e: number
  vs_base_year_percent: number | null
  scope1_tco2e: number
  scope2_tco2e: number
  scope3_tco2e: number
  source: "mock" | "api"
}

export type AnnualReportingBundleRead = {
  reportingYear: number
  collectionGranularity: string
  periodStart: string
  periodEnd: string
  aggregationNote: string
  preparedAt: string
  payload: Record<string, unknown>
}

export type ReportBundleResponse = {
  organization_id: number
  form_code: string
  fid: number | null
  data: Record<string, unknown>
}

export type GhgtFormRead = {
  fid: number
  form_id: string
  name: string
  version: string
  version_date: string
  create_date: string | null
  end_date: string | null
  organization_id: number
}

export type AdminUserListItem = {
  user_id: number
  organization_id: number
  firstname: string
  lastname: string
  email: string | null
  uname: string
  uall: number
}

export type PaginatedUsers = {
  items: AdminUserListItem[]
  total: number
  skip: number
  limit: number
}

export type MonitoringOrgRow = {
  organization_id: number
  organization_name: string
  forms_count: number
  last_edit_date: string | null
}

export type GwpRead = {
  gwpid: number
  subject: string
  value: string
}

export type EfUiOptionRead = {
  option_id: number
  scope_scid: number
  ui_context: string
  option_key: string
  label_th: string
  ef_category_code: string
  activity_subtype: string | null
  ef_purpose: string | null
  unit_denominator: string
  calc_mode: string
}

export type EfResolveRow = {
  option_key: string | null
  gas_code: string | null
  ef_value: number | null
  ef_unit: string | null
  ef_unit_denominator: string | null
  gwp_value: number | null
  source_code: string | null
  ui_label_th: string | null
  calc_mode: string | null
}

export type Scope3EfCatalogRead = {
  line_code: string
  scope3_category_code: string
  label_th: string
  default_unit: string
  entry_mode_hint: string | null
  ef_category_code: string
  activity_name_match: string | null
  sort_order: number | null
}

export type PointsConsiderRead = {
  pid: number
  organization_id: number
  fid: number
  source_GHG: string
  magnitude: string
  influence: string
  risk: string
  sector: string
  outsourcing: string
  engagement: string
}

export type AnnouncementRead = {
  id: string
  title: string
  body: string
  active: boolean
  priority: number
  created_at: string
  updated_at: string
  created_by_email: string | null
}

export type AdminAuditEntryRead = {
  ts: string
  action: string
  actor_email: string | null
  resource: string
  detail: Record<string, unknown>
}

export type MonitorCommandRead = {
  title: string
  description: string
  command: string
}
