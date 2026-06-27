import { LockOutlined, MailOutlined } from "@ant-design/icons"
import { Alert, Button, Form, Input, Modal, Result, Typography } from "antd"
import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router"
import { AuthSplitLayout } from "@/components/auth/AuthSplitLayout"
import { apiUrl } from "@/lib/apiBase"

type RegisterFormValues = {
  email: string
  password: string
  confirm_password: string
}

type RegisterOkBody = {
  message?: string
  detail?: unknown
}

export function RegisterPage() {
  const navigate = useNavigate()
  const [form] = Form.useForm<RegisterFormValues>()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [done, setDone] = useState<{ message: string } | null>(null)

  useEffect(() => {
    if (!done) return
    const t = window.setTimeout(() => {
      navigate("/auth/login", { replace: true })
    }, 1800)
    return () => window.clearTimeout(t)
  }, [done, navigate])

  const onFinish = async (values: RegisterFormValues) => {
    setSubmitError(null)
    const payload = {
      email: values.email.trim(),
      password: values.password,
    }
    try {
      const res = await fetch(apiUrl("/api/v1/auth/register"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = (await res.json().catch(() => ({}))) as RegisterOkBody
      if (!res.ok) {
        const detail = data.detail
        const msg = typeof detail === "string" ? detail : "ลงทะเบียนไม่สำเร็จ"
        setSubmitError(msg)
        return
      }
      const okMsg =
        typeof data.message === "string" && data.message.trim()
          ? data.message.trim()
          : "ลงทะเบียนสำเร็จ — เข้าสู่ระบบด้วยอีเมลและรหัสผ่านของคุณ"
      setDone({ message: okMsg })
    } catch {
      setSubmitError("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้")
    }
  }

  return (
    <AuthSplitLayout
      title="สร้างบัญชี"
      subtitle="ใช้เฉพาะอีเมลและรหัสผ่าน — กรอกข้อมูลส่วนตัวให้ครบหลังล็อกอินที่หน้าตั้งค่า"
    >
      <Modal
        open={Boolean(done)}
        footer={null}
        closable={false}
        maskClosable={false}
        keyboard={false}
        centered
        title={null}
      >
        <Result
          status="success"
          title="สมัครสำเร็จ"
          subTitle={done?.message}
        />
      </Modal>
      {submitError ? (
        <Alert type="error" showIcon className="mb-4" message={submitError} closable onClose={() => setSubmitError(null)} />
      ) : null}
      <Form form={form} layout="vertical" requiredMark={false} onFinish={onFinish}>
        <Form.Item
          label="อีเมล (ใช้ล็อกอิน)"
          name="email"
          rules={[
            { required: true, message: "กรุณากรอกอีเมล" },
            { type: "email", message: "รูปแบบอีเมลไม่ถูกต้อง" },
            { max: 50, message: "อีเมลยาวเกิน 50 ตัวอักษร" },
          ]}
        >
          <Input prefix={<MailOutlined />} placeholder="you@company.com" size="large" />
        </Form.Item>
        <Form.Item
          label="รหัสผ่าน"
          name="password"
          rules={[
            { required: true, message: "กรุณากรอกรหัสผ่าน" },
            { min: 8, message: "รหัสผ่านอย่างน้อย 8 ตัวอักษร" },
          ]}
        >
          <Input.Password prefix={<LockOutlined />} placeholder="••••••••" size="large" />
        </Form.Item>
        <Form.Item
          label="ยืนยันรหัสผ่าน"
          name="confirm_password"
          dependencies={["password"]}
          rules={[
            { required: true, message: "กรุณายืนยันรหัสผ่าน" },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue("password") === value) return Promise.resolve()
                return Promise.reject(new Error("รหัสผ่านไม่ตรงกัน"))
              },
            }),
          ]}
        >
          <Input.Password prefix={<LockOutlined />} placeholder="••••••••" size="large" />
        </Form.Item>

        <Button type="primary" htmlType="submit" block size="large" className="auth-primary-btn mt-2">
          สร้างบัญชี
        </Button>
      </Form>
      <Typography.Paragraph style={{ textAlign: "center", marginTop: 18, marginBottom: 0 }}>
        มีบัญชีแล้ว? <Link to="/auth/login">เข้าสู่ระบบ</Link>
      </Typography.Paragraph>
    </AuthSplitLayout>
  )
}
