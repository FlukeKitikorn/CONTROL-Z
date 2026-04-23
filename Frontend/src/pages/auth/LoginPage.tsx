import { ArrowRightOutlined, LockOutlined, MailOutlined } from "@ant-design/icons"
import { Button, Checkbox, Form, Input, Typography } from "antd"
import { Link, useNavigate } from "react-router"
import { AuthSplitLayout } from "@/components/auth/AuthSplitLayout"
import { profileFromEmail } from "@/lib/profileFromEmail"
import { useAuthStore } from "@/store/useAuthStore"

export function LoginPage() {
  const navigate = useNavigate()
  const loginAs = useAuthStore((state) => state.loginAs)

  const onFinish = (values: { email?: string }) => {
    const email = values.email?.trim() ?? ""
    const role = email.toLowerCase().includes("admin") ? "ADMIN" : "USER"
    const { firstName, lastName } = profileFromEmail(email)
    loginAs(role, { email, fname: firstName, lname: lastName })
    navigate(role === "ADMIN" ? "/admin" : "/app")
  }

  return (
    <AuthSplitLayout
      title="ยินดีต้อนรับ"
      subtitle="เข้าสู่แดชบอร์ดด้านสิ่งแวดล้อมขององค์กรคุณ"
    >
      <Form layout="vertical" onFinish={onFinish} requiredMark={false}>
        <Form.Item label="อีเมล" name="email" rules={[{ required: true, message: "กรุณากรอกอีเมล" }]}>
          <Input prefix={<MailOutlined />} placeholder="name@company.com" size="large" />
        </Form.Item>
        <Form.Item label="รหัสผ่าน" name="password" rules={[{ required: true, message: "กรุณากรอกรหัสผ่าน" }]}>
          <Input.Password prefix={<LockOutlined />} placeholder="••••••••" size="large" />
        </Form.Item>
        <div className="mb-4 flex items-center justify-between">
          <Checkbox>จดจำฉัน</Checkbox>
          <Typography.Text type="secondary">ติดต่อผู้ดูแลระบบหากลืมรหัสผ่าน</Typography.Text>
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
