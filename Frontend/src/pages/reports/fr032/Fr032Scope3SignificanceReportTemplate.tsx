import { Alert, Collapse, Input, Table, Typography } from "antd"
import type { ColumnsType } from "antd/es/table"
import { useMemo } from "react"
import type { Fr032CategoryAssessmentRow } from "@/pages/reports/fr032/fr032Scope3SignificanceConstants"
import {
  mergeFr032Scope3SignificanceModel,
  type Fr032Scope3SignificanceViewModel,
} from "@/pages/reports/fr032/fr032Scope3SignificanceModel"

const shell =
  "bg-[#f8f9fa] pb-4 pt-0 font-[family-name:var(--font-fr02,'TH_Sarabun_New','Sarabun',sans-serif)] text-base text-black"

const card = "mt-5 w-full border border-black bg-white px-3 py-5 sm:px-5 sm:py-6"

/** คอลัมน์ที่ตรวจว่า "ทั้งคอลัมน์ไม่มีข้อมูล" เพื่อขีดหัวตาราง */
const COLUMN_FILL_KEYS = [
  "sourceOfGhg",
  "magnitude",
  "levelOfInfluence",
  "riskOrOpportunity",
  "sectorGuidance",
  "outsourcing",
  "employeeEngagement",
  "remark",
] as const satisfies readonly (keyof Fr032CategoryAssessmentRow)[]

type AssessmentColumnKey = (typeof COLUMN_FILL_KEYS)[number]

function poMarkVisual(value: string): "tick" | "cross" | "empty" {
  const t = value.trim()
  if (!t) return "empty"
  if (t === "ü" || t === "Ü") return "tick"
  if (t.toUpperCase() === "P") return "tick"
  if (t.toUpperCase() === "O") return "cross"
  return "empty"
}

function isFilledAssessmentCell(key: AssessmentColumnKey, value: string): boolean {
  if (key === "remark") return value.trim() !== ""
  if (
    key === "sourceOfGhg" ||
    key === "sectorGuidance" ||
    key === "outsourcing" ||
    key === "employeeEngagement"
  ) {
    return poMarkVisual(value) !== "empty"
  }
  return value.trim() !== ""
}

function computeAllEmptyColumnKeys(rows: readonly Fr032CategoryAssessmentRow[]): Set<AssessmentColumnKey> {
  const empty = new Set<AssessmentColumnKey>()
  for (const col of COLUMN_FILL_KEYS) {
    const anyFilled = rows.some((r) => isFilledAssessmentCell(col, String(r[col])))
    if (!anyFilled) empty.add(col)
  }
  return empty
}

function columnTitleNode(title: string, columnKey: AssessmentColumnKey, allEmpty: Set<AssessmentColumnKey>) {
  const strike = allEmpty.has(columnKey)
  return (
    <span
      className={
        strike
          ? "text-neutral-500 line-through decoration-black/40 decoration-2 opacity-80"
          : undefined
      }
    >
      {title}
    </span>
  )
}

function TickCrossCell({ value }: { value: string }) {
  const v = poMarkVisual(value)
  if (v === "tick") {
    return (
      <span className="text-xl font-bold leading-none text-emerald-700" aria-label="ใช่">
        ✓
      </span>
    )
  }
  if (v === "cross") {
    return (
      <span className="text-xl font-bold leading-none text-red-700/90" aria-label="ไม่ใช่">
        ✗
      </span>
    )
  }
  return (
    <span
      className="inline-block min-w-[1.5rem] text-center text-sm text-neutral-400 line-through decoration-neutral-400/70 opacity-70"
      aria-label="ไม่ได้กรอก"
    >
      —
    </span>
  )
}

function NumericOrTextCell({ value }: { value: string }) {
  const t = value.trim()
  if (!t) {
    return (
      <span className="inline-block min-w-[1.5rem] text-center text-sm text-neutral-400 line-through decoration-neutral-400/70 opacity-70">
        —
      </span>
    )
  }
  return <span>{value}</span>
}

function buildColumns(
  allEmptyColumns: Set<AssessmentColumnKey>,
): ColumnsType<Fr032CategoryAssessmentRow> {
  return [
    {
      title: "No",
      dataIndex: "no",
      key: "no",
      width: 52,
      align: "center",
      fixed: "left",
    },
    {
      title: "Category",
      dataIndex: "category",
      key: "category",
      width: 280,
      fixed: "left",
      render: (t: string) => <span className="text-[13px] leading-snug sm:text-sm">{t}</span>,
    },
    {
      title: columnTitleNode("Source of GHG", "sourceOfGhg", allEmptyColumns),
      dataIndex: "sourceOfGhg",
      key: "sourceOfGhg",
      width: 88,
      align: "center",
      render: (v: string) => <TickCrossCell value={v} />,
    },
    {
      title: columnTitleNode("Magnitude", "magnitude", allEmptyColumns),
      dataIndex: "magnitude",
      key: "magnitude",
      width: 88,
      align: "center",
      render: (v: string) => <NumericOrTextCell value={v} />,
    },
    {
      title: columnTitleNode("Level of influence (Reduction of potential)", "levelOfInfluence", allEmptyColumns),
      dataIndex: "levelOfInfluence",
      key: "levelOfInfluence",
      width: 120,
      align: "center",
      render: (v: string) => <NumericOrTextCell value={v} />,
    },
    {
      title: columnTitleNode("Opportunity or Risk", "riskOrOpportunity", allEmptyColumns),
      dataIndex: "riskOrOpportunity",
      key: "riskOrOpportunity",
      width: 100,
      align: "center",
      render: (v: string) => <NumericOrTextCell value={v} />,
    },
    {
      title: columnTitleNode("Sector Guidance", "sectorGuidance", allEmptyColumns),
      dataIndex: "sectorGuidance",
      key: "sectorGuidance",
      width: 96,
      align: "center",
      render: (v: string) => <TickCrossCell value={v} />,
    },
    {
      title: columnTitleNode("Outsourcing", "outsourcing", allEmptyColumns),
      dataIndex: "outsourcing",
      key: "outsourcing",
      width: 96,
      align: "center",
      render: (v: string) => <TickCrossCell value={v} />,
    },
    {
      title: columnTitleNode("Employee engagement", "employeeEngagement", allEmptyColumns),
      dataIndex: "employeeEngagement",
      key: "employeeEngagement",
      width: 112,
      align: "center",
      render: (v: string) => <TickCrossCell value={v} />,
    },
    {
      title: columnTitleNode("Remark", "remark", allEmptyColumns),
      dataIndex: "remark",
      key: "remark",
      width: 220,
      render: (t: string) => <NumericOrTextCell value={t} />,
    },
  ]
}

export type Fr032Scope3SignificanceReportTemplateProps = {
  model?: Partial<Fr032Scope3SignificanceViewModel>
}

export function Fr032Scope3SignificanceReportTemplate({
  model: modelProp,
}: Fr032Scope3SignificanceReportTemplateProps) {
  const model = useMemo(() => mergeFr032Scope3SignificanceModel(modelProp), [modelProp])

  const allEmptyColumns = useMemo(
    () => computeAllEmptyColumnKeys(model.categoryRows),
    [model.categoryRows],
  )

  const columns = useMemo(() => buildColumns(allEmptyColumns), [allEmptyColumns])

  const criteriaCollapseItems = useMemo(
    () =>
      model.criteriaRows.map((row, index) => ({
        key: row.key,
        label: (
          <span className="flex min-w-0 items-center gap-3 py-0.5">
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-sm font-bold text-teal-900 shadow-sm ring-1 ring-slate-200/70"
              aria-hidden
            >
              {index + 1}
            </span>
            <Typography.Text className="!mb-0 !text-[15px] !font-semibold !leading-snug !text-slate-900">
              {row.term}
            </Typography.Text>
          </span>
        ),
        children: (
          <div className="border-t border-slate-100/90 bg-white px-1 pb-1 pt-3 text-[15px] leading-[1.65] text-slate-600 sm:px-2 sm:pb-2 sm:pt-3.5">
            {row.description}
          </div>
        ),
      })),
    [model.criteriaRows],
  )

  const criteriaDefaultOpenKeys = useMemo(() => model.criteriaRows.map((r) => r.key), [model.criteriaRows])

  return (
    <div className={shell}>
      <div className={card}>
        <Typography.Title level={3} className="!mb-4 !mt-0 !text-lg !font-semibold !leading-snug text-black sm:!text-xl">
          {model.formTitle}
        </Typography.Title>

        <Alert
          type="info"
          showIcon
          message={<span className="font-semibold text-teal-900">คำอธิบาย</span>}
          description={
            <span className="text-sm leading-relaxed text-slate-800 sm:text-base">{model.intro}</span>
          }
          className="mb-6 text-left [&_.ant-alert-message]:!mb-1 [&_.ant-alert-description]:!text-slate-800"
        />

        <Typography.Title level={4} className="!mb-3 !mt-0 !text-base !font-semibold text-black sm:!text-lg pt-4">
          {model.criteriaSectionTitle}
        </Typography.Title>

        <Collapse
          bordered
          defaultActiveKey={criteriaDefaultOpenKeys}
          className="mb-8 overflow-hidden rounded-xl border border-slate-200/95 bg-white shadow-sm ring-1 ring-slate-100/90 [&_.ant-collapse-content]:!border-t-0 [&_.ant-collapse-content-box]:!p-0 [&_.ant-collapse-header]:!items-center [&_.ant-collapse-header]:!min-h-[3.25rem] [&_.ant-collapse-header]:!bg-gradient-to-r [&_.ant-collapse-header]:!from-[#e8f4e4] [&_.ant-collapse-header]:!to-[#f0f7ed] [&_.ant-collapse-header]:!px-3 [&_.ant-collapse-header]:!py-2.5 sm:[&_.ant-collapse-header]:!px-4 [&_.ant-collapse-item]:!border-slate-200/90 [&_.ant-collapse-item:last-child]:!border-b-0"
          items={criteriaCollapseItems}
        />

        <Typography.Paragraph type="secondary" className="!mb-6 !text-xs !leading-relaxed sm:!text-sm">
          {model.criteriaSource}
        </Typography.Paragraph>

        <Typography.Text strong className="mb-2 block text-sm text-slate-800 sm:text-base">
          ตารางประเมินตามหมวด Scope 3
        </Typography.Text>

        <div className="overflow-x-auto rounded-lg border border-black">
          <Table<Fr032CategoryAssessmentRow>
            className="fr032-scope3-table min-w-[920px] [&_.ant-table]:text-black [&_.ant-table-thead>tr>th]:!bg-[#92cd8c] [&_.ant-table-thead>tr>th]:!text-center [&_.ant-table-thead>tr>th]:!font-semibold [&_.ant-table-thead>tr>th]:!text-black [&_.ant-table-thead>tr>th]:!border-black/80 [&_.ant-table-tbody>tr>td]:!border-black/40"
            columns={columns}
            dataSource={[...model.categoryRows]}
            pagination={false}
            size="small"
            rowKey="key"
            scroll={{ x: "max-content" }}
          />
        </div>

        <div className="mt-8 border-t border-slate-200 pt-6">
          <Typography.Title level={5} className="!mb-3 !mt-0 !text-sm !font-semibold text-black sm:!text-base">
            {model.criteriaNoteTitle}
          </Typography.Title>
          <Input.TextArea
            readOnly
            value={model.criteriaExplanationFromDb}
            placeholder="รอข้อมูลจากระบบ…"
            rows={5}
            className="!resize-none !rounded-lg !border-slate-200 !bg-slate-50/90 !font-[family-name:var(--font-fr02,'TH_Sarabun_New','Sarabun',sans-serif)] !text-base !leading-relaxed !text-slate-800"
            aria-label="อธิบายหลักเกณฑ์ในการประเมินความมีนัยสำคัญ (อ่านอย่างเดียว)"
          />
          <Typography.Paragraph className="!mb-0 !mt-4 !text-sm !leading-relaxed text-slate-800 sm:!text-base">
            {model.selfAssessmentNote}
          </Typography.Paragraph>
        </div>
      </div>
    </div>
  )
}
