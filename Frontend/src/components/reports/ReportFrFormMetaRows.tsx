import { Col, Row } from "antd"

const cell = "border border-black bg-white px-[10px] py-[5px] text-base leading-snug align-top"
const labelCell = `${cell} bg-[#92cd8c] text-center font-bold`

export type ReportFrFormMetaRowsProps = {
  formNameValue: string
  organizationName: string
  displayFormCode: string
  agencyName: string
  preparedDate: string
  /** หมายเลขหน้าในแถวเมตา (ค่าเริ่มต้น 1) */
  pageNumber?: string
}

/**
 * สองแถวเมตาใต้หัวเขียว (ชื่อฟอร์ม / รหัสฟอร์ม) — ใช้ร่วมทุกแบบ Fr_xx
 */
export function ReportFrFormMetaRows({
  formNameValue,
  organizationName,
  displayFormCode,
  agencyName,
  preparedDate,
  pageNumber = "1",
}: ReportFrFormMetaRowsProps) {
  return (
    <>
      <Row gutter={0}>
        <Col span={4} className={labelCell}>
          ชื่อฟอร์ม
        </Col>
        <Col span={8} className={cell}>
          {formNameValue}
        </Col>
        <Col span={4} className={labelCell}>
          องค์กร
        </Col>
        <Col span={4} className={cell}>
          {organizationName}
        </Col>
        <Col span={2} className={labelCell}>
          หน้าที่
        </Col>
        <Col span={2} className={`${cell} text-center`}>
          {pageNumber}
        </Col>
      </Row>

      <Row gutter={0}>
        <Col span={4} className={labelCell}>
          รหัสฟอร์ม
        </Col>
        <Col span={8} className={cell}>
          {displayFormCode}
        </Col>
        <Col span={4} className={labelCell}>
          ผู้จัดทำ
        </Col>
        <Col span={4} className={cell}>
          {agencyName}
        </Col>
        <Col span={2} className={labelCell}>
          วันที่จัดทำ
        </Col>
        <Col span={2} className={cell}>
          {preparedDate}
        </Col>
      </Row>
    </>
  )
}
