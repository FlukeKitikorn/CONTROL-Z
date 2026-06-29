import { Suspense, useMemo } from "react"
import { Breadcrumb, Button, Flex, Layout, Menu, Space, Typography } from "antd"
import type { MenuProps } from "antd"
import {
  DashboardOutlined,
  DatabaseOutlined,
  FormOutlined,
  FileTextOutlined,
  LineChartOutlined,
  LogoutOutlined,
  SettingOutlined as ManageOutlined,
  SettingOutlined,
} from "@ant-design/icons"
import { NavLink, Outlet, useLocation, useNavigate } from "react-router"
import { mainAppBreadcrumbItems } from "@/app/breadcrumbs/routeBreadcrumbs"
import { PageLoadingFallback } from "@/components/common/PageLoadingFallback"
import { AppHeaderAccountZone } from "@/components/layout/AppHeaderAccountZone"
import { performLogout } from "@/lib/logout"
import { useAuthStore } from "@/store/useAuthStore"

const { Header, Sider, Content } = Layout

const HEADER_LOGO = "/images/bg-logo.png"

export function MainLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const role = useAuthStore((state) => state.role)

  const selectedKey =
    [
      "/app/settings",
      "/app/setup/organization",
      "/app/reports",
      "/app/data-input",
      "/app/records",
      "/app/results",
      "/app",
    ]
      .filter((key) => location.pathname === key || location.pathname.startsWith(`${key}/`))
      .sort((a, b) => b.length - a.length)[0] ?? location.pathname

  const menuItems: MenuProps["items"] = useMemo(() => {
    const groups: MenuProps["items"] = [
      {
        key: "grp-user",
        type: "group",
        label: "พื้นที่ผู้ใช้",
        children: [
          { key: "/app", icon: <DashboardOutlined />, label: <NavLink to="/app">แดชบอร์ด</NavLink> },
          { key: "/app/data-input", icon: <FormOutlined />, label: <NavLink to="/app/data-input">กรอกข้อมูล</NavLink> },
          { key: "/app/records", icon: <DatabaseOutlined />, label: <NavLink to="/app/records">บันทึกข้อมูล</NavLink> },
          { key: "/app/results", icon: <LineChartOutlined />, label: <NavLink to="/app/results">การคำนวณ</NavLink> },
          { key: "/app/reports", icon: <FileTextOutlined />, label: <NavLink to="/app/reports">รายงานและส่งออก</NavLink> },
        ],
      },
      {
        key: "grp-setup",
        type: "group",
        label: "ตั้งค่าองค์กร",
        children: [
          {
            key: "/app/setup/organization",
            icon: <ManageOutlined />,
            label: <NavLink to="/app/setup/organization">องค์กร</NavLink>,
          },
        ],
      },
      {
        key: "grp-system",
        type: "group",
        label: "ระบบ",
        children: [{ key: "/app/settings", icon: <SettingOutlined />, label: <NavLink to="/app/settings">ตั้งค่า</NavLink> }],
      },
    ]
    if (role === "ADMIN") {
      return groups.filter((g) => g && "key" in g && g.key !== "grp-setup")
    }
    return groups
  }, [role])

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
        <Space size={20} align="center" className="min-w-0 flex-1">
          <NavLink to="/app" style={{ display: "flex", alignItems: "center", lineHeight: 0 }}>
            <img
              src={HEADER_LOGO}
              alt="Control Z"
              style={{ height: 36, width: "auto", maxWidth: 200, objectFit: "contain" }}
            />
          </NavLink>
          {role === "ADMIN" ? (
            <NavLink to="/admin" className="hidden shrink-0 sm:inline">
              <Typography.Text type="secondary" className="text-sm whitespace-nowrap hover:text-teal-800">
                ← คอนโซลผู้ดูแล
              </Typography.Text>
            </NavLink>
          ) : null}
        </Space>
        <AppHeaderAccountZone logoutNavigateTo="/auth/login" />
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
              className="[&_.ant-menu-item-selected]:!bg-teal-50 [&_.ant-menu-item-selected]:!text-teal-900"
            />
            <Button
              type="primary"
              danger
              icon={<LogoutOutlined />}
              block
              onClick={() => {
                void performLogout().then(() => navigate("/auth/login"))
              }}
            >
              ออกจากระบบ
            </Button>
          </Flex>
        </Sider>

        <Content className="main-app-content !ml-0 mt-16 box-border flex min-h-[calc(100dvh-64px)] w-full min-w-0 flex-1 flex-col p-4 sm:p-6 md:!ml-[272px]">
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
