import { Typography } from "antd"

import { useMemo } from "react"

import { Navigate, useParams } from "react-router"

import { OrganizationDetailReportHeader } from "@/components/reports/OrganizationDetailReportHeader"

import { ReportFrFormMetaRows } from "@/components/reports/ReportFrFormMetaRows"

import {

  DEFAULT_REPORT_PAGE_SLUG,

  catalogItemByCode,

  isOrganizationMapReportPage,

  isValidReportPageSlug,

  organizationMapDiagramTitle,

} from "@/lib/reportExportCatalog"

import { getLatestBaseYearSnapshot, getOrganizationStorageId } from "@/lib/organizationBaseYearStorage"

import { Fr01ReportTemplate } from "@/pages/reports/fr01/Fr01ReportTemplate"

import { Fr02OrganizationMapReportTemplate } from "@/pages/reports/fr02/Fr02OrganizationMapReportTemplate"

import { Fr032Scope3SignificanceReportTemplate } from "@/pages/reports/fr032/Fr032Scope3SignificanceReportTemplate"

import { Fr04InventoryReportTemplate } from "@/pages/reports/fr04/Fr04InventoryReportTemplate"

import { Fr05InventoryReportTemplate } from "@/pages/reports/fr05/Fr05InventoryReportTemplate"

import { ReportSpreadsheetMock } from "@/pages/reports/ReportSpreadsheetMock"

import { useReportsHeaderLiveData } from "@/pages/reports/useReportsHeaderLiveData"

import { useAuthStore } from "@/store/useAuthStore"



export function ReportsSectionPage() {

  const { reportSlug } = useParams<{ reportSlug: string }>()

  const live = useReportsHeaderLiveData()

  const authUser = useAuthStore((s) => s.user)

  const fr042BaseYearLabel = useMemo(() => {

    const orgId = getOrganizationStorageId(authUser)

    const snap = getLatestBaseYearSnapshot(orgId)

    if (!snap) return ""

    return `${snap.dat_start} – ${snap.dat_end}`

  }, [authUser])



  if (!reportSlug || !isValidReportPageSlug(reportSlug)) {

    return <Navigate to={`/app/reports/${DEFAULT_REPORT_PAGE_SLUG}`} replace />

  }



  const item = catalogItemByCode(reportSlug)

  if (!item) {

    return <Navigate to={`/app/reports/${DEFAULT_REPORT_PAGE_SLUG}`} replace />

  }



  const fr01HeaderModel = useMemo(

    () => ({

      organizationName: live.organizationName,

      nameOfAgency: live.agencyName,

      date: live.preparedDate,

    }),

    [live.agencyName, live.organizationName, live.preparedDate],

  )



  const orgMapModel = useMemo(

    () => ({

      organizationMapImageUrl: "",

      footerPreparedBy: live.agencyName,

      footerCompletedDate: live.preparedDate,

    }),

    [live.agencyName, live.preparedDate],

  )



  const fr032Model = useMemo(

    () => ({

      criteriaExplanationFromDb: live.fr032CriteriaExplanation,

    }),

    [live.fr032CriteriaExplanation],

  )



  return (

    <article className="flex min-h-[min(48vh,640px)] min-w-0 flex-col gap-6">

      <header className="space-y-2">

        <Typography.Title level={4} className="!mb-0 !font-mono !text-lg !font-semibold text-teal-900 md:!text-xl">

          {item.code}

        </Typography.Title>

        <Typography.Paragraph type="secondary" className="!mb-0 !max-w-none !text-sm !leading-relaxed md:!text-[15px]">

          {item.pageIntro}

        </Typography.Paragraph>

      </header>



      <div className="flex min-w-0 flex-col gap-0">

        <OrganizationDetailReportHeader

          organizationName={live.organizationName}

          referenceCode={item.reportReferenceCode}

          referenceVersion={item.reportReferenceVersion}

        >

          <ReportFrFormMetaRows

            formNameValue={item.lockedFormNameValue}

            organizationName={live.organizationName}

            displayFormCode={item.displayFormCode}

            agencyName={live.agencyName}

            preparedDate={live.preparedDate}

            pageNumber={item.formMetaPageNumber}

          />

        </OrganizationDetailReportHeader>



        {item.code === "Fr_01" ? (

          <Fr01ReportTemplate model={fr01HeaderModel} />

        ) : item.code === "Fr_03.2" ? (

          <Fr032Scope3SignificanceReportTemplate model={fr032Model} />

        ) : item.code === "Fr_04.1" || item.code === "Fr_04.2" ? (

          <Fr04InventoryReportTemplate
            variant={item.code}
            baseYearLabel={item.code === "Fr_04.2" ? fr042BaseYearLabel : undefined}
            bundle={live.fr04Bundle}
            tableLoading={live.fr04TableLoading}
          />

        ) : item.code === "Fr_05" ? (

          <Fr05InventoryReportTemplate bundle={live.fr05Bundle} tableLoading={live.fr05TableLoading} />

        ) : isOrganizationMapReportPage(item.code) ? (

          <Fr02OrganizationMapReportTemplate

            diagramSectionTitle={organizationMapDiagramTitle(item.code)}

            model={orgMapModel}

            showCompletionFooter={item.code === "Fr_03.1"}

          />

        ) : (

          <section className="flex min-h-0 flex-1 flex-col gap-4">

            <div className="min-h-[min(40vh,520px)] flex-1 rounded-2xl border border-slate-200/90 bg-slate-50/40 p-2 shadow-inner ring-1 ring-slate-100/70 sm:p-3 md:min-h-[min(44vh,600px)]">

              <ReportSpreadsheetMock sheetTitle={`${item.code} — ${item.title}`} forms={[item]} />

            </div>

            <div

              className="min-h-[min(28vh,320px)] rounded-2xl border border-dashed border-slate-300/70 bg-slate-50/30 p-6 text-center text-sm text-slate-500"

              aria-hidden

            >

              พื้นที่เผื่อสำหรับกราฟ สรุป หรือบล็อกเนื้อหาเพิ่มเติมบนหน้านี้

            </div>

          </section>

        )}

      </div>

    </article>

  )

}

