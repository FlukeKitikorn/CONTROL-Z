import { ArrowRightOutlined, LockOutlined, MailOutlined } from "@ant-design/icons"
import { Alert, App, Button, Checkbox, Form, Input, Typography } from "antd"
import { useState } from "react"
import { Link, useNavigate } from "react-router"
import { AuthSplitLayout } from "@/components/auth/AuthSplitLayout"
import { apiUrl } from "@/lib/apiBase"
import type { AuthTokenResponse } from "@/lib/authApiTypes"
import { mapAuthUserToProfile } from "@/lib/authApiTypes"
import { setSessionToken } from "@/lib/authToken"
import { isUserProfileComplete } from "@/lib/userProfileComplete"
import { useAuthStore } from "@/store/useAuthStore"

export function LoginPage() {
  const navigate = useNavigate()
  const loginAs = useAuthStore((state) => state.loginAs)
  const { message, notification } = App.useApp()
  const [loginError, setLoginError] = useState<string | null>(null)

  const onFinish = async (values: { email?: string; password?: string }) => {
    setLoginError(null)
    const email = values.email?.trim() ?? ""
    const password = values.password ?? ""
    try {
      const res = await fetch(apiUrl("/api/v1/auth/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })
      const data = (await res.json().catch(() => ({}))) as Partial<AuthTokenResponse> & { detail?: unknown }
      if (!res.ok) {
        const detail = data.detail
        const msg =
          typeof detail === "string"
            ? detail
            : Array.isArray(detail)
              ? detail
                  .map((d) => (typeof d === "object" && d && "msg" in d ? String((d as { msg: string }).msg) : ""))
                  .join(", ")
              : "เข้าสู่ระบบไม่สำเร็จ"
        setLoginError(msg || "เข้าสู่ระบบไม่สำเร็จ")
        return
      }
      const token = data.access_token
      const u = data.user
      if (!token || !u) {
        setLoginError("รูปแบบข้อมูลจากเซิร์ฟเวอร์ไม่ถูกต้อง")
        return
      }
      if (u.role === "ADMIN") {
        setLoginError("บัญชีนี้เป็นผู้ดูแลระบบ — กรุณาเข้าสู่ระบบที่หน้าสำหรับผู้ดูแลระบบ")
        return
      }
      setSessionToken(token, data.expires_in ?? null)
      const profile = mapAuthUserToProfile(u)
      loginAs(u.role, profile, token)
      message.success("เข้าสู่ระบบแล้ว")

      if (!isUserProfileComplete(profile)) {
        notification.warning({
          message: "กรุณากรอกข้อมูลส่วนตัวให้ครบ",
          description:
            "ระบบจะเปิดเฉพาะหน้าตั้งค่าจนกว่าจะกรอกชื่อ–ที่อยู่–เบอร์โทรให้ครบ (รูปประจำตัวไม่บังคับ)",
          placement: "topRight",
          duration: 8,
        })
      }

      navigate("/app", { replace: true })
    } catch {
      setLoginError("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ — ตรวจสอบว่า Backend รันอยู่")
    }
  }

  return (
    <AuthSplitLayout title="ยินดีต้อนรับ" subtitle="เข้าสู่แดชบอร์ดด้านสิ่งแวดล้อมขององค์กรคุณ">
      {loginError ? (
        <Alert type="error" showIcon className="mb-4" message={loginError} closable onClose={() => setLoginError(null)} />
      ) : null}
      <Form layout="vertical" onFinish={onFinish} requiredMark={false}>
        <Form.Item label="อีเมล" name="email" rules={[{ required: true, message: "กรุณากรอกอีเมล" }]}>
          <Input prefix={<MailOutlined />} placeholder="name@company.com" size="large" />
        </Form.Item>
        <Form.Item label="รหัสผ่าน" name="password" rules={[{ required: true, message: "กรุณากรอกรหัสผ่าน" }]}>
          <Input.Password prefix={<LockOutlined />} placeholder="••••••••" size="large" />
        </Form.Item>
        <div className="mb-4 flex items-center justify-between">
          <Checkbox>จดจำฉัน</Checkbox>
          <Link to="/auth/forgot-password">ลืมรหัสผ่าน?</Link>
        </div>
        <Button type="primary" htmlType="submit" block size="large" className="auth-primary-btn">
          เข้าสู่ระบบ<ArrowRightOutlined />
        </Button>
      </Form>

      <Typography.Paragraph style={{ textAlign: "center", marginTop: 18, marginBottom: 0 }}>
        ยังไม่มีบัญชี? <Link to="/auth/register">ลงทะเบียน</Link>
      </Typography.Paragraph>
    </AuthSplitLayout>
  )
}
