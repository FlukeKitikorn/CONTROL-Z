import { Suspense, useMemo } from "react"
import { Avatar, Badge, Breadcrumb, Button, Flex, Input, Layout, Menu, Space, Typography } from "antd"
import {
  BellOutlined,
  FileTextOutlined,
  LogoutOutlined,
  SearchOutlined,
  SettingOutlined,
  TableOutlined,
  UserOutlined,
} from "@ant-design/icons"
import { NavLink, Outlet, useLocation, useNavigate } from "react-router"
import { adminBreadcrumbItems } from "@/app/breadcrumbs/routeBreadcrumbs"
import { PageLoadingFallback } from "@/components/common/PageLoadingFallback"
import { useAuthStore } from "@/store/useAuthStore"

const { Header, Sider, Content } = Layout

const adminTopItems = [
  { to: "/admin", label: "แดชบอร์ดผู้ดูแล" },
  { to: "/admin/users", label: "ผู้ใช้" },
  { to: "/admin/organizations", label: "องค์กร" },
]

export function AdminLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const logout = useAuthStore((state) => state.logout)
  const selectedKey =
    ["/admin", "/admin/users", "/admin/organizations", "/admin/factors", "/admin/monitoring"]
      .filter((key) => location.pathname.startsWith(key))
      .sort((a, b) => b.length - a.length)[0] ?? location.pathname

  const breadcrumbItems = useMemo(() => adminBreadcrumbItems(location.pathname), [location.pathname])

  return (
    <Layout style={{ minHeight: "100dvh", background: "#f8fafc" }}>
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
        <Space size={20}>
          <Typography.Text strong style={{ fontSize: 20 }}>
            Control Z ผู้ดูแลระบบ
          </Typography.Text>
          <Space size={8} className="hidden md:flex">
            {adminTopItems.map((item) => (
              <NavLink key={item.to} to={item.to}>
                {({ isActive }) => <Button type={isActive ? "primary" : "text"}>{item.label}</Button>}
              </NavLink>
            ))}
          </Space>
        </Space>
        <Space>
          <Input
            placeholder="ค้นหาผู้ใช้ องค์กร..."
            prefix={<SearchOutlined />}
            style={{ width: 260 }}
            className="hidden lg:inline-flex"
          />
          <Badge dot>
            <Button type="text" icon={<BellOutlined />} />
          </Badge>
          <Button type="text" icon={<SettingOutlined />} />
          <Avatar size={32} style={{ background: "#1d4ed8" }}>
            AD
          </Avatar>
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
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 shrink-0">
              <Typography.Text strong>ผู้จัดการระบบ</Typography.Text>
              <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
                กำกับดูแลข้อมูลและการใช้งาน
              </Typography.Paragraph>
            </div>

            <Menu
              mode="inline"
              selectedKeys={[selectedKey]}
              items={[
                { key: "/admin", icon: <TableOutlined />, label: <NavLink to="/admin">แดชบอร์ด</NavLink> },
                { key: "/admin/users", icon: <UserOutlined />, label: <NavLink to="/admin/users">จัดการผู้ใช้</NavLink> },
                { key: "/admin/organizations", icon: <TableOutlined />, label: <NavLink to="/admin/organizations">องค์กร</NavLink> },
                { key: "/admin/factors", icon: <FileTextOutlined />, label: <NavLink to="/admin/factors">ปัจจัยการปล่อย</NavLink> },
                { key: "/admin/monitoring", icon: <FileTextOutlined />, label: <NavLink to="/admin/monitoring">ตรวจสอบข้อมูล</NavLink> },
              ]}
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
        <Content className="admin-app-content !ml-0 mt-16 box-border flex min-h-[calc(100dvh-64px)] w-full min-w-0 flex-1 flex-col p-6 md:!ml-[272px]">
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
