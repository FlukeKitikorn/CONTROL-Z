/** แถวล่าสุดตาม `ciid` */
export function latestCollectRow<T extends { ciid: number }>(rows: T[]): T | null {
  if (!rows.length) return null
  return [...rows].sort((a, b) => b.ciid - a.ciid)[0] ?? null
}

/** แปลงค่าที่เก็บแบบ `ISO|ISO` เป็นข้อความช่วงวันที่ */
export function pipeRangeLabel(raw: string | null | undefined): string | null {
  if (!raw || !raw.includes("|")) return null
  const [a, b] = raw.split("|").map((x) => x.trim())
  if (!a || !b) return null
  try {
    const fmt = new Intl.DateTimeFormat("th-TH", {
      year: "numeric",
      month: "short",
      day: "numeric",
      calendar: "gregory",
    })
    const da = new Date(a)
    const db = new Date(b)
    if (Number.isNaN(da.getTime()) || Number.isNaN(db.getTime())) return `${a} – ${b}`
    return `${fmt.format(da)} – ${fmt.format(db)}`
  } catch {
    return `${a} – ${b}`
  }
}
