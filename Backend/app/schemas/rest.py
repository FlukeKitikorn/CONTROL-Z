"""Request/response models สำหรับ REST ตาม docs/api-design.md"""

from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field


# --- Me ---
class MeUpdate(BaseModel):
    prefix: str | None = Field(default=None, max_length=50)
    firstname: str | None = Field(default=None, max_length=50)
    lastname: str | None = Field(default=None, max_length=50)
    address: str | None = Field(default=None, max_length=100)
    subdistrict: str | None = Field(default=None, max_length=50)
    district: str | None = Field(default=None, max_length=50)
    province: str | None = Field(default=None, max_length=50)
    postal_code: str | None = Field(default=None, max_length=50)
    phone: str | None = Field(default=None, max_length=50)
    email: EmailStr | None = Field(default=None, max_length=50)
    image: str | None = Field(default=None, max_length=100)


class PasswordChangeRequest(BaseModel):
    current_password: str = Field(min_length=1, max_length=255)
    new_password: str = Field(min_length=8, max_length=128)


class MeDeleteConfirm(BaseModel):
    password: str = Field(min_length=1, max_length=255)


# --- Organization ---
class OrganizationRead(BaseModel):
    organization_id: int
    name_of_agency: str
    organization_name: str
    address1: str
    subdistrict: str
    district: str
    province: str
    postal_code: str
    phone: str
    email: str
    logo: str | None
    organization_image: str | None
    organization_map: str | None
    organ_structure: str | None
    registration_date: str

    model_config = {"from_attributes": True}


class OrganizationUpdate(BaseModel):
    name_of_agency: str | None = Field(default=None, max_length=50)
    organization_name: str | None = Field(default=None, max_length=50)
    address1: str | None = Field(default=None, max_length=100)
    subdistrict: str | None = Field(default=None, max_length=50)
    district: str | None = Field(default=None, max_length=50)
    province: str | None = Field(default=None, max_length=50)
    postal_code: str | None = Field(default=None, max_length=50)
    phone: str | None = Field(default=None, max_length=50)
    email: EmailStr | None = Field(default=None, max_length=50)
    logo: str | None = Field(default=None, max_length=100)
    organization_image: str | None = Field(default=None, max_length=50)
    organization_map: str | None = Field(default=None, max_length=50)
    organ_structure: str | None = Field(default=None, max_length=50)
    registration_date: str | None = Field(default=None, max_length=50)


class OrganizationInformationRead(BaseModel):
    ogid: int
    organization_id: int
    description: str

    model_config = {"from_attributes": True}


class OrganizationInformationCreate(BaseModel):
    description: str = Field(max_length=300)


class OrganizationInformationUpdate(BaseModel):
    description: str = Field(max_length=300)


class CollectInformationRead(BaseModel):
    ciid: int
    organization_id: int
    period_collection: str
    productivity: float
    unit_productivity: str
    base_year: str
    base_year_output: float
    unit_base_output: str

    model_config = {"from_attributes": True}


class CollectInformationCreate(BaseModel):
    period_collection: str = Field(max_length=100)
    productivity: float
    unit_productivity: str = Field(max_length=100)
    base_year: str = Field(max_length=100)
    base_year_output: float
    unit_base_output: str = Field(max_length=100)


class CollectInformationUpdate(BaseModel):
    period_collection: str | None = Field(default=None, max_length=100)
    productivity: float | None = None
    unit_productivity: str | None = Field(default=None, max_length=100)
    base_year: str | None = Field(default=None, max_length=100)
    base_year_output: float | None = None
    unit_base_output: str | None = Field(default=None, max_length=100)


# --- Forms ---
class GhgtFormRead(BaseModel):
    fid: int
    form_id: str
    name: str
    version: str
    version_date: str
    create_date: str | None
    end_date: str | None
    organization_id: int

    model_config = {"from_attributes": True}


class GhgtFormCreate(BaseModel):
    form_id: str = Field(max_length=50)
    name: str = Field(max_length=100)
    version: str = Field(max_length=50)
    version_date: str = Field(max_length=50)
    create_date: str | None = Field(default=None, max_length=50)
    end_date: str | None = Field(default=None, max_length=50)


class GhgtFormUpdate(BaseModel):
    form_id: str | None = Field(default=None, max_length=50)
    name: str | None = Field(default=None, max_length=100)
    version: str | None = Field(default=None, max_length=50)
    version_date: str | None = Field(default=None, max_length=50)
    create_date: str | None = Field(default=None, max_length=50)
    end_date: str | None = Field(default=None, max_length=50)


class FormDetailRead(BaseModel):
    fdid: int
    fid: int
    subject: str
    description: str

    model_config = {"from_attributes": True}


class FormDetailCreate(BaseModel):
    subject: str = Field(max_length=100)
    description: str = Field(max_length=150)


class FormDetailUpdate(BaseModel):
    subject: str | None = Field(default=None, max_length=100)
    description: str | None = Field(default=None, max_length=150)


# --- Scope ---
class ScopeRead(BaseModel):
    scid: int
    description: str

    model_config = {"from_attributes": True}


class ScopeCreate(BaseModel):
    description: str = Field(max_length=100)


class ScopeUpdate(BaseModel):
    description: str | None = Field(default=None, max_length=100)


class SubjectScopeRead(BaseModel):
    subid: int
    scid: int
    organization_id: int
    fid: int
    description: str

    model_config = {"from_attributes": True}


class SubjectScopeCreate(BaseModel):
    scid: int
    description: str = Field(max_length=100)


class SubjectScopeUpdate(BaseModel):
    scid: int | None = None
    description: str | None = Field(default=None, max_length=100)


class DetailsScopeRead(BaseModel):
    osid: int
    subid: int
    description: str

    model_config = {"from_attributes": True}


class DetailsScopeReplaceBody(BaseModel):
    descriptions: list[str] = Field(min_length=1)


class DetailsScopeCreate(BaseModel):
    description: str = Field(max_length=300)


class DetailsScopeUpdate(BaseModel):
    description: str | None = Field(default=None, max_length=300)


# --- Points / category ---
class PointsConsiderRead(BaseModel):
    pid: int
    organization_id: int
    fid: int
    source_GHG: str
    magnitude: str
    influence: str
    risk: str
    sector: str
    outsourcing: str
    engagement: str

    model_config = {"from_attributes": True}


class PointsConsiderUpdate(BaseModel):
    source_GHG: str | None = Field(default=None, max_length=500)
    magnitude: str | None = Field(default=None, max_length=500)
    influence: str | None = Field(default=None, max_length=500)
    risk: str | None = Field(default=None, max_length=500)
    sector: str | None = Field(default=None, max_length=500)
    outsourcing: str | None = Field(default=None, max_length=500)
    engagement: str | None = Field(default=None, max_length=500)


class PointsConsiderCreate(BaseModel):
    source_GHG: str = Field(max_length=500)
    magnitude: str = Field(max_length=500)
    influence: str = Field(max_length=500)
    risk: str = Field(max_length=500)
    sector: str = Field(max_length=500)
    outsourcing: str = Field(max_length=500)
    engagement: str = Field(max_length=500)


class CategoryRead(BaseModel):
    cid: int
    fid: int
    description: str

    model_config = {"from_attributes": True}


class CategoryCreate(BaseModel):
    description: str = Field(max_length=100)


class CategoryUpdate(BaseModel):
    description: str | None = Field(default=None, max_length=100)


class CategoryAnswerRead(BaseModel):
    caid: int
    cid: int
    organization_id: int
    source_GHG: int
    magnitude: int
    influence: int
    risk: int
    sector: int
    outsourcing: int
    engagement: int
    remark: str | None

    model_config = {"from_attributes": True}


class CategoryAnswerUpsert(BaseModel):
    source_GHG: int
    magnitude: int
    influence: int
    risk: int
    sector: int
    outsourcing: int
    engagement: int
    remark: str | None = Field(default=None, max_length=300)


# --- FR-04 ---
class Fr04DetailRead(BaseModel):
    fr04wid: int | None
    subid: int
    value: float
    unit: str
    co2_ef: float | None = None
    fossil_ch4_ef: float | None = None
    ch4_ef: float | None = None
    n2o_ef: float | None = None
    sf6_ef: float | None = None
    nf3_ef: float | None = None
    hfcs_ef: float | None = None
    pfcs_ef: float | None = None
    hfcs_gwp: float | None = None
    pfcs_gwp: float | None = None
    ef_unit: float | None = None
    gwp_unit: float | None = None
    kgco2e_total: float | None = None
    self_collct: int | None = None
    supplier: int | None = None
    th_lci_db: int | None = None
    tgo_ef: int | None = None
    thai_res: int | None = None
    int_db: int | None = None
    other: int | None = Field(default=None, serialization_alias="Other")
    substitute: int | None = None
    reference: str | None = None
    description: str | None = None

    model_config = {"from_attributes": True, "populate_by_name": True}


class Fr04DetailUpsert(BaseModel):
    fr04wid: int | None = None
    value: float
    unit: str = Field(max_length=10)
    co2_ef: float | None = None
    fossil_ch4_ef: float | None = None
    ch4_ef: float | None = None
    n2o_ef: float | None = None
    sf6_ef: float | None = None
    nf3_ef: float | None = None
    hfcs_ef: float | None = None
    pfcs_ef: float | None = None
    hfcs_gwp: float | None = None
    pfcs_gwp: float | None = None
    ef_unit: float | None = None
    gwp_unit: float | None = None
    kgco2e_total: float | None = None
    self_collct: int | None = None
    supplier: int | None = None
    th_lci_db: int | None = None
    tgo_ef: int | None = None
    thai_res: int | None = None
    int_db: int | None = None
    other: int | None = None
    substitute: int | None = None
    reference: str | None = Field(default=None, max_length=100)
    description: str | None = Field(default=None, max_length=100)


class Fr04DetailsPutBody(BaseModel):
    rows: list[Fr04DetailUpsert]


class Fr04DetailPatch(BaseModel):
    value: float | None = None
    unit: str | None = Field(default=None, max_length=10)
    co2_ef: float | None = None
    fossil_ch4_ef: float | None = None
    ch4_ef: float | None = None
    n2o_ef: float | None = None
    sf6_ef: float | None = None
    nf3_ef: float | None = None
    hfcs_ef: float | None = None
    pfcs_ef: float | None = None
    hfcs_gwp: float | None = None
    pfcs_gwp: float | None = None
    ef_unit: float | None = None
    gwp_unit: float | None = None
    kgco2e_total: float | None = None
    self_collct: int | None = None
    supplier: int | None = None
    th_lci_db: int | None = None
    tgo_ef: int | None = None
    thai_res: int | None = None
    int_db: int | None = None
    other: int | None = None
    substitute: int | None = None
    reference: str | None = Field(default=None, max_length=100)
    description: str | None = Field(default=None, max_length=100)


class CategoryAnswerCreate(CategoryAnswerUpsert):
    """สร้างแถวคำตอบใหม่ (หลายแถวต่อ cid+org ได้)"""


# --- GWP / emission ---
class GwpRead(BaseModel):
    gwpid: int
    subject: str
    value: str

    model_config = {"from_attributes": True}


class GwpCreate(BaseModel):
    subject: str = Field(max_length=100)
    value: str = Field(max_length=100)


class GwpUpdate(BaseModel):
    subject: str | None = Field(default=None, max_length=100)
    value: str | None = Field(default=None, max_length=100)


# --- Calculations & reports ---
class AnnualReportingBundle(BaseModel):
    reportingYear: int
    collectionGranularity: str
    periodStart: str
    periodEnd: str
    aggregationNote: str
    preparedAt: str
    payload: dict[str, Any] = Field(default_factory=dict)


class CalculationRunRequest(BaseModel):
    annual_report_bundle: AnnualReportingBundle | None = None
    fid: int | None = Field(default=None, description="forms.fid — default ฟอร์มแรกขององค์กร")


class ActivityEntryRead(BaseModel):
    aeid: int
    organization_id: int
    fid: int
    rpid: int | None
    scope_scid: int
    entry_kind: str
    category_code: str | None
    entry_payload: dict[str, Any]

    model_config = {"from_attributes": True}


class ActivityEntrySummary(BaseModel):
    total: int
    scope1: int
    scope2: int
    scope3: int
    reporting_years: list[int] = Field(default_factory=list)


class ActivityEntryListResponse(BaseModel):
    items: list[ActivityEntryRead]
    total: int
    page: int
    page_size: int
    summary: ActivityEntrySummary


class EfResolveRow(BaseModel):
    option_id: int | None = None
    scope_scid: int | None = None
    ui_context: str | None = None
    option_key: str | None = None
    ui_label_th: str | None = None
    ef_category_code: str | None = None
    activity_subtype: str | None = None
    ef_purpose: str | None = None
    ui_unit: str | None = None
    calc_mode: str | None = None
    gas_code: str | None = None
    ef_value: float | None = None
    ef_unit: str | None = None
    ef_unit_denominator: str | None = None
    gwp_value: float | None = None
    source_code: str | None = None


class EfUiOptionRead(BaseModel):
    option_id: int
    scope_scid: int
    ui_context: str
    option_key: str
    label_th: str
    ef_category_code: str
    activity_subtype: str | None = None
    ef_purpose: str | None = None
    unit_denominator: str
    calc_mode: str


class Scope3EfCatalogRead(BaseModel):
    line_code: str
    scope3_category_code: str
    label_th: str
    default_unit: str
    entry_mode_hint: str | None = None
    ef_category_code: str
    activity_name_match: str | None = None
    sort_order: int | None = None


class CalculationRunResponse(BaseModel):
    ran_at: str
    total_tco2e: float
    vs_base_year_percent: float | None
    scope1_tco2e: float
    scope2_tco2e: float
    scope3_tco2e: float
    source: Literal["mock", "api"]


class ReportBundleResponse(BaseModel):
    organization_id: int
    form_code: str
    fid: int | None = None
    data: dict[str, Any]


# --- Admin ---
class AdminUserListItem(BaseModel):
    user_id: int
    organization_id: int
    firstname: str
    lastname: str
    email: str | None
    uname: str
    uall: int


class AdminUserCreate(BaseModel):
    organization_id: int
    email: EmailStr = Field(max_length=50)
    password: str = Field(min_length=8, max_length=128)
    prefix: str = Field(max_length=50)
    firstname: str = Field(max_length=50)
    lastname: str = Field(max_length=50)
    address: str = Field(max_length=100)
    subdistrict: str = Field(max_length=50)
    district: str = Field(max_length=50)
    province: str = Field(max_length=50)
    postal_code: str = Field(max_length=50)
    phone: str | None = Field(default=None, max_length=50)
    uall: int = Field(default=0, ge=0, le=1)


class AdminUserPatch(BaseModel):
    organization_id: int | None = None
    prefix: str | None = Field(default=None, max_length=50)
    firstname: str | None = Field(default=None, max_length=50)
    lastname: str | None = Field(default=None, max_length=50)
    address: str | None = Field(default=None, max_length=100)
    subdistrict: str | None = Field(default=None, max_length=50)
    district: str | None = Field(default=None, max_length=50)
    province: str | None = Field(default=None, max_length=50)
    postal_code: str | None = Field(default=None, max_length=50)
    phone: str | None = Field(default=None, max_length=50)
    email: EmailStr | None = Field(default=None, max_length=50)


class AdminPrivilegesPatch(BaseModel):
    uread: int | None = Field(default=None, ge=0, le=1)
    uwrite: int | None = Field(default=None, ge=0, le=1)
    uedit: int | None = Field(default=None, ge=0, le=1)
    uall: int | None = Field(default=None, ge=0, le=1)


class OrganizationPut(BaseModel):
    """แทนที่ฟิลด์องค์กรทั้งก้อน (สำหรับ PUT)"""

    name_of_agency: str = Field(max_length=50)
    organization_name: str = Field(max_length=50)
    address1: str = Field(max_length=100)
    subdistrict: str = Field(max_length=50)
    district: str = Field(max_length=50)
    province: str = Field(max_length=50)
    postal_code: str = Field(max_length=50)
    phone: str = Field(max_length=50)
    email: EmailStr = Field(max_length=50)
    logo: str | None = Field(default=None, max_length=100)
    organization_image: str | None = Field(default=None, max_length=50)
    organization_map: str | None = Field(default=None, max_length=50)
    organ_structure: str | None = Field(default=None, max_length=50)
    registration_date: str = Field(max_length=50)


class AdminOrganizationCreate(BaseModel):
    name_of_agency: str = Field(max_length=50)
    organization_name: str = Field(max_length=50)
    address1: str = Field(max_length=100)
    subdistrict: str = Field(max_length=50)
    district: str = Field(max_length=50)
    province: str = Field(max_length=50)
    postal_code: str = Field(max_length=50)
    phone: str = Field(max_length=50)
    email: EmailStr = Field(max_length=50)
    registration_date: str = Field(max_length=50)


class MonitoringOrgRow(BaseModel):
    organization_id: int
    organization_name: str
    forms_count: int
    last_edit_date: str | None


class PaginatedUsers(BaseModel):
    items: list[AdminUserListItem]
    total: int
    skip: int
    limit: int


class AnnouncementCreate(BaseModel):
    title: str = Field(max_length=200)
    body: str = Field(max_length=8000)
    active: bool = True
    priority: int = Field(default=0, ge=0, le=100)


class AnnouncementUpdate(BaseModel):
    title: str | None = Field(default=None, max_length=200)
    body: str | None = Field(default=None, max_length=8000)
    active: bool | None = None
    priority: int | None = Field(default=None, ge=0, le=100)


class AnnouncementRead(BaseModel):
    id: str
    title: str
    body: str
    active: bool
    priority: int
    created_at: str
    updated_at: str
    created_by_email: str | None = None


class AdminAuditEntryRead(BaseModel):
    model_config = ConfigDict(extra="ignore")

    ts: str
    action: str
    actor_email: str | None = None
    resource: str
    detail: dict[str, Any] = Field(default_factory=dict)


class MonitorCommandRead(BaseModel):
    title: str
    description: str
    command: str
