import { Card, Col, Row, Statistic, Typography } from "antd"

export function AdminDashboardPage() {
  return (
    <div className="w-full min-w-0 space-y-6">
      <Typography.Title level={2} style={{ marginBottom: 0 }}>
        แดชบอร์ดผู้ดูแลระบบ
      </Typography.Title>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card>
            <Statistic title="จำนวนผู้ใช้" value={128} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Statistic title="จำนวนองค์กร" value={47} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Statistic title="การใช้งานระบบ (7 วัน)" value={82} suffix="%" />
          </Card>
        </Col>
      </Row>
    </div>
  )
}
