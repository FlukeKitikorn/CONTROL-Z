import { ArrowRightOutlined, LockOutlined } from "@ant-design/icons"
import { Alert, App, Button, Form, Input, Result, Typography } from "antd"
import { useMemo, useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router"
import { AuthSplitLayout } from "@/components/auth/AuthSplitLayout"
import { apiUrl } from "@/lib/apiBase"

type ResetPasswordFormValues = {
  new_password: string
  confirm_password: string
}

type ResetPasswordOkBody = {
  message?: string
  detail?: unknown
}

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const [searchParams] = useSearchParams()
  const token = useMemo(() => searchParams.get("token")?.trim() ?? "", [searchParams])
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [done, setDone] = useState<string | null>(null)

  const onFinish = async (values: ResetPasswordFormValues) => {
    if (!token) {
      setSubmitError("ลิงก์รีเซ็ตไม่ถูกต้อง — ขอลิงก์ใหม่จากหน้าลืมรหัสผ่าน")
      return
    }
    setSubmitError(null)
    try {
      const res = await fetch(apiUrl("/api/v1/auth/reset-password"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          new_password: values.new_password,
          confirm_password: values.confirm_password,
        }),
      })
      const data = (await res.json().catch(() => ({}))) as ResetPasswordOkBody
      if (!res.ok) {
        const detail = data.detail
        const msg = typeof detail === "string" ? detail : "ตั้งรหัสผ่านใหม่ไม่สำเร็จ"
        setSubmitError(msg)
        return
      }
      const okMsg = data.message ?? "ตั้งรหัสผ่านใหม่สำเร็จ"
      setDone(okMsg)
      message.success(okMsg)
      window.setTimeout(() => navigate("/auth/login", { replace: true }), 1500)
    } catch {
      setSubmitError("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ — ตรวจสอบว่า Backend รันอยู่")
    }
  }

  if (!token) {
    return (
      <AuthSplitLayout title="ลิงก์ไม่ถูกต้อง" subtitle="ไม่พบ token สำหรับรีเซ็ตรหัสผ่าน">
        <Result
          status="warning"
          title="ลิงก์รีเซ็ตไม่ถูกต้อง"
          subTitle="กรุณาขอลิงก์ใหม่จากหน้าลืมรหัสผ่าน"
          extra={
            <Link to="/auth/forgot-password">
              <Button type="primary" size="large">
                ขอลิงก์รีเซ็ตใหม่
              </Button>
            </Link>
          }
        />
      </AuthSplitLayout>
    )
  }

  if (done) {
    return (
      <AuthSplitLayout title="สำเร็จ" subtitle="รหัสผ่านของคุณถูกอัปเดตแล้ว">
        <Result
          status="success"
          title="ตั้งรหัสผ่านใหม่สำเร็จ"
          subTitle={done}
          extra={
            <Link to="/auth/login">
              <Button type="primary" size="large">
                เข้าสู่ระบบ
              </Button>
            </Link>
          }
        />
      </AuthSplitLayout>
    )
  }

  return (
    <AuthSplitLayout title="ตั้งรหัสผ่านใหม่" subtitle="กรอกรหัสผ่านใหม่สำหรับบัญชีของคุณ">
      {submitError ? (
        <Alert type="error" showIcon className="mb-4" message={submitError} closable onClose={() => setSubmitError(null)} />
      ) : null}
      <Form layout="vertical" onFinish={onFinish} requiredMark={false}>
        <Form.Item
          label="รหัสผ่านใหม่"
          name="new_password"
          rules={[
            { required: true, message: "กรุณากรอกรหัสผ่านใหม่" },
            { min: 8, message: "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร" },
          ]}
        >
          <Input.Password prefix={<LockOutlined />} placeholder="••••••••" size="large" autoComplete="new-password" />
        </Form.Item>
        <Form.Item
          label="ยืนยันรหัสผ่านใหม่"
          name="confirm_password"
          dependencies={["new_password"]}
          rules={[
            { required: true, message: "กรุณายืนยันรหัสผ่าน" },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue("new_password") === value) return Promise.resolve()
                return Promise.reject(new Error("รหัสผ่านไม่ตรงกัน"))
              },
            }),
          ]}
        >
          <Input.Password prefix={<LockOutlined />} placeholder="••••••••" size="large" autoComplete="new-password" />
        </Form.Item>
        <Button type="primary" htmlType="submit" block size="large" className="auth-primary-btn">
          บันทึกรหัสผ่านใหม่<ArrowRightOutlined />
        </Button>
      </Form>
      <Typography.Paragraph style={{ textAlign: "center", marginTop: 18, marginBottom: 0 }}>
        <Link to="/auth/login">กลับไปเข้าสู่ระบบ</Link>
      </Typography.Paragraph>
    </AuthSplitLayout>
  )
}
