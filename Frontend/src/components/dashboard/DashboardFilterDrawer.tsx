import { FilterOutlined } from "@ant-design/icons"
import { Button, Drawer, Form, Segmented, Select, Space, Switch, Tag, Typography } from "antd"
import {
  COMPARE_MODE_OPTIONS,
  type CompareMode,
} from "@/lib/dashboardComparisons"
import { formatDateRangeTh } from "@/lib/organizationBaseYearStorage"
import {
  PERIOD_GRANULARITY_OPTIONS,
  type PeriodGranularity,
} from "@/lib/periodGranularity"

export type DashboardFilterState = {
  compareMode: CompareMode
  year: number
  granularity: PeriodGranularity
  facility: string
  useMockViz: boolean
}

type FacilityOption = { value: string; label: string }
type YearOption = { value: number; label: string }

type DashboardFilterDrawerProps = {
  open: boolean
  onClose: () => void
  filters: DashboardFilterState
  yearOptions: YearOption[]
  facilityOptions: FacilityOption[]
  referenceBaseYear: number | null
  baseYearRange: { dat_start: string; dat_end: string } | null
  onChange: (patch: Partial<DashboardFilterState>) => void
  onOpenBaseYear: () => void
}

export function DashboardFilterDrawer({
  open,
  onClose,
  filters,
  yearOptions,
  facilityOptions,
  referenceBaseYear,
  baseYearRange,
  onChange,
  onOpenBaseYear,
}: DashboardFilterDrawerProps) {
  return (
    <Drawer
      title={
        <Space>
          <FilterOutlined className="text-teal-700" />
          <span>ตัวกรองและมุมมอง</span>
        </Space>
      }
      placement="right"
      width={400}
      open={open}
      onClose={onClose}
    >
      <Typography.Paragraph type="secondary" className="!mb-5 !text-sm">
        ปรับการเปรียบเทียบ ช่วงเวลา และพื้นที่ — แดชบอร์ดแสดงเฉพาะภาพรวม
      </Typography.Paragraph>

      <Form layout="vertical" requiredMark={false} className="space-y-1">
        <Form.Item label="โหมดเปรียบเทียบ" className="!mb-4">
          <Segmented
            block
            value={filters.compareMode}
            onChange={(v) => onChange({ compareMode: v as CompareMode })}
            options={COMPARE_MODE_OPTIONS.map((o) => ({ label: o.short, value: o.value }))}
          />
        </Form.Item>

        <Form.Item label="ปีที่ดู (ช่วงรายงาน)" className="!mb-4">
          <Select
            size="large"
            className="w-full"
            value={filters.year}
            options={yearOptions}
            onChange={(v) => onChange({ year: v })}
          />
        </Form.Item>

        <Form.Item label="ความถี่รอบข้อมูล" className="!mb-4">
          <Select
            size="large"
            className="w-full"
            value={filters.granularity}
            options={PERIOD_GRANULARITY_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
            onChange={(v) => onChange({ granularity: v })}
          />
        </Form.Item>

        <Form.Item label="สถานที่ / พื้นที่" className="!mb-4">
          <Select
            size="large"
            className="w-full"
            value={filters.facility}
            options={facilityOptions}
            onChange={(v) => onChange({ facility: v })}
          />
        </Form.Item>

        <Form.Item label="ข้อมูลจำลอง (ทดสอบ UI)" className="!mb-4">
          <Space>
            <Switch checked={filters.useMockViz} onChange={(c) => onChange({ useMockViz: c })} />
            <Typography.Text type="secondary" className="text-sm">
              ไม่เรียก API จริง
            </Typography.Text>
          </Space>
        </Form.Item>
      </Form>

      <div className="mt-2 rounded-xl border border-slate-200/80 bg-slate-50/60 p-4">
        <Typography.Text strong className="block text-sm text-slate-800">
          ปีฐานอ้างอิง
        </Typography.Text>
        <div className="mt-2 flex flex-wrap gap-2">
          {referenceBaseYear != null ? (
            <Tag color="processing">ปี {referenceBaseYear} (ค.ศ.)</Tag>
          ) : (
            <Tag>ยังไม่ตั้งค่า</Tag>
          )}
          {baseYearRange ? (
            <Tag>{formatDateRangeTh(baseYearRange.dat_start, baseYearRange.dat_end)}</Tag>
          ) : null}
        </div>
        <Button type="link" className="!mt-2 !px-0" onClick={() => { onClose(); onOpenBaseYear() }}>
          เปิดตั้งค่าปีฐาน →
        </Button>
      </div>

      <Button type="primary" block size="large" className="signature-gradient !mt-6 border-0" onClick={onClose}>
        ใช้ตัวกรองนี้
      </Button>
    </Drawer>
  )
}
