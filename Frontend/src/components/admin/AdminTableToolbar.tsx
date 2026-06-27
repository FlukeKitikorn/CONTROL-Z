import { SearchOutlined } from "@ant-design/icons"
import { Card, Input } from "antd"
import type { ReactNode } from "react"

/** การ์ดตารางมาตรฐานโซนแอดมิน — สอดคล้องหน้าประกาศ */
export const adminStandardTableCardProps = {
  bordered: false as const,
  className: "shadow-sm",
}

export const adminStandardTablePagination = {
  pageSize: 10,
  showSizeChanger: true as const,
}

type AdminTableToolbarProps = {
  placeholder: string
  value: string
  onChange: (next: string) => void
  suffix?: ReactNode
}

export function AdminTableToolbar({ placeholder, value, onChange, suffix }: AdminTableToolbarProps) {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
      <Input
        allowClear
        placeholder={placeholder}
        prefix={<SearchOutlined className="text-slate-400" />}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="max-w-md"
      />
      {suffix ? <div className="flex flex-wrap items-center gap-2">{suffix}</div> : null}
    </div>
  )
}

type AdminStandardTableCardProps = {
  toolbar?: ReactNode
  children: ReactNode
}

export function AdminStandardTableCard({ toolbar, children }: AdminStandardTableCardProps) {
  return (
    <Card {...adminStandardTableCardProps}>
      {toolbar}
      {children}
    </Card>
  )
}
