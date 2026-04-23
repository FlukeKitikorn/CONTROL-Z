import { DownloadOutlined } from "@ant-design/icons"

import { App, Button } from "antd"

import { useState } from "react"

import { NavLink, Outlet, useLocation } from "react-router"

import { PageHeader } from "@/components/common/PageHeader"

import { REPORT_TEMPLATE_CODES } from "@/lib/reportExportCatalog"
import { useReportsHeaderLiveData } from "@/pages/reports/useReportsHeaderLiveData"



export function ReportsLayout() {

  const { message } = App.useApp()
  const live = useReportsHeaderLiveData()
  const [downloading, setDownloading] = useState(false)

  const { pathname } = useLocation()



  const onDownloadAll = async () => {
    try {
      setDownloading(true)
      const { createWorkbookModelFromLiveData, exportAllReportsToSingleWorkbook } = await import(
        "@/lib/excelTemplateExportService"
      )
      const model = createWorkbookModelFromLiveData({ live })
      const result = await exportAllReportsToSingleWorkbook({ model })
      if (result.usedMasterTemplate) {
        message.success("ดาวน์โหลดไฟล์เดียวครบทุกชุดจาก template ต้นฉบับแล้ว")
      } else {
        message.warning("ดาวน์โหลดไฟล์เดียวสำเร็จ (ยังไม่พบ master template จึงใช้โครงจากระบบ)")
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "เกิดข้อผิดพลาดระหว่างส่งออกไฟล์"
      message.error(msg)
    } finally {
      setDownloading(false)
    }
  }



  return (

    <div className="w-full min-w-0">

      <div className="px-5 pt-2 sm:px-8 md:px-10">

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">

          <div className="min-w-0 flex-1">

            <PageHeader

              title="รายงานและการส่งออก"

              description="some text"

            />

          </div>

          <Button

            type="primary"

            size="large"

            icon={<DownloadOutlined />}

            className="signature-gradient shrink-0 self-stretch border-0 px-5 sm:self-start sm:px-6"

            onClick={onDownloadAll}
            loading={downloading}

          >

            ดาวน์โหลดไฟล์ .XLSX

          </Button>

        </div>

      </div>



      <div className="px-5 pb-12 sm:px-8 md:px-10">

        <nav

          className="mb-6 flex flex-wrap gap-1 border-b border-slate-200/90 pb-px"

          aria-label="แบบฟอร์มรายงาน (แยกหน้า)"

        >

          {REPORT_TEMPLATE_CODES.map((code) => {

            const to = `/app/reports/${code}`

            const active = pathname === to || pathname.startsWith(`${to}/`)

            return (

              <NavLink

                key={code}

                to={to}

                className={[

                  "inline-flex min-h-[44px] items-center rounded-t-lg border border-b-0 px-3 py-2.5 text-sm font-medium transition-colors sm:px-4",

                  active

                    ? "relative z-[1] -mb-px border-slate-300/90 bg-white font-mono text-teal-800 shadow-sm"

                    : "border-transparent font-mono text-slate-600 hover:bg-slate-50/90 hover:text-slate-900",

                ].join(" ")}

              >

                {code}

              </NavLink>

            )

          })}

        </nav>



        <div className="min-h-[min(52vh,720px)] min-w-0 pt-1">

          <Outlet />

        </div>

      </div>

    </div>

  )

}

