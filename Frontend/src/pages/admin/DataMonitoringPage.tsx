import { Alert, Button, Descriptions, Modal, Space, Table, Tag, Typography } from "antd"
import type { ColumnsType } from "antd/es/table"
import { useCallback, useEffect, useMemo, useState } from "react"
import { adminStandardTablePagination } from "@/components/admin/adminTableConstants"
import { AdminStandardTableCard, AdminTableToolbar } from "@/components/admin/AdminTableToolbar"
import { AdminPageShell } from "@/components/admin/AdminPageShell"
import { ApiError } from "@/lib/api/http"
import { adminMonitoring } from "@/lib/api/service"
import type { MonitoringOrgRow } from "@/lib/api/types"

export function DataMonitoringPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rows, setRows] = useState<MonitoringOrgRow[]>([])
  const [search, setSearch] = useState("")
  const [detail, setDetail] = useState<MonitoringOrgRow | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await adminMonitoring()
      setRows(data)
    } catch (e) {
      setRows([])
      setError(e instanceof ApiError ? e.message : "โหลดข้อมูลมอนิเตอร์ไม่สำเร็จ")
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
        r.organization_name.toLowerCase().includes(q) ||
        String(r.organization_id).includes(q) ||
        (r.last_edit_date?.toLowerCase().includes(q) ?? false) ||
        String(r.forms_count).includes(q),
    )
  }, [rows, search])

  const columns: ColumnsType<MonitoringOrgRow> = [
    {
      title: "องค์กร",
      dataIndex: "organization_name",
      ellipsis: true,
      render: (text, row) => (
        <Space direction="vertical" size={0}>
          <Typography.Text strong>{text}</Typography.Text>
          <Typography.Text type="secondary" className="text-xs">
            organization_id: {row.organization_id}
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: "จำนวนฟอร์ม",
      dataIndex: "forms_count",
      width: 120,
      align: "right",
      sorter: (a, b) => a.forms_count - b.forms_count,
    },
    {
      title: "แก้ไขล่าสุด",
      dataIndex: "last_edit_date",
      width: 220,
      render: (v: string | null) =>
        v ? <Tag color="blue">{v}</Tag> : <Tag color="default">ยังไม่มีบันทึก</Tag>,
      sorter: (a, b) => {
        const ta = a.last_edit_date ? new Date(a.last_edit_date).getTime() : 0
        const tb = b.last_edit_date ? new Date(b.last_edit_date).getTime() : 0
        return ta - tb
      },
    },
    {
      title: "",
      key: "actions",
      width: 120,
      render: (_, row) => (
        <Button type="link" size="small" onClick={() => setDetail(row)}>
          รายละเอียด
        </Button>
      ),
    },
  ]

  return (
    <AdminPageShell
      title="ตรวจสอบข้อมูลและกิจกรรม"
      description="มองภาพองค์กรที่มีฟอร์ม / การแก้ไขในระบบ"
    >
      {error ? (
        <Alert type="error" showIcon closable onClose={() => setError(null)} message={error} className="mb-4" />
      ) : null}

      <AdminStandardTableCard
        toolbar={
          <AdminTableToolbar
            placeholder="ค้นหา (ชื่อองค์กร, รหัส, จำนวนฟอร์ม, วันที่แก้ไข)"
            value={search}
            onChange={setSearch}
          />
        }
      >
        <Table<MonitoringOrgRow>
          rowKey="organization_id"
          loading={loading}
          columns={columns}
          dataSource={filtered}
          pagination={{
            ...adminStandardTablePagination,
            showTotal: (t) => `${t.toLocaleString("th-TH")} องค์กร`,
          }}
          scroll={{ x: 720 }}
          locale={{ emptyText: "ยังไม่มีข้อมูล" }}
        />
      </AdminStandardTableCard>

      <Modal
        title="รายละเอียดแถวมอนิเตอร์"
        open={detail != null}
        onCancel={() => setDetail(null)}
        footer={null}
        width={560}
        destroyOnClose
      >
        <Alert
          type="info"
          showIcon
          className="mb-4"
          message="ข้อมูลอ้างอิง"
          description="ตัวเลขมาจากการนับฟอร์มและเวลาแก้ไขล่าสุดในระบบ — ใช้ประกอบการตรวจ ไม่ใช่รายงานสิทธิ์การเข้าถึงข้อมูลดิบ"
        />
        {detail ? (
          <>
            <Descriptions
              bordered
              size="small"
              column={1}
              className="mb-4"
              items={[
                { key: "n", label: "ชื่อองค์กร", children: detail.organization_name },
                { key: "id", label: "organization_id", children: detail.organization_id },
                { key: "fc", label: "จำนวนฟอร์ม", children: detail.forms_count },
                { key: "dt", label: "แก้ไขล่าสุด", children: detail.last_edit_date ?? "—" },
              ]}
            />
            <Typography.Text type="secondary" className="mb-1 block text-xs">
              ข้อมูลดิบ (JSON)
            </Typography.Text>
            <pre className="max-h-[240px] overflow-auto rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs leading-relaxed">
              {JSON.stringify(detail, null, 2)}
            </pre>
          </>
        ) : null}
      </Modal>
    </AdminPageShell>
  )
}
