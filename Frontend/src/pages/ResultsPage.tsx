import { CalculatorOutlined, ReloadOutlined } from "@ant-design/icons"
import {
  Alert,
  App,
  Button,
  Card,
  Col,
  Empty,
  Row,
  Select,
  Space,
  Spin,
  Statistic,
  Table,
  Tooltip,
  Typography,
} from "antd"
import type { ColumnsType } from "antd/es/table"
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Title,
  Tooltip as ChartTooltip,
  type ChartOptions,
} from "chart.js"
import { useCallback, useEffect, useMemo, useState } from "react"
import { Bar } from "react-chartjs-2"
import { Link } from "react-router"

import { PageHeader } from "@/components/common/PageHeader"
import { PageHeaderButton } from "@/components/common/PageHeaderButton"
import { ApiError } from "@/lib/api/http"
import type { AnnualReportingBundleRead, CollectInformationRead } from "@/lib/api/types"
import {
  getAnnualReportBundleLatest,
  getCalculationLatest,
  listCollectInformation,
  postCalculationRun,
} from "@/lib/api/service"
import type { CalculationResultsSnapshot } from "@/lib/calculationResultsStorage"
import {
  calculationSnapshotFromApi,
  CONTROL_Z_CALC_RESULTS_UPDATED,
  notifyCalculationResultsUpdated,
} from "@/lib/calculationResultsStorage"
import { appendCalculationHistory } from "@/lib/calculationHistoryStorage"
import { evaluateCalculationReadinessFromBundle } from "@/lib/dataInputValidation"
import { loadCalculationHistory } from "@/lib/calculationHistoryStorage"
import { latestCollectRow, pipeRangeLabel } from "@/lib/collectInformationRange"
import { DATA_NOT_FOUND_LABEL } from "@/lib/dataNotFound"
import { getOrganizationStorageId } from "@/lib/organizationBaseYearStorage"
import {
  barChartValues,
  buildEmissionTableRows,
  carbonIntensityTPerKwh,
  resolveActivityDivisorKwh,
  type EmissionTableRow,
} from "@/lib/resultsEmissionModel"
import { useAuthStore } from "@/store/useAuthStore"

ChartJS.register(BarElement, CategoryScale, LinearScale, Title, ChartTooltip, Legend)

const LIVE_SELECT_VALUE = "__live__"

function formatThNumber(n: number, fraction = 1): string {
  return new Intl.NumberFormat("th-TH", {
    maximumFractionDigits: fraction,
    minimumFractionDigits: 0,
  }).format(n)
}

function formatThDateTime(iso: string): string {
  try {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return iso
    return new Intl.DateTimeFormat("th-TH", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(d)
  } catch {
    return iso
  }
}

function formatIntensity(n: number): string {
  return new Intl.NumberFormat("th-TH", { maximumFractionDigits: 9, minimumFractionDigits: 2 }).format(n)
}

export function ResultsPage() {
  const { message } = App.useApp()
  const authUser = useAuthStore((s) => s.user)
  const orgIdStr = useMemo(() => getOrganizationStorageId(authUser), [authUser])
  const orgIdNum = useMemo(() => {
    const id = authUser?.organization_id
    if (id === undefined || id === null) return null
    const n = typeof id === "number" ? id : Number.parseInt(String(id), 10)
    return Number.isFinite(n) ? n : null
  }, [authUser?.organization_id])

  const [liveSnap, setLiveSnap] = useState<CalculationResultsSnapshot | null>(null)
  const [historyTick, setHistoryTick] = useState(0)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [baseYearSummary, setBaseYearSummary] = useState<string | null>(null)
  const [selectedKey, setSelectedKey] = useState<string>(LIVE_SELECT_VALUE)
  const [latestCollect, setLatestCollect] = useState<CollectInformationRead | null>(null)
  const [savedBundle, setSavedBundle] = useState<AnnualReportingBundleRead | null>(null)
  const [calculating, setCalculating] = useState(false)
  /** เน้นแท่งกราฟหลังคลิก (react-chartjs-2 / Chart.js) */
  const [barFocusIndex, setBarFocusIndex] = useState<number | null>(null)

  const historyList = useMemo(() => {
    void historyTick
    return loadCalculationHistory(orgIdStr)
  }, [orgIdStr, historyTick])

  const refreshFromApi = useCallback(async () => {
    if (orgIdNum == null) {
      setLoading(false)
      setLiveSnap(null)
      setLoadError(null)
      setBaseYearSummary(null)
      setLatestCollect(null)
      setSavedBundle(null)
      return
    }
    setLoading(true)
    setLoadError(null)
    try {
      const [calcRes, collects, bundleRes] = await Promise.all([
        getCalculationLatest(orgIdNum).catch((e) => {
          if (e instanceof ApiError && e.status === 404) return null
          throw e
        }),
        listCollectInformation(orgIdNum),
        getAnnualReportBundleLatest(orgIdNum).catch((e) => {
          if (e instanceof ApiError && e.status === 404) return null
          throw e
        }),
      ])
      const latest = latestCollectRow(collects)
      setLatestCollect(latest)
      const byRange = latest ? pipeRangeLabel(latest.base_year) : null
      const prod =
        latest != null
          ? `ผลผลิตช่วงรายงาน ${latest.productivity} ${latest.unit_productivity} · ผลผลิตปีฐาน ${latest.base_year_output} ${latest.unit_base_output}`
          : null
      if (byRange && prod) setBaseYearSummary(`${byRange} · ${prod}`)
      else if (byRange) setBaseYearSummary(byRange)
      else if (prod) setBaseYearSummary(prod)
      else setBaseYearSummary(null)

      setLiveSnap(calcRes ? calculationSnapshotFromApi(calcRes) : null)
      setSavedBundle(bundleRes)
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "โหลดข้อมูลไม่สำเร็จ"
      setLoadError(msg)
      setLiveSnap(null)
      setBaseYearSummary(null)
      setLatestCollect(null)
      setSavedBundle(null)
    } finally {
      setLoading(false)
    }
  }, [orgIdNum])

  useEffect(() => {
    void refreshFromApi()
  }, [refreshFromApi])

  useEffect(() => {
    const onCalc = (e: Event) => {
      const detail = (e as CustomEvent<{ orgId?: string }>).detail
      if (!detail?.orgId || detail.orgId === orgIdStr) {
        setHistoryTick((t) => t + 1)
        void refreshFromApi()
      }
    }
    window.addEventListener(CONTROL_Z_CALC_RESULTS_UPDATED, onCalc as EventListener)
    return () => window.removeEventListener(CONTROL_Z_CALC_RESULTS_UPDATED, onCalc as EventListener)
  }, [orgIdStr, refreshFromApi])

  useEffect(() => {
    if (selectedKey === LIVE_SELECT_VALUE && !liveSnap && historyList.length > 0) {
      setSelectedKey(historyList[0]!.ranAt)
    }
  }, [liveSnap, historyList, selectedKey])

  const activeSnap = useMemo(() => {
    if (selectedKey === LIVE_SELECT_VALUE && liveSnap) return liveSnap
    if (selectedKey !== LIVE_SELECT_VALUE) {
      return historyList.find((h) => h.ranAt === selectedKey) ?? null
    }
    return liveSnap ?? historyList[0] ?? null
  }, [selectedKey, liveSnap, historyList])

  useEffect(() => {
    setBarFocusIndex(null)
  }, [activeSnap?.ranAt])

  const kwhDivisor = useMemo(() => resolveActivityDivisorKwh(latestCollect), [latestCollect])

  const intensity12 = useMemo(() => {
    if (!activeSnap || kwhDivisor == null) return null
    const t = activeSnap.scope1Tco2e + activeSnap.scope2Tco2e
    return carbonIntensityTPerKwh(t, kwhDivisor)
  }, [activeSnap, kwhDivisor])

  const intensity123 = useMemo(() => {
    if (!activeSnap || kwhDivisor == null) return null
    const t = activeSnap.scope1Tco2e + activeSnap.scope2Tco2e + activeSnap.scope3Tco2e
    return carbonIntensityTPerKwh(t, kwhDivisor)
  }, [activeSnap, kwhDivisor])

  const tableRows = useMemo(() => (activeSnap ? buildEmissionTableRows(activeSnap) : []), [activeSnap])

  const chartPayload = useMemo(() => (activeSnap ? barChartValues(activeSnap) : { labels: [], values: [] }), [activeSnap])

  const barPalette = useMemo(() => ["#0f766e", "#14b8a6", "#5eead4", "#94a3b8"] as const, [])
  const barDimmed = useMemo(
    () => ["rgba(15, 118, 110, 0.38)", "rgba(20, 184, 166, 0.38)", "rgba(94, 234, 212, 0.42)", "rgba(148, 163, 184, 0.45)"] as const,
    [],
  )

  const barData = useMemo(() => {
    const bg = chartPayload.values.map((_, i) => {
      if (barFocusIndex === null) return barPalette[i] ?? "#94a3b8"
      return i === barFocusIndex ? (barPalette[i] ?? "#0f766e") : (barDimmed[i] ?? "rgba(148,163,184,0.4)")
    })
    const borderW = chartPayload.values.map((_, i) => (barFocusIndex === i ? 2 : 0))
    const borderC = chartPayload.values.map((_, i) => (barFocusIndex === i ? "#0f172a" : "transparent"))
    return {
      labels: chartPayload.labels,
      datasets: [
        {
          label: "การปล่อย (ton CO₂-eq)",
          data: chartPayload.values,
          backgroundColor: bg,
          hoverBackgroundColor: chartPayload.values.map((_, i) => barPalette[i] ?? "#0d9488"),
          borderColor: borderC,
          borderWidth: borderW,
          borderRadius: 8,
          borderSkipped: false,
        },
      ],
    }
  }, [chartPayload, barFocusIndex, barPalette, barDimmed])

  const barOptions = useMemo<ChartOptions<"bar">>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      animation: { duration: 520, easing: "easeOutQuart" },
      transitions: { active: { animation: { duration: 260 } } },
      onHover(_event, elements, chart) {
        const canvas = chart?.canvas
        if (canvas) canvas.style.cursor = elements.length ? "pointer" : "default"
      },
      onClick(_event, elements) {
        if (!elements.length) {
          setBarFocusIndex(null)
          return
        }
        const i = elements[0].index
        if (typeof i !== "number") return
        setBarFocusIndex((prev) => (prev === i ? null : i))
      },
      plugins: {
        legend: {
          display: chartPayload.values.length > 0,
          position: "bottom",
          labels: { usePointStyle: true, padding: 14, font: { size: 12 } },
        },
        title: {
          display: true,
          text: "การปล่อยตาม Scope",
          font: { size: 13, weight: "bold" },
          padding: { bottom: 8 },
          color: "#475569",
        },
        tooltip: {
          intersect: false,
          axis: "x",
          backgroundColor: "rgba(15, 23, 42, 0.92)",
          titleFont: { size: 13, weight: "bold" },
          bodyFont: { size: 13 },
          padding: 12,
          cornerRadius: 8,
          callbacks: {
            title: (items) => (items[0] ? String(items[0].label) : ""),
            label: (ctx) => {
              const v = ctx.parsed.y
              return ` ปริมาณ: ${formatThNumber(typeof v === "number" ? v : 0, 2)} ton CO₂-eq`
            },
            afterLabel: () => "ลากชี้แท่งอื่นเพื่อเปรียบเทียบ",
          },
        },
      },
      scales: {
        x: { grid: { display: false }, ticks: { maxRotation: 0, autoSkip: true } },
        y: {
          beginAtZero: true,
          title: { display: true, text: "ton CO₂-eq" },
          grid: { color: "rgba(148, 163, 184, 0.18)" },
        },
      },
    }),
    [chartPayload],
  )

  const selectOptions = useMemo(() => {
    const opts: { value: string; label: string }[] = []
    if (liveSnap) {
      opts.push({
        value: LIVE_SELECT_VALUE,
        label: `ล่าสุดจากระบบ · ${formatThDateTime(liveSnap.ranAt)}`,
      })
    }
    for (const h of historyList) {
      opts.push({
        value: h.ranAt,
        label: `ประวัติ · ${formatThDateTime(h.ranAt)}${h.source === "mock" ? " (จำลอง)" : ""}`,
      })
    }
    return opts
  }, [liveSnap, historyList])

  const columns: ColumnsType<EmissionTableRow> = useMemo(
    () => [
      {
        title: "ขอบเขต",
        dataIndex: "category",
        key: "category",
        ellipsis: true,
        render: (t: string, row) => <span className={row.rowClassName}>{t}</span>,
      },
      {
        title: (
          <Tooltip title="การปล่อยก๊าซเรือนกระจกขององค์กร (ton CO₂-eq)">การปล่อย (ton CO₂-eq)</Tooltip>
        ),
        dataIndex: "emissionsT",
        key: "emissionsT",
        align: "right",
        width: 120,
        render: (v: number) => formatThNumber(v, 2),
      },
      {
        title: <Tooltip title="สัดส่วนเมื่อเทียบขอบเขต 1 และ 2">% เทียบ 1+2</Tooltip>,
        dataIndex: "pctScope12",
        key: "pctScope12",
        align: "right",
        width: 100,
        render: (v: string | null) => (v == null ? "—" : v),
      },
      {
        title: <Tooltip title="สัดส่วนเมื่อเทียบขอบเขต 1, 2 และ 3">% เทียบ 1+2+3</Tooltip>,
        dataIndex: "pctScope123",
        key: "pctScope123",
        align: "right",
        width: 110,
        render: (v: string | null) => (v == null ? "—" : v),
      },
    ],
    [],
  )

  const preparerName = useMemo(() => {
    if (!authUser) return "—"
    const parts = [authUser.prefix, authUser.fname, authUser.lname].filter(Boolean)
    return parts.length ? parts.join(" ") : authUser.email || "—"
  }, [authUser])

  const vsBaseHelper = useMemo(() => {
    if (!activeSnap) return "—"
    if (activeSnap.vsBaseYearPercent == null) {
      return baseYearSummary ? "รอโมเดลเปรียบเทียบเต็มรูปแบบ" : "บันทึกข้อมูลทั่วไป (ปีฐาน) ในระบบเพื่อใช้เปรียบเทียบ"
    }
    const v = activeSnap.vsBaseYearPercent
    return v <= 0 ? `${formatThNumber(v, 1)}% (ลดลงจากปีฐาน)` : `+${formatThNumber(v, 1)}% (สูงกว่าปีฐาน)`
  }, [activeSnap, baseYearSummary])

  const calculationReadiness = useMemo(() => {
    if (!savedBundle) {
      return {
        canCalculate: false,
        reasons: ["ยังไม่มีข้อมูลที่บันทึก — กรอกและกดบันทึกที่หน้ากรอกข้อมูล"],
      }
    }
    return evaluateCalculationReadinessFromBundle(savedBundle)
  }, [savedBundle])

  const runCalculation = useCallback(async () => {
    if (orgIdNum == null || savedBundle == null) {
      message.warning("ยังไม่มีข้อมูลรายปีที่บันทึก")
      return
    }
    if (!calculationReadiness.canCalculate) {
      message.warning(
        calculationReadiness.reasons.length > 0
          ? `ยังคำนวณไม่ได้: ${calculationReadiness.reasons.join(" · ")}`
          : "ข้อมูลยังไม่ครบสำหรับการคำนวณรายปี",
        8,
      )
      return
    }
    setCalculating(true)
    try {
      const calcRes = await postCalculationRun(orgIdNum, {
        annual_report_bundle: savedBundle as unknown as Record<string, unknown>,
      })
      appendCalculationHistory(orgIdStr, calculationSnapshotFromApi(calcRes))
      notifyCalculationResultsUpdated(orgIdStr)
      message.success("คำนวณคาร์บอนฟุตพรินต์รายปีเสร็จแล้ว")
      await refreshFromApi()
    } catch (e) {
      message.error(e instanceof ApiError ? e.message : "คำนวณไม่สำเร็จ")
    } finally {
      setCalculating(false)
    }
  }, [orgIdNum, orgIdStr, savedBundle, calculationReadiness, message, refreshFromApi])

  const hasAnyView = Boolean(liveSnap || historyList.length > 0)

  const sectionCardClass = "overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm"
  const sectionBodyPadding = { padding: "16px 20px" } as const

  return (
    <div className="w-full min-w-0 pb-8">
      <div className="flex flex-col gap-6">
        <PageHeader
          title="การคำนวณ"
          description="ใช้ข้อมูลรายปีที่บันทึกจากหน้ากรอกข้อมูล — กดคำนวณเมื่อข้อมูลครบ แล้วดูสรุป กราฟ และตารางด้านล่าง"
          actions={
            <>
              <PageHeaderButton
                tone="primary"
                icon={<CalculatorOutlined />}
                loading={calculating}
                disabled={!calculationReadiness.canCalculate || orgIdNum == null}
                onClick={() => void runCalculation()}
              >
                คำนวณคาร์บอนฟุตพรินต์
              </PageHeaderButton>
              <PageHeaderButton
                icon={<ReloadOutlined />}
                onClick={() => void refreshFromApi()}
                disabled={loading || orgIdNum == null}
              >
                รีเฟรช
              </PageHeaderButton>
            </>
          }
        />

        {loadError ? <Alert type="error" showIcon message={loadError} className="rounded-xl" /> : null}

        {!loading && savedBundle ? (
          <Alert
            type={calculationReadiness.canCalculate ? "info" : "warning"}
            showIcon
            className="rounded-xl"
            message={`ข้อมูลรายปี ${savedBundle.reportingYear} (${savedBundle.periodStart} – ${savedBundle.periodEnd})`}
            description={
              calculationReadiness.canCalculate
                ? "ข้อมูลพร้อมคำนวณ — กดปุ่ม «คำนวณคาร์บอนฟุตพรินต์» ด้านบน"
                : calculationReadiness.reasons.join(" · ")
            }
          />
        ) : null}

        <Spin spinning={loading}>
          {!hasAnyView && !loading ? (
            <Card className={sectionCardClass}>
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <Space direction="vertical" size="small" className="max-w-md">
                    <Typography.Text strong>{DATA_NOT_FOUND_LABEL}</Typography.Text>
                    <Typography.Text className="text-slate-600">
                      ยังไม่มีผลการคำนวณ — บันทึกข้อมูลรายปีแล้วกดคำนวณที่ด้านบน
                    </Typography.Text>
                  </Space>
                }
              >
                <Link to="/app/data-input">
                  <Button size="large">ไปกรอกข้อมูล</Button>
                </Link>
              </Empty>
            </Card>
          ) : null}

          {hasAnyView && activeSnap ? (
            <div className="flex flex-col gap-4">
              <Card className={sectionCardClass} styles={{ body: { padding: "12px 16px 14px" } }}>
                <div className="rounded-lg border border-teal-100/80 bg-gradient-to-b from-teal-50/35 via-white to-slate-50/25 px-3 py-3 sm:px-4 sm:py-3.5">
                  <Row gutter={[16, 12]} align="middle">
                    <Col xs={24} lg={13}>
                      <Typography.Text className="text-[11px] font-medium text-teal-800">ผู้จัดทำ</Typography.Text>
                      <div className="mt-0.5 text-base font-semibold leading-snug text-slate-900 sm:text-lg">
                        {preparerName}
                      </div>
                      <Typography.Text className="mt-1 block text-xs text-slate-600">
                        องค์กร{" "}
                        <span className="font-medium text-slate-800">
                          {authUser?.organization_id === undefined || authUser?.organization_id === null
                            ? "—"
                            : String(authUser.organization_id)}
                        </span>
                      </Typography.Text>
                    </Col>
                    <Col xs={24} lg={11}>
                      <Typography.Text className="mb-1 block text-[11px] font-medium text-slate-600">
                        เวลาและชุดผล
                      </Typography.Text>
                      <Select
                        aria-label="เลือกชุดผลหรือประวัติ"
                        className="w-full"
                        value={selectOptions.some((o) => o.value === selectedKey) ? selectedKey : selectOptions[0]?.value}
                        options={selectOptions}
                        onChange={(v) => setSelectedKey(v)}
                        placeholder="เลือกประวัติหรือผลล่าสุด"
                      />
                    </Col>
                  </Row>
                </div>
                <div className="mt-3 border-t border-slate-100 pt-3">
                  <Typography.Text className="mb-0.5 block text-[11px] font-medium text-slate-600">
                    ช่วงรายงาน / ปีฐาน
                  </Typography.Text>
                  <Typography.Paragraph className="!mb-0 !mt-0 !text-xs !leading-relaxed !text-slate-700 sm:!text-sm">
                    {loading ? "กำลังโหลดข้อมูลอ้างอิง…" : baseYearSummary ? baseYearSummary : DATA_NOT_FOUND_LABEL}
                  </Typography.Paragraph>
                </div>
              </Card>

              <Card className={sectionCardClass} styles={{ body: sectionBodyPadding }}>
                <Row gutter={[12, 12]}>
                  <Col xs={24} sm={8}>
                    <div className="rounded-xl border border-teal-100/80 bg-teal-50/50 px-3 py-3">
                      <Statistic
                        title={<span className="text-slate-600">รวม Scope 1+2</span>}
                        value={activeSnap.scope1Tco2e + activeSnap.scope2Tco2e}
                        precision={2}
                        suffix={<span className="text-sm font-normal text-slate-500">tCO₂e</span>}
                        valueStyle={{ color: "#0f766e", fontSize: 20 }}
                      />
                    </div>
                  </Col>
                  <Col xs={24} sm={8}>
                    <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 px-3 py-3">
                      <Statistic
                        title={<span className="text-slate-600">รวม Scope 1+2+3</span>}
                        value={activeSnap.scope1Tco2e + activeSnap.scope2Tco2e + activeSnap.scope3Tco2e}
                        precision={2}
                        suffix={<span className="text-sm font-normal text-slate-500">tCO₂e</span>}
                        valueStyle={{ fontSize: 20 }}
                      />
                    </div>
                  </Col>
                  <Col xs={24} sm={8}>
                    <div className="rounded-xl border border-sky-100/80 bg-sky-50/50 px-3 py-3">
                      <Statistic
                        title={<span className="text-slate-600">เทียบปีฐาน</span>}
                        value={activeSnap.vsBaseYearPercent != null ? activeSnap.vsBaseYearPercent : "—"}
                        suffix={activeSnap.vsBaseYearPercent != null ? "%" : ""}
                        valueStyle={{ fontSize: 20 }}
                      />
                      <Typography.Text type="secondary" className="mt-1 line-clamp-2 block text-[11px] leading-snug">
                        {vsBaseHelper}
                      </Typography.Text>
                    </div>
                  </Col>
                </Row>
              </Card>

              <Card className={sectionCardClass} styles={{ body: { padding: "12px 16px 16px" } }}>
                <div className="relative mx-auto h-[min(360px,50vh)] w-full max-w-5xl min-h-[240px]">
                  {chartPayload.values.length > 0 ? <Bar options={barOptions} data={barData} /> : null}
                </div>
              </Card>

              <Card className={sectionCardClass} styles={{ body: sectionBodyPadding }}>
                <div className="mb-3">
                  <Typography.Text className="text-sm font-semibold text-slate-800">Carbon intensity</Typography.Text>
                  <Typography.Paragraph className="!mb-0 !mt-0.5 !text-sm !leading-relaxed !text-slate-600">
                    ความเข้มข้นของการปล่อยต่อหน่วยผลผลิตช่วงรายงาน — หน่วย{" "}
                    <Typography.Text code className="!text-[12px]">
                      ton CO₂-eq / kWh
                    </Typography.Text>
                  </Typography.Paragraph>
                </div>
                <Row gutter={[12, 12]}>
                  <Col xs={24} sm={12}>
                    <div className="h-full rounded-xl border border-teal-100/90 bg-slate-50/30 px-4 py-3 shadow-sm ring-1 ring-teal-900/5">
                      <Typography.Text type="secondary" className="mb-0.5 block text-xs">
                        Scope 1 + 2
                      </Typography.Text>
                      <Statistic
                        value={intensity12 != null ? formatIntensity(intensity12) : "—"}
                        suffix={
                          intensity12 != null ? (
                            <span className="text-xs font-normal text-slate-500">ton CO₂-eq / kWh</span>
                          ) : undefined
                        }
                        valueStyle={{
                          fontSize: 18,
                          fontWeight: 600,
                          color: intensity12 != null ? "#0f766e" : "#94a3b8",
                        }}
                      />
                      <Typography.Text type="secondary" className="mt-1.5 block text-[11px] leading-snug">
                        ผลรวมการปล่อย Scope 1 และ 2 ÷ ผลผลิตช่วงรายงาน
                      </Typography.Text>
                    </div>
                  </Col>
                  <Col xs={24} sm={12}>
                    <div className="h-full rounded-xl border border-slate-200/90 bg-slate-50/30 px-4 py-3 shadow-sm">
                      <Typography.Text type="secondary" className="mb-0.5 block text-xs">
                        Scope 1 + 2 + 3
                      </Typography.Text>
                      <Statistic
                        value={intensity123 != null ? formatIntensity(intensity123) : "—"}
                        suffix={
                          intensity123 != null ? (
                            <span className="text-xs font-normal text-slate-500">ton CO₂-eq / kWh</span>
                          ) : undefined
                        }
                        valueStyle={{
                          fontSize: 18,
                          fontWeight: 600,
                          color: intensity123 != null ? "#134e4a" : "#94a3b8",
                        }}
                      />
                      <Typography.Text type="secondary" className="mt-1.5 block text-[11px] leading-snug">
                        ผลรวมการปล่อย Scope 1–3 ÷ ผลผลิตช่วงรายงาน
                      </Typography.Text>
                    </div>
                  </Col>
                </Row>
              </Card>

              <Card className={sectionCardClass} styles={{ body: sectionBodyPadding }}>
                <Typography.Title level={5} className="!mb-3 !mt-0 !text-slate-800">
                  สรุปการปล่อยและสัดส่วน
                </Typography.Title>
                <Table<EmissionTableRow>
                  pagination={false}
                  size="small"
                  rowKey="key"
                  dataSource={tableRows}
                  columns={columns}
                  tableLayout="fixed"
                  className="results-emission-table"
                  locale={{ emptyText: "ไม่มีข้อมูล" }}
                />
              </Card>
            </div>
          ) : null}
        </Spin>

        <Card className={`${sectionCardClass} mt-6 border-slate-200/90`} styles={{ body: { padding: "16px 20px" } }}>
          <Row gutter={[20, 20]} align="middle">
            <Col xs={24} lg={17}>
              <Typography.Text className="text-base leading-relaxed text-slate-700">
                รายงานมาตรฐาน (Fr_xx) และการส่งออก — เปิดเมนูรายงานเพื่อเลือกแบบฟอร์มและดาวน์โหลดตามข้อมูลองค์กรที่ระบบใช้อยู่
              </Typography.Text>
            </Col>
            <Col xs={24} lg={7} className="text-start lg:text-end">
              <Link to="/app/reports">
                <Button type="primary" size="large">
                  ไปหน้ารายงานและส่งออก
                </Button>
              </Link>
            </Col>
          </Row>
        </Card>
      </div>
    </div>
  )
}
