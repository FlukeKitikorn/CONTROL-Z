import ExcelJS from "exceljs"
import { REPORT_TEMPLATE_CODES, type ReportTemplateCode } from "@/lib/reportExportCatalog"
import {
  buildExcelWritePlan,
  type ExcelCellPrimitive,
  type ReportWorkbookDataModel,
} from "@/lib/excelTemplateExportMock"
import { FR_01_DEFAULT_MODEL } from "@/pages/reports/fr01/fr01ReportModel"
import { resolveFr04ReportBundle } from "@/pages/reports/fr04/fr04InventoryModel"
import { resolveFr05ReportBundle } from "@/pages/reports/fr05/fr05InventoryModel"
import type { ReportsHeaderLiveData } from "@/pages/reports/useReportsHeaderLiveData"

const MASTER_TEMPLATE_URL = `${import.meta.env.BASE_URL}templates/report-pack-template.xlsx`

type CellRef = { row: number; col: number }

function columnToIndex(colLetters: string): number {
  let idx = 0
  for (const ch of colLetters.toUpperCase()) {
    idx = idx * 26 + (ch.charCodeAt(0) - 64)
  }
  return idx
}

function parseCellAddress(address: string): CellRef {
  const m = /^([A-Za-z]+)(\d+)$/.exec(address.trim())
  if (!m) throw new Error(`Invalid cell address: ${address}`)
  return { col: columnToIndex(m[1]), row: Number(m[2]) }
}

function toExcelCellValue(v: ExcelCellPrimitive): ExcelJS.CellValue {
  return v == null ? "" : v
}

function applyCells(workbook: ExcelJS.Workbook, cells: ReadonlyArray<{ sheetName: string; cell: string; value: ExcelCellPrimitive }>) {
  for (const w of cells) {
    const sheet = workbook.getWorksheet(w.sheetName) ?? workbook.addWorksheet(w.sheetName)
    sheet.getCell(w.cell).value = toExcelCellValue(w.value)
  }
}

function applyTables(
  workbook: ExcelJS.Workbook,
  tables: ReadonlyArray<{ sheetName: string; startCell: string; rows: ReadonlyArray<ReadonlyArray<ExcelCellPrimitive>> }>,
) {
  for (const t of tables) {
    const sheet = workbook.getWorksheet(t.sheetName) ?? workbook.addWorksheet(t.sheetName)
    const start = parseCellAddress(t.startCell)
    t.rows.forEach((rowData, r) => {
      rowData.forEach((val, c) => {
        sheet.getCell(start.row + r, start.col + c).value = toExcelCellValue(val)
      })
    })
  }
}

function triggerBrowserDownload(buffer: ArrayBuffer, fileName: string) {
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

async function tryLoadMasterTemplate(workbook: ExcelJS.Workbook): Promise<boolean> {
  try {
    const res = await fetch(MASTER_TEMPLATE_URL)
    if (!res.ok) return false
    const buf = await res.arrayBuffer()
    await workbook.xlsx.load(buf)
    return true
  } catch {
    return false
  }
}

export function createWorkbookModelFromLiveData(input: {
  live: ReportsHeaderLiveData
  reportYear?: number
}): ReportWorkbookDataModel {
  const { live } = input
  const year = input.reportYear ?? new Date().getFullYear() + 543
  return {
    reportYear: year,
    organization: {
      name: live.organizationName,
      agencyName: live.agencyName,
      address: "",
    },
    fr01: {
      ...FR_01_DEFAULT_MODEL,
      organizationName: live.organizationName,
      nameOfAgency: live.agencyName,
      date: live.preparedDate,
    },
    fr04: resolveFr04ReportBundle(live.fr04Bundle),
    fr05: resolveFr05ReportBundle(live.fr05Bundle),
  }
}

export async function exportAllReportsToSingleWorkbook(input: {
  model: ReportWorkbookDataModel
  fileName?: string
  codes?: ReadonlyArray<ReportTemplateCode>
}): Promise<{ usedMasterTemplate: boolean }> {
  const workbook = new ExcelJS.Workbook()
  const usedMasterTemplate = await tryLoadMasterTemplate(workbook)
  const codes = input.codes ?? REPORT_TEMPLATE_CODES

  for (const code of codes) {
    const plan = buildExcelWritePlan({ code, model: input.model })
    applyCells(workbook, plan.cells)
    applyTables(workbook, plan.tables)
  }

  const out = await workbook.xlsx.writeBuffer()
  triggerBrowserDownload(out as ArrayBuffer, input.fileName ?? `report-pack-${input.model.reportYear}.xlsx`)
  return { usedMasterTemplate }
}
