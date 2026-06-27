/** ประเมิน Material Topic ตามสูตรถ่วงน้ำหนัก Scope 3 */

export type Scope3SelfAssessmentRow = {
  categoryId?: string
  presence?: "yes" | "no"
  /** สัดส่วน %GHG ต่อภาพรวมองค์กร (0–100) */
  ghgPercent?: number
  influenceLevel?: 1 | 3 | 5
  riskLevel?: 1 | 3 | 5
  opportunityLevel?: 1 | 3 | 5
  /** ค่าเก่า — รองรับข้อมูลเดิม */
  magnitude?: number
  opportunityRisk?: 1 | 3 | 5
  sectorGuidance?: "yes" | "no"
  outsourcing?: "yes" | "no"
  employeeEngagement?: "yes" | "no"
  remark?: string
}

export type MaterialTopicResult = {
  categoryId: string
  total: number
  isMaterial: boolean
  ghgScore: number
  weightedGhg: number
  weightedInfluence: number
  weightedRisk: number
  weightedOpportunity: number
}

const MATERIAL_THRESHOLD = 3

export function ghgPercentToScore(percent: number | undefined | null): number {
  if (percent == null || !Number.isFinite(percent) || percent < 0) return 1
  if (percent > 40) return 5
  if (percent > 30) return 4
  if (percent > 20) return 3
  if (percent > 10) return 2
  return 1
}

function resolveGhgScore(row: Scope3SelfAssessmentRow): number {
  if (row.ghgPercent != null && Number.isFinite(row.ghgPercent)) {
    return ghgPercentToScore(row.ghgPercent)
  }
  if (row.magnitude != null && row.magnitude >= 1 && row.magnitude <= 5) {
    return Math.round(row.magnitude)
  }
  return 1
}

function resolveThreeLevel(
  primary: 1 | 3 | 5 | undefined,
  legacy: 1 | 3 | 5 | undefined,
): number {
  const v = primary ?? legacy
  if (v === 5) return 5
  if (v === 3) return 3
  return 1
}

/* REFACTOR(CANDIDATE-REMOVAL): ไม่มี caller — Phase A dead-code audit
export function calculateMaterialTopicTotal(row: Scope3SelfAssessmentRow): number {
  const ghgScore = resolveGhgScore(row)
  const influence = resolveThreeLevel(row.influenceLevel, undefined)
  const risk = resolveThreeLevel(row.riskLevel, row.opportunityRisk)
  const opportunity = resolveThreeLevel(row.opportunityLevel, row.opportunityRisk)

  return (
    ghgScore * 0.6 +
    influence * 0.2 +
    risk * 0.1 +
    opportunity * 0.1
  )
}
*/

export function evaluateMaterialTopic(
  categoryId: string,
  row: Scope3SelfAssessmentRow | undefined,
): MaterialTopicResult {
  const ghgScore = resolveGhgScore(row ?? {})
  const influence = resolveThreeLevel(row?.influenceLevel, undefined)
  const risk = resolveThreeLevel(row?.riskLevel, row?.opportunityRisk)
  const opportunity = resolveThreeLevel(row?.opportunityLevel, row?.opportunityRisk)
  const weightedGhg = ghgScore * 0.6
  const weightedInfluence = influence * 0.2
  const weightedRisk = risk * 0.1
  const weightedOpportunity = opportunity * 0.1
  const total = weightedGhg + weightedInfluence + weightedRisk + weightedOpportunity
  const presenceOk = row?.presence === "yes"
  const isMaterial = presenceOk && total >= MATERIAL_THRESHOLD

  return {
    categoryId,
    total,
    isMaterial,
    ghgScore,
    weightedGhg,
    weightedInfluence,
    weightedRisk,
    weightedOpportunity,
  }
}

export function computeMaterialTopicIds(
  assessments: Scope3SelfAssessmentRow[] | undefined,
  categoryIds: readonly string[],
): string[] {
  if (!Array.isArray(assessments)) return []
  return categoryIds.filter((id, i) => {
    const row = assessments[i]
    if (row?.categoryId && row.categoryId !== id) {
      const byId = assessments.find((r) => r?.categoryId === id)
      return evaluateMaterialTopic(id, byId).isMaterial
    }
    return evaluateMaterialTopic(id, row).isMaterial
  })
}

export function formatMaterialTotal(total: number): string {
  return total.toFixed(2)
}

export const MATERIAL_TOPIC_THRESHOLD = MATERIAL_THRESHOLD
