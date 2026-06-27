import { Alert, App, Button, Descriptions, Form, Input, InputNumber, Modal, Popconfirm, Space, Switch, Table, Tag, Typography } from "antd"
import type { ColumnsType } from "antd/es/table"
import { PlusOutlined } from "@ant-design/icons"
import { useCallback, useEffect, useMemo, useState } from "react"
import { AdminStandardTableCard, AdminTableToolbar } from "@/components/admin/AdminTableToolbar"
import { AdminPageShell } from "@/components/admin/AdminPageShell"
import { ApiError } from "@/lib/api/http"
import { adminDeleteUser, adminListUsers, adminPatchUser, adminPatchUserPrivileges } from "@/lib/api/service"
import type { AdminUserListItem } from "@/lib/api/types"

const PAGE_SIZE = 15

type UserEditForm = {
  firstname: string
  lastname: string
  email: string
  organization_id: number
  active: boolean
}

export function ManageUsersPage() {
  const { message } = App.useApp()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [items, setItems] = useState<AdminUserListItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [detailUser, setDetailUser] = useState<AdminUserListItem | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<AdminUserListItem | null>(null)
  const [saving, setSaving] = useState(false)
  const [editForm] = Form.useForm<UserEditForm>()

  const load = useCallback(async (p: number) => {
    setLoading(true)
    setError(null)
    const skip = (p - 1) * PAGE_SIZE
    try {
      const res = await adminListUsers(skip, PAGE_SIZE)
      setItems(res.items)
      setTotal(res.total)
    } catch (e) {
      setItems([])
      setTotal(0)
      setError(e instanceof ApiError ? e.message : "โหลดรายการผู้ใช้ไม่สำเร็จ")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load(page)
  }, [load, page])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return items
    return items.filter(
      (u) =>
        `${u.firstname} ${u.lastname}`.toLowerCase().includes(q) ||
        (u.email?.toLowerCase().includes(q) ?? false) ||
        u.uname.toLowerCase().includes(q) ||
        String(u.organization_id).includes(q) ||
        String(u.user_id).includes(q),
    )
  }, [items, search])

  const openEdit = (u: AdminUserListItem) => {
    setEditTarget(u)
    editForm.setFieldsValue({
      firstname: u.firstname,
      lastname: u.lastname,
      email: u.email ?? "",
      organization_id: u.organization_id,
      active: Boolean(u.uall),
    })
    setEditOpen(true)
  }

  const submitEdit = async () => {
    if (!editTarget) return
    const v = await editForm.validateFields()
    setSaving(true)
    try {
      await adminPatchUser(editTarget.user_id, {
        firstname: v.firstname.trim(),
        lastname: v.lastname.trim(),
        email: v.email.trim() || undefined,
        organization_id: v.organization_id,
      })
      await adminPatchUserPrivileges(editTarget.user_id, { uall: v.active ? 1 : 0 })
      message.success("บันทึกการแก้ไขผู้ใช้แล้ว")
      setEditOpen(false)
      setEditTarget(null)
      await load(page)
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "บันทึกไม่สำเร็จ"
      message.error(msg)
      setError(msg)
    } finally {
      setSaving(false)
    }
  }

  const columns: ColumnsType<AdminUserListItem> = [
    {
      title: "ชื่อ",
      key: "name",
      render: (_, u) => (
        <Space direction="vertical" size={0}>
          <Typography.Text strong>
            {u.firstname} {u.lastname}
          </Typography.Text>
          <Typography.Text type="secondary" className="text-xs">
            @{u.uname}
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: "อีเมล",
      dataIndex: "email",
      ellipsis: true,
      render: (email: string | null) => email ?? "—",
    },
    {
      title: "องค์กร ID",
      dataIndex: "organization_id",
      width: 110,
    },
    {
      title: "สถานะ",
      dataIndex: "uall",
      width: 100,
      render: (v: number) => (v ? <Tag color="success">ใช้งาน</Tag> : <Tag>ระงับ</Tag>),
    },
    {
      title: "",
      key: "actions",
      width: 260,
      render: (_, u) => (
        <Space size="small" wrap>
          <Button type="link" size="small" onClick={() => setDetailUser(u)}>
            รายละเอียด
          </Button>
          <Button type="link" size="small" onClick={() => openEdit(u)}>
            แก้ไข
          </Button>
          <Popconfirm
            title="ลบผู้ใช้นี้และข้อมูลที่เกี่ยวข้อง?"
            description="การลบไม่สามารถย้อนกลับได้"
            okText="ลบ"
            cancelText="ยกเลิก"
            okButtonProps={{ danger: true }}
            onConfirm={async () => {
              try {
                await adminDeleteUser(u.user_id)
                message.success("ลบผู้ใช้แล้ว")
                await load(page)
              } catch (e) {
                const msg = e instanceof ApiError ? e.message : "ลบไม่สำเร็จ"
                message.error(msg)
                setError(msg)
              }
            }}
          >
            <Button type="link" size="small" danger>
              ลบ
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <AdminPageShell title="จัดการผู้ใช้" description="ดูรายชื่อผู้ใช้และองค์กรที่ผูกอยู่">
      {error ? (
        <Alert type="error" showIcon closable onClose={() => setError(null)} message={error} className="mb-4" />
      ) : null}

      <AdminStandardTableCard
        toolbar={
          <AdminTableToolbar
            placeholder="ค้นหาในหน้านี้ (ชื่อ, อีเมล, ชื่อผู้ใช้, รหัสองค์กร, รหัสผู้ใช้)"
            value={search}
            onChange={setSearch}
            suffix={
              <Space wrap className="justify-end">
                <Typography.Text type="secondary" className="text-sm">
                  ทั้งระบบ {total.toLocaleString("th-TH")} บัญชี · แสดง {filtered.length} รายการในหน้า
                </Typography.Text>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddOpen(true)}>
                  เพิ่มผู้ใช้
                </Button>
              </Space>
            }
          />
        }
      >
        <Table<AdminUserListItem>
          rowKey="user_id"
          loading={loading}
          columns={columns}
          dataSource={search.trim() ? filtered : items}
          pagination={{
            current: page,
            pageSize: PAGE_SIZE,
            total,
            showSizeChanger: false,
            onChange: (p) => setPage(p),
            showTotal: (t) => `ทั้งหมด ${t.toLocaleString("th-TH")} รายการ`,
          }}
          scroll={{ x: 720 }}
        />
      </AdminStandardTableCard>

      <Modal
        title="รายละเอียดผู้ใช้"
        open={detailUser != null}
        onCancel={() => setDetailUser(null)}
        footer={null}
        width={600}
        destroyOnClose
      >
        <Alert
          type="info"
          showIcon
          className="mb-4"
          message="ข้อมูลจากระบบ"
          description="ด้านล่างเป็นรายการฟิลด์ที่ API ส่งกลับ — ข้อมูลดิบ JSON ใช้ตรวจสอบหรือคัดลอก"
        />
        {detailUser ? (
          <>
            <Descriptions
              bordered
              size="small"
              column={1}
              className="mb-4"
              items={[
                { key: "id", label: "user_id", children: detailUser.user_id },
                { key: "name", label: "ชื่อ", children: `${detailUser.firstname} ${detailUser.lastname}` },
                { key: "uname", label: "ชื่อผู้ใช้ (login)", children: detailUser.uname },
                { key: "email", label: "อีเมล", children: detailUser.email ?? "—" },
                { key: "org", label: "องค์กร ID", children: detailUser.organization_id },
                { key: "uall", label: "สถานะ (uall)", children: detailUser.uall ? "ใช้งาน (1)" : "ระงับ (0)" },
              ]}
            />
            <Typography.Text type="secondary" className="mb-1 block text-xs">
              ข้อมูลดิบ
            </Typography.Text>
            <pre className="max-h-[280px] overflow-auto rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs leading-relaxed">
              {JSON.stringify(detailUser, null, 2)}
            </pre>
          </>
        ) : null}
      </Modal>

      <Modal
        title="แก้ไขผู้ใช้"
        open={editOpen}
        onCancel={() => {
          setEditOpen(false)
          setEditTarget(null)
        }}
        onOk={() => void submitEdit()}
        confirmLoading={saving}
        width={520}
        destroyOnClose
      >
        <Alert
          type="warning"
          showIcon
          className="mb-4"
          message="แก้ไขข้อมูลผู้ใช้"
          description="การเปลี่ยนอีเมลอาจกระทบการเข้าสู่ระบบ — ตรวจสอบความซ้ำในระบบก่อนบันทึก"
        />
        <Form form={editForm} layout="vertical" className="mt-0">
          <Form.Item name="firstname" label="ชื่อ" rules={[{ required: true, message: "กรุณากรอกชื่อ" }]}>
            <Input />
          </Form.Item>
          <Form.Item name="lastname" label="นามสกุล" rules={[{ required: true, message: "กรุณากรอกนามสกุล" }]}>
            <Input />
          </Form.Item>
          <Form.Item
            name="email"
            label="อีเมล"
            rules={[
              {
                validator: async (_, v) => {
                  const s = typeof v === "string" ? v.trim() : ""
                  if (!s) return
                  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) throw new Error("รูปแบบอีเมลไม่ถูกต้อง")
                },
              },
            ]}
          >
            <Input placeholder="เว้นว่างได้หากไม่ต้องการเปลี่ยน" />
          </Form.Item>
          <Form.Item name="organization_id" label="องค์กร ID" rules={[{ required: true, message: "กรุณาระบุรหัสองค์กร" }]}>
            <InputNumber min={1} className="!w-full" />
          </Form.Item>
          <Form.Item name="active" label="สถานะใช้งาน" valuePropName="checked">
            <Switch checkedChildren="ใช้งาน" unCheckedChildren="ระงับ" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="เพิ่มผู้ใช้" open={addOpen} onCancel={() => setAddOpen(false)} footer={null} destroyOnClose>
        <Alert
          type="info"
          showIcon
          className="mb-0"
          message="ยังไม่พร้อมใช้งาน"
          description="การเพิ่มผู้ใช้จากคอนโซลผู้ดูแลจะเปิดเมื่อ API รองรับ — ขณะนี้ใช้การลงทะเบียนผ่านหน้า /auth/register ตามกระบวนการที่กำหนด"
        />
      </Modal>
    </AdminPageShell>
  )
}
