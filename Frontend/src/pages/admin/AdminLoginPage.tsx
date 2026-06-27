import { ArrowRightOutlined, LockOutlined, MailOutlined } from "@ant-design/icons"
import { Alert, App, Button, ConfigProvider, Form, Input, Space, Typography, theme } from "antd"
import { useState } from "react"
import { Link, useNavigate } from "react-router"
import { AdminAuthLayout } from "@/components/admin/AdminAuthLayout"
import { apiUrl } from "@/lib/apiBase"
import { USER_LOGIN_PATH } from "@/lib/authPaths"
import type { AuthTokenResponse } from "@/lib/authApiTypes"
import { mapAuthUserToProfile } from "@/lib/authApiTypes"
import { setSessionToken } from "@/lib/authToken"
import { useAuthStore } from "@/store/useAuthStore"

/** สีหลักชุดเดียวกับปุ่ม auth หลัก / ธีม Control Z */
const THEME_TEAL = "#0d9488"
const THEME_TEAL_STRONG = "#0f766e"

export function AdminLoginPage() {
  const navigate = useNavigate()
  const loginAs = useAuthStore((state) => state.loginAs)
  const { message } = App.useApp()
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
      if (u.role !== "ADMIN") {
        setLoginError("บัญชีนี้ไม่ใช่ผู้ดูแลระบบ — กรุณาใช้หน้าเข้าสู่ระบบสำหรับผู้ใช้ทั่วไป")
        return
      }
      setSessionToken(token, data.expires_in ?? null, data.session_id ?? null)
      const profile = mapAuthUserToProfile(u)
      loginAs(u.role, profile, token)
      message.success("เข้าสู่ระบบผู้ดูแลแล้ว")
      navigate("/admin", { replace: true })
    } catch {
      setLoginError("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ — ตรวจสอบว่า Backend รันอยู่")
    }
  }

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: THEME_TEAL,
          colorInfo: "#14b8a6",
          borderRadius: 10,
          fontFamily: '"Chakra Petch", "Noto Sans Thai", system-ui, sans-serif',
        },
        components: {
          Input: {
            activeBorderColor: THEME_TEAL_STRONG,
            hoverBorderColor: "#2dd4bf",
          },
        },
      }}
    >
      <AdminAuthLayout
        title="เข้าสู่คอนโซลผู้ดูแล"
        subtitle="ใช้บัญชีที่ได้รับสิทธิ์ผู้ดูแลระบบเท่านั้น"
      >

        {loginError ? (
          <Alert
            type="error"
            showIcon
            className="mb-4"
            message={loginError}
            closable
            onClose={() => setLoginError(null)}
          />
        ) : null}

        <Form layout="vertical" onFinish={onFinish} requiredMark={false} className="admin-auth-form">
          <Form.Item label="อีเมล" name="email" rules={[{ required: true, message: "กรุณากรอกอีเมล" }]}>
            <Input
              prefix={<MailOutlined className="text-teal-600" />}
              placeholder="admin@company.com"
              size="large"
              autoComplete="username"
            />
          </Form.Item>
          <Form.Item label="รหัสผ่าน" name="password" rules={[{ required: true, message: "กรุณากรอกรหัสผ่าน" }]}>
            <Input.Password
              prefix={<LockOutlined className="text-teal-600" />}
              placeholder="••••••••"
              size="large"
              autoComplete="current-password"
            />
          </Form.Item>
          <Button type="primary" htmlType="submit" block size="large" className="admin-auth-submit">
            เข้าสู่ระบบผู้ดูแล
            <ArrowRightOutlined />
          </Button>
        </Form>

        <Space direction="vertical" size={4} className="mt-6 flex w-full justify-center">
          <Typography.Text type="secondary" className="block text-center text-sm">
            ผู้ใช้ทั่วไป?{" "}
            <Link to={USER_LOGIN_PATH} className="font-medium text-teal-700 hover:text-teal-600">
              ไปหน้าเข้าสู่ระบบหลัก
            </Link>
          </Typography.Text>
        </Space>
      </AdminAuthLayout>
    </ConfigProvider>
  )
}
