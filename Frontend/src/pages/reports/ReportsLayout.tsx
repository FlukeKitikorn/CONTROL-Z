import { NavLink, Outlet, useLocation } from "react-router"

import { PageHeader } from "@/components/common/PageHeader"
import { REPORT_TEMPLATE_CODES } from "@/lib/reportExportCatalog"
import {
  useReportsHeaderLiveData,
  type ReportsHeaderLiveData,
} from "@/pages/reports/useReportsHeaderLiveData"

export function ReportsLayout() {
  const live = useReportsHeaderLiveData()
  const { pathname } = useLocation()

  return (
    <div className="w-full min-w-0 pb-12">
      <div className="flex flex-col gap-6">
        <PageHeader
          title="รายงานและการส่งออก"
          description="เลือกแบบฟอร์มรายงานแต่ละชุดเพื่อดูและตรวจสอบข้อมูลก่อนส่งออก"
        />

        <nav
          className="flex flex-wrap gap-1 border-b border-slate-200/90 pb-px"
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

        <div className="min-h-[min(52vh,720px)] min-w-0">
          <Outlet context={live satisfies ReportsHeaderLiveData} />
        </div>
      </div>
    </div>
  )
}
