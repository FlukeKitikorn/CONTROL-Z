import ExcelJS from "exceljs"

import type { CalculationResultsSnapshot } from "@/lib/calculationResultsStorage"

export type ResultsPageTestExcelInput = {
  preparerName: string
  organizationIdDisplay: string
  baseYearDescription: string
  results: CalculationResultsSnapshot | null
  /** ข้อความเวลาคำนวณล่าสุด (จัดรูปแบบแล้ว) */
  ranAtDisplay: string | null
}

const TEAL_HEADER = "FF0F766E"
const TEAL_LIGHT = "FFCCFBF4"
const SLATE_HEADER = "FF334155"
const SLATE_ROW = "FFF8FAFC"
const WHITE = "FFFFFFFF"

function scopeShare(scope: number, total: number): string {
  if (!total) return "0%"
  const pct = (scope / total) * 100
  return `${new Intl.NumberFormat("th-TH", { maximumFractionDigits: 1, minimumFractionDigits: 0 }).format(pct)}%`
}

function formatThNumber(n: number, fraction = 1): string {
  return new Intl.NumberFormat("th-TH", {
    maximumFractionDigits: fraction,
    minimumFractionDigits: 0,
  }).format(n)
}

function downloadBuffer(buffer: ArrayBuffer, fileName: string) {
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

/**
 * ส่งออกไฟล์ทดสอบ .xlsx — มี merge cell, สีพื้นหลัง, โครงข้อมูลสอดคล้องหน้า «ผลการคำนวณ»
 */
export async function exportResultsPageTestXlsx(input: ResultsPageTestExcelInput): Promise<void> {
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet("ผลการคำนวณ", {
    views: [{ showGridLines: true }],
  })

  ws.columns = [
    { width: 22 },
    { width: 18 },
    { width: 18 },
    { width: 16 },
    { width: 14 },
    { width: 28 },
  ]

  const titleRow = 1
  ws.mergeCells(`A${titleRow}:F${titleRow}`)
  const t1 = ws.getCell(`A${titleRow}`)
  t1.value = "ผลการคำนวณ — สรุปการปล่อยก๊าซเรือนกระจก (CO₂e)"
  t1.font = { bold: true, size: 14, color: { argb: WHITE } }
  t1.alignment = { vertical: "middle", horizontal: "center" }
  t1.fill = { type: "pattern", pattern: "solid", fgColor: { argb: TEAL_HEADER } }
  ws.getRow(titleRow).height = 28

  const subRow = 2
  ws.mergeCells(`A${subRow}:F${subRow}`)
  const t2 = ws.getCell(`A${subRow}`)
  t2.value = input.results
    ? `คำนวณล่าสุด: ${input.ranAtDisplay ?? "—"}`
    : "ยังไม่มีผลการคำนวณในระบบ — ไฟล์นี้เป็นตัวอย่างโครงส่งออก"
  t2.font = { size: 11, color: { argb: SLATE_HEADER } }
  t2.alignment = { vertical: "middle", horizontal: "center" }
  t2.fill = { type: "pattern", pattern: "solid", fgColor: { argb: TEAL_LIGHT } }
  ws.getRow(subRow).height = 22

  let r = 4
  ws.mergeCells(`A${r}:F${r}`)
  const secRef = ws.getCell(`A${r}`)
  secRef.value = "ข้อมูลอ้างอิงจากระบบ"
  secRef.font = { bold: true, size: 12, color: { argb: WHITE } }
  secRef.fill = { type: "pattern", pattern: "solid", fgColor: { argb: SLATE_HEADER } }
  secRef.alignment = { vertical: "middle", horizontal: "left", indent: 1 }
  ws.getRow(r).height = 22
  r += 1

  const refRows: [string, string][] = [
    ["ผู้จัดทำ / บัญชี", input.preparerName],
    ["องค์กร (รหัส)", input.organizationIdDisplay],
    ["ช่วงปีฐาน (ล่าสุด)", input.baseYearDescription],
  ]
  for (const [label, val] of refRows) {
    ws.getCell(`A${r}`).value = label
    ws.getCell(`A${r}`).font = { bold: true }
    ws.getCell(`A${r}`).fill = { type: "pattern", pattern: "solid", fgColor: { argb: SLATE_ROW } }
    ws.mergeCells(`B${r}:F${r}`)
    ws.getCell(`B${r}`).value = val
    ws.getCell(`B${r}`).alignment = { vertical: "middle", wrapText: true }
    r += 1
  }

  r += 1

  if (!input.results) {
    ws.mergeCells(`A${r}:F${r + 2}`)
    const empty = ws.getCell(`A${r}`)
    empty.value =
      "ยังไม่มีผลการคำนวณ — กรอกข้อมูลและกดคำนวณที่หน้ากรอกข้อมูล แล้วลองส่งออกอีกครั้ง"
    empty.alignment = { vertical: "middle", horizontal: "center", wrapText: true }
    empty.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEF3C7" } }
    empty.font = { size: 11 }
    ws.getRow(r).height = 48
  } else {
    const res = input.results
    const total = res.totalTco2e

    ws.mergeCells(`A${r}:F${r}`)
    const secM = ws.getCell(`A${r}`)
    secM.value = "สรุปตัวเลขหลัก (รอบล่าสุด)"
    secM.font = { bold: true, size: 12, color: { argb: WHITE } }
    secM.fill = { type: "pattern", pattern: "solid", fgColor: { argb: TEAL_HEADER } }
    secM.alignment = { vertical: "middle", horizontal: "left", indent: 1 }
    ws.getRow(r).height = 22
    r += 1

    const vsText =
      res.vsBaseYearPercent != null
        ? `${formatThNumber(res.vsBaseYearPercent, 1)}%`
        : "— (ยังไม่มีข้อมูลเปรียบเทียบปีฐาน)"

    const metrics: [string, string][] = [
      ["การปล่อยรวม", `${formatThNumber(total, 0)} tCO₂e`],
      ["เทียบปีฐาน", vsText],
      ["แหล่งข้อมูล", res.source === "mock" ? "จำลอง (mock)" : "API"],
    ]
    for (const [label, val] of metrics) {
      ws.mergeCells(`A${r}:C${r}`)
      ws.getCell(`A${r}`).value = label
      ws.getCell(`A${r}`).font = { bold: true }
      ws.getCell(`A${r}`).fill = { type: "pattern", pattern: "solid", fgColor: { argb: TEAL_LIGHT } }
      ws.mergeCells(`D${r}:F${r}`)
      ws.getCell(`D${r}`).value = val
      ws.getCell(`D${r}`).font = { bold: true, size: 11 }
      ws.getCell(`D${r}`).alignment = { horizontal: "right" }
      r += 1
    }

    r += 1
    ws.mergeCells(`A${r}:F${r}`)
    const secT = ws.getCell(`A${r}`)
    secT.value = "แยกตาม Scope (tCO₂e)"
    secT.font = { bold: true, size: 12, color: { argb: WHITE } }
    secT.fill = { type: "pattern", pattern: "solid", fgColor: { argb: SLATE_HEADER } }
    secT.alignment = { vertical: "middle", horizontal: "left", indent: 1 }
    ws.getRow(r).height = 22
    r += 1

    const headerRow = r
    ws.mergeCells(`A${headerRow}:A${headerRow}`)
    ws.getCell(`A${headerRow}`).value = "Scope"
    ws.getCell(`B${headerRow}`).value = "การปล่อย (tCO₂e)"
    ws.getCell(`C${headerRow}`).value = "สัดส่วน"
    ws.mergeCells(`D${headerRow}:F${headerRow}`)
    ws.getCell(`D${headerRow}`).value = "หมายเหตุ"
    for (const col of ["A", "B", "C", "D"] as const) {
      const c = ws.getCell(`${col}${headerRow}`)
      c.font = { bold: true, color: { argb: WHITE } }
      c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: TEAL_HEADER } }
      c.alignment = { vertical: "middle", horizontal: col === "B" ? "right" : "center" }
    }
    ws.getRow(headerRow).height = 20
    r += 1

    const breakdown: { scope: string; value: number; share: string; note: string; rowArgb: string }[] = [
      {
        scope: "Scope 1",
        value: res.scope1Tco2e,
        share: scopeShare(res.scope1Tco2e, total),
        note: "การปล่อยโดยตรง",
        rowArgb: "FFE8F5E9",
      },
      {
        scope: "Scope 2",
        value: res.scope2Tco2e,
        share: scopeShare(res.scope2Tco2e, total),
        note: "พลังงานทางอ้อม",
        rowArgb: "FFE3F2FD",
      },
      {
        scope: "Scope 3",
        value: res.scope3Tco2e,
        share: scopeShare(res.scope3Tco2e, total),
        note: "ห่วงโซ่อุปทาน",
        rowArgb: "FFF3E5F5",
      },
    ]

    for (const row of breakdown) {
      ws.getCell(`A${r}`).value = row.scope
      ws.getCell(`B${r}`).value = row.value
      ws.getCell(`B${r}`).numFmt = "#,##0.0"
      ws.getCell(`C${r}`).value = row.share
      ws.mergeCells(`D${r}:F${r}`)
      ws.getCell(`D${r}`).value = row.note
      for (const col of ["A", "B", "C", "D"] as const) {
        const cell = ws.getCell(`${col}${r}`)
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: row.rowArgb } }
        cell.alignment = {
          vertical: "middle",
          horizontal: col === "B" ? "right" : col === "C" ? "center" : "left",
        }
      }
      r += 1
    }

    r += 1
    ws.mergeCells(`A${r}:F${r}`)
    const foot = ws.getCell(`A${r}`)
    foot.value =
      "ไฟล์ทดสอบนี้แสดง merge cell, สีพื้นหลัง และโครงข้อมูลเดียวกับหน้าเว็บ — นำไปเปรียบเทียบกับเทมเพลต Fr_xx ได้"
    foot.font = { italic: true, size: 10, color: { argb: "FF64748B" } }
    foot.alignment = { vertical: "middle", horizontal: "center", wrapText: true }
  }

  const buf = await wb.xlsx.writeBuffer()
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")
  downloadBuffer(buf as ArrayBuffer, `test-results-export-${stamp}.xlsx`)
}
