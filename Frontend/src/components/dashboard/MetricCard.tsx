/**
 * REFACTOR(CANDIDATE-REMOVAL): ไม่ถูก import — Phase A dead-code audit
 */
export {}

/*
import { Card, Typography } from "antd"

interface MetricCardProps {
  label: string
  value: string
  helper: string
  trend?: "up" | "down" | "neutral"
}

export function MetricCard({ label, value, helper, trend = "neutral" }: MetricCardProps) {
  const trendColor =
    trend === "up"
      ? "#dc2626"
      : trend === "down"
        ? "#059669"
        : "#64748b"

  return (
    <Card>
      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
        {label}
      </Typography.Text>
      <Typography.Title level={3} style={{ marginTop: 10, marginBottom: 8 }}>
        {value}
      </Typography.Title>
      <Typography.Text style={{ color: trendColor }}>{helper}</Typography.Text>
    </Card>
  )
}
*/
