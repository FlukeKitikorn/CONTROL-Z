import { FileExcelOutlined } from "@ant-design/icons"
import { Alert, App, Button, Card, Col, Descriptions, Empty, Progress, Row, Space, Table, Tag, Typography } from "antd"
import { useCallback, useEffect, useMemo, useState } from "react"
import { Link } from "react-router"

import { PageHeader } from "@/components/common/PageHeader"
import { MetricCard } from "@/components/dashboard/MetricCard"
import { CONTROL_Z_CALC_RESULTS_UPDATED, type CalculationResultsSnapshot, loadCalculationResultsSnapshot } from "@/lib/calculationResultsStorage"
import { formatDateRangeTh, getLatestBaseYearSnapshot, getOrganizationStorageId } from "@/lib/organizationBaseYearStorage"
import { useAuthStore } from "@/store/useAuthStore"

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

function scopeShare(scope: number, total: number): string {
  if (!total) return "0%"
  return `${formatThNumber((scope / total) * 100, 1)}%`
}

export function ResultsPage() {
  const { message } = App.useApp()
  const authUser = useAuthStore((s) => s.user)
  const orgId = useMemo(() => getOrganizationStorageId(authUser), [authUser])

  const [results, setResults] = useState<CalculationResultsSnapshot | null>(() =>
    typeof window !== "undefined" ? loadCalculationResultsSnapshot(orgId) : null,
  )
  const [testExporting, setTestExporting] = useState(false)

  const refreshResults = useCallback(() => {
    setResults(loadCalculationResultsSnapshot(orgId))
  }, [orgId])

  useEffect(() => {
    refreshResults()
  }, [refreshResults])

  useEffect(() => {
    const onCalc = (e: Event) => {
      const detail = (e as CustomEvent<{ orgId?: string }>).detail
      if (!detail?.orgId || detail.orgId === orgId) refreshResults()
    }
    window.addEventListener(CONTROL_Z_CALC_RESULTS_UPDATED, onCalc as EventListener)
    return () => window.removeEventListener(CONTROL_Z_CALC_RESULTS_UPDATED, onCalc as EventListener)
  }, [orgId, refreshResults])

  const baseSnap = useMemo(() => getLatestBaseYearSnapshot(orgId), [orgId])

  const preparerName = useMemo(() => {
    if (!authUser) return "—"
    const parts = [authUser.prefix, authUser.fname, authUser.lname].filter(Boolean)
    return parts.length ? parts.join(" ") : authUser.email || "—"
  }, [authUser])

  const breakdownRows = useMemo(() => {
    if (!results) return []
    const t = results.totalTco2e
    return [
      { key: "1", scope: "Scope 1", value: results.scope1Tco2e, share: scopeShare(results.scope1Tco2e, t) },
      { key: "2", scope: "Scope 2", value: results.scope2Tco2e, share: scopeShare(results.scope2Tco2e, t) },
      { key: "3", scope: "Scope 3", value: results.scope3Tco2e, share: scopeShare(results.scope3Tco2e, t) },
    ]
  }, [results])

  const vsBaseHelper = useMemo(() => {
    if (!results) return "—"
    if (results.vsBaseYearPercent == null) {
      return baseSnap ? "รอโมเดลเปรียบเทียบเต็มรูปแบบ" : "บันทึกช่วงปีฐานในขั้นข้อมูลทั่วไปเพื่อใช้เปรียบเทียบ"
    }
    const v = results.vsBaseYearPercent
    return v <= 0 ? `${formatThNumber(v, 1)}% (ลดลงจากปีฐาน)` : `+${formatThNumber(v, 1)}% (สูงกว่าปีฐาน)`
  }, [results, baseSnap])

  const baseYearDescription = useMemo(() => {
    if (!baseSnap) {
      return "ยังไม่มี snapshot ปีฐาน — กรอกในขั้นข้อมูลทั่วไปแล้วบันทึก"
    }
    let s = formatDateRangeTh(baseSnap.dat_start, baseSnap.dat_end)
    if (baseSnap.vx_create != null && baseSnap.vx_create !== "") {
      s += ` · ผลผลิตปีฐาน ${baseSnap.vx_create}`
      if (baseSnap.unityLabel) s += ` ${baseSnap.unityLabel}`
      else if (baseSnap.unity) s += ` (${baseSnap.unity})`
    }
    return s
  }, [baseSnap])

  const onTestExportXlsx = useCallback(async () => {
    try {
      setTestExporting(true)
      const { exportResultsPageTestXlsx } = await import("@/lib/resultsTestExcelExport")
      await exportResultsPageTestXlsx({
        preparerName,
        organizationIdDisplay:
          authUser?.organization_id === undefined || authUser?.organization_id === null
            ? "—"
            : String(authUser.organization_id),
        baseYearDescription,
        results,
        ranAtDisplay: results ? formatThDateTime(results.ranAt) : null,
      })
      message.success("ส่งออกไฟล์ทดสอบ .xlsx แล้ว")
    } catch (e) {
      const msg = e instanceof Error ? e.message : "ส่งออกไม่สำเร็จ"
      message.error(msg)
    } finally {
      setTestExporting(false)
    }
  }, [authUser?.organization_id, baseYearDescription, message, preparerName, results])

  return (
    <div className="w-full min-w-0 space-y-6 pb-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          title="ผลการคำนวณ"
          description="สรุปการปล่อยก๊าซเรือนกระจก (CO₂e) จากรอบคำนวณล่าสุด — อ้างอิงข้อมูลผู้ใช้และปีฐาน (ข้อมูลในเครื่องต่อองค์กรจนกว่าจะเชื่อม API)"
        />
        <Button
          type="default"
          size="large"
          icon={<FileExcelOutlined />}
          loading={testExporting}
          onClick={onTestExportXlsx}
          className="shrink-0"
        >
          ทดสอบส่งออก .xlsx
        </Button>
      </div>

      <div className="space-y-6">
        <Card className="border-slate-200/90 shadow-sm ring-1 ring-slate-100/80" title="ข้อมูลอ้างอิงจากระบบ">
          <Descriptions column={{ xs: 1, sm: 1, md: 2 }} size="small" bordered>
            <Descriptions.Item label="ผู้จัดทำ / บัญชี">{preparerName}</Descriptions.Item>
            <Descriptions.Item label="องค์กร (รหัส)">{authUser?.organization_id ?? "—"}</Descriptions.Item>
            <Descriptions.Item label="ช่วงปีฐาน (ล่าสุด)" span={2}>
              {baseSnap ? (
                <span>
                  {formatDateRangeTh(baseSnap.dat_start, baseSnap.dat_end)}
                  {baseSnap.vx_create != null && baseSnap.vx_create !== "" ? (
                    <span className="text-slate-600">
                      {" "}
                      · ผลผลิตปีฐาน {baseSnap.vx_create}
                      {baseSnap.unityLabel ? ` ${baseSnap.unityLabel}` : baseSnap.unity ? ` (${baseSnap.unity})` : ""}
                    </span>
                  ) : null}
                </span>
              ) : (
                <Typography.Text type="secondary">
                  ยังไม่มี snapshot ปีฐาน — กรอกในขั้น «ข้อมูลทั่วไป» แล้วบันทึกร่างหรือไปขั้นถัดไป
                </Typography.Text>
              )}
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {!results ? (
          <Card>
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <Space direction="vertical" size="small" className="max-w-md">
                  <Typography.Text strong>ยังไม่มีผลการคำนวณในระบบ</Typography.Text>
                  <Typography.Text type="secondary">
                    หลังกรอกข้อมูลครบทุกขั้น ให้กด «คำนวณคาร์บอนฟุตพรินต์» ที่หน้ากรอกข้อมูล — ระบบจะบันทึกผลรอบล่าสุดไว้ที่นี่
                  </Typography.Text>
                </Space>
              }
            >
              <Link to="/app/data-input">
                <Button type="primary" size="large">
                  ไปกรอกข้อมูล / คำนวณ
                </Button>
              </Link>
            </Empty>
          </Card>
        ) : (
          <>
            {results.source === "mock" ? (
              <Alert
                type="info"
                showIcon
                message="ตัวเลขจำลองจากปุ่มคำนวณ"
                description="โครงสร้างหน้านี้พร้อมรับผลจากเครื่องคำนวณหลังบ้าน — แทนที่ `saveMockCalculationResults` ด้วยการบันทึก payload จาก API ได้โดยตรง"
              />
            ) : null}

            <Typography.Text type="secondary" className="block text-sm">
              คำนวณล่าสุด: <strong className="text-slate-800">{formatThDateTime(results.ranAt)}</strong>
            </Typography.Text>

            <Row gutter={[16, 16]}>
              <Col xs={24} md={8}>
                <MetricCard
                  label="การปล่อยรวม (รอบล่าสุด)"
                  value={`${formatThNumber(results.totalTco2e, 0)} tCO₂e`}
                  helper="รวม Scope 1–3 จากชุดข้อมูลที่ส่งคำนวณ"
                  trend="neutral"
                />
              </Col>
              <Col xs={24} md={8}>
                <MetricCard
                  label="เทียบปีฐาน"
                  value={results.vsBaseYearPercent != null ? `${formatThNumber(results.vsBaseYearPercent, 1)}%` : "—"}
                  helper={vsBaseHelper}
                  trend={
                    results.vsBaseYearPercent == null
                      ? "neutral"
                      : results.vsBaseYearPercent <= 0
                        ? "down"
                        : "up"
                  }
                />
              </Col>
              <Col xs={24} md={8}>
                <Card>
                  <Typography.Text type="secondary" className="text-xs">
                    สัดส่วนตาม Scope (รอบล่าสุด)
                  </Typography.Text>
                  <Space direction="vertical" className="mt-3 w-full" size="middle">
                    {breakdownRows.map((r) => (
                      <div key={r.key}>
                        <div className="mb-1 flex justify-between text-sm">
                          <span>{r.scope}</span>
                          <span className="font-semibold">{r.share}</span>
                        </div>
                        <Progress
                          percent={Math.round((r.value / results.totalTco2e) * 1000) / 10}
                          size="small"
                          showInfo={false}
                          strokeColor={{ from: "#059669", to: "#10b981" }}
                        />
                      </div>
                    ))}
                  </Space>
                </Card>
              </Col>
            </Row>

            <Card title="แยกตาม Scope" extra={<Tag color="blue">tCO₂e</Tag>}>
              <Table
                pagination={false}
                size="middle"
                dataSource={breakdownRows}
                columns={[
                  { title: "Scope", dataIndex: "scope", width: 120 },
                  {
                    title: "การปล่อย (tCO₂e)",
                    dataIndex: "value",
                    align: "right" as const,
                    render: (v: number) => formatThNumber(v, 1),
                  },
                  { title: "สัดส่วน", dataIndex: "share", width: 100 },
                ]}
              />
            </Card>
          </>
        )}
      </div>

      <Card size="small" className="bg-slate-50/80">
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={16}>
            <Typography.Text type="secondary" className="text-sm">
              ดูรายงานมาตรฐาน (Fr_xx) และการส่งออก — เมนูรายงาน
            </Typography.Text>
          </Col>
          <Col xs={24} md={8} className="text-start md:text-end">
            <Space wrap>
              <Link to="/app/data-input">
                <Button>แก้ไขข้อมูลกรอก</Button>
              </Link>
              <Link to="/app/reports">
                <Button type="primary">เปิดรายงาน</Button>
              </Link>
            </Space>
          </Col>
        </Row>
      </Card>
    </div>
  )
}
