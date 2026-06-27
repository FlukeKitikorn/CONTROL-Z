import ExcelJS from "exceljs"

export type DashboardExportInput = {
  year: number
  compareLabel: string
  comparePercent: number | null
  facilityLabel: string
  granularityLabel: string
  referenceBaseYear: number | null
  scope1: number
  scope2: number
  scope3: number
  total: number
  totalBase: number
  totalSelected: number
}

const TEAL_HEADER = "FF0F766E"
const TEAL_LIGHT = "FFCCFBF4"

function formatThNumber(n: number, fraction = 2): string {
  return new Intl.NumberFormat("th-TH", {
    maximumFractionDigits: fraction,
    minimumFractionDigits: fraction,
  }).format(n)
}

function sharePct(v: number, total: number): string {
  if (!total) return "0"
  return ((v / total) * 100).toFixed(2)
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

function stamp(): string {
  const d = new Date()
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`
}

export function exportDashboardCsv(input: DashboardExportInput): void {
  const lines = [
    "รายการ,ค่า,หน่วย",
    `ปีรายงาน,${input.year},ค.ศ.`,
    `สถานที่,${input.facilityLabel},`,
    `รอบข้อมูล,${input.granularityLabel},`,
    `โหมดเปรียบเทียบ,${input.compareLabel},`,
    `% เปรียบเทียบ,${input.comparePercent ?? ""},%`,
    `ปีฐานอ้างอิง,${input.referenceBaseYear ?? ""},ค.ศ.`,
    "",
    "Scope,tCO2e,สัดส่วน (%)",
    `Scope 1,${input.scope1},${sharePct(input.scope1, input.total)}`,
    `Scope 2,${input.scope2},${sharePct(input.scope2, input.total)}`,
    `Scope 3,${input.scope3},${sharePct(input.scope3, input.total)}`,
    `รวม,${input.total},100`,
    "",
    `ยอดปีฐาน (ประมาณ),${input.totalBase},tCO2e`,
    `ยอดปี ${input.year} (ที่เลือก),${input.totalSelected},tCO2e`,
  ]
  const bom = "\uFEFF"
  const blob = new Blob([bom + lines.join("\r\n")], { type: "text/csv;charset=utf-8" })
  downloadBlob(blob, `control-z-dashboard-${input.year}-${stamp()}.csv`)
}

export async function exportDashboardExcel(input: DashboardExportInput): Promise<void> {
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet("ภาพรวม GHG", { views: [{ showGridLines: true }] })
  ws.columns = [{ width: 28 }, { width: 18 }, { width: 14 }]

  const titleRow = ws.addRow(["ภาพรวมการปล่อย GHG — Control Z"])
  titleRow.font = { bold: true, size: 14, color: { argb: TEAL_HEADER } }
  ws.mergeCells(titleRow.number, 1, titleRow.number, 3)

  ws.addRow(["ปีรายงาน", input.year, "ค.ศ."])
  ws.addRow(["สถานที่", input.facilityLabel, ""])
  ws.addRow(["รอบข้อมูล", input.granularityLabel, ""])
  ws.addRow(["เปรียบเทียบ", input.compareLabel, input.comparePercent != null ? `${input.comparePercent}%` : ""])
  ws.addRow([])

  const hdr = ws.addRow(["Scope", "tCO₂e", "สัดส่วน (%)"])
  hdr.eachCell((c) => {
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: TEAL_HEADER } }
    c.font = { bold: true, color: { argb: "FFFFFFFF" } }
  })

  const rows: [string, number][] = [
    ["Scope 1", input.scope1],
    ["Scope 2", input.scope2],
    ["Scope 3", input.scope3],
    ["รวม", input.total],
  ]
  for (const [label, val] of rows) {
    const r = ws.addRow([label, val, sharePct(val, input.total)])
    if (label === "รวม") r.font = { bold: true }
    else if (r.number % 2 === 0) {
      r.eachCell((c) => {
        c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: TEAL_LIGHT } }
      })
    }
  }

  const buffer = await wb.xlsx.writeBuffer()
  downloadBlob(
    new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
    `control-z-dashboard-${input.year}-${stamp()}.xlsx`,
  )
}

/** PDF — เปิดหน้าพิมพ์สรุป (พร้อมต่อ backend รายงาน PDF ภายหลัง) */
export function exportDashboardPdf(input: DashboardExportInput): void {
  const html = `<!DOCTYPE html><html lang="th"><head><meta charset="utf-8"/><title>ภาพรวม GHG ${input.year}</title>
<style>
body{font-family:"Segoe UI",Tahoma,sans-serif;padding:32px;color:#0f172a}
h1{color:#0f766e;font-size:20px;margin:0 0 8px}
.meta{color:#64748b;font-size:13px;margin-bottom:24px}
table{border-collapse:collapse;width:100%;max-width:520px}
th,td{border:1px solid #e2e8f0;padding:10px 12px;text-align:left;font-size:13px}
th{background:#0f766e;color:#fff}
tr:nth-child(even){background:#f0fdfa}
.total{font-weight:700}
footer{margin-top:24px;font-size:11px;color:#94a3b8}
</style></head><body>
<h1>ภาพรวมการปล่อย GHG — Control Z</h1>
<p class="meta">ปี ${input.year} · ${input.facilityLabel} · ${input.granularityLabel} · ${input.compareLabel}${input.comparePercent != null ? ` ${input.comparePercent > 0 ? "+" : ""}${input.comparePercent}%` : ""}</p>
<table>
<tr><th>Scope</th><th>tCO₂e</th><th>สัดส่วน</th></tr>
<tr><td>Scope 1</td><td>${formatThNumber(input.scope1)}</td><td>${sharePct(input.scope1, input.total)}%</td></tr>
<tr><td>Scope 2</td><td>${formatThNumber(input.scope2)}</td><td>${sharePct(input.scope2, input.total)}%</td></tr>
<tr><td>Scope 3</td><td>${formatThNumber(input.scope3)}</td><td>${sharePct(input.scope3, input.total)}%</td></tr>
<tr class="total"><td>รวม</td><td>${formatThNumber(input.total)}</td><td>100%</td></tr>
</table>
<footer>ส่งออกจากแดชบอร์ด Control Z · ${new Date().toLocaleString("th-TH")}</footer>
<script>window.onload=function(){window.print();setTimeout(function(){window.close()},300)}</script>
</body></html>`
  const w = window.open("", "_blank", "noopener,noreferrer")
  if (!w) return
  w.document.write(html)
  w.document.close()
}
