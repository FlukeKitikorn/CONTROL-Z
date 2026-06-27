import { SafetyOutlined } from "@ant-design/icons"
import { Card, Typography } from "antd"
import type { ReactNode } from "react"

interface AdminAuthLayoutProps {
  children: ReactNode
  title: string
  subtitle: string
}

/**
 * เลย์เอาต์ล็อกอินผู้ดูแล — พื้นและโทนสีสอดคล้อง auth หลัก (teal / #f3f5fa) แต่เป็นการ์ดกลางจอ
 */
export function AdminAuthLayout({ children, title, subtitle }: AdminAuthLayoutProps) {
  return (
    <div className="admin-auth-root relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-4 py-10 sm:px-6">
      <div className="admin-auth-bg absolute inset-0 -z-10" aria-hidden />
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.06]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%230d9488' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative w-full max-w-[440px]">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-teal-200/70 bg-white shadow-sm ring-1 ring-teal-500/10">
            <SafetyOutlined className="text-2xl text-teal-700" />
          </div>
          <Typography.Text className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-800/85">
            Administrator access
          </Typography.Text>
        </div>

        <Card
          className="admin-auth-card border-0"
          styles={{
            body: { padding: "28px 28px 24px" },
          }}
        >
          <Typography.Title level={3} className="!mb-1 !mt-0 !text-slate-900">
            {title}
          </Typography.Title>
          <Typography.Paragraph type="secondary" className="!mb-6 !text-[15px] !leading-relaxed">
            {subtitle}
          </Typography.Paragraph>
          {children}
        </Card>

        <Typography.Text className="mt-6 block text-center text-[13px] text-slate-500">
          Control Z · คอนโซลผู้ดูแลระบบ
        </Typography.Text>
      </div>
    </div>
  )
}
