import {
  CalendarOutlined,
  DatabaseOutlined,
  FlagOutlined,
  FormOutlined,
  HistoryOutlined,
  LineChartOutlined,
} from "@ant-design/icons"
import {
  Alert,
  Button,
  Card,
  Col,
  Empty,
  Form,
  InputNumber,
  Row,
  Space,
  Tag,
  Typography,
  message,
} from "antd"
import { useCallback, useEffect, useMemo, useState } from "react"
import { NavLink } from "react-router"
import { PageHeader } from "@/components/common/PageHeader"
import {
  CONTROL_Z_BASE_YEAR_UPDATED,
  defaultYearFromSnapshot,
  formatDateRangeTh,
  getLatestBaseYearSnapshot,
  getOrganizationStorageId,
  getPreferredBaseYearYear,
  loadBaseYearSnapshots,
  setPreferredBaseYearYear,
  type BaseYearSnapshot,
} from "@/lib/organizationBaseYearStorage"
import { useAuthStore } from "@/store/useAuthStore"

function formatSavedAt(iso: string): string {
  try {
    return new Intl.DateTimeFormat("th-TH", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

export function BaseYearPage() {
  const user = useAuthStore((s) => s.user)
  const orgId = useMemo(() => getOrganizationStorageId(user), [user])
  const [tick, setTick] = useState(0)
  const [messageApi, contextHolder] = message.useMessage()
  const [form] = Form.useForm<{ referenceYear: number }>()

  useEffect(() => {
    const bump = () => setTick((t) => t + 1)
    window.addEventListener(CONTROL_Z_BASE_YEAR_UPDATED, bump as EventListener)
    window.addEventListener("storage", bump)
    return () => {
      window.removeEventListener(CONTROL_Z_BASE_YEAR_UPDATED, bump as EventListener)
      window.removeEventListener("storage", bump)
    }
  }, [])

  const latest = useMemo(() => getLatestBaseYearSnapshot(orgId), [orgId, tick])
  const history = useMemo(() => {
    const all = loadBaseYearSnapshots(orgId)
    return [...all].sort((a, b) => (a.savedAt < b.savedAt ? 1 : -1)).slice(0, 6)
  }, [orgId, tick])

  const inferredYear = latest ? defaultYearFromSnapshot(latest) : null
  const displayYear = useMemo(() => getPreferredBaseYearYear(orgId, latest), [orgId, latest, tick])

  useEffect(() => {
    if (displayYear != null) form.setFieldsValue({ referenceYear: displayYear })
  }, [displayYear, form])

  const onSaveReferenceYear = useCallback(async () => {
    try {
      const { referenceYear } = await form.validateFields()
      if (typeof referenceYear !== "number" || Number.isNaN(referenceYear)) return
      setPreferredBaseYearYear(orgId, referenceYear)
      messageApi.success("บันทึกปีฐานที่ใช้เปรียบเทียบแล้ว")
    } catch {
      /* validation */
    }
  }, [form, orgId, messageApi])

  const rangeLabel = latest ? formatDateRangeTh(latest.dat_start, latest.dat_end) : null
  const yearBounds = useMemo(() => {
    if (!latest) return { min: 1990, max: 2100 }
    const ys = new Date(latest.dat_start).getFullYear()
    const ye = new Date(latest.dat_end).getFullYear()
    const lo = Math.min(ys, ye)
    const hi = Math.max(ys, ye)
    return { min: Math.max(1990, lo - 1), max: Math.min(2100, hi + 1) }
  }, [latest])

  const renderHistoryRow = useCallback((row: BaseYearSnapshot, idx: number) => {
    const isFirst = idx === 0
    return (
      <div
        key={row.id}
        className="flex flex-col gap-1 rounded-xl border border-slate-200/80 bg-white/90 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <Typography.Text strong className="text-slate-800">
              {formatDateRangeTh(row.dat_start, row.dat_end)}
            </Typography.Text>
            {isFirst ? <Tag color="cyan">ล่าสุด</Tag> : null}
          </div>
          <Typography.Text type="secondary" className="text-xs">
            บันทึก {formatSavedAt(row.savedAt)}
            {row.vx_create != null && row.vx_create !== "" ? ` · ผลผลิตปีฐาน ${row.vx_create}` : ""}
            {row.unityLabel ? ` ${row.unityLabel}` : ""}
          </Typography.Text>
        </div>
      </div>
    )
  }, [])

  return (
    <div className="w-full min-w-0 space-y-6 pb-4">
      {contextHolder}

      <PageHeader
        title="ปีฐาน"
        description="กำหนดปีฐานอ้างอิงสำหรับเปรียบเทียบและติดตามเป้าหมาย — ค่าเริ่มต้นดึงจากข้อมูลปีฐานล่าสุดที่บันทึก"
      />

      {!latest ? (
        <Card
          className="overflow-hidden border-slate-200/90 shadow-sm ring-1 ring-slate-100/80"
          styles={{ body: { padding: 32 } }}
        >
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <Space direction="vertical" size="small" className="max-w-md">
                <Typography.Text strong className="text-base text-slate-800">
                  ยังไม่มีข้อมูลปีฐานในระบบ
                </Typography.Text>
                <Typography.Paragraph type="secondary" className="!mb-0 !text-sm !leading-relaxed">
                  กรุณาไปที่ <strong>กรอกข้อมูล</strong> แล้วกรอกส่วน{" "}
                  <strong>ช่วงปีฐาน (เริ่มต้น – สิ้นสุด)</strong> และผลผลิตปีฐานในขั้นข้อมูลทั่วไป
                  จากนั้นกด <strong>บันทึกร่าง</strong> หรือดำเนินการต่อจนถึงขั้นถัดไปเพื่อให้ระบบเก็บข้อมูลปีฐาน
                </Typography.Paragraph>
              </Space>
            }
          >
            <NavLink to="/app/data-input#section-base-year">
              <Button type="primary" size="large" className="signature-gradient border-0 !text-white">
                ไปกรอกข้อมูลปีฐาน
              </Button>
            </NavLink>
          </Empty>
        </Card>
      ) : (
        <>
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={14}>
              <Card
                className="h-full overflow-hidden border-slate-200/90 shadow-sm ring-1 ring-slate-100/80"
                styles={{ body: { padding: 24 } }}
              >
                <div className="mb-6 flex flex-wrap items-start gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-50 to-emerald-100/90 text-xl text-teal-800">
                    <FlagOutlined />
                  </span>
                  <div className="min-w-0 flex-1">
                    <Typography.Title level={4} className="!mb-1 !text-lg !font-semibold text-slate-900">
                      ข้อมูลปีฐานล่าสุด
                    </Typography.Title>
                    <Typography.Paragraph type="secondary" className="!mb-0 !text-sm !leading-relaxed">
                      มาจากการกรอกในเมนูกรอกข้อมูล (ขั้นข้อมูลทั่วไป) — อัปเดตล่าสุด{" "}
                      {formatSavedAt(latest.savedAt)}
                    </Typography.Paragraph>
                  </div>
                  <Tag icon={<DatabaseOutlined />} color="blue">
                    องค์กรนี้
                  </Tag>
                </div>

                <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-5">
                  <div className="mb-4 flex flex-wrap items-center gap-2">
                    <CalendarOutlined className="text-teal-700" />
                    <Typography.Text className="text-sm font-semibold text-slate-700">
                      ช่วงปีฐาน (อ้างอิง)
                    </Typography.Text>
                  </div>
                  <Typography.Title level={3} className="!mb-2 !mt-0 !text-2xl !font-bold tracking-tight text-slate-900">
                    {rangeLabel}
                  </Typography.Title>
                  <Typography.Text type="secondary" className="text-sm">
                    ค่าเริ่มต้นปีฐานเชิงตัวเลขจากช่วงนี้:{" "}
                    <Typography.Text strong className="text-slate-800">
                      {inferredYear != null ? `ปี ${inferredYear} (ค.ศ.)` : "—"}
                    </Typography.Text>
                  </Typography.Text>
                </div>

                {(latest.vx_create != null && latest.vx_create !== "") || latest.unityLabel ? (
                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-xl border border-slate-200/70 bg-white/90 px-4 py-3">
                      <Typography.Text type="secondary" className="text-xs font-semibold uppercase tracking-wide">
                        ผลผลิต (ปีฐาน)
                      </Typography.Text>
                      <Typography.Title level={4} className="!mb-0 !mt-2 !text-xl !font-semibold text-slate-900">
                        {latest.vx_create ?? "—"}
                      </Typography.Title>
                    </div>
                    <div className="rounded-xl border border-slate-200/70 bg-white/90 px-4 py-3">
                      <Typography.Text type="secondary" className="text-xs font-semibold uppercase tracking-wide">
                        หน่วย
                      </Typography.Text>
                      <Typography.Title level={4} className="!mb-0 !mt-2 !text-xl !font-semibold text-slate-900">
                        {latest.unityLabel ?? latest.unity ?? "—"}
                      </Typography.Title>
                    </div>
                  </div>
                ) : null}
              </Card>
            </Col>

            <Col xs={24} lg={10}>
              <Space direction="vertical" size={16} className="w-full">
                <Card
                  className="border-slate-200/90 shadow-sm ring-1 ring-slate-100/80"
                  styles={{ body: { padding: 24 } }}
                >
                  <div className="mb-4 flex items-center gap-2">
                    <FormOutlined className="text-teal-700" />
                    <Typography.Text strong className="text-slate-800">
                      ปีฐานที่ใช้เปรียบเทียบ
                    </Typography.Text>
                  </div>
                  <Alert
                    type="info"
                    showIcon
                    className="!mb-4"
                    message="ค่าเริ่มต้นจากข้อมูลล่าสุด"
                    description={`ระบบตั้งค่าเริ่มต้นเป็น ${displayYear ?? inferredYear ?? "—"} (ค.ศ.) คุณสามารถปรับได้หากต้องการใช้ปีอื่นเป็นจุดอ้างอิงหลัก`}
                  />
                  <Form form={form} layout="vertical" requiredMark={false}>
                    <Form.Item
                      name="referenceYear"
                      label="ปี (ค.ศ.) สำหรับเปรียบเทียบ / รายงาน"
                      rules={[
                        { required: true, message: "กรุณากรอกปี" },
                        {
                          validator: async (_, v) => {
                            if (v == null || v === "") {
                              return Promise.reject(new Error("กรุณากรอกปี"))
                            }
                            const n = Number(v)
                            if (Number.isNaN(n)) {
                              return Promise.reject(new Error("กรอกเป็นตัวเลขปี ค.ศ."))
                            }
                            if (n < yearBounds.min || n > yearBounds.max) {
                              return Promise.reject(
                                new Error(
                                  `แนะนำช่วง ${yearBounds.min}–${yearBounds.max} ให้สอดคล้องกับช่วงปีฐาน`,
                                ),
                              )
                            }
                            return Promise.resolve()
                          },
                        },
                      ]}
                    >
                      <InputNumber
                        className="!w-full"
                        min={1990}
                        max={2100}
                        placeholder="เช่น 2021"
                      />
                    </Form.Item>
                    <Button type="primary" block size="large" onClick={() => void onSaveReferenceYear()} className="signature-gradient border-0">
                      บันทึกการตั้งค่า
                    </Button>
                  </Form>
                </Card>

                <Card
                  className="border-slate-200/90 shadow-sm ring-1 ring-slate-100/80"
                  styles={{ body: { padding: 24 } }}
                >
                  <div className="mb-2 flex items-center gap-2">
                    <LineChartOutlined className="text-slate-500" />
                    <Typography.Text strong className="text-slate-800">
                      เทียบปีฐาน
                    </Typography.Text>
                  </div>
                  <Typography.Paragraph type="secondary" className="!mb-0 !text-sm !leading-relaxed">
                    เปอร์เซ็นต์เปลี่ยนแปลงจากปีฐานจะคำนวณได้เมื่อมีผลการปล่อยครบ — ดูสรุปได้ที่หน้าแดชบอร์ดและผลการคำนวณ
                  </Typography.Paragraph>
                </Card>
              </Space>
            </Col>
          </Row>

          {history.length > 0 ? (
            <Card
              title={
                <Space>
                  <HistoryOutlined />
                  <span>ประวัติการบันทึกปีฐาน</span>
                </Space>
              }
              className="border-slate-200/90 shadow-sm ring-1 ring-slate-100/80"
              styles={{ body: { padding: 20 } }}
            >
              <Space direction="vertical" size={12} className="w-full">
                {history.map((row, idx) => renderHistoryRow(row, idx))}
              </Space>
              <div className="mt-4 flex justify-end">
                <Button type="link">
                  <NavLink to="/app/data-input#section-base-year">แก้ไขข้อมูลปีฐานในกรอกข้อมูล</NavLink>
                </Button>
              </div>
            </Card>
          ) : null}
        </>
      )}
    </div>
  )
}