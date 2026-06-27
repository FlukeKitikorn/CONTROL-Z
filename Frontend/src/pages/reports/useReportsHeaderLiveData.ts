import { useCallback, useEffect, useMemo, useState } from "react"
import { ApiError } from "@/lib/api/http"
import { getOrganization, getReportBundle, listCollectInformation, listForms, listPointsConsider } from "@/lib/api/service"
import { latestCollectRow, pipeRangeLabel } from "@/lib/collectInformationRange"
import { DATA_NOT_FOUND_LABEL, displayOrNotFound } from "@/lib/dataNotFound"
import { apiReportToFr04Bundle, apiReportToFr05Bundle } from "@/lib/mapApiReportBundle"
import type { Fr04ReportBundle } from "@/pages/reports/fr04/fr04InventoryModel"
import type { Fr05ReportBundle } from "@/pages/reports/fr05/fr05InventoryModel"
import { useAuthStore } from "@/store/useAuthStore"

export type ReportsHeaderLiveData = {
  loading: boolean
  error: string | null
  organizationName: string
  agencyName: string
  preparedDate: string
  /** ช่วงปีฐานสำหรับหัวรายงาน Fr_04.2 (จาก collect_information ล่าสุด) */
  baseYearRangeLabel: string | null
  fr032CriteriaExplanation: string
  fr04Bundle: Fr04ReportBundle | null
  fr04TableLoading: boolean
  fr05Bundle: Fr05ReportBundle | null
  fr05TableLoading: boolean
}

export function useReportsHeaderLiveData(): ReportsHeaderLiveData {
  const authUser = useAuthStore((s) => s.user)
  const orgIdNum = useMemo(() => {
    const id = authUser?.organization_id
    if (id === undefined || id === null) return null
    const n = typeof id === "number" ? id : Number.parseInt(String(id), 10)
    return Number.isFinite(n) ? n : null
  }, [authUser?.organization_id])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [organizationName, setOrganizationName] = useState(DATA_NOT_FOUND_LABEL)
  const [agencyName, setAgencyName] = useState(DATA_NOT_FOUND_LABEL)
  const [preparedDate, setPreparedDate] = useState(DATA_NOT_FOUND_LABEL)
  const [baseYearRangeLabel, setBaseYearRangeLabel] = useState<string | null>(null)
  const [fr04Bundle, setFr04Bundle] = useState<Fr04ReportBundle | null>(null)
  const [fr05Bundle, setFr05Bundle] = useState<Fr05ReportBundle | null>(null)
  const [fr04Loading, setFr04Loading] = useState(false)
  const [fr05Loading, setFr05Loading] = useState(false)

  const load = useCallback(async () => {
    if (orgIdNum == null) {
      setLoading(false)
      setError(null)
      setOrganizationName(DATA_NOT_FOUND_LABEL)
      setAgencyName(DATA_NOT_FOUND_LABEL)
      setPreparedDate(DATA_NOT_FOUND_LABEL)
      setBaseYearRangeLabel(null)
      setFr04Bundle(null)
      setFr05Bundle(null)
      return
    }
    setLoading(true)
    setError(null)
    setFr04Loading(true)
    setFr05Loading(true)
    try {
      const [org, collects] = await Promise.all([
        getOrganization(orgIdNum),
        listCollectInformation(orgIdNum),
      ])
      setOrganizationName(displayOrNotFound(org.organization_name))
      setAgencyName(displayOrNotFound(org.name_of_agency))
      setPreparedDate(
        displayOrNotFound(
          org.registration_date ||
            new Intl.DateTimeFormat("th-TH", { dateStyle: "medium", calendar: "gregory" }).format(new Date()),
        ),
      )
      const latest = latestCollectRow(collects)
      setBaseYearRangeLabel(latest ? pipeRangeLabel(latest.base_year) : null)

      let f04: Fr04ReportBundle | null = null
      let f05: Fr05ReportBundle | null = null
      try {
        const b41 = await getReportBundle(orgIdNum, "Fr_04.1")
        f04 = apiReportToFr04Bundle(b41)
      } catch (e) {
        if (!(e instanceof ApiError && e.status === 404)) throw e
      }
      try {
        const b05 = await getReportBundle(orgIdNum, "Fr_05")
        f05 = apiReportToFr05Bundle(b05)
      } catch (e) {
        if (!(e instanceof ApiError && e.status === 404)) throw e
      }
      setFr04Bundle(f04)
      setFr05Bundle(f05)
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "โหลดข้อมูลไม่สำเร็จ"
      setError(msg)
      setOrganizationName(DATA_NOT_FOUND_LABEL)
      setAgencyName(DATA_NOT_FOUND_LABEL)
      setPreparedDate(DATA_NOT_FOUND_LABEL)
      setBaseYearRangeLabel(null)
      setFr04Bundle(null)
      setFr05Bundle(null)
    } finally {
      setLoading(false)
      setFr04Loading(false)
      setFr05Loading(false)
    }
  }, [orgIdNum])

  useEffect(() => {
    void load()
  }, [load])

  const [fr032CriteriaExplanation, setFr032CriteriaExplanation] = useState("")

  useEffect(() => {
    if (orgIdNum == null) {
      setFr032CriteriaExplanation("")
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const forms = await listForms(orgIdNum)
        const norm = (s: string) => s.replace(/-/g, "_").toLowerCase()
        const target = norm("Fr_03.2")
        const f = forms.find((x) => norm(x.form_id) === target)
        if (!f) {
          if (!cancelled) setFr032CriteriaExplanation("")
          return
        }
        const pts = await listPointsConsider(orgIdNum, f.fid)
        const row = pts[0]
        if (!row) {
          if (!cancelled) setFr032CriteriaExplanation("")
          return
        }
        const text = [row.source_GHG, row.magnitude, row.influence, row.risk].filter((x) => x?.trim()).join(" — ")
        if (!cancelled) setFr032CriteriaExplanation(text)
      } catch {
        if (!cancelled) setFr032CriteriaExplanation("")
      }
    })()
    return () => {
      cancelled = true
    }
  }, [orgIdNum])

  return {
    loading,
    error,
    organizationName,
    agencyName,
    preparedDate,
    baseYearRangeLabel,
    fr032CriteriaExplanation,
    fr04Bundle,
    fr04TableLoading: loading || fr04Loading,
    fr05Bundle,
    fr05TableLoading: loading || fr05Loading,
  }
}
