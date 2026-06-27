import {
  Alert,
  Button,
  Card,
  Col,
  Row,
  Space,
  Spin,
  Table,
  Tag,
  Typography,
} from "antd"
import { ArcElement, CategoryScale, Chart as ChartJS, Legend, LineElement, LinearScale, PointElement, Tooltip } from "chart.js"
import {
  AuditOutlined,
  BankOutlined,
  BellOutlined,
  CodeOutlined,
  FileTextOutlined,
  ReadOutlined,
  SettingOutlined,
  TeamOutlined,
} from "@ant-design/icons"
import { useEffect, useMemo, useState, type ReactNode } from "react"
import { Line, Pie } from "react-chartjs-2"
import { Link } from "react-router"

import { PageHeader } from "@/components/common/PageHeader"
import { ApiError } from "@/lib/api/http"
import { adminListOrganizations, adminListUsers, adminMonitoring, getCalculationLatest } from "@/lib/api/service"
import type { CalculationRunResponse, MonitoringOrgRow } from "@/lib/api/types"

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Tooltip, Legend)

const dashboardTileCardClassName =
  "h-full rounded-xl border border-slate-200/90 bg-white shadow-sm ring-1 ring-slate-100/80 transition-all hover:-translate-y-0.5 hover:border-teal-200/80 hover:shadow-md"

const dashboardTileIconBoxClassName =
  "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-50 to-emerald-50 text-lg text-teal-800 ring-1 ring-teal-100/60"

const dashboardTileIconBoxInteractiveClassName = `${dashboardTileIconBoxClassName} group-hover:from-teal-100/90 group-hover:to-emerald-100/70`

type QuickItem = {
  to: string
  title: string
  hint: string
  icon: ReactNode
}

function QuickAccessCard({ to, title, hint, icon }: QuickItem) {
  return (
    <Link to={to} className="group block h-full">
      <Card variant="borderless" className={dashboardTileCardClassName} styles={{ body: { padding: 16 } }}>
        <div className="flex gap-3">
          <span className={dashboardTileIconBoxInteractiveClassName}>{icon}</span>
          <div className="min-w-0">
            <Typography.Text strong className="block text-[15px] text-slate-900 group-hover:text-teal-800">
              {title}
            </Typography.Text>
            <Typography.Text type="secondary" className="mt-0.5 block text-xs leading-snug">
              {hint}
            </Typography.Text>
          </div>
        </div>
      </Card>
    </Link>
  )
}

function SummaryStatCard({
  title,
  value,
  hint,
  icon,
}: {
  title: string
  value: ReactNode
  hint: string
  icon: ReactNode
}) {
  return (
    <Card
      variant="borderless"
      className={`group ${dashboardTileCardClassName}`}
      styles={{ body: { padding: 16 } }}
    >
      <div className="flex gap-3">
        <span className={dashboardTileIconBoxInteractiveClassName}>{icon}</span>
        <div className="min-w-0 flex-1">
          <Typography.Text className="block text-sm font-medium text-slate-600">{title}</Typography.Text>
          <div className="mt-1 text-[28px] font-bold leading-none tracking-tight text-slate-900 sm:text-[34px]">
            {value}
          </div>
          <Typography.Text type="secondary" className="mt-1 block text-xs leading-snug">
            {hint}
          </Typography.Text>
        </div>
      </div>
    </Card>
  )
}

export function AdminDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [userTotal, setUserTotal] = useState<number | null>(null)
  const [orgCount, setOrgCount] = useState<number | null>(null)
  const [monitoring, setMonitoring] = useState<MonitoringOrgRow[]>([])
  const [calcSnapshots, setCalcSnapshots] = useState<CalculationRunResponse[]>([])

  useEffect(() => {
    let cancelled = false
    async function run() {
      setLoading(true)
      setLoadError(null)
      const results = await Promise.allSettled([
        adminListUsers(0, 500),
        adminListOrganizations(),
        adminMonitoring(),
      ])
      if (cancelled) return

      const [uRes, oRes, mRes] = results
      if (uRes.status === "fulfilled") setUserTotal(uRes.value.total)
      else setUserTotal(null)
      if (oRes.status === "fulfilled") setOrgCount(oRes.value.length)
      else setOrgCount(null)
      if (mRes.status === "fulfilled") setMonitoring(mRes.value)
      else setMonitoring([])

      if (mRes.status === "fulfilled") {
        const orgIds = [...new Set(mRes.value.map((row) => row.organization_id))].slice(0, 120)
        const calcResults = await Promise.allSettled(orgIds.map((orgId) => getCalculationLatest(orgId)))
        if (!cancelled) {
          setCalcSnapshots(
            calcResults
              .filter((r): r is PromiseFulfilledResult<CalculationRunResponse> => r.status === "fulfilled")
              .map((r) => r.value),
          )
        }
      } else {
        setCalcSnapshots([])
      }

      const failed = results.filter((r) => r.status === "rejected")
      if (failed.length === results.length) {
        const first = failed[0] as PromiseRejectedResult
        const msg =
          first.reason instanceof ApiError
            ? first.reason.message
            : "โหลดข้อมูลไม่สำเร็จ — ตรวจสอบ Backend และสิทธิ์ ADMIN"
        setLoadError(msg)
      } else if (failed.length > 0) {
        setLoadError("บางรายการโหลดไม่สำเร็จ")
      }
      setLoading(false)
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [])

  const recentOrgs = useMemo(() => {
    return [...monitoring]
      .sort((a, b) => {
        const ta = a.last_edit_date ? new Date(a.last_edit_date).getTime() : 0
        const tb = b.last_edit_date ? new Date(b.last_edit_date).getTime() : 0
        return tb - ta
      })
      .slice(0, 8)
  }, [monitoring])

  const usageTrend = useMemo(() => {
    const bucket = new Map<string, number>()
    for (const row of monitoring) {
      if (!row.last_edit_date) continue
      const d = new Date(row.last_edit_date)
      if (!Number.isFinite(d.getTime())) continue
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
      bucket.set(key, (bucket.get(key) ?? 0) + 1)
    }
    const labels = [...bucket.keys()].sort().slice(-6)
    return {
      labels,
      values: labels.map((k) => bucket.get(k) ?? 0),
    }
  }, [monitoring])

  const emissionTrend = useMemo(() => {
    const bucket = new Map<string, number>()
    for (const item of calcSnapshots) {
      const d = new Date(item.ran_at)
      if (!Number.isFinite(d.getTime())) continue
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
      bucket.set(key, (bucket.get(key) ?? 0) + item.total_tco2e)
    }
    const labels = [...bucket.keys()].sort().slice(-6)
    return {
      labels,
      values: labels.map((k) => Number((bucket.get(k) ?? 0).toFixed(2))),
    }
  }, [calcSnapshots])

  const scopeBreakdown = useMemo(() => {
    const sum = calcSnapshots.reduce(
      (acc, item) => {
        acc.scope1 += item.scope1_tco2e
        acc.scope2 += item.scope2_tco2e
        acc.scope3 += item.scope3_tco2e
        return acc
      },
      { scope1: 0, scope2: 0, scope3: 0 },
    )
    return [sum.scope1, sum.scope2, sum.scope3]
  }, [calcSnapshots])

  const lineOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true } },
    }),
    [],
  )

  const quickItems: QuickItem[] = useMemo(
    () => [
      {
        to: "/admin/users",
        title: "จัดการผู้ใช้",
        hint: "บัญชี สิทธิ์ และองค์กรที่เชื่อม",
        icon: <TeamOutlined />,
      },
      {
        to: "/admin/organizations",
        title: "องค์กร",
        hint: "ลงทะเบียนและแก้ไขหน่วยงาน",
        icon: <BankOutlined />,
      },
      {
        to: "/admin/factors",
        title: "ปัจจัย / GWP",
        hint: "ข้อมูลอ้างอิงที่กระทบการคำนวณ",
        icon: <ReadOutlined />,
      },
      {
        to: "/admin/monitoring",
        title: "ตรวจสอบข้อมูล",
        hint: "องค์กร ฟอร์ม และการแก้ไขล่าสุด",
        icon: <AuditOutlined />,
      },
      {
        to: "/admin/announcements",
        title: "ประกาศถึงผู้ใช้",
        hint: "ข้อความแจ้งในแอป",
        icon: <BellOutlined />,
      },
      {
        to: "/admin/terminal",
        title: "Terminal & บันทึก",
        hint: "มุมมองคอนโซลสำหรับ audit log",
        icon: <CodeOutlined />,
      },
      {
        to: "/admin/logs",
        title: "บันทึกและคำสั่ง",
        hint: "ตารางเต็มและคำสั่งตรวจเซิร์ฟเวอร์",
        icon: <FileTextOutlined />,
      },
      {
        to: "/admin/settings",
        title: "ตั้งค่าผู้ดูแล",
        hint: "โปรไฟล์และความปลอดภัย",
        icon: <SettingOutlined />,
      },
    ],
    [],
  )

  return (
    <div className="w-full min-w-0 space-y-6 pb-2">
      <PageHeader
        title="แดชบอร์ดผู้ดูแลระบบ"
        description="สรุปผู้ใช้ องค์กร และกิจกรรมล่าสุด"
      />

      {loadError ? (
        <Alert type="warning" showIcon message={loadError} className="rounded-lg border-amber-200/80" />
      ) : null}

      <section aria-label="ตัวเลขภาพรวม">
        <Spin spinning={loading} className="block w-full [&_.ant-spin-container]:block [&_.ant-spin-container]:w-full">
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} lg={8}>
              <SummaryStatCard
                title="ผู้ใช้ในระบบ"
                value={userTotal ?? "—"}
                hint="จำนวนผู้ใช้งานในระบบ"
                icon={<TeamOutlined />}
              />
            </Col>
            <Col xs={24} sm={12} lg={8}>
              <SummaryStatCard
                title="องค์กร"
                value={orgCount ?? "—"}
                hint="จำนวนหน่วยงานที่ลงทะเบียน"
                icon={<BankOutlined />}
              />
            </Col>
            <Col xs={24} sm={12} lg={8}>
              <SummaryStatCard
                title="องค์กรในมอนิเตอร์"
                value={monitoring.length}
                hint="มีข้อมูลฟอร์ม / การแก้ไขล่าสุด"
                icon={<AuditOutlined />}
              />
            </Col>
          </Row>
        </Spin>
      </section>

      <section aria-label="เข้าถึงด่วน">
        <Row gutter={[16, 16]}>
          {quickItems.map((item) => (
            <Col xs={24} sm={12} lg={6} key={item.to}>
              <QuickAccessCard {...item} />
            </Col>
          ))}
        </Row>
      </section>

      <Spin spinning={loading}>
        <Card
          title="องค์กรล่าสุด"
          className="rounded-xl border-slate-200/90 shadow-sm ring-1 ring-slate-100/80"
          styles={{ header: { borderBottom: "1px solid #f1f5f9" } }}
          extra={
            <Space wrap size="small" className="justify-end">
              <Link to="/admin/terminal">
                <Button type="primary" size="small" icon={<CodeOutlined />} className="signature-gradient border-0 !text-white">
                  เปิด Terminal
                </Button>
              </Link>
              <Link to="/admin/monitoring">
                <Button size="small">ตรวจสอบข้อมูล</Button>
              </Link>
              <Link to="/admin/monitoring">
                <Button type="link" size="small">
                  ดูทั้งหมด
                </Button>
              </Link>
            </Space>
          }
        >
          <Table<MonitoringOrgRow>
            size="small"
            pagination={false}
            rowKey="organization_id"
            dataSource={recentOrgs}
            locale={{ emptyText: loading ? "กำลังโหลด…" : "ยังไม่มีข้อมูล" }}
            columns={[
              {
                title: "องค์กร",
                dataIndex: "organization_name",
                ellipsis: true,
                render: (text: string, row) => (
                  <Space direction="vertical" size={0}>
                    <Typography.Text strong>{text}</Typography.Text>
                    <Typography.Text type="secondary" className="text-xs">
                      ID {row.organization_id}
                    </Typography.Text>
                  </Space>
                ),
              },
              {
                title: "จำนวนฟอร์ม",
                dataIndex: "forms_count",
                width: 110,
                align: "right",
              },
              {
                title: "แก้ไขล่าสุด",
                dataIndex: "last_edit_date",
                width: 200,
                render: (v: string | null) =>
                  v ? (
                    <Tag color="processing">{v}</Tag>
                  ) : (
                    <Tag>—</Tag>
                  ),
              },
            ]}
          />
        </Card>
      </Spin>

      <section aria-label="แนวโน้มและสัดส่วนการปล่อย">
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Card title="Usage Trend" className="rounded-xl border-slate-200/90 shadow-sm ring-1 ring-slate-100/80">
              <div className="h-64">
                <Line
                  options={lineOptions}
                  data={{
                    labels: usageTrend.labels,
                    datasets: [
                      {
                        label: "Active organizations",
                        data: usageTrend.values,
                        borderColor: "#0d9488",
                        backgroundColor: "rgba(13, 148, 136, 0.2)",
                        fill: true,
                        tension: 0.35,
                      },
                    ],
                  }}
                />
              </div>
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title="Emission Trend" className="rounded-xl border-slate-200/90 shadow-sm ring-1 ring-slate-100/80">
              <div className="h-64">
                <Line
                  options={lineOptions}
                  data={{
                    labels: emissionTrend.labels,
                    datasets: [
                      {
                        label: "tCO2e",
                        data: emissionTrend.values,
                        borderColor: "#2563eb",
                        backgroundColor: "rgba(37, 99, 235, 0.18)",
                        fill: true,
                        tension: 0.35,
                      },
                    ],
                  }}
                />
              </div>
            </Card>
          </Col>
          <Col xs={24}>
            <Card title="Scope Breakdown" className="rounded-xl border-slate-200/90 shadow-sm ring-1 ring-slate-100/80">
              <div className="mx-auto h-72 max-w-md">
                <Pie
                  data={{
                    labels: ["Scope 1", "Scope 2", "Scope 3"],
                    datasets: [
                      {
                        data: scopeBreakdown,
                        backgroundColor: ["#14b8a6", "#0ea5e9", "#6366f1"],
                        borderColor: "#ffffff",
                        borderWidth: 2,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { position: "bottom" as const } },
                  }}
                />
              </div>
            </Card>
          </Col>
        </Row>
      </section>
    </div>
  )
}
