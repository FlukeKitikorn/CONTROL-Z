import { Card, Col, Flex, Row, Skeleton, Space } from "antd"
import { useState } from "react"
import { useLocation } from "react-router"

type SkeletonLayout = "auth" | "form" | "table" | "dashboard"

function resolveLayout(pathname: string): SkeletonLayout {
  if (pathname.startsWith("/auth")) return "auth"
  if (pathname.includes("/data-input") || pathname.includes("/setup")) return "form"
  if (
    pathname.startsWith("/admin") &&
    (pathname.includes("/users") ||
      pathname.includes("/organizations") ||
      pathname.includes("/monitoring") ||
      pathname.includes("/factors"))
  ) {
    return "table"
  }
  return "dashboard"
}

/** จำนวนแถว paragraph สุ่มเล็กน้อยต่อการโหลด — ให้ความรู้สึก “ไดนามิก” โดยไม่ต้องพึ่งข้อมูลจริง */
function useJitterRows(min: number, max: number) {
  const [rows] = useState(() => min + Math.floor(Math.random() * (max - min + 1)))
  return rows
}

function AuthSkeleton() {
  const rows = useJitterRows(3, 5)
  return (
    <Flex align="center" justify="center" style={{ minHeight: "70vh", padding: 24 }}>
      <Card style={{ width: "100%", maxWidth: 420 }} styles={{ body: { padding: 32 } }}>
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <Flex justify="center">
            <Skeleton.Avatar active size={64} shape="square" style={{ borderRadius: 12 }} />
          </Flex>
          <Skeleton active title={{ width: "60%" }} paragraph={{ rows: 1 }} />
          <Skeleton.Input active size="large" block />
          <Skeleton.Input active size="large" block />
          <Skeleton.Button active size="large" block />
          <Skeleton active paragraph={{ rows }} title={false} />
        </Space>
      </Card>
    </Flex>
  )
}

function FormSkeleton() {
  const rows = useJitterRows(2, 4)
  return (
    <Space direction="vertical" size={20} style={{ width: "100%" }}>
      <Skeleton active title={{ width: "40%" }} paragraph={false} />
      <Card>
        <Space direction="vertical" size="middle" style={{ width: "100%" }}>
          <Skeleton.Input active size="default" block />
          <Skeleton.Input active size="default" block />
          <Skeleton.Input active size="large" block />
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Skeleton.Input active block />
            </Col>
            <Col xs={24} md={12}>
              <Skeleton.Input active block />
            </Col>
          </Row>
          <Skeleton active paragraph={{ rows }} title={false} />
          <Flex gap={12} justify="flex-end">
            <Skeleton.Button active />
            <Skeleton.Button active />
          </Flex>
        </Space>
      </Card>
    </Space>
  )
}

function TableSkeleton() {
  const rows = useJitterRows(5, 9)
  return (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      <Flex justify="space-between" align="center" gap={16} wrap="wrap">
        <Skeleton active title={{ width: 200 }} paragraph={false} />
        <Skeleton.Button active />
      </Flex>
      <Card styles={{ body: { padding: 0 } }}>
        <div style={{ padding: 16 }}>
          <Skeleton active title={false} paragraph={{ rows: 1 }} />
        </div>
        <Skeleton active title={false} paragraph={{ rows }} />
      </Card>
    </Space>
  )
}

function DashboardSkeleton() {
  const cardLines = useJitterRows(2, 3)
  const bottomRows = useJitterRows(4, 7)
  return (
    <Space direction="vertical" size={24} style={{ width: "100%" }}>
      <Skeleton active title={{ width: "35%" }} paragraph={{ rows: 1 }} />
      <Row gutter={[16, 16]}>
        {[0, 1, 2].map((i) => (
          <Col key={i} xs={24} sm={12} lg={8}>
            <Card>
              <Skeleton active avatar title paragraph={{ rows: cardLines }} />
            </Card>
          </Col>
        ))}
      </Row>
      <Card>
        <Skeleton active title paragraph={{ rows: bottomRows }} />
      </Card>
    </Space>
  )
}

/**
 * Skeleton โหลดหน้าแบบไดนามิกจาก path ปัจจุบัน — ใช้กับ Suspense + React.lazy
 */
export function PageLoadingFallback() {
  const { pathname } = useLocation()
  const layout = resolveLayout(pathname)

  switch (layout) {
    case "auth":
      return <AuthSkeleton />
    case "form":
      return <FormSkeleton />
    case "table":
      return <TableSkeleton />
    default:
      return <DashboardSkeleton />
  }
}
