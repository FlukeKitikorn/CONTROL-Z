import type { Fr01ReportViewModel } from "@/pages/reports/fr01/fr01ReportModel"
import { FR_01_DEFAULT_MODEL } from "@/pages/reports/fr01/fr01ReportModel"
import type { Fr04ReportBundle } from "@/pages/reports/fr04/fr04InventoryModel"
import { FR04_REPORT_DEFAULT_BUNDLE } from "@/pages/reports/fr04/fr04InventoryModel"
import type { Fr05ReportBundle } from "@/pages/reports/fr05/fr05InventoryModel"
import { FR05_REPORT_DEFAULT_BUNDLE } from "@/pages/reports/fr05/fr05InventoryModel"
import type { ReportTemplateCode } from "@/lib/reportExportCatalog"

export type ExcelCellPrimitive = string | number | boolean | Date | null

export type ExcelCellWrite = {
  sheetName: string
  cell: string
  value: ExcelCellPrimitive
}

export type ExcelRowWrite = {
  sheetName: string
  startCell: string
  rows: ReadonlyArray<ReadonlyArray<ExcelCellPrimitive>>
}

/**
 * โครงข้อมูลกลางจากระบบ (DB/API) ก่อน map ลงเทมเพลตจริง
 * เน้น business meaning ไม่ผูกติด cell
 */
export type ReportWorkbookDataModel = {
  reportYear: number
  organization: {
    name: string
    agencyName: string
    address: string
  }
  fr01: Fr01ReportViewModel
  fr04: Fr04ReportBundle
  fr05: Fr05ReportBundle
}

/**
 * สเปคของเอกสารต้นแบบแต่ละชุด (Fr_xx) ที่จะส่งออกทั้งไฟล์เดียว
 * สามารถมีหลายชีตต่อ report code ได้
 */
export type ReportTemplateWorkbookSpec = {
  code: ReportTemplateCode
  templateFileName: string
  sheets: ReadonlyArray<{
    sheetName: string
    cellWrites: (model: ReportWorkbookDataModel) => ReadonlyArray<ExcelCellWrite>
    rowWrites?: (model: ReportWorkbookDataModel) => ReadonlyArray<ExcelRowWrite>
  }>
}

/**
 * MOCK: ไฟล์ข้อมูลตัวอย่างจากระบบ
 * ใช้ทดสอบ flow export ด้วย exceljs โดยยังไม่ต้องต่อ API จริง
 */
export const MOCK_REPORT_WORKBOOK_MODEL: ReportWorkbookDataModel = {
  reportYear: 2568,
  organization: {
    name: "CONTROL-Z Demo Manufacturing Co., Ltd.",
    agencyName: "Sustainability and Climate Team",
    address: "99/9 Demo Industrial Estate, Bangkok 10110",
  },
  fr01: {
    ...FR_01_DEFAULT_MODEL,
    organizationName: "CONTROL-Z Demo Manufacturing Co., Ltd.",
    nameOfAgency: "Sustainability and Climate Team",
    date: "31/12/2568",
    period: "01/01/2568 - 31/12/2568",
    value: "12,450",
    unit: "tCO2e",
    addressString: "99/9 Demo Industrial Estate, Bangkok 10110",
  },
  fr04: FR04_REPORT_DEFAULT_BUNDLE,
  fr05: FR05_REPORT_DEFAULT_BUNDLE,
}

function fr04Rows(model: ReportWorkbookDataModel): ReadonlyArray<ReadonlyArray<ExcelCellPrimitive>> {
  return model.fr04.rows.map((r) => r.map((c) => c ?? ""))
}

function fr05CurrentRows(model: ReportWorkbookDataModel): ReadonlyArray<ReadonlyArray<ExcelCellPrimitive>> {
  return model.fr05.current.rows.map((r) => r.map((c) => c ?? ""))
}

function fr05BaseRows(model: ReportWorkbookDataModel): ReadonlyArray<ReadonlyArray<ExcelCellPrimitive>> {
  return model.fr05.base.rows.map((r) => r.map((c) => c ?? ""))
}

/**
 * MOCK mapping จาก business data -> cell address
 * หมายเหตุ:
 * - ตั้งใจ map เฉพาะจุดหลักที่มาจากระบบ
 * - style/merge/width ต้องคงไว้ในไฟล์ template ต้นฉบับ
 */
export const REPORT_TEMPLATE_WORKBOOK_SPECS: readonly ReportTemplateWorkbookSpec[] = [
  {
    code: "Fr_01",
    templateFileName: "Fr_01_template.xlsx",
    sheets: [
      {
        sheetName: "Fr_01",
        cellWrites: (model) => [
          { sheetName: "Fr_01", cell: "C5", value: model.organization.name },
          { sheetName: "Fr_01", cell: "C6", value: model.organization.agencyName },
          { sheetName: "Fr_01", cell: "C7", value: model.fr01.date },
          { sheetName: "Fr_01", cell: "C8", value: model.fr01.period },
          { sheetName: "Fr_01", cell: "C9", value: model.fr01.value },
          { sheetName: "Fr_01", cell: "E9", value: model.fr01.unit },
          { sheetName: "Fr_01", cell: "C10", value: model.organization.address },
        ],
      },
    ],
  },
  {
    code: "Fr_02",
    templateFileName: "Fr_02_template.xlsx",
    sheets: [
      {
        sheetName: "Fr_02",
        cellWrites: (model) => [
          { sheetName: "Fr_02", cell: "C5", value: model.organization.name },
          { sheetName: "Fr_02", cell: "C6", value: model.reportYear },
        ],
      },
    ],
  },
  {
    code: "Fr_03.1",
    templateFileName: "Fr_03_1_template.xlsx",
    sheets: [
      {
        sheetName: "Fr_03.1",
        cellWrites: (model) => [
          { sheetName: "Fr_03.1", cell: "C5", value: model.organization.name },
          { sheetName: "Fr_03.1", cell: "C6", value: model.reportYear },
        ],
      },
    ],
  },
  {
    code: "Fr_03.2",
    templateFileName: "Fr_03_2_template.xlsx",
    sheets: [
      {
        sheetName: "Fr_03.2",
        cellWrites: (model) => [
          { sheetName: "Fr_03.2", cell: "C5", value: model.organization.name },
          { sheetName: "Fr_03.2", cell: "C6", value: model.reportYear },
        ],
      },
    ],
  },
  {
    code: "Fr_04.1",
    templateFileName: "Fr_04_1_template.xlsx",
    sheets: [
      {
        sheetName: "Fr_04.1",
        cellWrites: (model) => [
          { sheetName: "Fr_04.1", cell: "C5", value: model.organization.name },
          { sheetName: "Fr_04.1", cell: "C6", value: model.reportYear },
          { sheetName: "Fr_04.1", cell: "C45", value: model.fr04.footer.preparedBy },
          { sheetName: "Fr_04.1", cell: "F45", value: model.fr04.footer.completedDate },
        ],
        rowWrites: (model) => [
          {
            sheetName: "Fr_04.1",
            startCell: "A12",
            rows: fr04Rows(model),
          },
        ],
      },
    ],
  },
  {
    code: "Fr_04.2",
    templateFileName: "Fr_04_2_template.xlsx",
    sheets: [
      {
        sheetName: "Fr_04.2",
        cellWrites: (model) => [
          { sheetName: "Fr_04.2", cell: "C5", value: model.organization.name },
          { sheetName: "Fr_04.2", cell: "C6", value: model.reportYear },
          { sheetName: "Fr_04.2", cell: "C45", value: model.fr04.footer.preparedBy },
          { sheetName: "Fr_04.2", cell: "F45", value: model.fr04.footer.completedDate },
        ],
        rowWrites: (model) => [
          {
            sheetName: "Fr_04.2",
            startCell: "A12",
            rows: fr04Rows(model),
          },
        ],
      },
    ],
  },
  {
    code: "Fr_05",
    templateFileName: "Fr_05_template.xlsx",
    sheets: [
      {
        sheetName: "Fr_05_Current",
        cellWrites: (model) => [
          { sheetName: "Fr_05_Current", cell: "C5", value: model.organization.name },
          { sheetName: "Fr_05_Current", cell: "C6", value: model.reportYear },
        ],
        rowWrites: (model) => [
          {
            sheetName: "Fr_05_Current",
            startCell: "A10",
            rows: fr05CurrentRows(model),
          },
        ],
      },
      {
        sheetName: "Fr_05_Base",
        cellWrites: (model) => [
          { sheetName: "Fr_05_Base", cell: "C5", value: model.organization.name },
          { sheetName: "Fr_05_Base", cell: "C6", value: model.reportYear - 1 },
        ],
        rowWrites: (model) => [
          {
            sheetName: "Fr_05_Base",
            startCell: "A10",
            rows: fr05BaseRows(model),
          },
        ],
      },
    ],
  },
] as const

export function reportTemplateSpecByCode(code: ReportTemplateCode): ReportTemplateWorkbookSpec | undefined {
  return REPORT_TEMPLATE_WORKBOOK_SPECS.find((x) => x.code === code)
}

/**
 * flatten เป็น list ของงานเขียน cell/row พร้อมให้ exceljs ใช้งานทันที
 */
export function buildExcelWritePlan(input: {
  code: ReportTemplateCode
  model?: ReportWorkbookDataModel
}): {
  templateFileName: string
  cells: ReadonlyArray<ExcelCellWrite>
  tables: ReadonlyArray<ExcelRowWrite>
} {
  const spec = reportTemplateSpecByCode(input.code)
  if (!spec) {
    throw new Error(`Template spec not found for code: ${input.code}`)
  }
  const model = input.model ?? MOCK_REPORT_WORKBOOK_MODEL
  const cells = spec.sheets.flatMap((s) => s.cellWrites(model))
  const tables = spec.sheets.flatMap((s) => (s.rowWrites ? s.rowWrites(model) : []))
  return { templateFileName: spec.templateFileName, cells, tables }
}
