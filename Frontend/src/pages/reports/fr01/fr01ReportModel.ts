/**
 * โมเดลมุมมอง Fr_01 — map จาก API / DB
 * ชื่อฟิลด์สอดคล้อง placeholder ใน fr_01.html
 */
export type Fr01ReportViewModel = {
  organizationName: string
  nameOfAgency: string
  date: string
  period: string
  value: string
  unit: string
  addressString: string
  /** แถวข้อมูลองค์กร (ตัวเลข 1 + ข้อความ) */
  organizationDetailLine: string
  /** บรรทัดใต้โลโก้ เช่น "3.00 | tCO2" */
  badgeLine: string
  /** URL โลโก้ (public หรือ data URL) */
  logoUrl: string
  /** URL รูปประกอบจาก DB — ว่างแสดง placeholder */
  coverImageUrl: string
  /** แท่งกราฟ GHG ตามขอบเขต */
  scopeChartBars: readonly {
    label: string
    value: number
    backgroundColor: string
  }[]
}

export const FR_01_DEFAULT_MODEL: Fr01ReportViewModel = {
  organizationName: "{ORGANIZATION_NAME}",
  nameOfAgency: "{NAME_OF_AGENCY}",
  date: "{DATE}",
  period: "{PERIOD}",
  value: "{VALUE}",
  unit: "{UNIT}",
  addressString: "{ADDRESS_STRING}",
  organizationDetailLine: "พื้นที่ทั้งหมดประมาณ 7.30 ตารางกิโลเมตร",
  badgeLine: "3.00 | tCO2",
  logoUrl: "",
  coverImageUrl: "",
  scopeChartBars: [
    { label: "ขอบเขต 1", value: 1.0, backgroundColor: "#4F81BD" },
    { label: "ขอบเขต 2", value: 1.0, backgroundColor: "#C0504D" },
    { label: "ขอบเขต 3", value: 1.0, backgroundColor: "#9BBB59" },
    { label: "อื่น ๆ", value: 1.0, backgroundColor: "#23BFAA" },
  ],
}

export function mergeFr01Model(partial?: Partial<Fr01ReportViewModel>): Fr01ReportViewModel {
  return {
    ...FR_01_DEFAULT_MODEL,
    ...partial,
    scopeChartBars: partial?.scopeChartBars ?? FR_01_DEFAULT_MODEL.scopeChartBars,
  }
}

/** ถ้า `logoUrl` ว่าง ใช้ไฟล์ใน public ตามเทมเพลตเดิม */
export function resolveFr01LogoUrl(model: Fr01ReportViewModel): string {
  if (model.logoUrl) return model.logoUrl
  const base = import.meta.env.BASE_URL
  const prefix = base.endsWith("/") ? base : `${base}/`
  return `${prefix}img/logo_fr01.png`
}
