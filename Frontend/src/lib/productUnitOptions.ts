export const PRODUCT_UNIT_OPTIONS = [
  { label: "ลิตร", value: "L" },
  { label: "กิโลกรัม", value: "kg" },
  { label: "ตัน", value: "t" },
  { label: "kWh", value: "kWh" },
  { label: "ลูกบาศก์เมตร (m³)", value: "m3" },
  { label: "ชิ้น / หน่วย", value: "pc" },
  { label: "เมกะวัตต์-ชั่วโมง", value: "MWh" },
  { label: "อื่น ๆ (ระบุในหมายเหตุ)", value: "other" },
] as const

export function resolveProductUnitLabel(code: string | undefined): string | undefined {
  if (!code) return undefined
  return PRODUCT_UNIT_OPTIONS.find((o) => o.value === code)?.label
}

export const DECIMAL_NUMBER_RULES = [
  { required: true, message: "กรุณากรอกตัวเลข" },
  {
    pattern: /^\d+(\.\d+)?$/,
    message: "กรอกได้เฉพาะตัวเลขและจุดทศนิยม (เช่น 1200 หรือ 1200.5)",
  },
] as const
