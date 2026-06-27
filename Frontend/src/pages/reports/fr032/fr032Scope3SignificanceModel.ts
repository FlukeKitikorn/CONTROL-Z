import {
  FR032_CRITERIA_NOTE_TITLE,
  FR032_CRITERIA_ROWS,
  FR032_CRITERIA_SOURCE,
  FR032_DEFAULT_CATEGORY_ROWS,
  FR032_FORM_TITLE,
  FR032_INTRO,
  FR032_SELF_ASSESSMENT_NOTE,
  type Fr032CategoryAssessmentRow,
  type Fr032CriterionRow,
} from "@/pages/reports/fr032/fr032Scope3SignificanceConstants"

export type Fr032Scope3SignificanceViewModel = {
  formTitle: string
  intro: string
  criteriaSectionTitle: string
  criteriaRows: readonly Fr032CriterionRow[]
  criteriaSource: string
  categoryRows: readonly Fr032CategoryAssessmentRow[]
  criteriaNoteTitle: string
  /** อธิบายหลักเกณฑ์ — อ่านอย่างเดียว จาก DB/API */
  criteriaExplanationFromDb: string
  selfAssessmentNote: string
}

const defaultModel: Fr032Scope3SignificanceViewModel = {
  formTitle: FR032_FORM_TITLE,
  intro: FR032_INTRO,
  criteriaSectionTitle: "ประเด็นที่ต้องพิจารณา",
  criteriaRows: FR032_CRITERIA_ROWS,
  criteriaSource: FR032_CRITERIA_SOURCE,
  categoryRows: FR032_DEFAULT_CATEGORY_ROWS,
  criteriaNoteTitle: FR032_CRITERIA_NOTE_TITLE,
  criteriaExplanationFromDb: "",
  selfAssessmentNote: FR032_SELF_ASSESSMENT_NOTE,
}

export function mergeFr032Scope3SignificanceModel(
  partial?: Partial<Fr032Scope3SignificanceViewModel>,
): Fr032Scope3SignificanceViewModel {
  if (!partial) return defaultModel
  return {
    ...defaultModel,
    ...partial,
    criteriaRows: partial.criteriaRows ?? defaultModel.criteriaRows,
    categoryRows: partial.categoryRows ?? defaultModel.categoryRows,
  }
}
