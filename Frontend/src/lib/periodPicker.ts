import dayjs, { type Dayjs } from "dayjs"
import isoWeek from "dayjs/plugin/isoWeek"
import weekOfYear from "dayjs/plugin/weekOfYear"
import {
  formatPeriodRoundLabel,
  periodRangeForAnchor,
  type PeriodGranularity,
} from "@/lib/periodGranularity"

dayjs.extend(isoWeek)
dayjs.extend(weekOfYear)

function deriveReportingYear(start: Dayjs, end: Dayjs): number {
  if (start.year() === end.year()) return end.year()
  const mid = start.add(end.diff(start, "day") / 2, "day")
  return mid.year()
}

export function periodBoundsFromPicker(
  granularity: PeriodGranularity,
  value: Dayjs | null | undefined,
): { start: Dayjs; end: Dayjs; reportingYear: number } | null {
  if (!value || !value.isValid()) return null
  const anchor = value.toDate()
  const { start, end } = periodRangeForAnchor(granularity, anchor)
  const startDj = dayjs(start)
  const endDj = dayjs(end)
  return {
    start: startDj.startOf("day"),
    end: endDj.endOf("day"),
    reportingYear: deriveReportingYear(startDj, endDj),
  }
}

export function pickerValueFromBounds(
  granularity: PeriodGranularity,
  start?: Dayjs | null,
  end?: Dayjs | null,
): Dayjs | null {
  void end
  if (!start?.isValid()) return null
  if (granularity === "daily") return start
  if (granularity === "weekly") return start.startOf("isoWeek")
  if (granularity === "monthly") return start.startOf("month")
  return start.startOf("year")
}

export function formatPickerPeriodSummary(
  granularity: PeriodGranularity,
  start: Dayjs,
  end: Dayjs,
): string {
  return formatPeriodRoundLabel(granularity, start.toDate(), end.toDate())
}

export const PERIOD_PICKER_CONFIG: Record<
  PeriodGranularity,
  { label: string; picker: "date" | "week" | "month" | "year"; placeholder: string; hint: string }
> = {
  daily: {
    label: "เลือกวัน",
    picker: "date",
    placeholder: "เลือกวันที่ต้องการกรอกข้อมูล",
    hint: "เลือกวันเดียว — ข้อมูลจะถูกรวมเข้าปีรายงานเมื่อคำนวณ",
  },
  weekly: {
    label: "เลือกสัปดาห์",
    picker: "week",
    placeholder: "เลือกสัปดาห์ (จันทร์–อาทิตย์)",
    hint: "เลือกสัปดาห์ — ระบบกำหนดช่วงจันทร์ถึงอาทิตย์ให้อัตโนมัติ",
  },
  monthly: {
    label: "เลือกเดือน",
    picker: "month",
    placeholder: "เลือกเดือน",
    hint: "เลือกเดือน — ระบบกำหนดวันแรกถึงวันสุดท้ายของเดือน",
  },
  yearly: {
    label: "เลือกปี",
    picker: "year",
    placeholder: "เลือกปี",
    hint: "เลือกปีปฏิทิน — ข้อมูลรายย่อยจะถูกรวมเป็นปีเดียวกันเมื่อคำนวณ",
  },
}
