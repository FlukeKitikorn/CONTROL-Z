import type { ReportExportCatalogItem } from "@/lib/reportExportCatalog"

const th =
  "border border-slate-400 bg-slate-200/90 px-2 py-1.5 text-left text-xs font-semibold text-slate-800 md:text-sm"
const td = "border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-800 md:text-sm"
const tdDim = `${td} text-slate-500`
const corner = "border border-slate-400 bg-slate-300/90 w-10 min-w-[2.5rem] px-1 py-1.5 text-center text-xs font-semibold text-slate-700"

/** จำลองตารางแบบ Excel — ไม่ใช้ Card */
export function ReportSpreadsheetMock({
  sheetTitle,
  forms,
}: {
  sheetTitle: string
  forms: readonly ReportExportCatalogItem[]
}) {
  const colLetters = ["A", "B", "C", "D", "E", "F", "G"]

  const fillerRows: string[][] = [
    ["—", "ข้อมูลตัวอย่าง (mock)", "องค์กรตัวอย่าง", "ปีรายงาน", "ร่าง", "—", "—"],
    ["—", "…", "…", "…", "…", "…", "…"],
    ["—", "…", "…", "…", "…", "…", "…"],
    ...Array.from({ length: 14 }, (_, i) =>
      i === 0
        ? [
            "—",
            "พื้นที่แถวเพิ่ม (mock — เตรียมเผื่อข้อมูล/สูตรจำนวนมาก)",
            "…",
            "…",
            "…",
            "…",
            "…",
          ]
        : ["—", "…", "…", "…", "…", "…", "…"],
    ),
  ]

  return (
    <div className="h-full min-h-[min(36vh,420px)] overflow-x-auto rounded-sm border border-slate-400 bg-slate-100/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">
      <table className="w-full min-w-[760px] border-collapse font-mono text-[13px] leading-snug md:min-w-[960px]">
        <thead>
          <tr>
            <th className={corner} aria-label="มุม" />
            {colLetters.map((L) => (
              <th key={L} className={th}>
                {L}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className={`${corner} bg-slate-200/90`}>1</td>
            <td className={tdDim} colSpan={7}>
              {sheetTitle} — ตัวอย่างเทมเพลตล็อค (แสดงบนเว็บ)
            </td>
          </tr>
          <tr>
            <td className={`${corner} bg-slate-200/90`}>2</td>
            <td className={th} role="columnheader">
              รหัส
            </td>
            <td className={th} role="columnheader">
              ชื่อแบบฟอร์ม
            </td>
            <td className={th} colSpan={2} role="columnheader">
              คำอธิบายสั้น
            </td>
            <td className={th} role="columnheader">
              สถานะ
            </td>
            <td className={th} colSpan={2} role="columnheader">
              หมายเหตุ
            </td>
          </tr>
          {forms.map((f, i) => (
            <tr key={f.code}>
              <td className={`${corner} bg-slate-200/90`}>{i + 3}</td>
              <td className={`${td} font-semibold`}>{f.code}</td>
              <td className={td}>{f.title}</td>
              <td className={td} colSpan={2}>
                {f.summary}
              </td>
              <td className={tdDim}>ร่าง</td>
              <td className={tdDim} colSpan={2}>
                {f.detail}
              </td>
            </tr>
          ))}
          {fillerRows.map((cells, ri) => (
            <tr key={`f-${ri}`}>
              <td className={`${corner} bg-slate-200/90`}>{forms.length + 3 + ri}</td>
              {cells.map((c, ci) => (
                <td key={ci} className={tdDim}>
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
