import type { FormInstance } from "antd"
import { isScope3EntryRowMeaningful } from "@/lib/dataInputScope3Helpers"
import { computeMaterialTopicIds } from "@/lib/scope3MaterialTopic"

export const SCOPE1_NONE = "none" as const
export const SCOPE2_NONE = "none" as const

type Scope1Category = string
type Scope1OnRoadMode = "fuel_based" | "vehicle_based"

function scope1EntryFieldPaths(category: Scope1Category, index: number, entry: Record<string, unknown>): (string | number)[][] {
  const base: (string | number)[] = ["scope1_entries", index]
  if (category === "on_road") {
    const mode = entry.entry_mode as Scope1OnRoadMode | undefined
    const paths: (string | number)[][] = [[...base, "entry_mode"]]
    if (mode === "fuel_based") {
      paths.push(
        [...base, "activity_key"],
        [...base, "quantity"],
        [...base, "unit"],
      )
    } else if (mode === "vehicle_based") {
      paths.push(
        [...base, "activity_key"],
        [...base, "condition"],
        [...base, "vehicle_distance"],
        [...base, "vehicle_distance_unit"],
        [...base, "vehicle_wheels"],
        [...base, "vehicle_mxl"],
        [...base, "vehicle_load"],
      )
    }
    return paths
  }
  const paths: (string | number)[][] = [
    [...base, "activity_key"],
    [...base, "quantity"],
    [...base, "unit"],
  ]
  if (category === "stationary_combustion") {
    paths.push([...base, "activity_sector"])
  }
  return paths
}

export async function validateScope1BeforeNext(form: FormInstance): Promise<void> {
  await form.validateFields(["scope1_category"])
  const category = form.getFieldValue("scope1_category") as string | undefined
  if (!category || category === SCOPE1_NONE) {
    form.setFieldsValue({ scope1_entries: [] })
    return
  }
  const entries = form.getFieldValue("scope1_entries") as Record<string, unknown>[] | undefined
  if (!entries?.length) {
    const err = new Error("SCOPE1_NO_ENTRIES")
    throw err
  }
  const fieldNames = entries.flatMap((entry, i) => scope1EntryFieldPaths(category, i, entry))
  if (fieldNames.length === 0) {
    throw new Error("SCOPE1_INCOMPLETE")
  }
  await form.validateFields(fieldNames)
}

export async function validateScope2BeforeNext(form: FormInstance): Promise<void> {
  await form.validateFields(["scope2_energy_type"])
  const energyType = form.getFieldValue("scope2_energy_type") as string | undefined
  if (!energyType || energyType === SCOPE2_NONE) {
    form.setFieldsValue({ scope2_batches: [] })
    return
  }
  await form.validateFields(["scope2_batches"])
}

export function areMaterialScope3CategoriesFilled(
  materialTopicIds: string[],
  scope3CatEntries: Record<string, unknown[]> | undefined,
): boolean {
  if (materialTopicIds.length === 0) return true
  return materialTopicIds.every((id) => {
    const rows = scope3CatEntries?.[id]
    return Array.isArray(rows) && rows.some((r) => isScope3EntryRowMeaningful(r))
  })
}

export type DataInputReadiness = {
  canCalculate: boolean
  reasons: string[]
}

export type SaveReadiness = {
  canSave: boolean
  reasons: string[]
}

export function evaluateSaveReadiness(input: {
  fname?: string
  lname?: string
  dateStart?: unknown
  dateEnd?: unknown
}): SaveReadiness {
  const reasons: string[] = []
  if (!input.fname?.trim()) reasons.push("กรอกชื่อผู้จัดทำ")
  if (!input.lname?.trim()) reasons.push("กรอกนามสกุลผู้จัดทำ")
  if (!input.dateStart || !input.dateEnd) reasons.push("เลือกรอบการเก็บข้อมูล (ปีรายงาน)")
  return { canSave: reasons.length === 0, reasons }
}

const SCOPE3_CATEGORY_IDS = [
  "s3_cat_1_purchased_goods",
  "s3_cat_2_capital_goods",
  "s3_cat_3_fuel_energy_related",
  "s3_cat_4_upstream_transport",
  "s3_cat_5_waste_operations",
  "s3_cat_6_business_travel",
  "s3_cat_7_employee_commuting",
  "s3_cat_8_upstream_leased",
  "s3_cat_9_downstream_transport",
  "s3_cat_10_processing_sold",
  "s3_cat_11_use_sold",
  "s3_cat_12_end_of_life",
  "s3_cat_13_downstream_leased",
  "s3_cat_14_franchises",
  "s3_cat_15_investments",
] as const

export function evaluateCalculationReadinessFromBundle(
  bundle: {
    reportingYear?: number
    periodStart?: string
    periodEnd?: string
    payload?: Record<string, unknown>
  },
): DataInputReadiness {
  const p = bundle.payload ?? {}
  const general = (p.general ?? {}) as Record<string, unknown>
  const materialTopicIds = computeMaterialTopicIds(
    p.s3_self_assessments as import("@/lib/scope3MaterialTopic").Scope3SelfAssessmentRow[] | undefined,
    [...SCOPE3_CATEGORY_IDS],
  )
  const reasons: string[] = []

  if (!bundle.reportingYear) reasons.push("ไม่พบปีรายงาน")
  if (!bundle.periodStart || !bundle.periodEnd) {
    reasons.push("ข้อมูลยังไม่ถูกรวมเป็นช่วงรายปี — บันทึกจากหน้ากรอกข้อมูลให้ครบรอบเก็บข้อมูล")
  }

  const base = evaluateCalculationReadiness({
    mainStep: 4,
    hasMaterialTopics: materialTopicIds.length > 0,
    materialTopicIds,
    scope1Category: p.scope1_category as string | undefined,
    scope2EnergyType: p.scope2_energy_type as string | undefined,
    scope3CatEntries: p.scope3_cat_entries as Record<string, unknown[]> | undefined,
    dateStart: bundle.periodStart || general.date_start,
    dateEnd: bundle.periodEnd || general.date_end,
    fname: general.fname as string | undefined,
    lname: general.lname as string | undefined,
    dateCreate: general.date_create,
    vCreate: general.v_create,
    unitx: general.unitx as string | undefined,
  })

  return {
    canCalculate: reasons.length === 0 && base.canCalculate,
    reasons: [...reasons, ...base.reasons],
  }
}

function evaluateCalculationReadiness(input: {
  mainStep: number
  hasMaterialTopics: boolean
  materialTopicIds: string[]
  scope1Category?: string
  scope2EnergyType?: string
  scope3CatEntries?: Record<string, unknown[]>
  dateStart?: unknown
  dateEnd?: unknown
  fname?: string
  lname?: string
  dateCreate?: unknown
  vCreate?: unknown
  unitx?: string
}): DataInputReadiness {
  const reasons: string[] = []

  if (!input.fname?.trim()) reasons.push("กรอกชื่อผู้จัดทำ")
  if (!input.lname?.trim()) reasons.push("กรอกนามสกุลผู้จัดทำ")
  if (!input.dateCreate) reasons.push("เลือกวันที่จัดทำรายงาน")
  if (!input.dateStart || !input.dateEnd) reasons.push("เลือกรอบการเก็บข้อมูล")
  if (!input.vCreate) reasons.push("กรอกผลผลิต")
  if (!input.unitx) reasons.push("เลือกหน่วยผลผลิต")

  if (!input.scope1Category) reasons.push("เลือกหมวดกิจกรรม Scope 1")
  if (!input.scope2EnergyType) reasons.push("เลือกหมวดกิจกรรม Scope 2")

  if (input.hasMaterialTopics) {
    if (input.mainStep < 4) {
      reasons.push("กรอกขอบเขตที่ 3 (มี Material Topic จากการประเมิน)")
    } else if (!areMaterialScope3CategoriesFilled(input.materialTopicIds, input.scope3CatEntries)) {
      reasons.push("กรอกข้อมูลครบทุกหมวด Material Topic ใน Scope 3")
    }
  } else if (input.mainStep < 3) {
    reasons.push("ทำแบบประเมินตนเองให้ครบขั้นตอน")
  }

  return { canCalculate: reasons.length === 0, reasons }
}
