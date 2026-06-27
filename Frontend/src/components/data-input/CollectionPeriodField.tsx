import { Alert, DatePicker, Form, Segmented, Typography } from "antd"
import type { Dayjs } from "dayjs"
import { PERIOD_GRANULARITY_OPTIONS, type PeriodGranularity } from "@/lib/periodGranularity"
import {
  PERIOD_PICKER_CONFIG,
  formatPickerPeriodSummary,
  periodBoundsFromPicker,
  pickerValueFromBounds,
} from "@/lib/periodPicker"

type CollectionPeriodFieldProps = {
  granularity: PeriodGranularity
  dateStart?: Dayjs
  dateEnd?: Dayjs
  reportingYear?: number
  onGranularityChange: (granularity: PeriodGranularity) => void
  onPeriodApply: (payload: {
    start: Dayjs
    end: Dayjs
    reportingYear: number
    pickerValue: Dayjs
  }) => void
}

export function CollectionPeriodField({
  granularity,
  dateStart,
  dateEnd,
  reportingYear,
  onGranularityChange,
  onPeriodApply,
}: CollectionPeriodFieldProps) {
  const cfg = PERIOD_PICKER_CONFIG[granularity]
  const pickerValue = pickerValueFromBounds(granularity, dateStart, dateEnd)

  return (
    <div className="space-y-4">
      <Form.Item
        name="collection_granularity"
        label="ความถี่ของรอบการเก็บข้อมูล"
        rules={[{ required: true, message: "เลือกความถี่" }]}
      >
        <Segmented
          block
          options={PERIOD_GRANULARITY_OPTIONS.map((o) => ({ label: o.label, value: o.value }))}
          onChange={(v) => onGranularityChange(v as PeriodGranularity)}
        />
      </Form.Item>

      <Alert type="info" showIcon className="!text-sm" message={cfg.hint} />

      <Form.Item
        label={cfg.label}
        required
        tooltip="เลือกช่วงตามความถี่ — ระบบจะบันทึกช่วงวันที่และปีรายงานสำหรับการรวมข้อมูลรายปี"
      >
        <DatePicker
          className="!w-full max-w-md"
          picker={cfg.picker}
          placeholder={cfg.placeholder}
          value={pickerValue}
          onChange={(value) => {
            const bounds = periodBoundsFromPicker(granularity, value)
            if (!bounds) return
            onPeriodApply({
              ...bounds,
              pickerValue: value!,
            })
          }}
        />
      </Form.Item>

      {dateStart && dateEnd ? (
        <div className="rounded-lg border border-slate-200/90 bg-slate-50/90 px-4 py-3 text-sm text-slate-700">
          <div>
            <span className="font-medium text-teal-800">ช่วงที่เลือก: </span>
            {formatPickerPeriodSummary(granularity, dateStart, dateEnd)}
          </div>
          <Typography.Text type="secondary" className="mt-1 block text-xs">
            {dateStart.format("YYYY-MM-DD")} ถึง {dateEnd.format("YYYY-MM-DD")}
            {reportingYear != null ? ` · ปีรายงานสำหรับคำนวณ: ${reportingYear}` : ""}
          </Typography.Text>
        </div>
      ) : (
        <Typography.Text type="secondary" className="text-sm">
          ยังไม่ได้เลือกช่วง — กรุณาเลือกจากปฏิทินด้านบน
        </Typography.Text>
      )}
    </div>
  )
}
