import { Button, Card, Space, Table, Tag, Typography } from "antd"

const data = [
  { key: "1", name: "Jane Doe", email: "jane@corp.com", role: "USER" },
  { key: "2", name: "Admin Root", email: "admin@corp.com", role: "ADMIN" },
]

export function ManageUsersPage() {
  return (
    <Card
      className="w-full min-w-0"
      title={<Typography.Title level={4} style={{ margin: 0 }}>จัดการผู้ใช้</Typography.Title>}
      extra={<Button type="primary">เพิ่มผู้ใช้</Button>}
    >
      <Table
        dataSource={data}
        columns={[
          { title: "ชื่อ", dataIndex: "name" },
          { title: "อีเมล", dataIndex: "email" },
          { title: "บทบาท", dataIndex: "role", render: (role) => <Tag>{role}</Tag> },
          {
            title: "การดำเนินการ",
            render: () => (
              <Space>
                <Button size="small">แก้ไข</Button>
                <Button size="small" danger>
                  ลบ
                </Button>
              </Space>
            ),
          },
        ]}
      />
    </Card>
  )
}
