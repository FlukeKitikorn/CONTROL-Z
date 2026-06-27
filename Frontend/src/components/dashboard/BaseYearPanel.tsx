import {
  CalendarOutlined,
  EditOutlined,
  FlagOutlined,
  FormOutlined,
  HistoryOutlined,
  SaveOutlined,
} from "@ant-design/icons"
import {
  Alert,
  Button,
  Col,
  Collapse,
  DatePicker,
  Descriptions,
  Drawer,
  Empty,
  Form,
  Input,
  Pagination,
  Row,
  Select,
  Space,
  Spin,
  Tag,
  Typography,
  message,
} from "antd"
import dayjs, { type Dayjs } from "dayjs"
import { useCallback, useEffect, useMemo, useState } from "react"
import { Link } from "react-router"
import type { CollectInformationRead } from "@/lib/api/types"
import { listCollectInformation } from "@/lib/api/service"
import { pipeRangeLabel } from "@/lib/collectInformationRange"
import { DECIMAL_NUMBER_RULES, PRODUCT_UNIT_OPTIONS, resolveProductUnitLabel } from "@/lib/productUnitOptions"
import {
  CONTROL_Z_BASE_YEAR_UPDATED,
  appendBaseYearSnapshot,
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

const { RangePicker } = DatePicker
const HISTORY_PAGE_SIZE = 5

function referenceYearFromBaseYearField(raw: string): number | null {
  if (!raw?.includes("|")) return null
  const [a, b] = raw.split("|").map((x) => x.trim())
  if (!a || !b) return null
  const y1 = new Date(a).getFullYear()
  const y2 = new Date(b).getFullYear()
  if (Number.isNaN(y1) || Number.isNaN(y2)) return null
  return Math.max(y1, y2)
}

function yearOptionsFromCollectRows(rows: CollectInformationRead[]): { value: number; label: string }[] {
  const byYear = new Map<number, string>()
  for (const row of rows) {
    const y = referenceYearFromBaseYearField(row.base_year)
    if (y == null) continue
    const rangeLabel = pipeRangeLabel(row.base_year)
    const label = rangeLabel ? `ปี ${y} (ค.ศ.) · ${rangeLabel}` : `ปี ${y} (ค.ศ.) · ชุดข้อมูล #${row.ciid}`
    if (!byYear.has(y)) byYear.set(y, label)
  }
  return [...byYear.entries()]
    .map(([value, label]) => ({ value, label }))
    .sort((a, b) => b.value - a.value)
}

function formatSavedAt(iso: string): string {
  try {
    return new Intl.DateTimeFormat("th-TH", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso))
  } catch {
    return iso
  }
}

type BaseYearFormValues = {
  datRange: [Dayjs, Dayjs]
  vx_create: string
  unity: string
  referenceYear: number
}

type BaseYearSettingsDrawerProps = {
  open: boolean
  onClose: () => void
}

/** ตั้งค่าปีฐานเต็มรูปแบบ — เปิดจากปุ่มบนแดชบอร์ด (ไม่แสดง inline) */
export function BaseYearSettingsDrawer({ open, onClose }: BaseYearSettingsDrawerProps) {
  const user = useAuthStore((s) => s.user)
  const orgId = useMemo(() => getOrganizationStorageId(user), [user])
  const orgIdNum = useMemo(() => {
    const id = user?.organization_id
    if (id === undefined || id === null) return null
    const n = typeof id === "number" ? id : Number.parseInt(String(id), 10)
    return Number.isFinite(n) ? n : null
  }, [user?.organization_id])

  const [tick, setTick] = useState(0)
  const [collectRows, setCollectRows] = useState<CollectInformationRead[]>([])
  const [collectLoading, setCollectLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [historyPage, setHistoryPage] = useState(1)
  const [messageApi, contextHolder] = message.useMessage()
  const [form] = Form.useForm<BaseYearFormValues>()

  useEffect(() => {
    const bump = () => setTick((t) => t + 1)
    window.addEventListener(CONTROL_Z_BASE_YEAR_UPDATED, bump as EventListener)
    window.addEventListener("storage", bump)
    return () => {
      window.removeEventListener(CONTROL_Z_BASE_YEAR_UPDATED, bump as EventListener)
      window.removeEventListener("storage", bump)
    }
  }, [])

  useEffect(() => {
    if (!open || orgIdNum == null) return
    let cancelled = false
    setCollectLoading(true)
    void listCollectInformation(orgIdNum)
      .then((rows) => {
        if (!cancelled) setCollectRows(rows)
      })
      .catch(() => {
        if (!cancelled) setCollectRows([])
      })
      .finally(() => {
        if (!cancelled) setCollectLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [orgIdNum, tick, open])

  const latest = useMemo(() => getLatestBaseYearSnapshot(orgId), [orgId, tick])
  const historySorted = useMemo(() => {
    return [...loadBaseYearSnapshots(orgId)].sort((a, b) => (a.savedAt < b.savedAt ? 1 : -1))
  }, [orgId, tick])

  const displayYear = useMemo(() => getPreferredBaseYearYear(orgId, latest), [orgId, latest, tick])
  const inferredYear = latest ? defaultYearFromSnapshot(latest) : null

  const referenceYearOptions = useMemo(() => {
    const fromDb = yearOptionsFromCollectRows(collectRows)
    if (fromDb.length > 0) return fromDb
    if (inferredYear != null) return [{ value: inferredYear, label: `ปี ${inferredYear} (ค.ศ.) · จากช่วงปีฐาน` }]
    return []
  }, [collectRows, inferredYear])

  useEffect(() => {
    if (!open || !latest) return
    form.setFieldsValue({
      datRange: [dayjs(latest.dat_start), dayjs(latest.dat_end)],
      vx_create: latest.vx_create ?? "",
      unity: latest.unity ?? undefined,
      referenceYear: displayYear ?? inferredYear ?? undefined,
    })
  }, [open, latest, displayYear, inferredYear, form, tick])

  const onSaveBaseYear = useCallback(async () => {
    try {
      const { datRange, vx_create, unity } = await form.validateFields(["datRange", "vx_create", "unity"])
      if (!datRange?.[0] || !datRange?.[1]) return
      setSaving(true)
      appendBaseYearSnapshot(orgId, {
        dat_start: datRange[0].format("YYYY-MM-DD"),
        dat_end: datRange[1].format("YYYY-MM-DD"),
        vx_create: String(vx_create),
        unity: String(unity),
        unityLabel: resolveProductUnitLabel(String(unity)),
      })
      messageApi.success("บันทึกข้อมูลปีฐานแล้ว")
      setTick((t) => t + 1)
    } catch {
      /* validation */
    } finally {
      setSaving(false)
    }
  }, [form, orgId, messageApi])

  const onSaveReferenceYear = useCallback(async () => {
    try {
      const { referenceYear } = await form.validateFields(["referenceYear"])
      if (typeof referenceYear !== "number") return
      setPreferredBaseYearYear(orgId, referenceYear)
      messageApi.success("บันทึกปีอ้างอิงสำหรับเปรียบเทียบแล้ว")
      setTick((t) => t + 1)
    } catch {
      /* validation */
    }
  }, [form, orgId, messageApi])

  const historyTotal = historySorted.length
  const historySlice = useMemo(() => {
    const start = (historyPage - 1) * HISTORY_PAGE_SIZE
    return historySorted.slice(start, start + HISTORY_PAGE_SIZE)
  }, [historySorted, historyPage])

  return (
    <>
      {contextHolder}
      <Drawer
        id="base-year-settings"
        title={
          <Space>
            <FlagOutlined className="text-teal-700" />
            <span>ตั้งค่าปีฐานและการเปรียบเทียบ</span>
          </Space>
        }
        placement="right"
        width={Math.min(720, typeof window !== "undefined" ? window.innerWidth - 24 : 720)}
        open={open}
        onClose={onClose}
        destroyOnClose={false}
        extra={
          <Link to="/app/data-input">
            <Button type="link" size="small" icon={<EditOutlined />}>
              กรอกข้อมูลรอบ
            </Button>
          </Link>
        }
      >
        <Typography.Paragraph type="secondary" className="!mb-5 !text-sm !leading-relaxed">
          กำหนดช่วงปีฐาน ผลผลิต และปีอ้างอิง — แดชบอร์ดแสดงเฉพาะภาพรวม เปิดหน้านี้เมื่อต้องการปรับค่าเปรียบเทียบ
        </Typography.Paragraph>

        <Form form={form} layout="vertical" requiredMark={false}>
          <div className="rounded-xl border border-teal-100/80 bg-gradient-to-b from-teal-50/40 to-white p-4">
            <div className="mb-3 flex items-center gap-2">
              <FormOutlined className="text-teal-700" />
              <Typography.Text strong>กำหนดปีฐาน</Typography.Text>
            </div>
            <Form.Item
              name="datRange"
              label="ช่วงปีฐาน (เริ่มต้น – สิ้นสุด)"
              rules={[{ required: true, message: "เลือกช่วงปีฐาน" }]}
            >
              <RangePicker className="!w-full" format="YYYY-MM-DD" />
            </Form.Item>
            <Row gutter={16}>
              <Col xs={24} sm={14}>
                <Form.Item name="vx_create" label="ผลผลิต (ปีฐาน)" rules={[...DECIMAL_NUMBER_RULES]}>
                  <Input inputMode="decimal" placeholder="ตัวเลข / ทศนิยม" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={10}>
                <Form.Item name="unity" label="หน่วย (ปีฐาน)" rules={[{ required: true, message: "เลือกหน่วย" }]}>
                  <Select placeholder="เลือกหน่วย" options={[...PRODUCT_UNIT_OPTIONS]} />
                </Form.Item>
              </Col>
            </Row>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              loading={saving}
              onClick={() => void onSaveBaseYear()}
              className="signature-gradient border-0"
            >
              บันทึกปีฐาน
            </Button>
          </div>

          {latest ? (
            <div className="mt-4 rounded-lg border border-slate-200/70 bg-slate-50/50 px-4 py-3">
              <Typography.Text type="secondary" className="text-xs">
                ปีฐานล่าสุด
              </Typography.Text>
              <Typography.Text strong className="mt-1 block">
                {formatDateRangeTh(latest.dat_start, latest.dat_end)}
              </Typography.Text>
              <Descriptions
                size="small"
                column={1}
                className="mt-2"
                items={[
                  { key: "saved", label: "บันทึกเมื่อ", children: formatSavedAt(latest.savedAt) },
                  {
                    key: "prod",
                    label: "ผลผลิตปีฐาน",
                    children:
                      latest.vx_create != null
                        ? `${latest.vx_create} ${latest.unityLabel ?? latest.unity ?? ""}`
                        : "—",
                  },
                ]}
              />
            </div>
          ) : (
            <Alert className="mt-4" type="info" showIcon message="ยังไม่มีข้อมูลปีฐาน" />
          )}

          <div className="mt-6 rounded-xl border border-slate-200/80 p-4">
            <div className="mb-3 flex items-center gap-2">
              <CalendarOutlined className="text-teal-700" />
              <Typography.Text strong>ปีอ้างอิงสำหรับเปรียบเทียบ</Typography.Text>
            </div>
            <Form.Item
              name="referenceYear"
              label="ปี (ค.ศ.)"
              rules={[{ required: true, message: "เลือกปีอ้างอิง" }]}
            >
              <Spin spinning={collectLoading}>
                <Select
                  size="large"
                  className="w-full"
                  placeholder={referenceYearOptions.length ? "เลือกปี" : "บันทึกปีฐานก่อน"}
                  options={referenceYearOptions}
                  disabled={referenceYearOptions.length === 0}
                />
              </Spin>
            </Form.Item>
            <Button block size="large" onClick={() => void onSaveReferenceYear()} disabled={referenceYearOptions.length === 0}>
              บันทึกปีอ้างอิง
            </Button>
            {displayYear != null ? (
              <Tag color="processing" className="mt-3">
                กำลังใช้ปี {displayYear} เป็นปีฐานอ้างอิง
              </Tag>
            ) : null}
          </div>
        </Form>

        <Collapse
          className="mt-6 !bg-transparent"
          items={[
            {
              key: "history",
              label: (
                <Space>
                  <HistoryOutlined />
                  <span>ประวัติการบันทึกปีฐาน</span>
                  <Tag>{historyTotal}</Tag>
                </Space>
              ),
              children:
                historyTotal > 0 ? (
                  <Space direction="vertical" size={10} className="w-full">
                    {historySlice.map((row: BaseYearSnapshot) => (
                      <div
                        key={row.id}
                        className="rounded-lg border border-slate-200/80 bg-slate-50/40 px-3 py-2.5 text-sm"
                      >
                        <Typography.Text strong>{formatDateRangeTh(row.dat_start, row.dat_end)}</Typography.Text>
                        <Typography.Text type="secondary" className="block text-xs">
                          {formatSavedAt(row.savedAt)}
                          {row.vx_create ? ` · ${row.vx_create} ${row.unityLabel ?? row.unity ?? ""}` : ""}
                        </Typography.Text>
                      </div>
                    ))}
                    {historyTotal > HISTORY_PAGE_SIZE ? (
                      <Pagination
                        size="small"
                        current={historyPage}
                        pageSize={HISTORY_PAGE_SIZE}
                        total={historyTotal}
                        onChange={setHistoryPage}
                        showSizeChanger={false}
                      />
                    ) : null}
                  </Space>
                ) : (
                  <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="ยังไม่มีประวัติ" />
                ),
            },
          ]}
        />
      </Drawer>
    </>
  )
}
