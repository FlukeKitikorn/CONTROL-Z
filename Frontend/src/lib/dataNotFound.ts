/** ข้อความมาตรฐานเมื่อไม่มีข้อมูลจาก API หรือได้ 404 */
export const DATA_NOT_FOUND_LABEL = "ไม่พบข้อมูล"

export function displayOrNotFound(value: string | null | undefined, trim = true): string {
  if (value == null) return DATA_NOT_FOUND_LABEL
  const s = trim ? String(value).trim() : String(value)
  return s === "" ? DATA_NOT_FOUND_LABEL : s
}
