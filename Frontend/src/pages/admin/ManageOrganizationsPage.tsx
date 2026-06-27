import { BankOutlined, PlusOutlined } from "@ant-design/icons"
import { Alert, App, Button, Descriptions, Form, Input, Modal, Popconfirm, Space, Table, Tag, Typography } from "antd"
import type { ColumnsType } from "antd/es/table"
import { useCallback, useEffect, useMemo, useState } from "react"
import {
  AdminStandardTableCard,
  AdminTableToolbar,
  adminStandardTablePagination,
} from "@/components/admin/AdminTableToolbar"
import { AdminPageShell } from "@/components/admin/AdminPageShell"
import { OrganizationRegistrationForm } from "@/components/organization/OrganizationRegistrationForm"
import { ApiError } from "@/lib/api/http"
import { adminDeleteOrganization, adminListOrganizations, adminPatchOrganization } from "@/lib/api/service"
import type { OrganizationRead } from "@/lib/api/types"

export function ManageOrganizationsPage() {
  const { message } = App.useApp()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [orgs, setOrgs] = useState<OrganizationRead[]>([])
  const [search, setSearch] = useState("")
  const [registerOpen, setRegisterOpen] = useState(false)
  const [detailOrg, setDetailOrg] = useState<OrganizationRead | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<OrganizationRead | null>(null)
  const [saving, setSaving] = useState(false)
  const [editForm] = Form.useForm<OrganizationRead>()

  const loadOrgs = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const list = await adminListOrganizations()
      setOrgs(list)
    } catch (e) {
      setOrgs([])
      setError(e instanceof ApiError ? e.message : "โหลดรายการองค์กรไม่สำเร็จ")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadOrgs()
  }, [loadOrgs])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return orgs
    return orgs.filter(
      (o) =>
        o.organization_name.toLowerCase().includes(q) ||
        o.name_of_agency.toLowerCase().includes(q) ||
        (o.province?.toLowerCase().includes(q) ?? false) ||
        (o.email?.toLowerCase().includes(q) ?? false) ||
        String(o.organization_id).includes(q),
    )
  }, [orgs, search])

  const openEdit = (o: OrganizationRead) => {
    setEditTarget(o)
    editForm.setFieldsValue({ ...o })
    setEditOpen(true)
  }

  const submitEdit = async () => {
    if (!editTarget) return
    const v = await editForm.validateFields()
    setSaving(true)
    try {
      await adminPatchOrganization(editTarget.organization_id, {
        name_of_agency: v.name_of_agency?.trim(),
        organization_name: v.organization_name?.trim(),
        address1: v.address1?.trim(),
        subdistrict: v.subdistrict?.trim(),
        district: v.district?.trim(),
        province: v.province?.trim(),
        postal_code: v.postal_code?.trim(),
        phone: v.phone?.trim(),
        email: v.email?.trim(),
        registration_date: v.registration_date?.trim(),
        logo: v.logo,
        organization_image: v.organization_image,
        organization_map: v.organization_map,
        organ_structure: v.organ_structure,
      })
      message.success("บันทึกการแก้ไของค์กรแล้ว")
      setEditOpen(false)
      setEditTarget(null)
      await loadOrgs()
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "บันทึกไม่สำเร็จ"
      message.error(msg)
      setError(msg)
    } finally {
      setSaving(false)
    }
  }

  const columns: ColumnsType<OrganizationRead> = [
    {
      title: "ชื่อองค์กร",
      key: "name",
      ellipsis: true,
      render: (_, o) => (
        <Space direction="vertical" size={0}>
          <Typography.Text strong>{o.organization_name}</Typography.Text>
          <Typography.Text type="secondary" className="text-xs">
            {o.name_of_agency}
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: "จังหวัด",
      dataIndex: "province",
      width: 120,
      ellipsis: true,
    },
    {
      title: "ติดต่อ",
      key: "contact",
      ellipsis: true,
      render: (_, o) => (
        <Space direction="vertical" size={0}>
          <Typography.Text className="text-xs">{o.email}</Typography.Text>
          <Typography.Text type="secondary" className="text-xs">
            {o.phone}
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: "รหัส",
      dataIndex: "organization_id",
      width: 90,
    },
    {
      title: "ลงทะเบียน",
      dataIndex: "registration_date",
      width: 120,
      render: (d: string) => <Tag>{d}</Tag>,
    },
    {
      title: "",
      key: "actions",
      width: 260,
      render: (_, o) => (
        <Space size="small" wrap>
          <Button type="link" size="small" onClick={() => setDetailOrg(o)}>
            รายละเอียด
          </Button>
          <Button type="link" size="small" onClick={() => openEdit(o)}>
            แก้ไข
          </Button>
          <Popconfirm
            title="ลบองค์กรนี้?"
            description="จะลบผู้ใช้ในองค์กรและข้อมูลที่เกี่ยวข้องตามนโยบายระบบ"
            okText="ลบ"
            cancelText="ยกเลิก"
            okButtonProps={{ danger: true }}
            onConfirm={async () => {
              try {
                await adminDeleteOrganization(o.organization_id)
                message.success("ลบองค์กรแล้ว")
                await loadOrgs()
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
    <AdminPageShell
      title="จัดการองค์กร"
      description="ดูรายการทั้งหมดและลงทะเบียนองค์กรใหม่จากคอนโซลผู้ดูแล"
    >
      {error ? (
        <Alert type="error" showIcon closable onClose={() => setError(null)} message={error} className="mb-4" />
      ) : null}

      <AdminStandardTableCard
        toolbar={
          <AdminTableToolbar
            placeholder="ค้นหา (ชื่อองค์กร, หน่วยงาน, จังหวัด, อีเมล, รหัส)"
            value={search}
            onChange={setSearch}
            suffix={
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setRegisterOpen(true)}>
                ลงทะเบียนองค์กรใหม่
              </Button>
            }
          />
        }
      >
        <Table<OrganizationRead>
          rowKey="organization_id"
          loading={loading}
          columns={columns}
          dataSource={filtered}
          pagination={{
            ...adminStandardTablePagination,
            showTotal: (t) => `${t.toLocaleString("th-TH")} องค์กร`,
          }}
          scroll={{ x: 1100 }}
          locale={{ emptyText: "ยังไม่มีองค์กร" }}
        />
      </AdminStandardTableCard>

      <Modal
        title="รายละเอียดองค์กร"
        open={detailOrg != null}
        onCancel={() => setDetailOrg(null)}
        footer={null}
        width={640}
        destroyOnClose
      >
        <Alert
          type="info"
          showIcon
          className="mb-4"
          message="ข้อมูลจากระบบ"
          description="รวมที่อยู่ ติดต่อ และพาธไฟล์ที่เก็บในฐานข้อมูล — ข้อมูลดิบด้านล่างใช้ตรวจสอบครบถ้วน"
        />
        {detailOrg ? (
          <>
            <Descriptions
              bordered
              size="small"
              column={1}
              className="mb-4"
              items={[
                { key: "id", label: "organization_id", children: detailOrg.organization_id },
                { key: "on", label: "ชื่อองค์กร", children: detailOrg.organization_name },
                { key: "ag", label: "หน่วยงาน", children: detailOrg.name_of_agency },
                { key: "ad", label: "ที่อยู่", children: detailOrg.address1 },
                { key: "sub", label: "ตำบล/แขวง", children: detailOrg.subdistrict },
                { key: "dis", label: "อำเภอ/เขต", children: detailOrg.district },
                { key: "pv", label: "จังหวัด", children: detailOrg.province },
                { key: "zip", label: "รหัสไปรษณีย์", children: detailOrg.postal_code },
                { key: "ph", label: "โทรศัพท์", children: detailOrg.phone },
                { key: "em", label: "อีเมล", children: detailOrg.email },
                { key: "rd", label: "วันลงทะเบียน", children: detailOrg.registration_date },
                { key: "logo", label: "logo", children: detailOrg.logo ?? "—" },
                { key: "img", label: "organization_image", children: detailOrg.organization_image ?? "—" },
                { key: "map", label: "organization_map", children: detailOrg.organization_map ?? "—" },
                { key: "st", label: "organ_structure", children: detailOrg.organ_structure ?? "—" },
              ]}
            />
            <Typography.Text type="secondary" className="mb-1 block text-xs">
              ข้อมูลดิบ
            </Typography.Text>
            <pre className="max-h-[320px] overflow-auto rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs leading-relaxed">
              {JSON.stringify(detailOrg, null, 2)}
            </pre>
          </>
        ) : null}
      </Modal>

      <Modal
        title="แก้ไของค์กร"
        open={editOpen}
        onCancel={() => {
          setEditOpen(false)
          setEditTarget(null)
        }}
        onOk={() => void submitEdit()}
        confirmLoading={saving}
        width={640}
        destroyOnClose
        styles={{ body: { maxHeight: "min(85vh, 720px)", overflowY: "auto" } }}
      >
        <Alert
          type="warning"
          showIcon
          className="mb-4"
          message="แก้ไขข้อมูลองค์กร"
          description="การเปลี่ยนข้อมูลกระทบผู้ใช้และรายงานที่อ้างอิงองค์กรนี้ — ตรวจสอบก่อนบันทึก"
        />
        <Form form={editForm} layout="vertical" className="mt-0">
          <Form.Item name="name_of_agency" label="ชื่อหน่วยงาน" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="organization_name" label="ชื่อองค์กร" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="address1" label="ที่อยู่" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="subdistrict" label="ตำบล/แขวง" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="district" label="อำเภอ/เขต" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="province" label="จังหวัด" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="postal_code" label="รหัสไปรษณีย์" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="โทรศัพท์" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="email" label="อีเมล" rules={[{ required: true, type: "email" }]}>
            <Input />
          </Form.Item>
          <Form.Item name="registration_date" label="วันลงทะเบียน" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="logo" label="logo (path/ชื่อไฟล์)">
            <Input />
          </Form.Item>
          <Form.Item name="organization_image" label="organization_image">
            <Input />
          </Form.Item>
          <Form.Item name="organization_map" label="organization_map">
            <Input />
          </Form.Item>
          <Form.Item name="organ_structure" label="organ_structure">
            <Input />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={
          <Space>
            <BankOutlined />
            <span>ลงทะเบียนองค์กรใหม่</span>
          </Space>
        }
        open={registerOpen}
        onCancel={() => setRegisterOpen(false)}
        footer={null}
        width="min(920px, 96vw)"
        destroyOnClose
        styles={{ body: { maxHeight: "min(85vh, 900px)", overflowY: "auto", paddingTop: 12 } }}
      >
        <Alert
          type="info"
          showIcon
          className="mb-4"
          message="กรอกข้อมูลให้ครบถ้วน"
          description="หลังบันทึกสำเร็จ รายการองค์กรด้านหลังจะรีเฟรชอัตโนมัติ (เมื่อฟอร์มเชื่อม API จริง)"
        />
        <OrganizationRegistrationForm
          variant="admin"
          embedded
          onSuccess={() => {
            setRegisterOpen(false)
            void loadOrgs()
          }}
        />
      </Modal>
    </AdminPageShell>
  )
}
