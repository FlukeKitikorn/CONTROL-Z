import { Col, Row } from "antd"
import { useMemo } from "react"
import {
  type Fr02OrganizationMapViewModel,
  mergeFr02OrganizationMapModel,
} from "@/pages/reports/fr02/fr02OrganizationMapModel"

/** ไม่ใส่ px แนวนอน — ให้กว้างเท่าแถวเมตา/หัวด้านบนในเลย์เอาต์เดียวกัน */
const shell =
  "bg-[#f8f9fa] pb-4 pt-0 font-[family-name:var(--font-fr02,'TH_Sarabun_New','Sarabun',sans-serif)] text-base text-black"

const footerLabel =
  "flex min-h-[52px] items-center justify-center border border-black bg-[#1c4d7e] px-2 py-3 text-center text-sm font-bold text-white sm:text-base"

const footerValue =
  "flex min-h-[52px] items-center justify-center border border-black bg-[#d9e4ef] px-3 py-3 text-center text-sm text-black sm:text-base"

export type Fr02OrganizationMapReportTemplateProps = {
  /** Fr_02: แผนภาพองค์กร — Fr_03.1: แผนภาพแสดงโครงสร้าง… */
  diagramSectionTitle: string
  model?: Partial<Fr02OrganizationMapViewModel>
  /** เฉพาะ Fr_03.1 — แถว จัดทำโดย / เสร็จสิ้นวันที่ อยู่นอกกล่องขาว ปิดท้ายด้านล่าง */
  showCompletionFooter?: boolean
}

/**
 * แบบฟอร์มตาม fr_02.html — ไม่มีอัปโหลด แสดงรูปจาก DB เท่านั้น
 */
export function Fr02OrganizationMapReportTemplate({
  diagramSectionTitle,
  model: modelProp,
  showCompletionFooter = false,
}: Fr02OrganizationMapReportTemplateProps) {
  const model = useMemo(() => mergeFr02OrganizationMapModel(modelProp), [modelProp])

  return (
    <div className={shell}>
      {/* เว้นระยะจากหัวรายงาน/เมตาด้านบน */}
      <div className="mt-5 w-full border border-black bg-white py-8 text-center">
        <h2 className="mb-6 mt-0 px-4 text-2xl font-semibold leading-snug text-black">{diagramSectionTitle}</h2>

        <div className="flex w-full min-h-[400px] items-center justify-center border-y border-[#ccc] bg-white px-2 py-4 sm:px-3">
          {model.organizationMapImageUrl ? (
            <img
              src={model.organizationMapImageUrl}
              alt="แผนภาพองค์กร"
              className="box-border w-full max-w-full border border-[#ddd] object-contain"
              style={{ maxHeight: "min(72vh, 900px)" }}
            />
          ) : (
            <span className="text-neutral-600">{"{IMAGE_URL_FROM_DB_ORGANIZATION_MAP}"}</span>
          )}
        </div>
      </div>

      {showCompletionFooter ? (
        <Row gutter={0} className="mt-2 w-full">
          <Col span={3} className={footerLabel}>
            จัดทำโดย
          </Col>
          <Col span={13} className={footerValue}>
            {model.footerPreparedBy}
          </Col>
          <Col span={4} className={footerLabel}>
            เสร็จสิ้นวันที่
          </Col>
          <Col span={4} className={footerValue}>
            {model.footerCompletedDate}
          </Col>
        </Row>
      ) : null}
    </div>
  )
}
