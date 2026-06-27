import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Title,
  Tooltip,
  type ChartOptions,
} from "chart.js"
import {
  Alert,
  App,
  Button,
  Col,
  Dropdown,
  Empty,
  Row,
  Segmented,
  Space,
  Spin,
  Tag,
  Typography,
} from "antd"
import type { MenuProps } from "antd"
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  DownOutlined,
  DownloadOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  FileTextOutlined,
  FilterOutlined,
  FlagOutlined,
} from "@ant-design/icons"
import { useCallback, useEffect, useMemo, useState } from "react"
import { Bar, Doughnut } from "react-chartjs-2"
import { Link } from "react-router"

import { BaseYearSettingsDrawer } from "@/components/dashboard/BaseYearPanel"
import { DashboardFilterDrawer } from "@/components/dashboard/DashboardFilterDrawer"
import { PageHeader } from "@/components/common/PageHeader"
import { PageHeaderButton } from "@/components/common/PageHeaderButton"
import { ApiError } from "@/lib/api/http"
import { getCalculationLatest } from "@/lib/api/service"
import type { CalculationRunResponse } from "@/lib/api/types"
import { loadCalculationHistory } from "@/lib/calculationHistoryStorage"
import {
  COMPARE_MODE_OPTIONS,
  compareDeltaPercent,
  type CompareMode,
} from "@/lib/dashboardComparisons"
import { DATA_NOT_FOUND_LABEL } from "@/lib/dataNotFound"
import {
  exportDashboardCsv,
  exportDashboardExcel,
  exportDashboardPdf,
  type DashboardExportInput,
} from "@/lib/dashboardExport"
import {
  CONTROL_Z_BASE_YEAR_UPDATED,
  getLatestBaseYearSnapshot,
  getOrganizationStorageId,
  getPreferredBaseYearYear,
} from "@/lib/organizationBaseYearStorage"
import {
  PERIOD_GRANULARITY_OPTIONS,
  getPreferredGranularity,
  setPreferredGranularity,
  type PeriodGranularity,
} from "@/lib/periodGranularity"
import { useAuthStore } from "@/store/useAuthStore"

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Title, Tooltip, Legend)

/** เปิดจากสวิตช์บนหน้า หรือ URL `?mock=1` — เก็บใน session ต่อแท็บ */
const DASHBOARD_MOCK_VIZ_SESSION_KEY = "control-z:dashboard-mock-viz"

function readInitialMockVizFlag(): boolean {
  if (typeof window === "undefined") return false
  if (new URLSearchParams(window.location.search).get("mock") === "1") return true
  try {
    return sessionStorage.getItem(DASHBOARD_MOCK_VIZ_SESSION_KEY) === "1"
  } catch {
    return false
  }
}

/** ชุดตัวเลขจำลองสำหรับทดสอบ KPI / bar / donut / เปรียบเทียบปีฐาน */
function buildDashboardMockCalc(): CalculationRunResponse {
  const scope1 = 2180.5
  const scope2 = 3450.25
  const scope3 = 9820.75
  return {
    ran_at: new Date().toISOString(),
    total_tco2e: scope1 + scope2 + scope3,
    vs_base_year_percent: -9.2,
    scope1_tco2e: scope1,
    scope2_tco2e: scope2,
    scope3_tco2e: scope3,
    source: "mock",
  }
}

const FACILITY_OPTIONS = [
  { value: "all", label: "ทุกสถานที่ / องค์กรรวม" },
  { value: "hq", label: "สำนักงานใหญ่" },
  { value: "plant-a", label: "โรงงาน A" },
  { value: "plant-b", label: "โรงงาน B" },
  { value: "warehouse", label: "คลังสินค้า" },
]

const SCOPE_THEME = {
  s1: "#0f766e",
  s2: "#0d9488",
  s3: "#14b8a6",
  base: "#94a3b8",
} as const

function formatThNumber(n: number, fraction = 0): string {
  return new Intl.NumberFormat("th-TH", {
    maximumFractionDigits: fraction,
    minimumFractionDigits: fraction,
  }).format(n)
}

type TopSourceRow = { name: string; scope: "Scope 1" | "Scope 2" | "Scope 3"; value: number }

function buildTopSources(s1: number, s2: number, s3: number): TopSourceRow[] {
  const pool: TopSourceRow[] = [
    { name: "ไฟฟ้าซื้อมาใช้ (บิลการไฟฟ้า)", scope: "Scope 2", value: s2 * 0.42 },
    { name: "น้ำมันดีเซล — เครื่องกำเนิดไฟ / รถบรรทุก", scope: "Scope 1", value: s1 * 0.35 },
    { name: "ก๊าซธรรมชาติ / LPG — หม้อไอน้ำ", scope: "Scope 1", value: s1 * 0.28 },
    { name: "สินค้าและบริการที่จัดซื้อ (ขาเข้า)", scope: "Scope 3", value: s3 * 0.22 },
    { name: "การเดินทางทางธุรกิจ (เที่ยวบิน/ที่พัก)", scope: "Scope 3", value: s3 * 0.12 },
    { name: "ของเสียจากการดำเนินงาน", scope: "Scope 3", value: s3 * 0.08 },
    { name: "สารทำความเย็น — การรั่วไหลโดยประมาณ", scope: "Scope 1", value: s1 * 0.15 },
  ]
  return [...pool].sort((a, b) => b.value - a.value).slice(0, 6)
}

function scopeBarColor(scope: TopSourceRow["scope"]): string {
  if (scope === "Scope 1") return SCOPE_THEME.s1
  if (scope === "Scope 2") return SCOPE_THEME.s2
  return SCOPE_THEME.s3
}

function baselineScopeValues(
  s1: number,
  s2: number,
  s3: number,
  vsBaseYearPercent: number | null | undefined,
): [number, number, number] {
  if (vsBaseYearPercent != null && Number.isFinite(vsBaseYearPercent) && vsBaseYearPercent !== -100) {
    const factor = 100 / (100 + vsBaseYearPercent)
    return [s1 * factor, s2 * factor, s3 * factor]
  }
  return [s1 * 0.92, s2 * 0.92, s3 * 0.92]
}

type ChartView = "compare" | "sources" | "scope" | "breakdown"

function TrendPill({
  delta,
  label,
  invertGood = true,
}: {
  delta: number | null
  label: string
  invertGood?: boolean
}) {
  if (delta == null) {
    return <span className="dash-trend-pill dash-trend-pill--neutral">{label} —</span>
  }
  const up = delta > 0
  const good = invertGood ? !up : up
  const cls = good ? "dash-trend-pill dash-trend-pill--down" : "dash-trend-pill dash-trend-pill--up"
  return (
    <span className={cls}>
      {up ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
      {up ? "+" : ""}
      {delta.toFixed(1)}% {label}
    </span>
  )
}

function DashScopeMetric({
  title,
  value,
  share,
  accent,
}: {
  title: string
  value: string
  share: number | null
  accent: string
}) {
  return (
    <div className="dash-metric-card flex min-h-[88px] flex-col justify-between p-4">
      <div className="flex items-center justify-between gap-2">
        <Typography.Text className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</Typography.Text>
        <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: accent }} />
      </div>
      <div className="mt-1 text-xl font-bold tabular-nums text-slate-900">{value}</div>
      {share != null ? (
        <Typography.Text type="secondary" className="!text-xs">
          {share.toFixed(1)}% ของรวม
        </Typography.Text>
      ) : (
        <Typography.Text type="secondary" className="!text-xs">
          —
        </Typography.Text>
      )}
    </div>
  )
}

export function DashboardPage() {
  const { message } = App.useApp()
  const authUser = useAuthStore((s) => s.user)
  const orgStorageId = useMemo(() => getOrganizationStorageId(authUser), [authUser])
  const orgIdNum = useMemo(() => {
    const id = authUser?.organization_id
    if (id === undefined || id === null) return null
    const n = typeof id === "number" ? id : Number.parseInt(String(id), 10)
    return Number.isFinite(n) ? n : null
  }, [authUser?.organization_id])

  const yearNow = new Date().getFullYear()
  const [year, setYear] = useState(yearNow)
  const [facility, setFacility] = useState("all")
  const [compareMode, setCompareMode] = useState<CompareMode>("base_year")
  const [granularity, setGranularity] = useState<PeriodGranularity>(() => getPreferredGranularity(orgStorageId))
  const [baseYearTick, setBaseYearTick] = useState(0)
  const [baseYearDrawerOpen, setBaseYearDrawerOpen] = useState(false)
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false)
  const [chartView, setChartView] = useState<ChartView>("compare")
  const [useMockViz, setUseMockViz] = useState(() => readInitialMockVizFlag())

  const [loading, setLoading] = useState(true)
  const [calcError, setCalcError] = useState<string | null>(null)
  const [calc, setCalc] = useState<CalculationRunResponse | null>(null)

  const setMockViz = useCallback((on: boolean) => {
    setUseMockViz(on)
    try {
      if (on) {
        sessionStorage.setItem(DASHBOARD_MOCK_VIZ_SESSION_KEY, "1")
      } else {
        sessionStorage.removeItem(DASHBOARD_MOCK_VIZ_SESSION_KEY)
      }
    } catch {
      /* ignore */
    }
  }, [])

  const loadCalc = useCallback(async () => {
    if (useMockViz) {
      setLoading(false)
      setCalcError(null)
      setCalc(buildDashboardMockCalc())
      return
    }
    if (orgIdNum == null) {
      setLoading(false)
      setCalc(null)
      setCalcError(null)
      return
    }
    setLoading(true)
    setCalcError(null)
    try {
      const data = await getCalculationLatest(orgIdNum)
      setCalc(data)
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) {
        setCalc(null)
        setCalcError(null)
      } else {
        setCalc(null)
        setCalcError(e instanceof ApiError ? e.message : "โหลดข้อมูลไม่สำเร็จ")
      }
    } finally {
      setLoading(false)
    }
  }, [orgIdNum, useMockViz])

  useEffect(() => {
    void loadCalc()
  }, [loadCalc])

  useEffect(() => {
    setGranularity(getPreferredGranularity(orgStorageId))
  }, [orgStorageId])

  const openBaseYearDrawer = useCallback(() => setBaseYearDrawerOpen(true), [])
  const closeBaseYearDrawer = useCallback(() => {
    setBaseYearDrawerOpen(false)
    if (typeof window !== "undefined" && window.location.hash === "#base-year-settings") {
      window.history.replaceState(null, "", window.location.pathname + window.location.search)
    }
  }, [])

  useEffect(() => {
    if (typeof window === "undefined" || window.location.hash !== "#base-year-settings") return
    setBaseYearDrawerOpen(true)
  }, [])

  useEffect(() => {
    const bump = () => setBaseYearTick((t) => t + 1)
    window.addEventListener(CONTROL_Z_BASE_YEAR_UPDATED, bump as EventListener)
    return () => window.removeEventListener(CONTROL_Z_BASE_YEAR_UPDATED, bump as EventListener)
  }, [])

  const latestBaseYear = useMemo(() => getLatestBaseYearSnapshot(orgStorageId), [orgStorageId, baseYearTick])
  const referenceBaseYear = useMemo(
    () => getPreferredBaseYearYear(orgStorageId, latestBaseYear),
    [orgStorageId, latestBaseYear, baseYearTick],
  )
  const calcHistory = useMemo(() => loadCalculationHistory(orgStorageId), [orgStorageId, calc?.ran_at])

  const s1 = calc?.scope1_tco2e ?? 0
  const s2 = calc?.scope2_tco2e ?? 0
  const s3 = calc?.scope3_tco2e ?? 0
  const total = calc?.total_tco2e ?? 0
  const vsBase = calc?.vs_base_year_percent ?? null

  const topSources = useMemo(() => buildTopSources(s1, s2, s3), [s1, s2, s3])
  const [b1, b2, b3] = useMemo(() => baselineScopeValues(s1, s2, s3, vsBase), [s1, s2, s3, vsBase])

  /** ปีที่เลือกใน dropdown — ถ้าไม่ใช่ปีอ้างอิงปัจจุบัน ปรับยอดจำลองเล็กน้อยจนกว่าจะมี API หลายปี */
  const yearDriftFactor = useMemo(() => 1 + (year - yearNow) * 0.04, [year, yearNow])
  const selS1 = useMemo(() => Math.max(0, s1 * yearDriftFactor), [s1, yearDriftFactor])
  const selS2 = useMemo(() => Math.max(0, s2 * yearDriftFactor), [s2, yearDriftFactor])
  const selS3 = useMemo(() => Math.max(0, s3 * yearDriftFactor), [s3, yearDriftFactor])
  const totalBase = useMemo(() => b1 + b2 + b3, [b1, b2, b3])
  const totalSelected = useMemo(() => selS1 + selS2 + selS3, [selS1, selS2, selS3])

  const doughnutData = useMemo(
    () => ({
      labels: ["Scope 1", "Scope 2", "Scope 3"],
      datasets: [
        {
          data: total > 0 ? [s1, s2, s3] : [1, 1, 1],
          backgroundColor: [SCOPE_THEME.s1, SCOPE_THEME.s2, SCOPE_THEME.s3],
          borderColor: "#fff",
          borderWidth: 2,
          hoverOffset: 6,
        },
      ],
    }),
    [s1, s2, s3, total],
  )

  const doughnutOptions = useMemo<ChartOptions<"doughnut">>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      cutout: "58%",
      plugins: {
        legend: {
          position: "bottom",
          labels: { boxWidth: 12, padding: 14, usePointStyle: true },
        },
        tooltip: {
          callbacks: {
            label(ctx) {
              const v = ctx.raw as number
              if (total <= 0) return `${ctx.label}: ${DATA_NOT_FOUND_LABEL}`
              const pct = total ? ((v / total) * 100).toFixed(1) : "0"
              return `${ctx.label}: ${formatThNumber(v, 2)} tCO₂e (${pct}%)`
            },
          },
        },
      },
    }),
    [total],
  )

  const sourcesBarData = useMemo(
    () => ({
      labels: topSources.map((t) => t.name),
      datasets: [
        {
          label: "tCO₂e",
          data: topSources.map((t) => Math.round(t.value * 100) / 100),
          backgroundColor: topSources.map((t) => scopeBarColor(t.scope)),
          borderRadius: 6,
          barThickness: 18,
        },
      ],
    }),
    [topSources],
  )

  const sourcesBarOptions = useMemo<ChartOptions<"bar">>(
    () => ({
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label(ctx) {
              const v = ctx.raw as number
              const row = topSources[ctx.dataIndex]
              return `${row?.scope ?? ""}: ${formatThNumber(v, 2)} tCO₂e`
            },
          },
        },
      },
      scales: {
        x: {
          beginAtZero: true,
          title: { display: true, text: "tCO₂e" },
          grid: { color: "#f1f5f9" },
        },
        y: { grid: { display: false }, ticks: { font: { size: 11 } } },
      },
    }),
    [topSources],
  )

  /** กราฟหลัก: เปรียบเทียบยอดรวม (ซ้อน Scope) — ปีฐาน vs ปีที่เลือก */
  const yearCompareStackedData = useMemo(
    () => ({
      labels: ["ปีฐาน", `ปี ${year} (ที่เลือก)`],
      datasets: [
        {
          label: "Scope 1",
          data: [Math.round(b1 * 100) / 100, Math.round(selS1 * 100) / 100],
          backgroundColor: SCOPE_THEME.s1,
          borderRadius: 4,
          stack: "emissions",
        },
        {
          label: "Scope 2",
          data: [Math.round(b2 * 100) / 100, Math.round(selS2 * 100) / 100],
          backgroundColor: SCOPE_THEME.s2,
          borderRadius: 4,
          stack: "emissions",
        },
        {
          label: "Scope 3",
          data: [Math.round(b3 * 100) / 100, Math.round(selS3 * 100) / 100],
          backgroundColor: SCOPE_THEME.s3,
          borderRadius: 4,
          stack: "emissions",
        },
      ],
    }),
    [b1, b2, b3, selS1, selS2, selS3, year],
  )

  const yearCompareStackedOptions = useMemo<ChartOptions<"bar">>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: "top", labels: { boxWidth: 12, usePointStyle: true } },
        tooltip: {
          callbacks: {
            footer(tooltipItems) {
              if (!tooltipItems.length) return ""
              const idx = tooltipItems[0].dataIndex
              const sum =
                idx === 0
                  ? totalBase
                  : idx === 1
                    ? totalSelected
                    : 0
              return `รวม: ${formatThNumber(Math.round(sum * 100) / 100, 2)} tCO₂e`
            },
          },
        },
      },
      scales: {
        x: { stacked: true, grid: { display: false } },
        y: {
          stacked: true,
          beginAtZero: true,
          title: { display: true, text: "tCO₂e (สะสมตาม Scope)" },
          grid: { color: "#f1f5f9" },
        },
      },
    }),
    [totalBase, totalSelected],
  )

  /** กราฟรอง: เปรียบเทียบราย Scope (กลุ่มแท่งคู่) */
  const compareBarData = useMemo(
    () => ({
      labels: ["Scope 1", "Scope 2", "Scope 3"],
      datasets: [
        {
          label: "ปีฐาน",
          data: [Math.round(b1 * 100) / 100, Math.round(b2 * 100) / 100, Math.round(b3 * 100) / 100],
          backgroundColor: SCOPE_THEME.base,
          borderRadius: 6,
        },
        {
          label: `ปี ${year} (ที่เลือก)`,
          data: [Math.round(selS1 * 100) / 100, Math.round(selS2 * 100) / 100, Math.round(selS3 * 100) / 100],
          backgroundColor: [SCOPE_THEME.s1, SCOPE_THEME.s2, SCOPE_THEME.s3],
          borderRadius: 6,
        },
      ],
    }),
    [b1, b2, b3, selS1, selS2, selS3, year],
  )

  const compareBarOptions = useMemo<ChartOptions<"bar">>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: "top", labels: { boxWidth: 12, usePointStyle: true } },
      },
      scales: {
        x: { grid: { display: false } },
        y: {
          beginAtZero: true,
          title: { display: true, text: "tCO₂e" },
          grid: { color: "#f1f5f9" },
        },
      },
    }),
    [],
  )

  const yearOptions = useMemo(() => {
    const ys: number[] = []
    for (let y = yearNow - 2; y <= yearNow + 1; y++) ys.push(y)
    return ys.map((y) => ({ value: y, label: String(y) }))
  }, [yearNow])

  const comparison = useMemo(
    () =>
      compareDeltaPercent(total, compareMode, {
        vsBaseYearPercent: vsBase,
        history: calcHistory,
        referenceDate: calc?.ran_at ? new Date(calc.ran_at) : new Date(),
      }),
    [total, compareMode, vsBase, calcHistory, calc?.ran_at],
  )

  const hasData = total > 0
  const share = (v: number) => (hasData && total > 0 ? (v / total) * 100 : null)
  const deltaScopes = comparison.percent
  const compareLabel = comparison.label
  const granularityLabel = PERIOD_GRANULARITY_OPTIONS.find((o) => o.value === granularity)?.label ?? granularity
  const facilityLabel = FACILITY_OPTIONS.find((o) => o.value === facility)?.label ?? facility
  const compareModeShort = COMPARE_MODE_OPTIONS.find((o) => o.value === compareMode)?.short ?? compareLabel

  const buildExportInput = useCallback((): DashboardExportInput => ({
    year,
    compareLabel,
    comparePercent: deltaScopes,
    facilityLabel,
    granularityLabel,
    referenceBaseYear,
    scope1: s1,
    scope2: s2,
    scope3: s3,
    total,
    totalBase,
    totalSelected,
  }), [
    year,
    compareLabel,
    deltaScopes,
    facilityLabel,
    granularityLabel,
    referenceBaseYear,
    s1,
    s2,
    s3,
    total,
    totalBase,
    totalSelected,
  ])

  const handleExport = useCallback(
    async (format: "csv" | "excel" | "pdf") => {
      if (!hasData) {
        message.warning("ยังไม่มีข้อมูลสำหรับส่งออก — กรุณาคำนวณผลก่อน")
        return
      }
      const input = buildExportInput()
      try {
        if (format === "csv") {
          exportDashboardCsv(input)
          message.success("ดาวน์โหลด CSV แล้ว")
        } else if (format === "excel") {
          await exportDashboardExcel(input)
          message.success("ดาวน์โหลด Excel แล้ว")
        } else {
          exportDashboardPdf(input)
          message.info("เปิดหน้าพิมพ์ PDF — เลือก «บันทึกเป็น PDF» ในหน้าต่างพิมพ์")
        }
      } catch {
        message.error("ส่งออกไม่สำเร็จ")
      }
    },
    [hasData, buildExportInput, message],
  )

  const exportMenuItems: MenuProps["items"] = [
    { key: "csv", label: "ส่งออก CSV (.csv)", icon: <FileTextOutlined />, onClick: () => void handleExport("csv") },
    { key: "excel", label: "ส่งออก Excel (.xlsx)", icon: <FileExcelOutlined />, onClick: () => void handleExport("excel") },
    { key: "pdf", label: "ส่งออก PDF (.pdf)", icon: <FilePdfOutlined />, onClick: () => void handleExport("pdf") },
  ]

  const chartViewOptions = [
    { label: "เปรียบเทียบ", value: "compare" },
    { label: "แหล่งปล่อย", value: "sources" },
    { label: "ราย Scope", value: "scope" },
    { label: "สัดส่วน", value: "breakdown" },
  ] as const

  const activeChartHeight = chartView === "compare" ? "min(420px,52vh)" : "min(340px,44vh)"

  return (
    <div className="dash-page w-full min-w-0 pb-10">
      <div className="flex flex-col gap-6">
        <PageHeader
          title="ภาพรวมการปล่อย GHG"
          description={
            <>
              Executive overview · ปี {year}
              {useMockViz ? " · ข้อมูลจำลอง" : ""}
            </>
          }
          actions={
            <>
              <button
                type="button"
                className="dash-filter-chip"
                onClick={() => setFilterDrawerOpen(true)}
                title="เปิดตัวกรองและมุมมองเปรียบเทียบ"
              >
                มุมมอง: {compareModeShort} · {granularityLabel}
              </button>
              <PageHeaderButton
                icon={<FilterOutlined />}
                onClick={() => setFilterDrawerOpen(true)}
              >
                ตัวกรองและเปรียบเทียบ
              </PageHeaderButton>
              <PageHeaderButton icon={<FlagOutlined />} onClick={openBaseYearDrawer}>
                ตั้งค่าปีฐาน
              </PageHeaderButton>
              <Dropdown menu={{ items: exportMenuItems }} trigger={["click"]} placement="bottomRight">
                <PageHeaderButton tone="primary" icon={<DownloadOutlined />}>
                  ส่งออกรายงาน <DownOutlined className="text-xs" />
                </PageHeaderButton>
              </Dropdown>
            </>
          }
        />

        <DashboardFilterDrawer
          open={filterDrawerOpen}
          onClose={() => setFilterDrawerOpen(false)}
          filters={{ compareMode, year, granularity, facility, useMockViz }}
          yearOptions={yearOptions}
          facilityOptions={FACILITY_OPTIONS}
          referenceBaseYear={referenceBaseYear}
          baseYearRange={latestBaseYear ? { dat_start: latestBaseYear.dat_start, dat_end: latestBaseYear.dat_end } : null}
          onChange={(patch) => {
            if (patch.compareMode != null) setCompareMode(patch.compareMode)
            if (patch.year != null) setYear(patch.year)
            if (patch.granularity != null) {
              setGranularity(patch.granularity)
              setPreferredGranularity(orgStorageId, patch.granularity)
            }
            if (patch.facility != null) setFacility(patch.facility)
            if (patch.useMockViz != null) setMockViz(patch.useMockViz)
          }}
          onOpenBaseYear={openBaseYearDrawer}
        />
        <BaseYearSettingsDrawer open={baseYearDrawerOpen} onClose={closeBaseYearDrawer} />

        {calcError ? <Alert type="error" showIcon message={calcError} className="rounded-xl" /> : null}
        {!orgIdNum && !useMockViz ? (
          <Alert type="info" showIcon message="ไม่พบรหัสองค์กร — ล็อกอินและเลือกองค์กรก่อน" className="rounded-xl" />
        ) : null}

        <Spin spinning={loading}>
          {!hasData && !loading && !useMockViz ? (
            <div className="dash-panel flex min-h-[320px] items-center justify-center p-8">
              <Empty description={DATA_NOT_FOUND_LABEL}>
                <Link to="/app/data-input">
                  <Button type="primary" className="signature-gradient border-0">
                    ไปกรอกข้อมูลและคำนวณ
                  </Button>
                </Link>
              </Empty>
            </div>
          ) : (
            <Row gutter={[20, 20]} align="stretch">
              <Col xs={24} lg={7} xl={6}>
                <div className="flex h-full flex-col gap-4">
                  <div className="dash-hero-card flex flex-1 flex-col justify-between p-6">
                    <Typography.Text className="!text-sm !font-medium !text-teal-50/90">
                      รวมการปล่อย GHG
                    </Typography.Text>
                    <div className="my-4">
                      <div className="text-3xl font-bold tabular-nums tracking-tight text-white sm:text-4xl">
                        {hasData ? formatThNumber(total, 2) : "—"}
                      </div>
                      <Typography.Text className="!mt-1 block !text-sm !text-teal-50/80">
                        tCO₂e · ปี {year}
                      </Typography.Text>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <TrendPill delta={deltaScopes} label={compareLabel} />
                      {referenceBaseYear != null ? (
                        <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-xs text-white/90">
                          ปีฐาน {referenceBaseYear}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <DashScopeMetric
                    title="Scope 1"
                    value={hasData ? `${formatThNumber(s1, 2)}` : "—"}
                    share={share(s1)}
                    accent={SCOPE_THEME.s1}
                  />
                  <DashScopeMetric
                    title="Scope 2"
                    value={hasData ? `${formatThNumber(s2, 2)}` : "—"}
                    share={share(s2)}
                    accent={SCOPE_THEME.s2}
                  />
                  <DashScopeMetric
                    title="Scope 3"
                    value={hasData ? `${formatThNumber(s3, 2)}` : "—"}
                    share={share(s3)}
                    accent={SCOPE_THEME.s3}
                  />
                </div>
              </Col>

              <Col xs={24} lg={17} xl={18}>
                <div className="dash-panel flex h-full min-h-[480px] flex-col p-5 sm:p-6">
                  <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="dash-chart-tabs min-w-0 flex-1">
                      <Segmented
                        value={chartView}
                        onChange={(v) => setChartView(v as ChartView)}
                        options={chartViewOptions.map((o) => ({ label: o.label, value: o.value }))}
                        className="w-full max-w-xl"
                      />
                    </div>
                    <Space wrap size="small" className="shrink-0">
                      {chartView === "compare" ? (
                        <>
                          <Tag bordered={false} className="dash-tag-teal !m-0">
                            ปีฐาน {formatThNumber(Math.round(totalBase * 100) / 100, 1)} tCO₂e
                          </Tag>
                          <Tag bordered={false} className="dash-tag-teal !m-0">
                            ปี {year} {formatThNumber(Math.round(totalSelected * 100) / 100, 1)} tCO₂e
                          </Tag>
                        </>
                      ) : null}
                      <Button size="small" icon={<FlagOutlined />} className="dash-btn-outline" onClick={openBaseYearDrawer}>
                        ตั้งค่าปีฐาน
                      </Button>
                    </Space>
                  </div>

                  <div className="min-h-0 flex-1">
                    {!hasData ? (
                      <div className="flex h-full min-h-[280px] items-center justify-center text-slate-400">
                        {DATA_NOT_FOUND_LABEL}
                      </div>
                    ) : chartView === "compare" ? (
                      <div className="w-full min-h-[300px]" style={{ height: activeChartHeight }}>
                        <Bar data={yearCompareStackedData} options={yearCompareStackedOptions} />
                      </div>
                    ) : chartView === "sources" ? (
                      <div className="h-[min(340px,44vh)] w-full min-h-[260px]">
                        <Bar data={sourcesBarData} options={sourcesBarOptions} />
                      </div>
                    ) : chartView === "scope" ? (
                      <div className="h-[min(340px,44vh)] w-full min-h-[260px]">
                        <Bar data={compareBarData} options={compareBarOptions} />
                      </div>
                    ) : (
                      <Row gutter={16} align="middle" className="h-full min-h-[280px]">
                        <Col xs={24} md={14}>
                          <div className="mx-auto h-[min(300px,40vh)] max-w-md min-h-[220px]">
                            <Doughnut data={doughnutData} options={doughnutOptions} />
                          </div>
                        </Col>
                        <Col xs={24} md={10}>
                          <Space direction="vertical" size="middle" className="w-full">
                            {[
                              { label: "Scope 1", val: s1, color: SCOPE_THEME.s1 },
                              { label: "Scope 2", val: s2, color: SCOPE_THEME.s2 },
                              { label: "Scope 3", val: s3, color: SCOPE_THEME.s3 },
                            ].map((row) => (
                              <div key={row.label} className="rounded-xl bg-slate-50 px-4 py-3">
                                <div className="flex items-center justify-between gap-2">
                                  <Space size="small">
                                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: row.color }} />
                                    <Typography.Text strong>{row.label}</Typography.Text>
                                  </Space>
                                  <Typography.Text className="tabular-nums font-semibold">
                                    {formatThNumber(row.val, 2)}
                                  </Typography.Text>
                                </div>
                                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
                                  <div
                                    className="h-full rounded-full transition-all"
                                    style={{
                                      width: `${total > 0 ? (row.val / total) * 100 : 0}%`,
                                      background: row.color,
                                    }}
                                  />
                                </div>
                              </div>
                            ))}
                          </Space>
                        </Col>
                      </Row>
                    )}
                  </div>
                </div>
              </Col>
            </Row>
          )}
        </Spin>
      </div>
    </div>
  )
}
