/**
 * REFACTOR(CANDIDATE-REMOVAL): ไม่ถูก import — Phase A dead-code audit
 * โค้ดเดิมคอมเมนต์ไว้ด้านล่าง ลบไฟล์ได้เมื่อยืนยัน
 */
export {}

/*
import { Tag } from "antd"

export type DataStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "CALCULATED"

const statusColorMap: Record<DataStatus, string> = {
  NOT_STARTED: "default",
  IN_PROGRESS: "processing",
  COMPLETED: "success",
  CALCULATED: "green",
}

const statusLabelTh: Record<DataStatus, string> = {
  NOT_STARTED: "ยังไม่เริ่ม",
  IN_PROGRESS: "กำลังดำเนินการ",
  COMPLETED: "กรอกครบแล้ว",
  CALCULATED: "คำนวณแล้ว",
}

export function StatusTag({ status }: { status: DataStatus }) {
  return <Tag color={statusColorMap[status]}>{statusLabelTh[status]}</Tag>
}
*/
