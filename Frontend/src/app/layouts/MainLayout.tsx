import { Suspense, useMemo, useState } from "react"
import {
  Avatar,
  Badge,
  Breadcrumb,
  Button,
  Dropdown,
  Flex,
  Layout,
  List,
  Menu,
  Popover,
  Space,
  Typography,
} from "antd"
import type { MenuProps } from "antd"
import {
  BellOutlined,
  DashboardOutlined,
  FormOutlined,
  FileTextOutlined,
  FlagOutlined,
  LineChartOutlined,
  LogoutOutlined,
  SettingOutlined as ManageOutlined,
  SettingOutlined,
} from "@ant-design/icons"
import { NavLink, Outlet, useLocation, useNavigate } from "react-router"
import { mainAppBreadcrumbItems } from "@/app/breadcrumbs/routeBreadcrumbs"
import { PageLoadingFallback } from "@/components/common/PageLoadingFallback"
import { useAuthStore } from "@/store/useAuthStore"

const { Header, Sider, Content } = Layout

const HEADER_LOGO = "/images/bg-logo.png"

type AppNotification = {
  id: string
  title: string
  description: string
  timeLabel: string
  read: boolean
}

function avatarInitials(firstName: string, lastName: string) {
  const a = firstName.charAt(0) || "?"
  const b = lastName && lastName !== "—" ? lastName.charAt(0) : firstName.charAt(1) || ""
  return `${a}${b}`.toUpperCase()
}

export function MainLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const logout = useAuthStore((state) => state.logout)
  const user = useAuthStore((state) => state.user)

  const [notifOpen, setNotifOpen] = useState(false)
  const [notifications, setNotifications] = useState<AppNotification[]>(() => [
    {
      id: "1",
      title: "ใกล้ถึงกำหนดส่งข้อมูลรายไตรมาส",
      description: "ตรวจสอบข้อมูลการปล่อยในหมวด Stationary และ Mobile ให้ครบถ้วน",
      timeLabel: "2 ชั่วโมงที่แล้ว",
      read: false,
    },
    {
      id: "2",
      title: "อัปเดตปัจจัยการปล่อย",
      description: "ฐานข้อมูลปัจจัย IPCC มีเวอร์ชันใหม่สำหรับปี 2026",
      timeLabel: "เมื่อวาน",
      read: false,
    },
    {
      id: "3",
      title: "สรุปผลการคำนวณเสร็จสิ้น",
      description: "คุณสามารถดูรายงานผลการปล่อยในหน้าผลการคำนวณได้แล้ว",
      timeLabel: "3 วันที่แล้ว",
      read: true,
    },
  ])

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications])

  const markNotificationRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const selectedKey =
    [
      "/app/settings",
      "/app/setup/organization",
      "/app/setup/base-year",
      "/app/reports",
      "/app/data-input",
      "/app/results",
      "/app",
    ]
      .filter((key) => location.pathname === key || location.pathname.startsWith(`${key}/`))
      .sort((a, b) => b.length - a.length)[0] ?? location.pathname

  const menuItems: MenuProps["items"] = [
    {
      key: "grp-user",
      type: "group",
      label: "พื้นที่ผู้ใช้",
      children: [
        { key: "/app", icon: <DashboardOutlined />, label: <NavLink to="/app">แดชบอร์ด</NavLink> },
        { key: "/app/data-input", icon: <FormOutlined />, label: <NavLink to="/app/data-input">กรอกข้อมูล</NavLink> },
        { key: "/app/results", icon: <LineChartOutlined />, label: <NavLink to="/app/results">ผลการคำนวณ</NavLink> },
        { key: "/app/reports", icon: <FileTextOutlined />, label: <NavLink to="/app/reports">รายงานและส่งออก</NavLink> },
      ],
    },
    {
      key: "grp-setup",
      type: "group",
      label: "ตั้งค่าองค์กร",
      children: [
        { key: "/app/setup/organization", icon: <ManageOutlined />, label: <NavLink to="/app/setup/organization">องค์กร</NavLink> },
        { key: "/app/setup/base-year", icon: <FlagOutlined />, label: <NavLink to="/app/setup/base-year">ปีฐาน</NavLink> },
      ],
    },
    {
      key: "grp-system",
      type: "group",
      label: "ระบบ",
      children: [
        { key: "/app/settings", icon: <SettingOutlined />, label: <NavLink to="/app/settings">ตั้งค่า</NavLink> },
      ],
    },
  ]

  const avatarMenuItems: MenuProps["items"] = [
    {
      key: "settings",
      label: "ตั้งค่า",
      icon: <SettingOutlined />,
    },
    { type: "divider" },
    {
      key: "logout",
      label: "ออกจากระบบ",
      icon: <LogoutOutlined />,
      danger: true,
    },
  ]

  const displayFirst = user?.fname ?? "ผู้ใช้"
  const displayLast = user?.lname ?? "—"
  const displayEmail = user?.email ?? "—"

  const breadcrumbItems = useMemo(() => mainAppBreadcrumbItems(location.pathname), [location.pathname])

  return (
    <Layout style={{ minHeight: "100dvh", background: "#f3f6fb" }}>
      <Header
        style={{
          position: "fixed",
          zIndex: 20,
          width: "100%",
          height: 64,
          background: "rgba(255,255,255,0.92)",
          borderBottom: "1px solid #d9e1ec",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingInline: 24,
        }}
      >
        <Space size={20} align="center">
          <NavLink to="/app" style={{ display: "flex", alignItems: "center", lineHeight: 0 }}>
            <img
              src={HEADER_LOGO}
              alt="Control Z"
              style={{ height: 36, width: "auto", maxWidth: 200, objectFit: "contain" }}
            />
          </NavLink>
        </Space>
        <Space size={16} align="center">
          <Popover
            title={<Typography.Text strong>การแจ้งเตือน</Typography.Text>}
            trigger="click"
            placement="bottomRight"
            open={notifOpen}
            onOpenChange={setNotifOpen}
            arrow={{ pointAtCenter: true }}
            styles={{
              root: { maxWidth: 316 },
              content: { padding: 0 },
            }}
            content={
              <div style={{ width: 300 }}>
                <div style={{ maxHeight: 260, overflowY: "auto", padding: "8px 10px 0" }}>
                  <List
                    size="small"
                    itemLayout="vertical"
                    dataSource={notifications}
                    locale={{ emptyText: "ไม่มีการแจ้งเตือน" }}
                    split={false}
                    renderItem={(item) => (
                      <List.Item
                        onClick={() => markNotificationRead(item.id)}
                        style={{
                          cursor: "pointer",
                          background: item.read ? undefined : "rgba(14, 165, 233, 0.06)",
                          padding: "8px 10px",
                          borderRadius: 8,
                          marginBottom: 6,
                        }}
                      >
                        <List.Item.Meta
                          title={
                            <Space size={6}>
                              {!item.read && <Badge status="processing" />}
                              <Typography.Text strong={!item.read} style={{ fontSize: 13 }}>
                                {item.title}
                              </Typography.Text>
                            </Space>
                          }
                          description={
                            <>
                              <Typography.Paragraph style={{ marginBottom: 6, fontSize: 12 }}>
                                {item.description}
                              </Typography.Paragraph>
                              <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                                {item.timeLabel}
                              </Typography.Text>
                            </>
                          }
                        />
                      </List.Item>
                    )}
                  />
                </div>
                <div
                  style={{
                    borderTop: "1px solid var(--ant-color-split, #f0f0f0)",
                    padding: "8px 10px",
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 8,
                    flexWrap: "wrap",
                  }}
                >
                  <Button size="small" onClick={markAllNotificationsRead} disabled={unreadCount === 0}>
                    อ่านทั้งหมดแล้ว
                  </Button>
                  <Button type="primary" size="small" onClick={() => setNotifOpen(false)}>
                    ปิด
                  </Button>
                </div>
              </div>
            }
          >
            <Badge count={unreadCount} size="small" overflowCount={99}>
              <Button type="text" icon={<BellOutlined />} aria-label="การแจ้งเตือน" />
            </Badge>
          </Popover>

          <Space align="center" size={12}>
            <Dropdown
              menu={{
                items: avatarMenuItems,
                onClick: ({ key }) => {
                  if (key === "settings") navigate("/app/settings")
                  if (key === "logout") {
                    logout()
                    navigate("/auth/login")
                  }
                },
              }}
              trigger={["hover"]}
              placement="bottomRight"
            >
              <Avatar size={36} style={{ background: "#0f766e", cursor: "pointer" }}>
                {avatarInitials(displayFirst, displayLast)}
              </Avatar>
            </Dropdown>
            <div className="max-sm:hidden" style={{ textAlign: "left", lineHeight: 1.35, maxWidth: 220 }}>
              <Typography.Text strong style={{ display: "block" }}>
                {displayFirst} {displayLast}
              </Typography.Text>
              <Typography.Text type="secondary" ellipsis style={{ fontSize: 12, maxWidth: 220, display: "block" }}>
                {displayEmail}
              </Typography.Text>
            </div>
          </Space>
        </Space>
      </Header>

      <Layout hasSider className="min-h-[calc(100dvh-64px)] !min-w-0">
        <Sider
          width={272}
          style={{
            background: "#ffffff",
            borderRight: "1px solid #d9e1ec",
            position: "fixed",
            left: 0,
            top: 64,
            bottom: 0,
            padding: 16,
          }}
          className="hidden md:block"
        >
          <Flex vertical gap={16} style={{ height: "100%" }}>
            <Menu
              mode="inline"
              selectedKeys={[selectedKey]}
              items={menuItems}
              style={{ borderInlineEnd: "none", flex: 1, minHeight: 0, overflowY: "auto" }}
            />
            <Button
              type="primary"
              danger
              icon={<LogoutOutlined />}
              block
              onClick={() => {
                logout()
                navigate("/auth/login")
              }}
            >
              ออกจากระบบ
            </Button>
          </Flex>
        </Sider>

        <Content className="main-app-content !ml-0 mt-16 box-border flex min-h-[calc(100dvh-64px)] w-full min-w-0 flex-1 flex-col p-6 md:!ml-[272px]">
          <div className="mx-auto w-full min-w-0 max-w-7xl">
            <Breadcrumb className="mb-0 shrink-0" items={breadcrumbItems} />
            <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col pt-6">
              <Suspense fallback={<PageLoadingFallback />}>
                <Outlet />
              </Suspense>
            </div>
          </div>
        </Content>
      </Layout>
    </Layout>
  )
}
