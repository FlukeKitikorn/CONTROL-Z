import { Alert, Button, Descriptions, Modal, Space, Table, Typography } from "antd"
import type { ColumnsType } from "antd/es/table"
import { CodeOutlined } from "@ant-design/icons"
import { useCallback, useEffect, useMemo, useState } from "react"
import { Link } from "react-router"
import { adminStandardTablePagination } from "@/components/admin/adminTableConstants"
import { AdminStandardTableCard, AdminTableToolbar } from "@/components/admin/AdminTableToolbar"
import { AdminPageShell } from "@/components/admin/AdminPageShell"
import { ApiError } from "@/lib/api/http"
import { adminAuditLog } from "@/lib/api/service"
import type { AdminAuditEntryRead } from "@/lib/api/types"

function formatTs(iso: string) {
  try {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return iso
    return d.toLocaleString("th-TH", { dateStyle: "short", timeStyle: "medium" })
  } catch {
    return iso
  }
}

export function AdminTerminalPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rows, setRows] = useState<AdminAuditEntryRead[]>([])
  const [search, setSearch] = useState("")
  const [detail, setDetail] = useState<AdminAuditEntryRead | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await adminAuditLog(400)
      setRows(data)
    } catch (e) {
      setRows([])
      setError(e instanceof ApiError ? e.message : "โหลดบันทึกไม่สำเร็จ")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const tableRows = useMemo(() => {
    return [...rows].sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime())
  }, [rows])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return tableRows
    return tableRows.filter((row) => {
      const detailStr =
        row.detail && typeof row.detail === "object" ? JSON.stringify(row.detail) : String(row.detail ?? "")
      return (
        row.action.toLowerCase().includes(q) ||
        (row.actor_email?.toLowerCase().includes(q) ?? false) ||
        (row.resource?.toLowerCase().includes(q) ?? false) ||
        detailStr.toLowerCase().includes(q) ||
        formatTs(row.ts).toLowerCase().includes(q)
      )
    })
  }, [tableRows, search])

  const columns: ColumnsType<AdminAuditEntryRead> = [
    {
      title: "เวลา",
      dataIndex: "ts",
      key: "ts",
      width: 200,
      render: (t: string) => formatTs(t),
    },
    {
      title: "การกระทำ",
      dataIndex: "action",
      key: "action",
      width: 160,
      ellipsis: true,
    },
    {
      title: "resource",
      dataIndex: "resource",
      key: "resource",
      width: 120,
      ellipsis: true,
    },
    {
      title: "ผู้ดำเนินการ",
      dataIndex: "actor_email",
      key: "actor_email",
      width: 200,
      ellipsis: true,
      render: (e: string | null) => e ?? "—",
    },
    {
      title: "รายละเอียด",
      dataIndex: "detail",
      key: "detail",
      ellipsis: true,
      render: (d: Record<string, unknown>) => (
        <Typography.Text className="text-xs" ellipsis>
          {JSON.stringify(d)}
        </Typography.Text>
      ),
    },
    {
      title: "",
      key: "actions",
      width: 100,
      render: (_, row) => (
        <Button type="link" size="small" onClick={() => setDetail(row)}>
          รายละเอียด
        </Button>
      ),
    },
  ]

  return (
    <AdminPageShell
      title={
        <Space align="center">
          <CodeOutlined className="text-teal-700" />
          <span>Terminal — บันทึกระบบ</span>
        </Space>
      }
      description="บันทึกการกระทำของผู้ดูแล — เรียงจากใหม่ไปเก่า โหลดใหม่เมื่อเข้าหน้าหรือเปลี่ยนหน้าในแอป"
    >
      {error ? (
        <Alert type="warning" showIcon closable onClose={() => setError(null)} message={error} className="mb-4" />
      ) : null}

      <AdminStandardTableCard
        toolbar={
          <AdminTableToolbar
            placeholder="ค้นหา (เวลา, การกระทำ, อีเมล, รายละเอียด JSON)"
            value={search}
            onChange={setSearch}
            suffix={
              <Link to="/admin/logs">
                <Button type="default">ตารางเต็มและคำสั่งเซิร์ฟเวอร์</Button>
              </Link>
            }
          />
        }
      >
        <Table<AdminAuditEntryRead>
          rowKey={(r, index) => `${r.ts}-${r.action}-${r.actor_email ?? ""}-${index}`}
          loading={loading}
          columns={columns}
          dataSource={filtered}
          pagination={{
            ...adminStandardTablePagination,
            showTotal: (t) => `${t.toLocaleString("th-TH")} รายการ`,
          }}
          scroll={{ x: 960 }}
          locale={{ emptyText: "ยังไม่มีบันทึก" }}
        />
      </AdminStandardTableCard>

      <Typography.Paragraph type="secondary" className="!mb-0 !mt-4 !text-xs !leading-relaxed">
        คัดลอก JSON หรือดูแบบตารางพร้อมคำสั่ง Docker/SSH ได้ที่{" "}
        <Link to="/admin/logs" className="text-teal-700">
          บันทึกและการตรวจสอบ
        </Link>
      </Typography.Paragraph>

      <Modal
        title="รายละเอียดบันทึก"
        open={detail != null}
        onCancel={() => setDetail(null)}
        footer={null}
        width={640}
        destroyOnClose
      >
        <Alert
          type="info"
          showIcon
          className="mb-4"
          message="ข้อมูลดิบ"
          description="รายละเอียดด้านล่างเป็น JSON จากระบบ — ใช้สำหรับตรวจสอบหรือแนบในเอกสารอ้างอิง"
        />
        {detail ? (
          <Space direction="vertical" size="middle" className="w-full">
            <Descriptions
              bordered
              size="small"
              column={1}
              items={[
                { key: "ts", label: "เวลา", children: formatTs(detail.ts) },
                { key: "act", label: "การกระทำ", children: detail.action },
                { key: "em", label: "ผู้ดำเนินการ", children: detail.actor_email ?? "—" },
                { key: "res", label: "resource", children: detail.resource },
              ]}
            />
            <Typography.Text type="secondary" className="text-xs">
              detail (JSON)
            </Typography.Text>
            <pre className="max-h-[min(40vh,360px)] overflow-auto rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs leading-relaxed">
              {JSON.stringify(detail.detail ?? {}, null, 2)}
            </pre>
            <Typography.Text type="secondary" className="text-xs">
              ข้อมูลดิบทั้งแถว
            </Typography.Text>
            <pre className="max-h-[200px] overflow-auto rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs">
              {JSON.stringify(detail, null, 2)}
            </pre>
          </Space>
        ) : null}
      </Modal>
    </AdminPageShell>
  )
}
