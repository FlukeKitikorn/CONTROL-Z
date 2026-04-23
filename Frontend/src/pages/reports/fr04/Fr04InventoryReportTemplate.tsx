import { Col, Row, Spin, Typography } from "antd"
import { useMemo } from "react"

import {
  type Fr04ReportBundle,
  fr04BodyRows,
  fr04HeaderRows,
  resolveFr04ReportBundle,
} from "@/pages/reports/fr04/fr04InventoryModel"

const shell =
  "bg-[#f8f9fa] pb-4 pt-0 font-[family-name:var(--font-fr02,'TH_Sarabun_New','Sarabun',sans-serif)] text-base text-black"

/** เดียวกับ Fr_03.1 / Fr_05 */
const footerLabel =
  "flex min-h-[52px] items-center justify-center border border-black bg-[#1c4d7e] px-2 py-3 text-center text-sm font-bold text-white sm:text-base"
const footerValue =
  "flex min-h-[52px] items-center justify-center border border-black bg-[#d9e4ef] px-3 py-3 text-center text-sm text-black sm:text-base"

const thCell =
  "border border-teal-900/35 bg-teal-700 px-1.5 py-2 text-center text-[10px] font-semibold leading-tight text-white sm:px-2 sm:text-[11px]"

function Fr04CompletionFooter({ footer }: { footer: Fr04ReportBundle["footer"] }) {
  return (
    <Row gutter={0} className="mt-2 w-full">
      <Col span={3} className={footerLabel}>
        จัดทำโดย
      </Col>
      <Col span={13} className={footerValue}>
        {footer.preparedBy || "\u00a0"}
      </Col>
      <Col span={4} className={footerLabel}>
        เสร็จสิ้นวันที่
      </Col>
      <Col span={4} className={footerValue}>
        {footer.completedDate?.trim() ? footer.completedDate : "\u00a0"}
      </Col>
    </Row>
  )
}

function isScopeBandRow(row: string[]): boolean {
  return /^ขอบเขต/.test((row[0] || "").trim())
}

function Fr04WideInventoryTable({ bundle }: { bundle: Fr04ReportBundle }) {
  const header = useMemo(() => fr04HeaderRows(bundle), [bundle])
  const body = useMemo(() => fr04BodyRows(bundle), [bundle])
  const colCount = bundle.columnCount || Math.max(1, ...bundle.rows.map((r) => r.length))

  return (
    <div className="overflow-x-auto rounded-md border border-slate-300/90 bg-white shadow-sm">
      <table
        className="w-max min-w-full border-collapse text-black"
        style={{ borderCollapse: "collapse" }}
      >
        <thead>
          {header.map((row, ri) => (
            <tr key={`h-${ri}`}>
              {Array.from({ length: colCount }, (_, ci) => {
                const raw = row[ci] ?? ""
                const isFirst = ci === 0
                return (
                  <td
                    key={ci}
                    className={`${thCell} ${isFirst ? "sticky left-0 z-[4] shadow-[2px_0_6px_rgba(0,0,0,0.08)]" : ""}`}
                  >
                    {raw.trim() ? raw : "\u00a0"}
                  </td>
                )
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {body.map((row, ri) => {
            const scopeBand = isScopeBandRow(row)
            const stripe = ri % 2 === 0
            const rowBg = scopeBand
              ? "bg-emerald-50/95"
              : stripe
                ? "bg-white"
                : "bg-slate-50/80"
            return (
              <tr key={`b-${ri}`} className={rowBg}>
                {Array.from({ length: colCount }, (_, ci) => {
                  const raw = row[ci] ?? ""
                  const isFirst = ci === 0
                  const cellBg = isFirst
                    ? scopeBand
                      ? "bg-emerald-50"
                      : stripe
                        ? "bg-white"
                        : "bg-slate-50"
                    : ""
                  return (
                    <td
                      key={ci}
                      className={`border border-slate-200 px-1 py-1 text-center text-[10px] tabular-nums sm:px-1.5 sm:text-[11px] ${scopeBand ? "font-medium text-emerald-950" : ""} ${isFirst ? `sticky left-0 z-[2] shadow-[2px_0_6px_rgba(0,0,0,0.06)] ${cellBg}` : ""}`}
                    >
                      {raw.trim() ? raw : "\u00a0"}
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export type Fr04InventoryReportVariant = "Fr_04.1" | "Fr_04.2"

export type Fr04InventoryReportTemplateProps = {
  variant: Fr04InventoryReportVariant
  /** Fr_04.2 — ข้อความช่วงปีฐาน (จาก snapshot / API) */
  baseYearLabel?: string
  /** จาก API — ถ้าไม่ส่งหรือว่าง ใช้ข้อมูลจาก parse `fr_04.htm` */
  bundle?: Fr04ReportBundle | null
  tableLoading?: boolean
}

/**
 * Fr_04.1 / Fr_04.2 — ข้อมูลจาก `fr_04.htm` (parse → `fr04ReportBundle.json`)
 * รีเจน: `node scripts/parse-fr04-table.mjs`
 */
export function Fr04InventoryReportTemplate({
  variant,
  baseYearLabel,
  bundle: bundleProp,
  tableLoading = false,
}: Fr04InventoryReportTemplateProps) {
  const isBaseYear = variant === "Fr_04.2"
  const bundle = useMemo(() => resolveFr04ReportBundle(bundleProp ?? null), [bundleProp])
  const usingApi = Boolean(bundleProp?.rows?.length)

  const metaLine = useMemo(() => {
    if (isBaseYear) {
      return "Fr_04.2 — โครงสร้างเดียวกับ Fr_04.1; แสดงช่วงปีฐานจากระบบ"
    }
    return usingApi
      ? "Fr_04.1 — แสดงข้อมูลตารางจาก API"
      : "Fr_04.1 — ข้อมูลจาก `fr_04.htm` (parse เป็น JSON) — ส่ง prop `bundle` เพื่อแทนที่เมื่อมี API"
  }, [isBaseYear, usingApi])

  return (
    <div className={shell}>
      <div className="mt-5 w-full min-w-0 border border-black bg-white px-3 py-4 sm:px-5 sm:py-5">
        <Typography.Paragraph type="secondary" className="!mb-3 !text-xs sm:!text-sm">
          {metaLine}
        </Typography.Paragraph>

        {isBaseYear ? (
          <div className="mb-4 rounded-md border border-blue-200 bg-blue-50/90 px-4 py-2.5 text-sm text-blue-950">
            <span className="font-semibold">ข้อมูลปีฐาน</span>
            <span className="mx-2 text-blue-400">|</span>
            <span>
              {baseYearLabel?.trim() || "ยังไม่มีช่วงปีฐานในระบบ — กรุณาบันทึกช่วงปีฐานในหน้ากรอกข้อมูลก่อน"}
            </span>
          </div>
        ) : null}

        <Spin spinning={tableLoading}>
          <Fr04WideInventoryTable bundle={bundle} />
        </Spin>
      </div>
      <Fr04CompletionFooter footer={bundle.footer} />
    </div>
  )
}
