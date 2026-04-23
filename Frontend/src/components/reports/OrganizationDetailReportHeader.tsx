import { Col, Row } from "antd"
import { Fragment, type ReactNode } from "react"

const cell =
  "border border-black bg-white px-[10px] py-[5px] text-base leading-snug align-top text-black"

export type OrganizationDetailReportHeaderProps = {
  organizationName: string
  /** หัวข้อแถบเขียวซ้าย */
  sectionTitle?: string
  /** บรรทัดแรกมุมขวา (รหัสอ้างอิงแบบฟอร์ม) */
  referenceCode?: string
  /** บรรทัดที่สองมุมขวา (เวอร์ชัน) */
  referenceVersion?: string
  /**
   * เนื้อหาระหว่างแถบหัวเขียวกับแถบชื่อองค์กรกลาง
   * (เช่น แถวเมตาของแบบฟอร์ม Fr_01)
   */
  children?: ReactNode
  /** คลาสเพิ่มบนห่อนอก (เช่น ฟอนต์รายงาน) — ถ้าไม่ส่ง จะไม่ห่อ div เพิ่ม */
  className?: string
}

const defaults = {
  sectionTitle: "รายละเอียดขององค์กร",
  referenceCode: "TCFO_R_01",
  referenceVersion: "Version 04 : 21/2/2020",
} as const

/**
 * หัวรายงานส่วน "รายละเอียดขององค์กร" + ช่อง children (ถ้ามี) + แถบชื่อองค์กรกลาง
 * ใช้ซ้ำได้หลายแบบฟอร์ม — ปรับ referenceCode / referenceVersion ตามรหัสแบบ
 */
export function OrganizationDetailReportHeader({
  organizationName,
  sectionTitle = defaults.sectionTitle,
  referenceCode = defaults.referenceCode,
  referenceVersion = defaults.referenceVersion,
  children,
  className,
}: OrganizationDetailReportHeaderProps) {
  const body = (
    <Fragment>
      <Row gutter={0}>
        <Col span={18} className="bg-[#92cd8c] py-3 text-center">
          <h3 className="m-0 text-2xl font-semibold leading-tight">{sectionTitle}</h3>
        </Col>
        <Col span={6} className="bg-[#92cd8c] py-2 text-center text-base leading-snug">
          {referenceCode} <br /> {referenceVersion}
        </Col>
      </Row>

      {children}

      {/* เว้นระหว่างเมตากับชื่อองค์กรเท่าเดิม — ไม่เว้นใต้แถบนี้ เพื่อให้ต่อเนื้อหาด้านล่างได้ชิด */}
      <Row gutter={0} className="mt-3 mb-0">
        <Col span={24} className={`${cell} py-2 text-center`}>
          <h4 className="m-0 text-xl font-semibold">{organizationName}</h4>
        </Col>
      </Row>
    </Fragment>
  )

  if (className) {
    return <div className={className}>{body}</div>
  }
  return body
}
