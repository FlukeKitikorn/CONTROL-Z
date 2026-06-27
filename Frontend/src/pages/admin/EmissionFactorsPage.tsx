import { DeleteOutlined, PlusOutlined } from "@ant-design/icons"
import { Alert, App, Button, Descriptions, Form, Input, Modal, Popconfirm, Space, Table, Typography } from "antd"
import type { ColumnsType } from "antd/es/table"
import { useCallback, useEffect, useMemo, useState } from "react"
import {
  AdminStandardTableCard,
  AdminTableToolbar,
  adminStandardTablePagination,
} from "@/components/admin/AdminTableToolbar"
import { AdminPageShell } from "@/components/admin/AdminPageShell"
import { ApiError } from "@/lib/api/http"
import { createGwp, deleteGwp, listGwp, patchGwp } from "@/lib/api/service"
import type { GwpRead } from "@/lib/api/types"

type GwpFormValues = { subject: string; value: string }

export function EmissionFactorsPage() {
  const { message } = App.useApp()
  const [createForm] = Form.useForm<GwpFormValues>()
  const [editForm] = Form.useForm<GwpFormValues>()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rows, setRows] = useState<GwpRead[]>([])
  const [search, setSearch] = useState("")
  const [createOpen, setCreateOpen] = useState(false)
  const [editing, setEditing] = useState<GwpRead | null>(null)
  const [detailRow, setDetailRow] = useState<GwpRead | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await listGwp()
      setRows(data)
    } catch (e) {
      setRows([])
      setError(e instanceof ApiError ? e.message : "โหลดรายการ GWP ไม่สำเร็จ")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return rows
    return rows.filter(
      (r) =>
        r.subject.toLowerCase().includes(q) ||
        r.value.toLowerCase().includes(q) ||
        String(r.gwpid).includes(q),
    )
  }, [rows, search])

  const openCreate = () => {
    createForm.resetFields()
    setCreateOpen(true)
  }

  const openEdit = (record: GwpRead) => {
    setEditing(record)
    editForm.setFieldsValue({ subject: record.subject, value: record.value })
  }

  const submitCreate = async () => {
    const v = await createForm.validateFields()
    setSaving(true)
    try {
      await createGwp({ subject: v.subject.trim(), value: v.value.trim() })
      message.success("เพิ่มรายการแล้ว")
      setCreateOpen(false)
      void load()
    } catch (e) {
      message.error(e instanceof ApiError ? e.message : "บันทึกไม่สำเร็จ")
    } finally {
      setSaving(false)
    }
  }

  const submitEdit = async () => {
    if (!editing) return
    const v = await editForm.validateFields()
    setSaving(true)
    try {
      await patchGwp(editing.gwpid, { subject: v.subject.trim(), value: v.value.trim() })
      message.success("อัปเดตแล้ว")
      setEditing(null)
      void load()
    } catch (e) {
      message.error(e instanceof ApiError ? e.message : "อัปเดตไม่สำเร็จ")
    } finally {
      setSaving(false)
    }
  }

  const onDelete = async (id: number) => {
    try {
      await deleteGwp(id)
      message.success("ลบแล้ว")
      void load()
    } catch (e) {
      message.error(e instanceof ApiError ? e.message : "ลบไม่สำเร็จ")
    }
  }

  const columns: ColumnsType<GwpRead> = [
    {
      title: "หัวข้อ / สาร",
      dataIndex: "subject",
      ellipsis: true,
    },
    {
      title: "ค่า GWP / หมายเหตุ",
      dataIndex: "value",
      ellipsis: true,
      render: (text: string) => <Typography.Text code>{text}</Typography.Text>,
    },
    {
      title: "รหัส",
      dataIndex: "gwpid",
      width: 90,
    },
    {
      title: "การจัดการ",
      key: "actions",
      width: 240,
      render: (_, record) => (
        <Space size="small" wrap>
          <Button size="small" type="link" onClick={() => setDetailRow(record)}>
            รายละเอียด
          </Button>
          <Button size="small" type="link" onClick={() => openEdit(record)}>
            แก้ไข
          </Button>
          <Popconfirm title="ลบรายการนี้?" okText="ลบ" cancelText="ยกเลิก" onConfirm={() => void onDelete(record.gwpid)}>
            <Button size="small" danger icon={<DeleteOutlined />}>
              ลบ
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <AdminPageShell
      title="ปัจจัยการปล่อยและ GWP"
      description="การแก้ไขกระทบความสอดคล้องของผลรายงานทั้งระบบ ควรมีกระบวนการอนุมัติภายในองค์กร"
    >
      {error ? (
        <Alert type="error" showIcon closable onClose={() => setError(null)} message={error} className="mb-4" />
      ) : null}

      <AdminStandardTableCard
        toolbar={
          <AdminTableToolbar
            placeholder="ค้นหา (หัวข้อ, ค่า, รหัส)"
            value={search}
            onChange={setSearch}
            suffix={
              <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
                เพิ่มรายการ
              </Button>
            }
          />
        }
      >
        <Table<GwpRead>
          rowKey="gwpid"
          loading={loading}
          columns={columns}
          dataSource={filtered}
          pagination={{
            ...adminStandardTablePagination,
            showTotal: (t) => `${t.toLocaleString("th-TH")} รายการ`,
          }}
          scroll={{ x: 720 }}
          locale={{ emptyText: "ยังไม่มีรายการ GWP" }}
        />
      </AdminStandardTableCard>

      <Modal
        title="รายละเอียด GWP"
        open={detailRow != null}
        onCancel={() => setDetailRow(null)}
        footer={null}
        width={520}
        destroyOnClose
      >
        <Alert
          type="info"
          showIcon
          className="mb-4"
          message="รายการในฐานข้อมูลอ้างอิง"
          description="ค่าและหัวข้อนี้ถูกใช้ในขั้นตอนคำนวณเมื่อระบบอ้างอิงตาราง GWP"
        />
        {detailRow ? (
          <>
            <Descriptions
              bordered
              size="small"
              column={1}
              className="mb-4"
              items={[
                { key: "id", label: "gwpid", children: detailRow.gwpid },
                { key: "sub", label: "หัวข้อ / สาร", children: detailRow.subject },
                { key: "val", label: "ค่า / หมายเหตุ", children: detailRow.value },
              ]}
            />
            <Typography.Text type="secondary" className="mb-1 block text-xs">
              ข้อมูลดิบ
            </Typography.Text>
            <pre className="max-h-[200px] overflow-auto rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs">
              {JSON.stringify(detailRow, null, 2)}
            </pre>
          </>
        ) : null}
      </Modal>

      <Modal
        title="เพิ่มรายการ GWP"
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        onOk={() => void submitCreate()}
        confirmLoading={saving}
        destroyOnClose
        width={520}
      >
        <Alert
          type="warning"
          showIcon
          className="mb-4"
          message="ผลกระทบต่อระบบ"
          description="ค่า GWP ที่บันทึกจะถูกใช้ในการคำนวณและรายงาน — ตรวจสอบฐานอ้างอิง (เช่น IPCC AR) ให้ตรงก่อนบันทึก"
        />
        <Form form={createForm} layout="vertical" className="mt-0">
          <Form.Item name="subject" label="หัวข้อ / ชื่อสาร" rules={[{ required: true, message: "กรอกหัวข้อ" }]}>
            <Input placeholder="เช่น CO₂, CH₄ (100-yr)" />
          </Form.Item>
          <Form.Item name="value" label="ค่า / คำอธิบายตัวเลข" rules={[{ required: true, message: "กรอกค่า" }]}>
            <Input placeholder="เช่น 1, 28, 265 ตามฐานที่ใช้" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="แก้ไขรายการ GWP"
        open={editing != null}
        onCancel={() => setEditing(null)}
        onOk={() => void submitEdit()}
        confirmLoading={saving}
        destroyOnClose
        width={520}
      >
        <Alert
          type="info"
          showIcon
          className="mb-4"
          message="แก้ไขค่าที่มีอยู่"
          description="การเปลี่ยนค่าอาจทำให้ผลคำนวณย้อนหลังไม่ตรงกับรายงานเดิม — ควรมีบันทึกการเปลี่ยนแปลงภายในองค์กร"
        />
        <Form form={editForm} layout="vertical" className="mt-0">
          <Form.Item name="subject" label="หัวข้อ / ชื่อสาร" rules={[{ required: true, message: "กรอกหัวข้อ" }]}>
            <Input />
          </Form.Item>
          <Form.Item name="value" label="ค่า / คำอธิบายตัวเลข" rules={[{ required: true, message: "กรอกค่า" }]}>
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </AdminPageShell>
  )
}
