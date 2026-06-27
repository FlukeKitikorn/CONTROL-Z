import dayjs, { type Dayjs } from "dayjs"
import type { PeriodGranularity } from "@/lib/periodGranularity"

/** โครงสร้างเตรียมส่งคำนวณรายปี — รวมข้อมูลรายย่อยเข้าปีรายงาน */
export type AnnualReportingBundle = {
  reportingYear: number
  collectionGranularity: PeriodGranularity
  periodStart: string
  periodEnd: string
  /** หมายเหตุสำหรับ backend: ค่าที่กรอกในรอบย่อยจะถูก aggregate เป็นปีนี้ */
  aggregationNote: string
  preparedAt: string
  payload: Record<string, unknown>
}

export function buildAnnualReportingBundle(formValues: Record<string, unknown>): AnnualReportingBundle {
  const start = formValues.date_start as Dayjs | undefined
  const end = formValues.date_end as Dayjs | undefined
  const reportingYear =
    typeof formValues.reporting_year === "number"
      ? formValues.reporting_year
      : end?.isValid()
        ? end.year()
        : start?.isValid()
          ? start.year()
          : dayjs().year()

  const granularity = (formValues.collection_granularity as PeriodGranularity | undefined) ?? "monthly"

  return {
    reportingYear,
    collectionGranularity: granularity,
    periodStart: start?.isValid() ? start.format("YYYY-MM-DD") : "",
    periodEnd: end?.isValid() ? end.format("YYYY-MM-DD") : "",
    aggregationNote:
      "ข้อมูลที่กรอกตามรอบ (รายวัน/สัปดาห์/เดือน) จะถูกรวมและจัดเก็บภายใต้ปีรายงานเดียวกันก่อนคำนวณคาร์บอนฟุตพรินต์รายปี",
    preparedAt: new Date().toISOString(),
    payload: {
      general: {
        fname: formValues.fname,
        lname: formValues.lname,
        date_create: formValues.date_create,
        v_create: formValues.v_create,
        unitx: formValues.unitx,
      },
      scope1_category: formValues.scope1_category,
      scope1_entries: formValues.scope1_entries,
      scope2_energy_type: formValues.scope2_energy_type,
      scope2_batches: formValues.scope2_batches,
      s3_self_assessments: formValues.s3_self_assessments,
      scope3_cat_entries: formValues.scope3_cat_entries,
    },
  }
}
