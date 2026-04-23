import {
  BankOutlined,
  HomeOutlined,
  IdcardOutlined,
  LockOutlined,
  MailOutlined,
  PhoneOutlined,
  SaveOutlined,
  UserOutlined,
} from "@ant-design/icons"
import {
  App,
  Button,
  Col,
  Divider,
  Flex,
  Form,
  Input,
  Row,
  Select,
  Typography,
} from "antd"
import type { ReactNode } from "react"
import { useEffect, useRef } from "react"
import { PageHeader } from "@/components/common/PageHeader"
import {
  ProfilePhotoField,
  type ProfilePhotoFieldHandle,
} from "@/components/settings/ProfilePhotoField"
import type { UserProfile } from "@/store/useAuthStore"
import { useAuthStore } from "@/store/useAuthStore"

const PREFIX_OPTIONS = [
  { value: "นาย", label: "นาย" },
  { value: "นาง", label: "นาง" },
  { value: "นางสาว", label: "นางสาว" },
  { value: "ดร.", label: "ดร." },
  { value: "ศ.", label: "ศ." },
  { value: "อื่น ๆ", label: "อื่น ๆ" },
]

const ORGANIZATION_OPTIONS = [
  { value: "org-1", label: "Global Carbon Corp" },
  { value: "org-2", label: "องค์กรตัวอย่าง จำกัด" },
  { value: "org-3", label: "Green Supply Co., Ltd." },
]

/** หัวย่อยภายในการ์ด (ไม่สร้างการ์ดซ้อน) */
function SubsectionTitle({
  icon,
  title,
  subtitle,
}: {
  icon?: ReactNode
  title: string
  subtitle?: string
}) {
  return (
    <div className="mb-4 flex items-start gap-3">
      {icon ? (
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-base text-teal-800">
          {icon}
        </span>
      ) : null}
      <div className="min-w-0">
        <Typography.Title level={5} className="!mb-0.5 !text-[15px] !font-semibold !text-slate-800 md:!text-base">
          {title}
        </Typography.Title>
        {subtitle ? (
          <Typography.Text type="secondary" className="text-xs leading-relaxed md:text-sm">
            {subtitle}
          </Typography.Text>
        ) : null}
      </div>
    </div>
  )
}

/** การ์ดหลักต่อหมวด */
function SectionBlock({
  icon,
  title,
  description,
  children,
}: {
  icon: ReactNode
  title: string
  description?: string
  children: ReactNode
}) {
  return (
    <section className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm md:p-8">
      <header className="mb-8 flex gap-4 border-b border-slate-100 pb-6">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-xl text-teal-800">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <Typography.Title level={3} className="!mb-1 !text-xl !font-semibold !leading-snug md:!text-2xl">
            {title}
          </Typography.Title>
          {description ? (
            <Typography.Paragraph type="secondary" className="!mb-0 !text-sm leading-relaxed md:!text-[15px]">
              {description}
            </Typography.Paragraph>
          ) : null}
        </div>
      </header>
      <div className="flex flex-col gap-0">{children}</div>
    </section>
  )
}

export function SettingsPage() {
  const { message } = App.useApp()
  const user = useAuthStore((s) => s.user)
  const updateUserProfile = useAuthStore((s) => s.updateUserProfile)
  const [form] = Form.useForm()
  const profilePhotoRef = useRef<ProfilePhotoFieldHandle>(null)

  useEffect(() => {
    if (!user) return
    form.setFieldsValue({
      prefix: user.prefix,
      fname: user.fname,
      lname: user.lname,
      address: user.address,
      subdistrict: user.subdistrict,
      district: user.district,
      province: user.province,
      postal_code: user.postal_code,
      phone: user.phone,
      email: user.email,
      username: user.username,
      password: undefined,
      confirm_password: undefined,
      organization_id: user.organization_id,
    })
  }, [user, form])

  const onFinish = async (values: Record<string, unknown>) => {
    if (!user) {
      message.warning("ไม่พบข้อมูลผู้ใช้")
      return
    }

    const imageprofile = await profilePhotoRef.current?.getValueForSave()

    const next: Partial<UserProfile> = {
      prefix: values.prefix as string | undefined,
      fname: (values.fname as string)?.trim() || user.fname,
      lname: (values.lname as string)?.trim() || user.lname,
      address: (values.address as string) || undefined,
      subdistrict: (values.subdistrict as string) || undefined,
      district: (values.district as string) || undefined,
      province: (values.province as string) || undefined,
      postal_code: (values.postal_code as string) || undefined,
      phone: (values.phone as string) || undefined,
      email: (values.email as string)?.trim() || user.email,
      username: (values.username as string) || undefined,
      organization_id: values.organization_id as string | number | undefined,
      imageprofile,
    }

    updateUserProfile(next)
    profilePhotoRef.current?.reset()

    const pwd = values.password as string | undefined
    if (pwd && pwd.length > 0) {
      message.success("บันทึกโปรไฟล์แล้ว")
      form.setFieldsValue({ password: undefined, confirm_password: undefined })
    } else {
      message.success("บันทึกข้อมูลโปรไฟล์แล้ว")
    }
  }

  const resetForm = () => {
    if (!user) return
    form.setFieldsValue({
      prefix: user.prefix,
      fname: user.fname,
      lname: user.lname,
      address: user.address,
      subdistrict: user.subdistrict,
      district: user.district,
      province: user.province,
      postal_code: user.postal_code,
      phone: user.phone,
      email: user.email,
      username: user.username,
      password: undefined,
      confirm_password: undefined,
      organization_id: user.organization_id,
    })
    profilePhotoRef.current?.reset()
  }

  return (
    <div className="w-full min-w-0 pb-10">
      <div className="mb-8">
        <PageHeader
          title="ตั้งค่าโปรไฟล์"
          description="แก้ไขข้อมูลโปรไฟล์ ที่อยู่ การติดต่อ และองค์กร"
        />
      </div>

      <Form form={form} layout="vertical" requiredMark onFinish={onFinish} scrollToFirstError size="large">
        <div className="flex flex-col gap-6">
          <SectionBlock
            icon={<UserOutlined />}
            title="ข้อมูลโปรไฟล์"
            description="รูปประจำตัว ชื่อ–นามสกุล ที่อยู่ การติดต่อ และองค์กร"
          >
            <div className="flex flex-col gap-6">
              <Row gutter={[24, 28]} align="top">
                <Col xs={24} md={9} lg={8} className="flex flex-col items-center">
                  <ProfilePhotoField
                    key={user?.email ?? "profile-photo"}
                    ref={profilePhotoRef}
                    savedUrl={user?.imageprofile}
                    variant="settings"
                  />
                </Col>
                <Col xs={24} md={15} lg={16}>
                  <SubsectionTitle title="ชื่อ–สกุล" subtitle="คำนำหน้า ชื่อ และนามสกุล" />
                  <Row gutter={[16, 16]}>
                    <Col xs={24} sm={8}>
                      <Form.Item
                        name="prefix"
                        label="คำนำหน้า"
                        rules={[{ required: true, message: "กรุณาเลือกคำนำหน้า" }]}
                      >
                        <Select placeholder="เลือก" options={PREFIX_OPTIONS} />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={8}>
                      <Form.Item name="fname" label="ชื่อ" rules={[{ required: true, message: "กรุณากรอกชื่อ" }]}>
                        <Input placeholder="ชื่อจริง" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={8}>
                      <Form.Item name="lname" label="นามสกุล" rules={[{ required: true, message: "กรุณากรอกนามสกุล" }]}>
                        <Input placeholder="นามสกุล" />
                      </Form.Item>
                    </Col>
                  </Row>
                </Col>
              </Row>
            </div>

            <Divider className="!my-8 !border-slate-100" />

            <SubsectionTitle
              icon={<HomeOutlined />}
              title="ที่อยู่"
              subtitle="ใช้สำหรับเอกสาร"
            />
            <Form.Item name="address" label="ที่อยู่">
              <Input.TextArea rows={3} placeholder="บ้านเลขที่ ถนน ซอย อาคาร" showCount maxLength={500} />
            </Form.Item>
            <Row gutter={[16, 0]}>
              <Col xs={24} sm={12} lg={6}>
                <Form.Item name="subdistrict" label="ตำบล / แขวง">
                  <Input placeholder="ตำบล" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Form.Item name="district" label="อำเภอ / เขต">
                  <Input placeholder="อำเภอ" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Form.Item name="province" label="จังหวัด">
                  <Input placeholder="จังหวัด" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Form.Item name="postal_code" label="รหัสไปรษณีย์">
                  <Input placeholder="10110" maxLength={10} inputMode="numeric" />
                </Form.Item>
              </Col>
            </Row>

            <Divider className="!my-8 !border-slate-100" />

            <SubsectionTitle icon={<PhoneOutlined />} title="การติดต่อ" subtitle="เบอร์โทรและอีเมลหลักสำหรับแจ้งเตือน" />
            <Row gutter={[16, 0]}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="phone"
                  label="เบอร์โทรศัพท์"
                  rules={[
                    { required: true, message: "กรุณากรอกเบอร์โทรศัพท์" },
                    {
                      validator: (_, value) => {
                        if (!value || typeof value !== "string") return Promise.reject(new Error("กรุณากรอกเบอร์โทรศัพท์"))
                        const digits = value.replace(/\D/g, "")
                        if (digits.length < 9 || digits.length > 10) {
                          return Promise.reject(new Error("เบอร์โทรควรเป็นตัวเลข 9–10 หลัก"))
                        }
                        return Promise.resolve()
                      },
                    },
                  ]}
                >
                  <Input prefix={<PhoneOutlined className="text-slate-400" />} placeholder="0812345678" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  name="email"
                  label="อีเมล"
                  rules={[{ required: true, type: "email", message: "กรุณากรอกอีเมลให้ถูกต้อง" }]}
                >
                  <Input prefix={<MailOutlined className="text-slate-400" />} placeholder="you@company.com" />
                </Form.Item>
              </Col>
            </Row>

            <Divider className="!my-8 !border-slate-100" />

            <SubsectionTitle
              icon={<BankOutlined />}
              title="องค์กร"
              subtitle="เลือกองค์กรที่สังกัด"
            />
            <Row gutter={[16, 0]}>
              <Col xs={24} md={16} lg={14}>
                <Form.Item name="organization_id" label="องค์กร">
                  <Select
                    allowClear
                    showSearch
                    placeholder="ค้นหาหรือเลือกองค์กร"
                    optionFilterProp="label"
                    options={ORGANIZATION_OPTIONS}
                  />
                </Form.Item>
              </Col>
            </Row>
          </SectionBlock>

          <SectionBlock
            icon={<LockOutlined />}
            title="เข้าสู่ระบบ"
            description="ชื่อผู้ใช้และรหัสผ่าน"
          >
            <Row gutter={[16, 0]}>
              <Col xs={24} md={14} lg={12}>
                <Form.Item
                  name="username"
                  label="Username"
                  rules={[{ required: true, message: "กรุณากรอกชื่อผู้ใช้" }]}
                >
                  <Input prefix={<IdcardOutlined className="text-slate-400" />} placeholder="ชื่อผู้ใช้" autoComplete="username" />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={[16, 0]}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="password"
                  label="รหัสผ่านใหม่"
                  rules={[
                    {
                      validator(_, value) {
                        if (!value || typeof value !== "string") return Promise.resolve()
                        if (value.length < 8) {
                          return Promise.reject(new Error("อย่างน้อย 8 ตัวอักษร"))
                        }
                        return Promise.resolve()
                      },
                    },
                  ]}
                >
                  <Input.Password prefix={<LockOutlined className="text-slate-400" />} placeholder="เว้นว่างหากไม่เปลี่ยน" autoComplete="new-password" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  name="confirm_password"
                  label="ยืนยันรหัสผ่าน"
                  dependencies={["password"]}
                  rules={[
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        const pwd = getFieldValue("password") as string | undefined
                        if (!pwd && !value) return Promise.resolve()
                        if (pwd && value !== pwd) {
                          return Promise.reject(new Error("รหัสผ่านไม่ตรงกัน"))
                        }
                        return Promise.resolve()
                      },
                    }),
                  ]}
                >
                  <Input.Password prefix={<LockOutlined className="text-slate-400" />} placeholder="ยืนยันอีกครั้ง" autoComplete="new-password" />
                </Form.Item>
              </Col>
            </Row>
          </SectionBlock>

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
        </div>
      </Form>
    </div>
  )
}
