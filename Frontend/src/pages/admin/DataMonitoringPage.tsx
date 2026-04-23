import { Card, Table, Tag, Typography } from "antd"

const logs = [
  { key: "1", dataset: "ข้อมูลเชื้อเพลิง Scope 1", actor: "Jane Doe", status: "ส่งแล้ว", time: "2026-04-10 09:12" },
  { key: "2", dataset: "ไฟฟ้า Scope 2", actor: "Admin Root", status: "ตรวจแล้ว", time: "2026-04-10 10:03" },
]

export function DataMonitoringPage() {
  return (
    <Card
      className="w-full min-w-0"
      title={<Typography.Title level={4} style={{ margin: 0 }}>ตรวจสอบข้อมูลและบันทึกการตรวจ</Typography.Title>}
    >
      <Table
        dataSource={logs}
        columns={[
          { title: "ชุดข้อมูล", dataIndex: "dataset" },
          { title: "ผู้ดำเนินการ", dataIndex: "actor" },
          { title: "สถานะ", dataIndex: "status", render: (status) => <Tag>{status}</Tag> },
          { title: "เวลา", dataIndex: "time" },
        ]}
      />
    </Card>
  )
}
