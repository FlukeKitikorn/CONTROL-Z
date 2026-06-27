import { Card, Space, Typography } from "antd"
import { Link } from "react-router"
import { AdminPageShell } from "@/components/admin/AdminPageShell"
import { useAuthStore } from "@/store/useAuthStore"

export function AdminSettingsPage() {
  const user = useAuthStore((s) => s.user)

  return (
    <AdminPageShell
      title="ตั้งค่าผู้ดูแลระบบ"
      description="ศูนย์รวมลิงก์และข้อมูลสำหรับผู้ดูแล — การตั้งค่าระบบหลักยังอยู่ที่เซิร์ฟเวอร์และฐานข้อมูล"
    >
      <Card title="บัญชีผู้ดูแล" bordered={false} className="shadow-sm">
        <Space direction="vertical" size="small">
          <Typography.Text>
            <strong>ชื่อ:</strong> {user?.fname ?? "—"} {user?.lname ?? ""}
          </Typography.Text>
          <Typography.Text>
            <strong>อีเมล:</strong> {user?.email ?? "—"}
          </Typography.Text>
          <Typography.Paragraph type="secondary" className="!mb-0 !text-sm">
            แก้รหัสผ่าน รูปโปรไฟล์ และดูประกาศ: ไปที่{" "}
            <Link to="/app/settings" className="text-teal-700">
              พื้นที่ผู้ใช้ → ตั้งค่า
            </Link>{" "}
            (ปุ่มแถบหัวของคอนโซลผู้ดูแลชี้ไปที่นี่เหมือนผู้ใช้ทั่วไป)
          </Typography.Paragraph>
        </Space>
      </Card>

      <Card title="เครื่องมือที่เกี่ยวข้อง" bordered={false} className="mt-6 shadow-sm">
        <ul className="list-inside list-disc space-y-2 text-slate-800">
          <li>
            <Link to="/admin/announcements">จัดการประกาศถึงผู้ใช้</Link>
          </li>
          <li>
            <Link to="/admin/logs">บันทึกการดำเนินการและคำสั่งตรวจสอบเซิร์ฟเวอร์</Link>
          </li>
          <li>
            <Link to="/admin/monitoring">ตรวจสอบการส่งข้อมูลขององค์กร</Link>
          </li>
        </ul>
      </Card>

      <Card title="หมายเหตุการปรับใช้งาน" bordered={false} className="mt-6 shadow-sm">
        <Typography.Paragraph className="!mb-2 !text-sm">
          ประกาศและบันทึก audit ของผู้ดูแลถูกเก็บเป็นไฟล์ในโฟลเดอร์ <code className="rounded bg-slate-100 px-1">Backend/runtime/</code>{" "}
          บนเครื่องที่รัน API — ควรสำรองและจำกัดสิทธิ์การเข้าถึงโฟลเดอร์นี้
        </Typography.Paragraph>
        <Typography.Paragraph type="secondary" className="!mb-0 !text-sm">
          การเชื่อมต่อ API ของเบราว์เซอร์กำหนดที่ Vite env (เช่น <code className="rounded bg-slate-100 px-1">VITE_API_BASE_URL</code>)
        </Typography.Paragraph>
      </Card>
    </AdminPageShell>
  )
}
