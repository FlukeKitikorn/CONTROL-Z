import { Button, Card, Form, Input, InputNumber, Space, Table, Typography } from "antd"

const factors = [
  { key: "1", source: "ดีเซล", factor: 2.68, version: "v2026.1" },
  { key: "2", source: "ไฟฟ้ากริด", factor: 0.56, version: "v2026.1" },
]

export function EmissionFactorsPage() {
  return (
    <div className="w-full min-w-0 space-y-6">
      <Card title={<Typography.Title level={4} style={{ margin: 0 }}>จัดการปัจจัยการปล่อย</Typography.Title>}>
        <Form layout="inline">
          <Form.Item label="แหล่งที่มา">
            <Input placeholder="เชื้อเพลิง / ไฟฟ้า / เดินทาง" />
          </Form.Item>
          <Form.Item label="ค่าปัจจัย">
            <InputNumber />
          </Form.Item>
          <Form.Item label="เวอร์ชัน">
            <Input placeholder="v2026.2" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary">เพิ่มปัจจัย</Button>
              <Button>บันทึกเวอร์ชัน</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Card>
        <Table
          dataSource={factors}
          columns={[
            { title: "แหล่งที่มา", dataIndex: "source" },
            { title: "ค่าปัจจัย", dataIndex: "factor" },
            { title: "เวอร์ชัน", dataIndex: "version" },
          ]}
        />
      </Card>
    </div>
  )
}
