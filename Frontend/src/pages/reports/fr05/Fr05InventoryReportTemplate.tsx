import { Alert, Button, Col, Row, Space, Spin, Typography } from "antd"
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Title,
  Tooltip,
  type ChartOptions,
} from "chart.js"
import { useMemo, useState, type ReactNode } from "react"
import { Bar } from "react-chartjs-2"

import { DATA_NOT_FOUND_LABEL } from "@/lib/dataNotFound"
import { exportFr05ToExcelFile, buildFr05ExcelExportPayload } from "@/pages/reports/fr05/fr05InventoryExcelExport"
import {
  type Fr05ReportBundle,
  fr05CarbonRows,
  fr05MainTableRows,
  fr05PeriodFromSection,
  fr05ScopeBarValues,
  resolveFr05ReportBundle,
} from "@/pages/reports/fr05/fr05InventoryModel"

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const shell =
  "bg-[#f8f9fa] pb-4 pt-0 font-[family-name:var(--font-fr02,'TH_Sarabun_New','Sarabun',sans-serif)] text-base text-black"

const thTeal = "border border-slate-800/90 bg-[#0f766e] px-2 py-2 text-center text-[15px] font-semibold text-white"
const tdCell = "border border-slate-800/90 px-2 py-1.5 text-[15px] align-middle"
const tdTotal = `${tdCell} bg-slate-300/90 font-semibold`
const tdCarbon = `${tdCell} bg-[#d8f6d4]`

/** เดียวกับ Fr_03.1 (`Fr02OrganizationMapReportTemplate` — showCompletionFooter) */
const footerLabel =
  "flex min-h-[52px] items-center justify-center border border-black bg-[#1c4d7e] px-2 py-3 text-center text-sm font-bold text-white sm:text-base"
const footerValue =
  "flex min-h-[52px] items-center justify-center border border-black bg-[#d9e4ef] px-3 py-3 text-center text-sm text-black sm:text-base"

function fr05RowHasTableCells(r: string[]): boolean {
  return [1, 2, 3, 4].some((i) => (r[i] ?? "").trim() !== "")
}

function fr05RowHasCarbonCells(r: string[]): boolean {
  return [1, 3, 4, 5].some((i) => (r[i] ?? "").trim() !== "")
}

function Fr05ScopeBarChart({ labels, values }: { labels: string[]; values: number[] }) {
  const data = useMemo(
    () => ({
      labels,
      datasets: [
        {
          data: values,
          backgroundColor: "#5c9bd5",
          borderColor: "#3a7ab8",
          borderWidth: 1,
          barPercentage: 0.55,
        },
      ],
    }),
    [labels, values],
  )

  const options = useMemo<ChartOptions<"bar">>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        title: {
          display: true,
          text: "tonCO2-eq",
          font: { size: 18, weight: "normal" },
          color: "#111",
        },
        tooltip: { enabled: true },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { size: 12 }, maxRotation: 45, minRotation: 0 },
        },
        y: {
          beginAtZero: true,
          suggestedMax: Math.max(5, ...values) * 1.15,
          grid: { color: "#ccc" },
          ticks: { font: { size: 11 } },
        },
      },
    }),
    [values],
  )

  return (
    <div className="flex h-full min-h-[220px] w-full flex-1 flex-col justify-center rounded-md border border-slate-300 bg-white p-2 shadow-sm">
      <div className="min-h-[200px] flex-1">
        <Bar data={data} options={options} />
      </div>
    </div>
  )
}

function Fr05ComparisonBarChart({
  labels,
  baseValues,
  currentValues,
}: {
  labels: string[]
  baseValues: number[]
  currentValues: number[]
}) {
  const data = useMemo(
    () => ({
      labels,
      datasets: [
        {
          label: "ปีฐาน",
          data: baseValues,
          backgroundColor: "#e53935",
          borderColor: "#c62828",
          borderWidth: 1,
          barPercentage: 0.65,
        },
        {
          label: "ปีปัจจุบัน",
          data: currentValues,
          backgroundColor: "#9e9e9e",
          borderColor: "#757575",
          borderWidth: 1,
          barPercentage: 0.65,
        },
      ],
    }),
    [labels, baseValues, currentValues],
  )

  const maxV = Math.max(1, ...baseValues, ...currentValues)
  const options = useMemo<ChartOptions<"bar">>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: "top",
          labels: { font: { size: 12 }, boxWidth: 14 },
        },
        title: {
          display: true,
          text: "เปรียบเทียบ",
          font: { size: 18, weight: "normal" },
          color: "#111",
        },
        tooltip: { enabled: true },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { size: 11 } },
        },
        y: {
          beginAtZero: true,
          suggestedMax: maxV * 1.12,
          grid: { color: "#ccc" },
          ticks: { font: { size: 11 } },
        },
      },
    }),
    [maxV],
  )

  return (
    <div className="flex h-full min-h-[240px] w-full flex-1 flex-col justify-center rounded-md border border-slate-300 bg-white p-2 shadow-sm">
      <div className="min-h-[220px] flex-1">
        <Bar data={data} options={options} />
      </div>
    </div>
  )
}

function Fr05MainTable({ rows }: { rows: string[][] }) {
  if (rows.length === 0) return null
  const head = rows[0]
  const body = rows.slice(1).filter(fr05RowHasTableCells)
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[480px] border-collapse text-black">
        <thead>
          <tr>
            {head.slice(1, 5).map((h, i) => (
              <th key={i} className={thTeal}>
                {h || "\u00a0"}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {body.map((r, ri) => {
            const label = (r[1] || "").trim()
            const isTotal = label.includes("รวม Scope")
            const c2 = r[2] || ""
            const c3 = r[3] || ""
            const c4 = r[4] || ""
            const td = isTotal ? tdTotal : tdCell
            return (
              <tr key={ri}>
                <td className={td}>{label || "\u00a0"}</td>
                <td className={`${td} text-end`}>{c2 || "\u00a0"}</td>
                <td className={`${td} text-end`}>{c3 || "\u00a0"}</td>
                <td className={`${td} text-end`}>{c4 || "\u00a0"}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function Fr05CarbonTable({ rows }: { rows: string[][] }) {
  const filtered = rows.filter(fr05RowHasCarbonCells)
  if (filtered.length === 0) return null
  return (
    <div className="mt-2 overflow-x-auto">
      <table className="w-full min-w-[480px] border-collapse">
        <tbody>
          {filtered.map((r, ri) => (
            <tr key={ri}>
              <td className={`${tdCarbon} w-[44%] font-medium`}>{r[1] || "\u00a0"}</td>
              <td className={`${tdCarbon} text-end`}>{r[3] || "\u00a0"}</td>
              <td className={tdCarbon}>{[r[4], r[5]].filter(Boolean).join(" ") || "\u00a0"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Fr05SectionBlock({
  section,
  chartSlot,
}: {
  section: Fr05ReportBundle["current"]
  chartSlot: ReactNode
}) {
  const period = fr05PeriodFromSection(section)
  const main = fr05MainTableRows(section)
  const carbon = fr05CarbonRows(section)

  return (
    <section className="mb-6 rounded-lg border border-slate-300/80 bg-white p-3 shadow-sm sm:p-4">
      <div className="mb-3 flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-slate-200 pb-2">
        <Typography.Text strong className="!text-lg">
          {period.title}
        </Typography.Text>
        <Typography.Text type="secondary" className="!text-base">
          {period.range}
        </Typography.Text>
      </div>
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(260px,36%)] lg:items-center lg:gap-5">
        <div className="min-w-0">
          <Fr05MainTable rows={main} />
          <Fr05CarbonTable rows={carbon} />
        </div>
        <div className="flex min-h-0 w-full items-center justify-center self-stretch">
          {chartSlot}
        </div>
      </div>
    </section>
  )
}

function Fr05CompletionFooter({ footer }: { footer: Fr05ReportBundle["footer"] }) {
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
        {footer.completedDate || "\u00a0"}
      </Col>
    </Row>
  )
}

export type Fr05InventoryReportTemplateProps = {
  /** แทนที่ชุดข้อมูลจาก parse — รูปแบบเดียวกับ `fr05ReportBundle.json` */
  bundle?: Fr05ReportBundle | null
  tableLoading?: boolean
}

/**
 * Fr_05 — อ้างอิงเลย์เอาต์จากรายงาน Excel (ปีปัจจุบัน / ปีฐาน + กราฟ)
 * รีเจน JSON: `node scripts/parse-fr05-table.mjs`
 */
export function Fr05InventoryReportTemplate({
  bundle: bundleProp,
  tableLoading = false,
}: Fr05InventoryReportTemplateProps) {
  const bundle = useMemo(() => resolveFr05ReportBundle(bundleProp ?? null), [bundleProp])
  const usingApi = Boolean(bundleProp?.current?.rows?.length && bundleProp?.base?.rows?.length)
  const showNotFound = bundleProp === null && !tableLoading
  const showFooter = Boolean(bundleProp) && !tableLoading
  const [exportErr, setExportErr] = useState<string | null>(null)

  const currentBars = useMemo(() => fr05ScopeBarValues(bundle.current), [bundle.current])
  const baseBars = useMemo(() => fr05ScopeBarValues(bundle.base), [bundle.base])
  const labels = useMemo(() => currentBars.map((b) => b.label), [currentBars])
  const currentVals = useMemo(() => currentBars.map((b) => b.value), [currentBars])
  const baseVals = useMemo(() => baseBars.map((b) => b.value), [baseBars])

  return (
    <div className={shell}>
      <div className="mt-5 w-full min-w-0 border border-black bg-white px-3 py-4 sm:px-5 sm:py-5">
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <Typography.Paragraph type="secondary" className="!mb-0 !text-xs sm:!text-sm">
            {usingApi
              ? "แสดงข้อมูลจาก API — รูปแบบอ้างอิงรายงาน Fr_05 (ตาราง + กราฟ)"
              : "ข้อมูลจาก `fr_05.htm` (parse เป็น JSON) — ส่ง prop `bundle` เพื่อแทนที่เมื่อมี API"}
          </Typography.Paragraph>
          <Space wrap size="small">
            <Button
              type="default"
              disabled={!bundleProp}
              onClick={async () => {
                setExportErr(null)
                try {
                  await exportFr05ToExcelFile(buildFr05ExcelExportPayload(bundle))
                } catch (e) {
                  setExportErr(e instanceof Error ? e.message : "ส่งออกไม่สำเร็จ")
                }
              }}
            >
              ส่งออก Excel
            </Button>
          </Space>
        </div>

        {exportErr ? (
          <Alert type="warning" showIcon className="mb-3" message={exportErr} closable onClose={() => setExportErr(null)} />
        ) : null}

        <Spin spinning={tableLoading}>
          {tableLoading ? (
            <div className="min-h-[240px]" aria-hidden />
          ) : showNotFound ? (
            <Alert type="warning" showIcon message={DATA_NOT_FOUND_LABEL} className="mb-2" />
          ) : (
            <>
              <Fr05SectionBlock
                section={bundle.current}
                chartSlot={<Fr05ScopeBarChart labels={labels} values={currentVals} />}
              />
              <Fr05SectionBlock
                section={bundle.base}
                chartSlot={
                  <Fr05ComparisonBarChart labels={labels} baseValues={baseVals} currentValues={currentVals} />
                }
              />
            </>
          )}
        </Spin>
      </div>
      {showFooter ? <Fr05CompletionFooter footer={bundle.footer} /> : null}
    </div>
  )
}
