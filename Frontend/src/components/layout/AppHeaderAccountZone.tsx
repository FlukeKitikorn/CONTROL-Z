import { useEffect, useMemo, useState } from "react"
import { Avatar, Badge, Button, Dropdown, List, Popover, Space, Typography } from "antd"
import type { MenuProps } from "antd"
import { BellOutlined, LogoutOutlined, SettingOutlined } from "@ant-design/icons"
import { useNavigate } from "react-router"
import { getAnnouncements } from "@/lib/api/service"
import { useAuthStore } from "@/store/useAuthStore"

type AppNotification = {
  id: string
  annId?: string
  title: string
  description: string
  timeLabel: string
  read: boolean
}

const READ_ANN_KEY = "cz_read_announcements"

function readAnnouncementIds(): Set<string> {
  try {
    const raw = sessionStorage.getItem(READ_ANN_KEY)
    if (!raw) return new Set()
    const arr = JSON.parse(raw) as unknown
    if (!Array.isArray(arr)) return new Set()
    return new Set(arr.filter((x): x is string => typeof x === "string"))
  } catch {
    return new Set()
  }
}

function persistAnnouncementIds(ids: Set<string>) {
  sessionStorage.setItem(READ_ANN_KEY, JSON.stringify([...ids]))
}

function formatAnnouncementTime(iso: string) {
  try {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return iso
    return d.toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" })
  } catch {
    return iso
  }
}

function avatarInitials(firstName: string, lastName: string) {
  const a = firstName.charAt(0) || "?"
  const b = lastName && lastName !== "—" ? lastName.charAt(0) : firstName.charAt(1) || ""
  return `${a}${b}`.toUpperCase()
}

export type AppHeaderAccountZoneProps = {
  /** เส้นทางหลังออกจากระบบ เช่น `/auth/login` หรือ `ADMIN_LOGIN_PATH` */
  logoutNavigateTo: string
}

/**
 * กลุ่มมุมขวาของแถบหัว: แจ้งเตือน (ประกาศ), avatar + hover เมนูตั้งค่า/ออกจากระบบ — ใช้ร่วมกันระหว่าง MainLayout กับ AdminLayout
 */
export function AppHeaderAccountZone({ logoutNavigateTo }: AppHeaderAccountZoneProps) {
  const navigate = useNavigate()
  const logout = useAuthStore((s) => s.logout)
  const user = useAuthStore((s) => s.user)

  const [notifOpen, setNotifOpen] = useState(false)
  const [notifications, setNotifications] = useState<AppNotification[]>([])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const ann = await getAnnouncements()
        if (cancelled) return
        const readIds = readAnnouncementIds()
        setNotifications(
          ann.map((a) => ({
            id: `ann-${a.id}`,
            annId: a.id,
            title: a.title,
            description: a.body,
            timeLabel: formatAnnouncementTime(a.updated_at),
            read: readIds.has(a.id),
          })),
        )
      } catch {
        if (!cancelled) setNotifications([])
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications])

  const markNotificationRead = (id: string) => {
    setNotifications((prev) => {
      const next = prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      const touched = next.find((n) => n.id === id)
      if (touched?.annId) {
        const s = readAnnouncementIds()
        s.add(touched.annId)
        persistAnnouncementIds(s)
      }
      return next
    })
  }

  const markAllNotificationsRead = () => {
    setNotifications((prev) => {
      const s = readAnnouncementIds()
      for (const n of prev) {
        if (n.annId) s.add(n.annId)
      }
      persistAnnouncementIds(s)
      return prev.map((n) => ({ ...n, read: true }))
    })
  }

  const displayFirst = user?.fname ?? "ผู้ใช้"
  const displayLast = user?.lname ?? "—"
  const displayEmail = user?.email ?? "—"

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

  return (
    <Space size={16} align="center">
      <Popover
        title={<Typography.Text strong>การแจ้งเตือน (รวมประกาศจากผู้ดูแล)</Typography.Text>}
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
                navigate(logoutNavigateTo)
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
  )
}
