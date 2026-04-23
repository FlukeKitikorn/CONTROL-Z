import type { ReactNode } from "react"
import { Button, Card } from "antd"

interface PanelProps {
  title: string
  actionText?: string
  children: ReactNode
}

export function Panel({ title, actionText, children }: PanelProps) {
  return (
    <Card
      title={title}
      extra={actionText ? <Button type="link">{actionText}</Button> : null}
    >
      {children}
    </Card>
  )
}
