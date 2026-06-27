import {
  Alert,
  Button,
  Descriptions,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Space,
  Switch,
  Table,
  Typography,
} from "antd"
import type { ColumnsType } from "antd/es/table"
import { PlusOutlined } from "@ant-design/icons"
import { useCallback, useEffect, useMemo, useState } from "react"
import {
  AdminStandardTableCard,
  AdminTableToolbar,
  adminStandardTablePagination,
} from "@/components/admin/AdminTableToolbar"
import { AdminPageShell } from "@/components/admin/AdminPageShell"
import { ApiError } from "@/lib/api/http"
import {
  adminCreateAnnouncement,
  adminDeleteAnnouncement,
  adminListAnnouncements,
  adminPatchAnnouncement,
} from "@/lib/api/service"
import type { AnnouncementRead } from "@/lib/api/types"

type FormValues = {
  title: string
  body: string
  active: boolean
  priority: number
}

function formatTs(iso: string) {
  try {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return iso
    return d.toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" })
  } catch {
    return iso
  }
}

export function AdminAnnouncementsPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [items, setItems] = useState<AnnouncementRead[]>([])
  const [search, setSearch] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<AnnouncementRead | null>(null)
  const [saving, setSaving] = useState(false)
  const [detailRow, setDetailRow] = useState<AnnouncementRead | null>(null)
  const [form] = Form.useForm<FormValues>()

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const rows = await adminListAnnouncements()
      setItems(rows)
    } catch (e) {
      setItems([])
      setError(e instanceof ApiError ? e.message : "โหลดประกาศไม่สำเร็จ")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return items
    return items.filter(
      (row) =>
        row.title.toLowerCase().includes(q) ||
        row.body.toLowerCase().includes(q) ||
        (row.created_by_email?.toLowerCase().includes(q) ?? false) ||
        String(row.id).includes(q),
    )
  }, [items, search])

  const openCreate = () => {
    setEditing(null)
    form.setFieldsValue({ title: "", body: "", active: true, priority: 0 })
    setModalOpen(true)
  }

  const openEdit = (row: AnnouncementRead) => {
    setEditing(row)
    form.setFieldsValue({
      title: row.title,
      body: row.body,
      active: row.active,
      priority: row.priority,
    })
    setModalOpen(true)
  }

  const submit = async () => {
    const v = await form.validateFields()
    setSaving(true)
    try {
      if (editing) {
        await adminPatchAnnouncement(editing.id, {
          title: v.title,
          body: v.body,
          active: v.active,
          priority: v.priority,
        })
      } else {
        await adminCreateAnnouncement({
          title: v.title,
          body: v.body,
          active: v.active,
          priority: v.priority,
        })
      }
      setModalOpen(false)
      await load()
    } catch (e) {
      if (e instanceof ApiError) {
        setError(e.message)
      }
    } finally {
      setSaving(false)
    }
  }

  const columns: ColumnsType<AnnouncementRead> = [
    {
      title: "หัวข้อ",
      dataIndex: "title",
      key: "title",
      ellipsis: true,
      render: (t: string, row) => (
        <Space direction="vertical" size={0}>
          <Typography.Text strong>{t}</Typography.Text>
          <Typography.Text type="secondary" className="!text-xs">
            อัปเดต {formatTs(row.updated_at)}
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: "สถานะ",
      dataIndex: "active",
      key: "active",
      width: 110,
      render: (active: boolean, row) => (
        <Switch
          checked={active}
          checkedChildren="เผยแพร่"
          unCheckedChildren="ปิด"
          onChange={async (checked) => {
            try {
              await adminPatchAnnouncement(row.id, { active: checked })
              await load()
            } catch (e) {
              setError(e instanceof ApiError ? e.message : "อัปเดตสถานะไม่สำเร็จ")
            }
          }}
        />
      ),
    },
    {
      title: "ลำดับ",
      dataIndex: "priority",
      key: "priority",
      width: 88,
    },
    {
      title: "ผู้สร้าง",
      dataIndex: "created_by_email",
      key: "created_by_email",
      width: 200,
      ellipsis: true,
      render: (e: string | null) => e ?? "—",
    },
    {
      title: "",
      key: "actions",
      width: 280,
      render: (_, row) => (
        <Space wrap>
          <Button type="link" onClick={() => setDetailRow(row)}>
            รายละเอียด
          </Button>
          <Button type="link" onClick={() => openEdit(row)}>
            แก้ไข
          </Button>
          <Popconfirm
            title="ลบประกาศนี้?"
            okText="ลบ"
            cancelText="ยกเลิก"
            okButtonProps={{ danger: true }}
            onConfirm={async () => {
              try {
                await adminDeleteAnnouncement(row.id)
                await load()
              } catch (e) {
                setError(e instanceof ApiError ? e.message : "ลบไม่สำเร็จ")
              }
            }}
          >
            <Button type="link" danger>
              ลบ
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <AdminPageShell
      title="ประกาศจากผู้ดูแล"
      description="ข้อความที่เผยแพร่จะแสดงในกระดิ่งแจ้งเตือนของผู้ใช้ในแอปหลัก"
    >
      {error ? (
        <Alert
          type="error"
          showIcon
          closable
          onClose={() => setError(null)}
          message={error}
          className="mb-4"
        />
      ) : null}

      <AdminStandardTableCard
        toolbar={
          <AdminTableToolbar
            placeholder="ค้นหา (หัวข้อ, เนื้อหา, อีเมลผู้สร้าง, รหัส)"
            value={search}
            onChange={setSearch}
            suffix={
              <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
                สร้างประกาศ
              </Button>
            }
          />
        }
      >
        <Table<AnnouncementRead>
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={filtered}
          pagination={{
            ...adminStandardTablePagination,
            showTotal: (t) => `ทั้งหมด ${t.toLocaleString("th-TH")} รายการ`,
          }}
          locale={{ emptyText: "ยังไม่มีประกาศ" }}
        />
      </AdminStandardTableCard>

      <Modal
        title="รายละเอียดประกาศ"
        open={detailRow != null}
        onCancel={() => setDetailRow(null)}
        footer={null}
        width={640}
        destroyOnClose
      >
        <Alert
          type="info"
          showIcon
          className="mb-4"
          message="ข้อมูลประกาศ"
          description="เนื้อหาด้านล่างเป็นข้อมูลที่เก็บในระบบสำหรับประกาศนี้"
        />
        {detailRow ? (
          <>
            <Descriptions
              bordered
              size="small"
              column={1}
              className="mb-4"
              items={[
                { key: "id", label: "รหัส", children: detailRow.id },
                { key: "title", label: "หัวข้อ", children: detailRow.title },
                {
                  key: "active",
                  label: "เผยแพร่",
                  children: detailRow.active ? "ใช่" : "ไม่",
                },
                { key: "pri", label: "ลำดับความสำคัญ", children: detailRow.priority },
                { key: "ca", label: "สร้างเมื่อ", children: formatTs(detailRow.created_at) },
                { key: "ua", label: "อัปเดตเมื่อ", children: formatTs(detailRow.updated_at) },
                { key: "by", label: "ผู้สร้าง (อีเมล)", children: detailRow.created_by_email ?? "—" },
              ]}
            />
            <Typography.Text strong className="mb-1 block">
              เนื้อหา
            </Typography.Text>
            <Typography.Paragraph className="whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
              {detailRow.body}
            </Typography.Paragraph>
            <Typography.Text type="secondary" className="mb-1 mt-4 block text-xs">
              ข้อมูลดิบ
            </Typography.Text>
            <pre className="max-h-[200px] overflow-auto rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs">
              {JSON.stringify(detailRow, null, 2)}
            </pre>
          </>
        ) : null}
      </Modal>

      <Modal
        title={editing ? "แก้ไขประกาศ" : "สร้างประกาศ"}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => void submit()}
        confirmLoading={saving}
        width={640}
        destroyOnClose
      >
        <Alert
          type="info"
          showIcon
          className="mb-4"
          message="การเผยแพร่ประกาศ"
          description="ประกาศที่เปิดสถานะ «เผยแพร่» จะปรากฏต่อผู้ใช้ในแอป — ตรวจสอบข้อความก่อนบันทึก"
        />
        <Form form={form} layout="vertical" className="mt-0">
          <Form.Item name="title" label="หัวข้อ" rules={[{ required: true, message: "กรุณากรอกหัวข้อ" }]}>
            <Input maxLength={200} showCount />
          </Form.Item>
          <Form.Item name="body" label="รายละเอียด" rules={[{ required: true, message: "กรุณากรอกเนื้อหา" }]}>
            <Input.TextArea rows={6} maxLength={8000} showCount />
          </Form.Item>
          <Form.Item name="priority" label="ความสำคัญ (เลขมากขึ้นก่อน)" rules={[{ required: true }]}>
            <InputNumber min={0} max={100} className="!w-full" />
          </Form.Item>
          <Form.Item name="active" label="เผยแพร่" valuePropName="checked">
            <Switch checkedChildren="เปิด" unCheckedChildren="ปิด" />
          </Form.Item>
        </Form>
      </Modal>
    </AdminPageShell>
  )
}
