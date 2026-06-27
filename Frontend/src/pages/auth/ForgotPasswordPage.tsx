import { ArrowLeftOutlined, MailOutlined } from "@ant-design/icons"
import { Alert, App, Button, Form, Input, Result, Typography } from "antd"
import { useState } from "react"
import { Link } from "react-router"
import { AuthSplitLayout } from "@/components/auth/AuthSplitLayout"
import { apiUrl } from "@/lib/apiBase"

type ForgotPasswordFormValues = {
  email: string
}

type ForgotPasswordOkBody = {
  message?: string
  detail?: unknown
}

export function ForgotPasswordPage() {
  const { message } = App.useApp()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [done, setDone] = useState<string | null>(null)

  const onFinish = async (values: ForgotPasswordFormValues) => {
    setSubmitError(null)
    try {
      const res = await fetch(apiUrl("/api/v1/auth/forgot-password"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: values.email.trim() }),
      })
      const data = (await res.json().catch(() => ({}))) as ForgotPasswordOkBody
      if (!res.ok) {
        const detail = data.detail
        const msg = typeof detail === "string" ? detail : "ส่งคำขอรีเซ็ตรหัสผ่านไม่สำเร็จ"
        setSubmitError(msg)
        return
      }
      const okMsg = data.message ?? "หากมีบัญชีนี้ในระบบ เราได้ส่งลิงก์รีเซ็ตรหัสผ่านไปยังอีเมลแล้ว"
      setDone(okMsg)
      message.success("ส่งคำขอแล้ว")
    } catch {
      setSubmitError("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ — ตรวจสอบว่า Backend รันอยู่")
    }
  }

  if (done) {
    return (
      <AuthSplitLayout title="ตรวจสอบอีเมล" subtitle="เราได้ดำเนินการตามคำขอของคุณแล้ว">
        <Result
          status="success"
          title="ตรวจสอบกล่องจดหมาย"
          subTitle={done}
          extra={
            <Link to="/auth/login">
              <Button type="primary" size="large">
                กลับไปหน้าเข้าสู่ระบบ
              </Button>
            </Link>
          }
        />
        <Typography.Paragraph type="secondary" style={{ textAlign: "center", marginBottom: 0 }}>
          หากไม่พบอีเมล ลองตรวจโฟลเดอร์ Spam หรือรอสักครู่แล้วลองใหม่
        </Typography.Paragraph>
      </AuthSplitLayout>
    )
  }

  return (
    <AuthSplitLayout title="ลืมรหัสผ่าน" subtitle="กรอกอีเมลที่ใช้ลงทะเบียน เราจะส่งลิงก์ตั้งรหัสผ่านใหม่ให้">
      {submitError ? (
        <Alert type="error" showIcon className="mb-4" message={submitError} closable onClose={() => setSubmitError(null)} />
      ) : null}
      <Form layout="vertical" onFinish={onFinish} requiredMark={false}>
        <Form.Item
          label="อีเมล"
          name="email"
          rules={[
            { required: true, message: "กรุณากรอกอีเมล" },
            { type: "email", message: "รูปแบบอีเมลไม่ถูกต้อง" },
          ]}
        >
          <Input prefix={<MailOutlined />} placeholder="name@company.com" size="large" autoComplete="email" />
        </Form.Item>
        <Button type="primary" htmlType="submit" block size="large" className="auth-primary-btn">
          ส่งลิงก์รีเซ็ตรหัสผ่าน
        </Button>
      </Form>
      <Typography.Paragraph style={{ textAlign: "center", marginTop: 18, marginBottom: 0 }}>
        <Link to="/auth/login">
          <ArrowLeftOutlined /> กลับไปเข้าสู่ระบบ
        </Link>
      </Typography.Paragraph>
    </AuthSplitLayout>
  )
}
