/**
 * โมเดลมุมมอง Fr_02 / Fr_03.1 (แผนภาพองค์กร) — map จาก DB
 */
export type Fr02OrganizationMapViewModel = {
  /** URL รูปแผนภาพองค์กรจาก DB */
  organizationMapImageUrl: string
  /** Fr_03.1 — แถวท้าย: ผู้จัดทำ */
  footerPreparedBy: string
  /** Fr_03.1 — แถวท้าย: วันที่เสร็จ */
  footerCompletedDate: string
}

export const FR_02_ORG_MAP_DEFAULT: Fr02OrganizationMapViewModel = {
  organizationMapImageUrl: "",
  footerPreparedBy: "{PREPARED_BY}",
  footerCompletedDate: "{COMPLETED_DATE}",
}

export function mergeFr02OrganizationMapModel(
  partial?: Partial<Fr02OrganizationMapViewModel>,
): Fr02OrganizationMapViewModel {
  return { ...FR_02_ORG_MAP_DEFAULT, ...partial }
}
