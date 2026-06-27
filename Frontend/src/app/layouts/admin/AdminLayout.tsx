import { Suspense, useMemo, useState } from "react"
import { Breadcrumb, Button, Drawer, Flex, Grid, Input, Layout, Menu, Space, Typography } from "antd"
import type { MenuProps } from "antd"
import {
  AuditOutlined,
  BankOutlined,
  BellOutlined,
  CodeOutlined,
  DashboardOutlined,
  FileTextOutlined,
  LogoutOutlined,
  MenuOutlined,
  ReadOutlined,
  SearchOutlined,
  SettingOutlined,
  TeamOutlined,
} from "@ant-design/icons"
import { NavLink, Outlet, useLocation, useNavigate } from "react-router"
import { adminBreadcrumbItems } from "@/app/breadcrumbs/routeBreadcrumbs"
import { PageLoadingFallback } from "@/components/common/PageLoadingFallback"
import { AppHeaderAccountZone } from "@/components/layout/AppHeaderAccountZone"
import { ADMIN_LOGIN_PATH } from "@/lib/authPaths"
import { useAuthStore } from "@/store/useAuthStore"

const { Header, Sider, Content } = Layout

const HEADER_LOGO = "/images/bg-logo.png"

const menuKeys = [
  "/admin",
  "/admin/users",
  "/admin/organizations",
  "/admin/factors",
  "/admin/monitoring",
  "/admin/announcements",
  "/admin/terminal",
  "/admin/logs",
  "/admin/settings",
] as const

function buildMenuItems(afterNavigate?: () => void): MenuProps["items"] {
  const link = (to: string, text: string) => (
    <NavLink to={to} onClick={() => afterNavigate?.()}>
      {text}
    </NavLink>
  )

  return [
    {
      type: "group",
      label: "ภาพรวม",
      children: [
        {
          key: "/admin",
          icon: <DashboardOutlined />,
          label: link("/admin", "แดชบอร์ด"),
        },
      ],
    },
    {
      type: "group",
      label: "ผู้ใช้และองค์กร",
      children: [
        {
          key: "/admin/users",
          icon: <TeamOutlined />,
          label: link("/admin/users", "จัดการผู้ใช้"),
        },
        {
          key: "/admin/organizations",
          icon: <BankOutlined />,
          label: link("/admin/organizations", "องค์กร"),
        },
      ],
    },
    {
      type: "group",
      label: "ข้อมูลอ้างอิงและกำกับ",
      children: [
        {
          key: "/admin/factors",
          icon: <ReadOutlined />,
          label: link("/admin/factors", "ปัจจัย / GWP"),
        },
        {
          key: "/admin/monitoring",
          icon: <AuditOutlined />,
          label: link("/admin/monitoring", "ตรวจสอบข้อมูล"),
        },
        {
          key: "/admin/announcements",
          icon: <BellOutlined />,
          label: link("/admin/announcements", "ประกาศถึงผู้ใช้"),
        },
      ],
    },
    {
      type: "group",
      label: "ระบบ",
      children: [
        {
          key: "/admin/terminal",
          icon: <CodeOutlined />,
          label: link("/admin/terminal", "Terminal — บันทึก"),
        },
        {
          key: "/admin/logs",
          icon: <FileTextOutlined />,
          label: link("/admin/logs", "บันทึกและตรวจสอบ"),
        },
        {
          key: "/admin/settings",
          icon: <SettingOutlined />,
          label: link("/admin/settings", "ตั้งค่าผู้ดูแล"),
        },
      ],
    },
  ]
}

export function AdminLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const screens = Grid.useBreakpoint()
  const logout = useAuthStore((state) => state.logout)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const selectedKey =
    [...menuKeys].filter((key) => location.pathname.startsWith(key)).sort((a, b) => b.length - a.length)[0] ??
    location.pathname

  const breadcrumbItems = useMemo(() => adminBreadcrumbItems(location.pathname), [location.pathname])

  const closeDrawer = () => setDrawerOpen(false)
  const menuItems = useMemo(() => buildMenuItems(screens.md ? undefined : closeDrawer), [screens.md])

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
          paddingInline: 16,
        }}
      >
        <Space size={12} align="center" className="min-w-0">
          {!screens.md ? (
            <Button type="text" icon={<MenuOutlined />} aria-label="เปิดเมนู" onClick={() => setDrawerOpen(true)} />
          ) : null}
          <NavLink to="/admin" style={{ display: "flex", alignItems: "center", lineHeight: 0 }}>
            <img
              src={HEADER_LOGO}
              alt="Control Z"
              style={{ height: 34, width: "auto", maxWidth: 180, objectFit: "contain" }}
            />
          </NavLink>
          <Typography.Text
            strong
            className="hidden min-w-0 truncate text-teal-800 sm:inline sm:max-w-[200px] lg:max-w-none"
            style={{ fontSize: 15 }}
          >
            คอนโซลผู้ดูแล
          </Typography.Text>
          <NavLink to="/app" className="hidden shrink-0 lg:inline">
          </NavLink>
        </Space>

        <Space size={12} align="center" wrap>
          <Input
            placeholder="ค้นหาในระบบ (เร็ว ๆ นี้)"
            prefix={<SearchOutlined className="text-slate-400" />}
            disabled
            className="hidden w-[200px] lg:inline-flex xl:w-[260px]"
            size="middle"
          />
          <AppHeaderAccountZone logoutNavigateTo={ADMIN_LOGIN_PATH} />
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
              style={{
                borderInlineEnd: "none",
                flex: 1,
                minHeight: 0,
                overflowY: "auto",
              }}
              className="admin-sider-menu [&_.ant-menu-item-selected]:!bg-teal-50 [&_.ant-menu-item-selected]:!text-teal-900"
            />

            <Button
              type="primary"
              danger
              icon={<LogoutOutlined />}
              block
              onClick={() => {
                logout()
                navigate(ADMIN_LOGIN_PATH)
              }}
            >
              ออกจากระบบ
            </Button>
          </Flex>
        </Sider>

        <Drawer
          title={
            <Space>
              <span>เมนูผู้ดูแล</span>
              <Typography.Text type="secondary" className="!text-xs">
                Control Z
              </Typography.Text>
            </Space>
          }
          placement="left"
          width={280}
          onClose={closeDrawer}
          open={drawerOpen}
          styles={{ body: { paddingTop: 8 } }}
        >
          <Menu
            mode="inline"
            selectedKeys={[selectedKey]}
            items={menuItems}
            style={{ borderInlineEnd: "none" }}
            className="[&_.ant-menu-item-selected]:!bg-teal-50"
          />
        </Drawer>

        <Content className="admin-app-content !ml-0 mt-16 box-border flex min-h-[calc(100dvh-64px)] w-full min-w-0 flex-1 flex-col p-4 sm:p-6 md:!ml-[272px]">
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
