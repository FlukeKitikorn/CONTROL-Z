import { DatabaseOutlined, ReloadOutlined, SearchOutlined } from "@ant-design/icons"
import {
  Alert,
  Card,
  Col,
  Descriptions,
  Drawer,
  Empty,
  Row,
  Segmented,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
} from "antd"
import type { ColumnsType, TablePaginationConfig } from "antd/es/table"
import { useCallback, useEffect, useMemo, useState } from "react"
import { Link } from "react-router"

import { AdminTableToolbar } from "@/components/admin/AdminTableToolbar"
import { adminStandardTablePagination } from "@/components/admin/adminTableConstants"
import { PageHeader } from "@/components/common/PageHeader"
import { PageHeaderButton } from "@/components/common/PageHeaderButton"
import {
  activityEntryDetailPairs,
  activityEntryKindLabel,
  activityEntrySummaryLine,
  activityScopeColor,
  activityScopeLabel,
} from "@/lib/activityEntryDisplay"
import { ApiError } from "@/lib/api/http"
import { listActivityEntries } from "@/lib/api/service"
import type { ActivityEntryRead, ActivityEntrySummary } from "@/lib/api/types"
import { useAuthStore } from "@/store/useAuthStore"

type ScopeFilter = "all" | "1" | "2" | "3"

const EMPTY_SUMMARY: ActivityEntrySummary = {
  total: 0,
  scope1: 0,
  scope2: 0,
  scope3: 0,
  reporting_years: [],
}

export function DataRecordsPage() {
  const authUser = useAuthStore((s) => s.user)
  const orgId = useMemo(() => {
    const id = authUser?.organization_id
    if (id == null) return null
    return typeof id === "number" ? id : Number.parseInt(String(id), 10)
  }, [authUser?.organization_id])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rows, setRows] = useState<ActivityEntryRead[]>([])
  const [total, setTotal] = useState(0)
  const [summary, setSummary] = useState<ActivityEntrySummary>(EMPTY_SUMMARY)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(adminStandardTablePagination.pageSize)
  const [scopeFilter, setScopeFilter] = useState<ScopeFilter>("all")
  const [yearFilter, setYearFilter] = useState<number | undefined>(undefined)
  const [search, setSearch] = useState("")
  const [searchDebounced, setSearchDebounced] = useState("")
  const [detail, setDetail] = useState<ActivityEntryRead | null>(null)

  useEffect(() => {
    const t = window.setTimeout(() => setSearchDebounced(search.trim()), 350)
    return () => window.clearTimeout(t)
  }, [search])

  useEffect(() => {
    setPage(1)
  }, [scopeFilter, yearFilter, searchDebounced])

  const load = useCallback(async () => {
    if (orgId == null || !Number.isFinite(orgId)) {
      setRows([])
      setTotal(0)
      setSummary(EMPTY_SUMMARY)
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await listActivityEntries(orgId, {
        page,
        page_size: pageSize,
        reporting_year: yearFilter,
        scope_scid: scopeFilter === "all" ? undefined : Number.parseInt(scopeFilter, 10),
        q: searchDebounced || undefined,
      })
      setRows(res.items)
      setTotal(res.total)
      setSummary(res.summary)
    } catch (e) {
      setRows([])
      setTotal(0)
      setSummary(EMPTY_SUMMARY)
      setError(e instanceof ApiError ? e.message : "โหลดบันทึกการกรอกข้อมูลไม่สำเร็จ")
    } finally {
      setLoading(false)
    }
  }, [orgId, page, pageSize, scopeFilter, yearFilter, searchDebounced])

  useEffect(() => {
    void load()
  }, [load])

  const columns: ColumnsType<ActivityEntryRead> = [
    {
      title: "รหัส",
      dataIndex: "aeid",
      width: 88,
      render: (v: number) => (
        <Typography.Text type="secondary" className="font-mono text-xs">
          #{v}
        </Typography.Text>
      ),
    },
    {
      title: "Scope",
      dataIndex: "scope_scid",
      width: 110,
      render: (v: number) => <Tag color={activityScopeColor(v)}>{activityScopeLabel(v)}</Tag>,
    },
    {
      title: "ประเภท",
      dataIndex: "entry_kind",
      width: 180,
      ellipsis: true,
      render: (kind: string) => activityEntryKindLabel(kind),
    },
    {
      title: "สรุปข้อมูล",
      key: "summary",
      ellipsis: true,
      render: (_, row) => (
        <Typography.Text className="text-sm text-slate-700">{activityEntrySummaryLine(row)}</Typography.Text>
      ),
    },
    {
      title: "",
      key: "actions",
      width: 100,
      fixed: "right",
      render: (_, row) => (
        <Typography.Link onClick={() => setDetail(row)}>รายละเอียด</Typography.Link>
      ),
    },
  ]

  const onTableChange = (pagination: TablePaginationConfig) => {
    if (pagination.current) setPage(pagination.current)
    if (pagination.pageSize) setPageSize(pagination.pageSize)
  }

  const yearOptions = useMemo(
    () => summary.reporting_years.map((y) => ({ value: y, label: `ปี ${y}` })),
    [summary.reporting_years],
  )

  return (
    <div className="w-full min-w-0 pb-10">
      <div className="flex flex-col gap-6">
        <PageHeader
          title="บันทึกการกรอกข้อมูล"
          description="ดูรายการกิจกรรมที่บันทึกจากหน้ากรอกข้อมูล — จัดกลุ่มตาม Scope และกรองตามปีรายงาน"
          actions={
            <Space wrap>
              <PageHeaderButton icon={<ReloadOutlined />} onClick={() => void load()} loading={loading}>
                รีเฟรช
              </PageHeaderButton>
              <Link to="/app/data-input">
                <PageHeaderButton tone="primary" icon={<DatabaseOutlined />}>
                  ไปกรอกข้อมูล
                </PageHeaderButton>
              </Link>
            </Space>
          }
        />

        {error ? (
          <Alert type="error" showIcon closable onClose={() => setError(null)} message={error} />
        ) : null}

        <Row gutter={[16, 16]}>
          <Col xs={12} sm={6}>
            <Card bordered={false} className="shadow-sm">
              <Statistic title="ทั้งหมด" value={summary.total} suffix="รายการ" />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card bordered={false} className="shadow-sm">
              <Statistic title="Scope 1" value={summary.scope1} valueStyle={{ color: "#cf1322" }} />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card bordered={false} className="shadow-sm">
              <Statistic title="Scope 2" value={summary.scope2} valueStyle={{ color: "#1677ff" }} />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card bordered={false} className="shadow-sm">
              <Statistic title="Scope 3" value={summary.scope3} valueStyle={{ color: "#722ed1" }} />
            </Card>
          </Col>
        </Row>

        <Card bordered={false} className="shadow-sm">
          <div className="mb-4 flex flex-col gap-4">
            <Segmented<ScopeFilter>
              value={scopeFilter}
              onChange={setScopeFilter}
              options={[
                { label: `ทั้งหมด (${summary.total.toLocaleString("th-TH")})`, value: "all" },
                { label: `Scope 1 (${summary.scope1.toLocaleString("th-TH")})`, value: "1" },
                { label: `Scope 2 (${summary.scope2.toLocaleString("th-TH")})`, value: "2" },
                { label: `Scope 3 (${summary.scope3.toLocaleString("th-TH")})`, value: "3" },
              ]}
            />
            <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center lg:justify-between">
              <AdminTableToolbar
                placeholder="ค้นหาในข้อมูล (เชื้อเพลิง, ปริมาณ, หมายเหตุ …)"
                value={search}
                onChange={setSearch}
                suffix={
                  <Select
                    allowClear
                    placeholder="ปีรายงานทั้งหมด"
                    className="min-w-[160px]"
                    value={yearFilter}
                    onChange={(v) => setYearFilter(v)}
                    options={yearOptions}
                    disabled={yearOptions.length === 0}
                  />
                }
              />
              <Typography.Text type="secondary" className="text-sm">
                แสดง {rows.length.toLocaleString("th-TH")} จาก {total.toLocaleString("th-TH")} รายการ
                {searchDebounced ? (
                  <>
                    {" "}
                    · ค้นหา &quot;{searchDebounced}&quot;
                  </>
                ) : null}
              </Typography.Text>
            </div>
          </div>

          <Table<ActivityEntryRead>
            rowKey="aeid"
            loading={loading}
            columns={columns}
            dataSource={rows}
            scroll={{ x: 720 }}
            locale={{
              emptyText: (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                    orgId == null
                      ? "ไม่พบองค์กรที่สังกัด"
                      : "ยังไม่มีบันทึก — บันทึกข้อมูลจากหน้ากรอกข้อมูลก่อน"
                  }
                >
                  {orgId != null ? (
                    <Link to="/app/data-input">
                      <PageHeaderButton tone="primary">ไปกรอกข้อมูล</PageHeaderButton>
                    </Link>
                  ) : null}
                </Empty>
              ),
            }}
            pagination={{
              ...adminStandardTablePagination,
              current: page,
              pageSize,
              total,
              showTotal: (t) => `${t.toLocaleString("th-TH")} รายการ`,
            }}
            onChange={onTableChange}
          />
        </Card>

        <Typography.Paragraph type="secondary" className="!mb-0 text-xs leading-relaxed">
          <SearchOutlined className="mr-1" />
          ระบบโหลดทีละหน้าเพื่อรองรับข้อมูลจำนวนมาก — ใช้ตัวกรอง Scope / ปีรายงาน / ค้นหาเพื่อจำกัดผลลัพธ์
        </Typography.Paragraph>
      </div>

      <Drawer
        title={detail ? `รายละเอียด #${detail.aeid}` : "รายละเอียด"}
        open={detail != null}
        onClose={() => setDetail(null)}
        width={Math.min(560, typeof window !== "undefined" ? window.innerWidth - 24 : 560)}
      >
        {detail ? (
          <Space direction="vertical" size="large" className="w-full">
            <Descriptions column={1} size="small" bordered>
              <Descriptions.Item label="Scope">
                <Tag color={activityScopeColor(detail.scope_scid)}>{activityScopeLabel(detail.scope_scid)}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="ประเภท">{activityEntryKindLabel(detail.entry_kind)}</Descriptions.Item>
              {detail.category_code ? (
                <Descriptions.Item label="หมวด">{detail.category_code}</Descriptions.Item>
              ) : null}
              <Descriptions.Item label="สรุป">{activityEntrySummaryLine(detail)}</Descriptions.Item>
            </Descriptions>

            <div>
              <Typography.Title level={5} className="!mb-3 !text-sm !font-semibold">
                ข้อมูลที่บันทึก
              </Typography.Title>
              <Descriptions column={1} size="small" bordered>
                {activityEntryDetailPairs(detail).map((pair) => (
                  <Descriptions.Item key={pair.key} label={pair.key}>
                    <Typography.Text className="whitespace-pre-wrap break-words text-sm">
                      {pair.value}
                    </Typography.Text>
                  </Descriptions.Item>
                ))}
              </Descriptions>
            </div>
          </Space>
        ) : null}
      </Drawer>
    </div>
  )
}
