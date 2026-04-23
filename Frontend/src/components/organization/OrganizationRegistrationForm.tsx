import {
  BankOutlined,
  BarChartOutlined,
  SaveOutlined,
  DeleteOutlined,
  EnvironmentOutlined,
  PlusOutlined,
  UploadOutlined,
} from "@ant-design/icons"
import {
  Alert,
  App,
  Button,
  Col,
  Flex,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Typography,
  Upload,
  DatePicker,
} from "antd"
import type { UploadFile } from "antd/es/upload/interface"
import type { ReactNode } from "react"
import { PageHeader } from "@/components/common/PageHeader"

export type OrganizationRegistrationVariant = "admin" | "user"

const MAX_IMAGE_MB = 2

const BUSINESS_TYPE_OPTIONS = [
  { value: "industry", label: "Industrial" },
  { value: "services", label: "Services" },
  { value: "agriculture", label: "Agriculture" },
  { value: "commerce", label: "Retail / wholesale" },
  { value: "technology", label: "Technology / digital" },
  { value: "energy", label: "Energy" },
  { value: "other", label: "Other" },
]

const BUSINESS_SIZE_OPTIONS = [
  { value: "micro", label: "Micro" },
  { value: "sme", label: "SME" },
  { value: "large", label: "Large enterprise" },
  { value: "enterprise", label: "Corporate / group" },
]

const LEGAL_ENTITY_OPTIONS = [
  { value: "ltd", label: "Co., Ltd." },
  { value: "plc", label: "Public company" },
  { value: "partnership", label: "Partnership" },
  { value: "government", label: "Government / state enterprise" },
  { value: "foundation", label: "Foundation / association" },
  { value: "other", label: "Other" },
]

const COPY: Record<
  OrganizationRegistrationVariant,
  {
    pageTitle: string
    pageDescription: string
    alertTitle: string
    alertDescription: ReactNode
    evidenceHelper: string
    footerHintDesktop: string
    footerHintMobile: string
    successMessage: string
    resetMessage: string
    submitLabel: string
    consoleLogPrefix: string
  }
> = {
  admin: {
    pageTitle: "ลงทะเบียนองค์กร",
    pageDescription:
      "ข้อมูลหน่วยงานและองค์กร, ข้อมูลติดต่อ และสถิติ",
    alertTitle: "การตรวจสอบข้อมูล",
    alertDescription: (
      <ul className="mb-0 list-disc space-y-1.5 pl-4 text-sm text-slate-700">
        <li>ฟิลด์ที่จำเป็นต้องกรอกให้ครบก่อนจึงจะสามารถส่งได้</li>
        <li>รูปภาพ: ขนาดไม่เกิน 2 MB รองรับ JPG / PNG </li>
        <li>อีเมลต้องถูกต้อง (เช่น name@company.com)</li>
      </ul>
    ),
    evidenceHelper:
      "อัปโหลดแบบรายการไฟล์ (แสดงเฉพาะชื่อไฟล์ ไม่มีตัวอย่างรูป) โดยตรวจสอบประเภทและขนาดไฟล์ตามที่ระบบจริงกำหนด",
    footerHintDesktop: "เมื่อกดบันทึก ระบบจะเขียนข้อมูลลงใน console ของเบราว์เซอร์เท่านั้น",
    footerHintMobile: "แสดงใน console เท่านั้น",
    successMessage: "บันทึกแล้ว — ตรวจสอบใน console (ยังไม่มีการเรียก API)",
    resetMessage: "รีเซ็ตฟอร์มแล้ว",
    submitLabel: "บันทึก (demo)",
    consoleLogPrefix: "[admin ลงทะเบียนองค์กร]",
  },
  user: {
    pageTitle: "ตั้งค่าองค์กร",
    pageDescription:
      "ข้อมูลหน่วยงานและองค์กร, ข้อมูลติดต่อ และสถิติ",
    alertTitle: "ก่อนกรอก",
    alertDescription: (
      <ul className="mb-0 list-disc space-y-1.5 pl-4 text-sm text-slate-700">
        <li>ฟิลด์ที่จำเป็นต้องกรอกให้ครบก่อนบันทึก</li>
        <li>รูปภาพแต่ละไฟล์ขนาดไม่เกิน 2MB — รองรับ JPG, PNG</li>
        <li>อีเมลต้องถูกต้อง (เช่น name@company.com)</li>
      </ul>
    ),
    evidenceHelper:
      "อัปโหลดแบบรายการไฟล์",
    footerHintDesktop:
      "หลังบันทึก สามารถดูข้อมูลได้ใน console ของเบราว์เซอร์ (ยังไม่ส่งไปเซิร์ฟเวอร์)",
    footerHintMobile: "ดูใน console",
    successMessage:
      "บันทึกแล้ว ",
    resetMessage: "ล้างฟอร์มแล้ว",
    submitLabel: "บันทึกองค์กร",
    consoleLogPrefix: "[user organization setup]",
  },
}

const resetForm = () => {
  console.log("resetForm")
  // if (!user) return
  // form.setFieldsValue({
  //   prefix: user.prefix,
  //   fname: user.fname,
  //   lname: user.lname,
  //   address: user.address,
  //   subdistrict: user.subdistrict,
  //   district: user.district,
  //   province: user.province,
  //   postal_code: user.postal_code,
  //   phone: user.phone,
  //   email: user.email,
  //   username: user.username,
  //   password: undefined,
  //   confirm_password: undefined,
  //   organization_id: user.organization_id,
  }// )
//    profilePhotoRef.current?.reset()
// }

function normFile(e: { fileList?: UploadFile[] }) {
  return e?.fileList ?? []
}

function FormSection({
  id,
  icon,
  title,
  description,
  children,
}: {
  id?: string
  icon: ReactNode
  title: string
  description?: string
  children: ReactNode
}) {
  return (
    <section
      id={id}
      className="scroll-mt-24 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm ring-1 ring-slate-100/80 md:p-8"
    >
      <header className="mb-6 flex gap-4 border-b border-slate-100 pb-5">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-50 to-teal-100/80 text-xl text-teal-800 shadow-sm">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <Typography.Title level={4} className="!mb-1 !text-lg !font-semibold !text-slate-900 md:!text-xl">
            {title}
          </Typography.Title>
          {description ? (
            <Typography.Paragraph type="secondary" className="!mb-0 !text-sm leading-relaxed">
              {description}
            </Typography.Paragraph>
          ) : null}
        </div>
      </header>
      <div className="flex flex-col gap-0">{children}</div>
    </section>
  )
}

function createImageBeforeUpload(showError: (content: string) => void, fieldLabel: string) {
  return (file: File) => {
    const okType = /^image\/(jpeg|png|webp|gif)$/i.test(file.type)
    if (!okType) {
      showError(`${fieldLabel}: JPG, PNG, WEBP, or GIF only`)
      return Upload.LIST_IGNORE
    }
    const mb = file.size / 1024 / 1024
    if (mb > MAX_IMAGE_MB) {
      showError(`${fieldLabel}: max ${MAX_IMAGE_MB} MB per file`)
      return Upload.LIST_IGNORE
    }
    return false
  }
}

type OrganizationRegistrationFormProps = {
  variant: OrganizationRegistrationVariant
}

export function OrganizationRegistrationForm({ variant }: OrganizationRegistrationFormProps) {
  const { message } = App.useApp()
  const [form] = Form.useForm()
  const c = COPY[variant]
  const beforeLogo = createImageBeforeUpload(message.error, "Logo")
  const beforeMap = createImageBeforeUpload(message.error, "Location map")
  const beforeStructure = createImageBeforeUpload(message.error, "Org chart")

  const onFinish = (values: Record<string, unknown>) => {
    console.info(c.consoleLogPrefix, values)
    message.success(c.successMessage)
  }

  return (
    <div className="org-registration w-full min-w-0 px-1 pb-28 sm:px-2 md:px-0">
      <div className="mb-6">
        <PageHeader title={c.pageTitle} description={c.pageDescription} />
      </div>

      <Alert
        type="info"
        showIcon
        className="border-teal-100 bg-teal-50/60"
        message={c.alertTitle}
        description={c.alertDescription}
        closable
      />

      <Form
        form={form}
        layout="vertical"
        requiredMark
        size="large"
        scrollToFirstError={{ behavior: "smooth", block: "center" }}
        onFinish={onFinish}
        className="flex flex-col gap-6 md:gap-8"
      >
        <FormSection
          id="section-basic"
          icon={<BankOutlined />}
          title="1. ชื่อหน่วยงานและองค์กร"
          description="ระบุชื่อหน่วยงาน, ชื่อบริษัท, ประเภทธุรกิจ, ขนาด และรูปแบบบริษัท"
        >
          <Row gutter={[20, 0]}>
            <Col xs={24} md={12}>
              <Form.Item
                name="agency_name"
                label="ชื่อหน่วยงาน"
                rules={[{ required: true, message: "Enter agency or unit name" }]}
              >
                <Input placeholder="e.g. Sustainability unit" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="organization_name"
                label="ชื่อองค์กร"
                rules={[{ required: true, message: "Enter legal organization name" }]}
              >
                <Input placeholder="e.g. Example Corp Co., Ltd." />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                name="business_type"
                label="ประเภทธุรกิจ"
                rules={[{ required: true, message: "Select business type" }]}
              >
                <Select placeholder="Select" options={BUSINESS_TYPE_OPTIONS} allowClear />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                name="business_size"
                label="ขนาดธุรกิจ"
                rules={[{ required: true, message: "Select business size" }]}
              >
                <Select placeholder="Select" options={BUSINESS_SIZE_OPTIONS} allowClear />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                name="legal_entity_type"
                label="ประเภทนิติบุคคล"
                rules={[{ required: true, message: "Select legal entity type" }]}
              >
                <Select placeholder="Select" options={LEGAL_ENTITY_OPTIONS} allowClear />
              </Form.Item>
            </Col>
          </Row>

          {/* <div className="mt-2 rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-600">
            {c.evidenceHelper}
          </div> */}

          <Row gutter={[20, 24]} className="mt-4">
            <Col xs={24} md={8}>
              <Form.Item
                name="evidence_logo"
                label="รูปภาพ logo องค์กร"
                valuePropName="fileList"
                getValueFromEvent={normFile}
                rules={[{ required: true, message: "Upload logo" }]}
              >
                <Upload
                  maxCount={1}
                  beforeUpload={beforeLogo}
                  accept="image/jpeg,image/png,image/webp,image/gif"
                >
                  <Button icon={<UploadOutlined />}>Choose file</Button>
                </Upload>
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                name="evidence_org_map"
                label="รูปภาพแผนที่สถานที่องค์กร"
                valuePropName="fileList"
                getValueFromEvent={normFile}
                rules={[{ required: true, message: "Upload map" }]}
              >
                <Upload
                  maxCount={1}
                  beforeUpload={beforeMap}
                  accept="image/jpeg,image/png,image/webp,image/gif"
                >
                  <Button icon={<UploadOutlined />}>Choose file</Button>
                </Upload>
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                name="evidence_org_structure"
                label="รูปภาพโครงสร้างองค์กร"
                valuePropName="fileList"
                getValueFromEvent={normFile}
                rules={[{ required: true, message: "Upload org chart" }]}
              >
                <Upload
                  maxCount={1}
                  beforeUpload={beforeStructure}
                  accept="image/jpeg,image/png,image/webp,image/gif"
                >
                  <Button icon={<UploadOutlined />}>Choose file</Button>
                </Upload>
              </Form.Item>
            </Col>
          </Row>
        </FormSection>

        <FormSection
          id="section-contact"
          icon={<EnvironmentOutlined />}
          title="2. ข้อมูลติดต่อและที่ตั้ง"
          description="กรอกที่อยู่ เบอร์โทร และอีเมลขององค์กร"
        >
          <Form.Item
            name="address_street"
            label="ที่อยู่ (อาคาร, ถนน)"
            rules={[{ required: true, message: "Enter address" }]}
          >
            <Input.TextArea rows={2} placeholder="Number, building, street" className="!resize-y" />
          </Form.Item>
          <Row gutter={[20, 0]}>
            <Col xs={24} sm={12} md={6}>
              <Form.Item
                name="subdistrict"
                label="ตำบล"
                rules={[{ required: true, message: "Enter subdistrict" }]}
              >
                <Input placeholder="Subdistrict" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item
                name="district"
                label="อำเภอ"
                rules={[{ required: true, message: "Enter district" }]}
              >
                <Input placeholder="District" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item
                name="province"
                label="จังหวัด"
                rules={[{ required: true, message: "Enter province" }]}
              >
                <Input placeholder="Province" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item
                name="postal_code"
                label="รหัสไปรษณีย์"
                rules={[
                  { required: true, message: "Enter postal code" },
                  { pattern: /^\d{5}$/, message: "5 digits" },
                ]}
              >
                <Input placeholder="10110" maxLength={5} inputMode="numeric" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="phone"
                label="เบอร์โทรศัพท์"
                rules={[{ required: true, message: "Enter phone" }]}
              >
                <Input placeholder="02-xxx-xxxx or 08x-xxx-xxxx" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="email"
                label="อีเมล"
                rules={[
                  { required: true, message: "Enter email" },
                  { type: "email", message: "Invalid email format" },
                ]}
              >
                <Input placeholder="contact@company.com" autoComplete="email" />
              </Form.Item>
            </Col>
          </Row>
        </FormSection>

        <FormSection
          id="section-stats"
          icon={<BarChartOutlined />}
          title="3. ข้อมูลสถิติและรายละเอียดภายในองค์กร"
          description="เช่น วันที่ก่อตั้ง จำนวนพนักงาน และข้อมูลภายในอื่น ๆ"
        >
          <Row gutter={[20, 0]}>
            <Col xs={24} md={8}>
              <Form.Item
                name="registration_date"
                label="วันที่ขอขึ้นทะเบียน"
                rules={[{ required: true, message: "Pick a date" }]}
              >
                <DatePicker className="!w-full" format="YYYY-MM-DD" placeholder="Select date" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                name="site_area_sqm"
                label="พื้นที่สถานที่ขององค์กรโดยประมาณ (ตร.ม.)"
                rules={[{ required: true, message: "Enter area" }]}
              >
                <InputNumber min={0} className="!w-full" placeholder="Square metres" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                name="headcount"
                label="จำนวนบุคลากรทั้งหมดโดยประมาณ (คน)"
                rules={[{ required: true, message: "Enter headcount" }]}
              >
                <InputNumber min={0} precision={0} className="!w-full" placeholder="People" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                name="main_departments_count"
                label="จำนวนแผนกหลักขององค์กรโดยประมาณ (แผนก)"
                rules={[{ required: true, message: "Enter count" }]}
              >
                <InputNumber min={0} precision={0} className="!w-full" placeholder="Departments" />
              </Form.Item>
            </Col>
          </Row>

          <div className="mt-2 rounded-xl border border-slate-100 bg-slate-50/60 p-4">
            <Typography.Text className="mb-3 block text-sm font-medium text-slate-700">
              ข้อมูลเพิ่มเติม (ถ้ามี)
            </Typography.Text>
            <Form.List name="custom_stats">
              {(fields, { add, remove }) => (
                <div className="flex flex-col gap-3">
                  {fields.length === 0 ? (
                    <Typography.Text type="secondary" className="block text-sm">
                      ยังไม่มีรายการ กด &quot;เพิ่ม&quot; เพื่อกรอกข้อมูล
                    </Typography.Text>
                  ) : null}
                  {fields.map(({ key, name, ...rest }) => (
                    <Row key={key} gutter={[12, 8]} align="bottom">
                      <Col xs={24} sm={10}>
                        <Form.Item
                          {...rest}
                          name={[name, "topic"]}
                          label={key === 0 ? "หัวข้อ" : undefined}
                          className="!mb-0"
                          rules={[{ required: true, message: "Required" }]}
                        >
                          <Input placeholder="e.g. แผนก" />
                        </Form.Item>
                      </Col>
                      <Col xs={12} sm={6}>
                        <Form.Item
                          {...rest}
                          name={[name, "amount"]}
                          label={key === 0 ? "จำนวน" : undefined}
                          className="!mb-0"
                          rules={[{ required: true, message: "Required" }]}
                        >
                          <InputNumber min={0} className="!w-full" placeholder="0" />
                        </Form.Item>
                      </Col>
                      <Col xs={10} sm={6}>
                        <Form.Item
                          {...rest}
                          name={[name, "unit"]}
                          label={key === 0 ? "หน่วย" : undefined}
                          className="!mb-0"
                          rules={[{ required: true, message: "Required" }]}
                        >
                          <Input placeholder="e.g. แผนก" />
                        </Form.Item>
                      </Col>
                      <Col xs={2} sm={2} className="flex justify-end pb-1 sm:justify-center">
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => remove(name)}
                          aria-label="Remove row"
                        />
                      </Col>
                    </Row>
                  ))}
                  <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />} className="!h-11">
                    เพิ่มข้อมูล
                  </Button>
                </div>
              )}
            </Form.List>
          </div>
        </FormSection>

        <div className="px-5 md:px-8">
          <Flex gap={12} wrap="wrap" align="center" justify="flex-end">
            <Button size="large" onClick={resetForm}>
              รีเซ็ต
            </Button>
            <Button type="primary" htmlType="submit" size="large">
              <SaveOutlined /> บันทึกข้อมูล
            </Button>
          </Flex>
        </div>
      </Form>
    </div>
  )
}
