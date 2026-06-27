import { Alert, Button, Card, Descriptions, Input, Modal, Space, Table, Tabs, Typography } from "antd"
import type { ColumnsType } from "antd/es/table"
import { CopyOutlined } from "@ant-design/icons"
import { useCallback, useEffect, useState } from "react"
import { AdminPageShell } from "@/components/admin/AdminPageShell"
import { ApiError } from "@/lib/api/http"
import { adminAuditLog, adminMonitorCommands } from "@/lib/api/service"
import type { AdminAuditEntryRead, MonitorCommandRead } from "@/lib/api/types"

function formatTs(iso: string) {
  try {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return iso
    return d.toLocaleString("th-TH", { dateStyle: "short", timeStyle: "medium" })
  } catch {
    return iso
  }
}

export function AdminLogsPage() {
  const [auditLoading, setAuditLoading] = useState(true)
  const [auditError, setAuditError] = useState<string | null>(null)
  const [auditRows, setAuditRows] = useState<AdminAuditEntryRead[]>([])

  const [cmdLoading, setCmdLoading] = useState(true)
  const [cmdError, setCmdError] = useState<string | null>(null)
  const [commands, setCommands] = useState<MonitorCommandRead[]>([])

  const [auditDetail, setAuditDetail] = useState<AdminAuditEntryRead | null>(null)
  const [cmdDetail, setCmdDetail] = useState<MonitorCommandRead | null>(null)

  const loadAudit = useCallback(async () => {
    setAuditLoading(true)
    setAuditError(null)
    try {
      const rows = await adminAuditLog(300)
      setAuditRows(rows)
    } catch (e) {
      setAuditRows([])
      setAuditError(e instanceof ApiError ? e.message : "โหลดบันทึกไม่สำเร็จ")
    } finally {
      setAuditLoading(false)
    }
  }, [])

  const loadCmd = useCallback(async () => {
    setCmdLoading(true)
    setCmdError(null)
    try {
      const rows = await adminMonitorCommands()
      setCommands(rows)
    } catch (e) {
      setCommands([])
      setCmdError(e instanceof ApiError ? e.message : "โหลดคำสั่งตรวจสอบไม่สำเร็จ")
    } finally {
      setCmdLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadAudit()
    void loadCmd()
  }, [loadAudit, loadCmd])

  const auditColumns: ColumnsType<AdminAuditEntryRead> = [
    { title: "เวลา", dataIndex: "ts", key: "ts", width: 200, render: (t: string) => formatTs(t) },
    { title: "การกระทำ", dataIndex: "action", key: "action", width: 180, ellipsis: true },
    {
      title: "ผู้ดำเนินการ",
      dataIndex: "actor_email",
      key: "actor_email",
      width: 180,
      ellipsis: true,
      render: (e: string | null) => e ?? "—",
    },
    {
      title: "รายละเอียด (ย่อ)",
      dataIndex: "detail",
      key: "detail",
      ellipsis: true,
      render: (d: Record<string, unknown>) => (
        <Typography.Text className="!text-xs" ellipsis>
          {JSON.stringify(d)}
        </Typography.Text>
      ),
    },
    {
      title: "",
      key: "actions",
      width: 110,
      render: (_, row) => (
        <Button type="link" size="small" onClick={() => setAuditDetail(row)}>
          รายละเอียด
        </Button>
      ),
    },
  ]

  return (
    <AdminPageShell
      title="บันทึกและการตรวจสอบ"
      description="บันทึกการกระทำของผู้ดูแล (เช่น สร้าง/แก้ไขประกาศ) และคำสั่งตัวอย่างสำหรับ SSH / Docker บนเซิร์ฟเวอร์"
    >
      <Tabs
        defaultActiveKey="audit"
        items={[
          {
            key: "audit",
            label: "บันทึกการดำเนินการ",
            children: (
              <Card bordered={false} className="shadow-sm">
                {auditError ? (
                  <Alert type="error" showIcon className="mb-4" message={auditError} />
                ) : null}
                <Table<AdminAuditEntryRead>
                  rowKey={(r, i) => `${r.ts}-${r.action}-${i}`}
                  loading={auditLoading}
                  columns={auditColumns}
                  dataSource={auditRows}
                  pagination={{ pageSize: 10, showSizeChanger: true }}
                  locale={{ emptyText: "ยังไม่มีบันทึก" }}
                  scroll={{ x: 900 }}
                />
              </Card>
            ),
          },
          {
            key: "monitor",
            label: "คำสั่งตรวจสอบเซิร์ฟเวอร์",
            children: (
              <Card bordered={false} className="shadow-sm">
                <Typography.Paragraph type="secondary" className="!mb-4 !text-sm">
                  คัดลอกไปรันบนเครื่อง Linux ที่รัน Docker / API — ปรับ path และชื่อคอนเทนเนอร์ให้ตรงสภาพแวดล้อมจริง (SSH เข้าเครื่องก่อน แล้วรันทีละคำสั่ง)
                </Typography.Paragraph>
                {cmdError ? (
                  <Alert type="error" showIcon className="mb-4" message={cmdError} />
                ) : null}
                <Space direction="vertical" size="large" className="w-full">
                  {cmdLoading ? (
                    <Typography.Text type="secondary">กำลังโหลด…</Typography.Text>
                  ) : (
                    commands.map((c) => (
                      <div key={c.title} className="rounded-lg border border-slate-200 bg-white p-4">
                        <Typography.Title level={5} className="!mb-1">
                          {c.title}
                        </Typography.Title>
                        <Typography.Paragraph type="secondary" className="!mb-2 !text-sm">
                          {c.description}
                        </Typography.Paragraph>
                        <Input.TextArea
                          readOnly
                          value={c.command}
                          autoSize={{ minRows: 2, maxRows: 6 }}
                          className="!font-mono !text-xs"
                        />
                        <Space className="mt-2" wrap>
                          <Button
                            icon={<CopyOutlined />}
                            onClick={() => void navigator.clipboard.writeText(c.command)}
                          >
                            คัดลอกคำสั่ง
                          </Button>
                          <Button type="link" onClick={() => setCmdDetail(c)}>
                            รายละเอียด
                          </Button>
                        </Space>
                      </div>
                    ))
                  )}
                </Space>
              </Card>
            ),
          },
        ]}
      />

      <Modal
        title="รายละเอียดบันทึกการดำเนินการ"
        open={auditDetail != null}
        onCancel={() => setAuditDetail(null)}
        footer={null}
        width={640}
        destroyOnClose
      >
        <Alert
          type="info"
          showIcon
          className="mb-4"
          message="ข้อมูลจาก audit log"
          description="รวมทรัพยากรที่ระบบบันทึกและ payload รายละเอียด"
        />
        {auditDetail ? (
          <>
            <Descriptions
              bordered
              size="small"
              column={1}
              className="mb-4"
              items={[
                { key: "ts", label: "เวลา", children: formatTs(auditDetail.ts) },
                { key: "act", label: "การกระทำ", children: auditDetail.action },
                { key: "em", label: "ผู้ดำเนินการ", children: auditDetail.actor_email ?? "—" },
                { key: "res", label: "resource", children: auditDetail.resource },
              ]}
            />
            <Typography.Text type="secondary" className="mb-1 block text-xs">
              detail (JSON)
            </Typography.Text>
            <pre className="max-h-[min(45vh,380px)] overflow-auto rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs leading-relaxed">
              {JSON.stringify(auditDetail.detail ?? {}, null, 2)}
            </pre>
            <Typography.Text type="secondary" className="mb-1 mt-4 block text-xs">
              ข้อมูลดิบทั้งแถว
            </Typography.Text>
            <pre className="max-h-[200px] overflow-auto rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs">
              {JSON.stringify(auditDetail, null, 2)}
            </pre>
          </>
        ) : null}
      </Modal>

      <Modal
        title="รายละเอียดคำสั่ง"
        open={cmdDetail != null}
        onCancel={() => setCmdDetail(null)}
        footer={null}
        width={640}
        destroyOnClose
      >
        <Alert
          type="warning"
          showIcon
          className="mb-4"
          message="รันบนเซิร์ฟเวอร์จริงด้วยความระมัดระวัง"
          description="ตรวจสอบสิทธิ์และสภาพแวดล้อมก่อนรันคำสั่ง — คำสั่งเป็นตัวอย่างเท่านั้น"
        />
        {cmdDetail ? (
          <>
            <Descriptions
              bordered
              size="small"
              column={1}
              className="mb-4"
              items={[
                { key: "t", label: "หัวข้อ", children: cmdDetail.title },
                { key: "d", label: "คำอธิบาย", children: cmdDetail.description },
              ]}
            />
            <Typography.Text strong className="mb-1 block text-sm">
              คำสั่ง
            </Typography.Text>
            <Input.TextArea readOnly value={cmdDetail.command} autoSize={{ minRows: 4, maxRows: 14 }} className="!font-mono !text-xs" />
            <Typography.Text type="secondary" className="mb-1 mt-4 block text-xs">
              ข้อมูลดิบ
            </Typography.Text>
            <pre className="max-h-[160px] overflow-auto rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs">
              {JSON.stringify(cmdDetail, null, 2)}
            </pre>
          </>
        ) : null}
      </Modal>
    </AdminPageShell>
  )
}
