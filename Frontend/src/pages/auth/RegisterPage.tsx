import { LockOutlined, MailOutlined, UserOutlined } from "@ant-design/icons"
import { Button, Form, Input, Typography } from "antd"
import { Link } from "react-router"
import { AuthSplitLayout } from "@/components/auth/AuthSplitLayout"

export function RegisterPage() {
  return (
    <AuthSplitLayout
      title="สร้างบัญชี"
      subtitle="ลงทะเบียนเพื่อเข้าสู่แดชบอร์ดด้านสิ่งแวดล้อมขององค์กรคุณ"
    >
      <Form layout="vertical" requiredMark={false}>
        <Form.Item label="ชื่อ–นามสกุล" required>
          <Input prefix={<UserOutlined />} placeholder="สมชาย ใจดี" size="large" />
        </Form.Item>
        <Form.Item label="อีเมล" required>
          <Input prefix={<MailOutlined />} placeholder="you@company.com" size="large" />
        </Form.Item>
        <Form.Item label="รหัสผ่าน" required>
          <Input.Password prefix={<LockOutlined />} placeholder="••••••••" size="large" />
        </Form.Item>
        <Form.Item label="ยืนยันรหัสผ่าน" required>
          <Input.Password prefix={<LockOutlined />} placeholder="••••••••" size="large" />
        </Form.Item>
        <Button type="primary" htmlType="submit" block size="large" className="auth-primary-btn">
          สร้างบัญชี
        </Button>
      </Form>
      <Typography.Paragraph style={{ textAlign: "center", marginTop: 18, marginBottom: 0 }}>
        มีบัญชีแล้ว? <Link to="/auth/login">เข้าสู่ระบบ</Link>
      </Typography.Paragraph>
    </AuthSplitLayout>
  )
}
