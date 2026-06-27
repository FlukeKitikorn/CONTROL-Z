import { Typography } from "antd"
import type { ReactNode } from "react"

export interface PageHeaderProps {
  title: ReactNode
  description?: ReactNode
  /** ปุ่มหรือ action ด้านขวา — layout เดียวกับหน้า Dashboard */
  actions?: ReactNode
  className?: string
}

/** หัวข้อหน้ามาตรฐาน — อ้างอิง layout Dashboard (ตัวอักษรใหญ่กว่าเล็กน้อย) */
export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <header
      className={[
        "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="min-w-0">
        <Typography.Title
          level={2}
          className="!mb-0.5 !text-[1.75rem] !font-bold !leading-tight !text-slate-900 md:!text-[1.875rem]"
        >
          {title}
        </Typography.Title>
        {description ? (
          <Typography.Text type="secondary" className="block text-[0.9375rem] leading-relaxed md:text-base">
            {description}
          </Typography.Text>
        ) : null}
      </div>
      {actions ? <div className="page-header-actions">{actions}</div> : null}
    </header>
  )
}
