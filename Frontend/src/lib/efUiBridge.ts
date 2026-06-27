import type { EfUiOptionRead } from "@/lib/api/types"

export type Scope2LineFromApi = {
  id: string
  label: string
  unitOptions: { label: string; value: string }[]
}

export type Scope2DataQueryResult = {
  usageHint?: string
  lines: Scope2LineFromApi[]
}

export type Scope1FuelDef = {
  value: string
  label: string
  defaultUnits: { label: string; value: string }[]
}

const UNIT_LABELS: Record<string, string> = {
  L: "ลิตร",
  litre: "ลิตร",
  m3: "ลูกบาศก์เมตร (m³)",
  t: "ตัน",
  kg: "กิโลกรัม (kg)",
  kWh: "kWh (กิโลวัตต์-ชั่วโมง)",
  unit: "Unit (หน่วยตามบิลการไฟฟ้า)",
}

/** หน่วย UI ต่อ option_key — fallback เมื่อ API ไม่ระบุหลายหน่วย */
const SCOPE1_OPTION_UNITS: Record<string, { label: string; value: string }[]> = {
  fuel_oil_a: [
    { label: "ลิตร", value: "L" },
    { label: "ลูกบาศก์เมตร (m³)", value: "m3" },
  ],
  fuel_oil_c: [
    { label: "ลิตร", value: "L" },
    { label: "ลูกบาศก์เมตร (m³)", value: "m3" },
  ],
  diesel_gas_oil: [{ label: "ลิตร", value: "L" }],
  diesel: [{ label: "ลิตร", value: "L" }],
  jet_kerosene: [{ label: "ลิตร", value: "L" }],
  motor_gasoline: [{ label: "ลิตร", value: "L" }],
  lignite: [{ label: "ตัน", value: "t" }],
  anthracite: [{ label: "ตัน", value: "t" }],
  sub_bituminous_coal: [{ label: "ตัน", value: "t" }],
  fuel_wood: [{ label: "ตัน", value: "t" }],
  bagasse: [{ label: "ตัน", value: "t" }],
  palm_kernel_shell: [{ label: "ตัน", value: "t" }],
  cob: [{ label: "ตัน", value: "t" }],
  biogas: [{ label: "ลูกบาศก์เมตร (m³)", value: "m3" }],
  natural_gas: [{ label: "ลูกบาศก์เมตร (m³)", value: "m3" }],
  lpg: [{ label: "ลิตร", value: "L" }],
  cng: [{ label: "ลูกบาศก์เมตร (m³)", value: "m3" }],
  gasoline_2_stroke: [{ label: "ลิตร", value: "L" }],
  gasoline_4_stroke: [{ label: "ลิตร", value: "L" }],
  motor_gasoline_uncontrolled: [{ label: "ลิตร", value: "L" }],
  motor_gasoline_oxidation_catalyst: [{ label: "ลิตร", value: "L" }],
  motor_gasoline_low_mileage_light_duty: [{ label: "ลิตร", value: "L" }],
}

const SCOPE2_KWH_UNIT_OPTIONS = [
  { label: "kWh (กิโลวัตต์-ชั่วโมง)", value: "kWh" },
  { label: "Unit (หน่วยตามบิลการไฟฟ้า)", value: "unit" },
] as const

function unitOptionsFromDenominator(den: string): { label: string; value: string }[] {
  if (den === "kWh") return [...SCOPE2_KWH_UNIT_OPTIONS]
  const label = UNIT_LABELS[den] ?? den
  return [{ label, value: den }]
}

function unitsForOptionKey(optionKey: string, apiDen?: string): { label: string; value: string }[] {
  const mapped = SCOPE1_OPTION_UNITS[optionKey]
  if (mapped?.length) return mapped.map((u) => ({ ...u }))
  if (apiDen) return unitOptionsFromDenominator(apiDen)
  return [{ label: "ลิตร", value: "L" }]
}

/** รวม ef-ui-options เป็นรายการเชื้อเพลิงต่อ context (off-road ไม่ซ้ำ option_key) */
export function scope1FuelsFromEfOptions(
  options: EfUiOptionRead[],
  uiContext: string,
): Scope1FuelDef[] {
  const filtered = options.filter((o) => o.ui_context === uiContext)
  const seen = new Set<string>()
  const out: Scope1FuelDef[] = []
  for (const o of filtered) {
    if (uiContext === "off_road" && o.activity_subtype) continue
    if (seen.has(o.option_key)) continue
    seen.add(o.option_key)
    out.push({
      value: o.option_key,
      label: o.label_th,
      defaultUnits: unitsForOptionKey(o.option_key, o.unit_denominator),
    })
  }
  return out
}

export function buildScope2ElectricityPayload(): Scope2DataQueryResult {
  return {
    lines: [
      {
        id: "s2-electricity-grid",
        label: "การใช้ไฟฟ้ารวม (ระบบสายส่ง)",
        unitOptions: [...SCOPE2_KWH_UNIT_OPTIONS],
      },
    ],
  }
}

export function buildScope2RefrigerantPayload(
  options: EfUiOptionRead[],
  refType: string,
): Scope2DataQueryResult {
  const ref = options.find((o) => o.ui_context === "refrigerant" && o.option_key === refType)
  if (!ref) {
    return { usageHint: "เลือกประเภทสารทำความเย็นก่อน", lines: [] }
  }
  return {
    usageHint: "กรอกปริมาณและหน่วยให้ตรงกับใบสั่งซื้อ / ใบกำกับ",
    lines: [
      {
        id: `s2-ref-${ref.option_key}`,
        label: ref.label_th,
        unitOptions: unitOptionsFromDenominator(ref.unit_denominator),
      },
    ],
  }
}

export function refrigerantSelectOptions(options: EfUiOptionRead[]): { value: string; label: string }[] {
  return options
    .filter((o) => o.ui_context === "refrigerant")
    .map((o) => ({ value: o.option_key, label: o.label_th }))
}

export function buildScope2LinesFormState(res: Scope2DataQueryResult) {
  return res.lines.map((l) => ({
    lineId: l.id,
    quantity: undefined as number | undefined,
    unit: l.unitOptions.length === 1 ? l.unitOptions[0].value : undefined,
  }))
}
