import type { ReactNode } from "react"

import { PageHeader } from "@/components/common/PageHeader"

/** หัวข้อหน้าแบบมาตรฐานโซน Admin — ใช้ PageHeader เดียวกับพื้นที่ผู้ใช้ */
export function AdminPageShell({
  title,
  description,
  extra,
  children,
  className,
}: {
  title: ReactNode
  description?: ReactNode
  extra?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <div className={className ?? "w-full min-w-0 space-y-6"}>
      <PageHeader title={title} description={description} actions={extra} />
      {children}
    </div>
  )
}
