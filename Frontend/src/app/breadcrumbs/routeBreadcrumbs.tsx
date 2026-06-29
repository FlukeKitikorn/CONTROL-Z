import type { BreadcrumbProps } from "antd"
import { NavLink } from "react-router"
import { DEFAULT_REPORT_PAGE_SLUG, catalogItemByCode, isValidReportPageSlug } from "@/lib/reportExportCatalog"

export type BreadcrumbItem = NonNullable<BreadcrumbProps["items"]>[number]

function crumbLink(to: string, label: string): BreadcrumbItem {
  return { title: <NavLink to={to}>{label}</NavLink> }
}

/** Breadcrumb สำหรับโซน /app (ผู้ใช้ทั่วไป) */
export function mainAppBreadcrumbItems(pathname: string): BreadcrumbItem[] {
  const p = pathname.replace(/\/$/, "") || "/app"

  if (p === "/app") {
    return [{ title: "แดชบอร์ด" }]
  }

  const dash = crumbLink("/app", "แดชบอร์ด")

  if (p === "/app/reports" || p.startsWith("/app/reports/")) {
    const slug =
      p === "/app/reports" ? DEFAULT_REPORT_PAGE_SLUG : decodeURIComponent(p.replace("/app/reports/", "").split("/")[0] ?? "")
    const reportsRoot = crumbLink(`/app/reports/${DEFAULT_REPORT_PAGE_SLUG}`, "รายงานและส่งออก")
    const label =
      isValidReportPageSlug(slug) && catalogItemByCode(slug) ? catalogItemByCode(slug)!.code : slug
    return [dash, reportsRoot, { title: label }]
  }

  const routes: Record<string, BreadcrumbItem[]> = {
    "/app/data-input": [dash, { title: "กรอกข้อมูล" }],
    "/app/records": [dash, { title: "บันทึกการกรอกข้อมูล" }],
    "/app/results": [dash, { title: "การคำนวณ" }],
    "/app/settings": [dash, { title: "ตั้งค่า" }],
    "/app/setup/organization": [dash, { title: "ตั้งค่าองค์กร" }, { title: "องค์กร" }],
    "/app/setup/base-year": [dash, { title: "ตั้งค่าองค์กร" }, { title: "ปีฐาน" }],
  }

  return routes[p] ?? [dash, { title: p.replace("/app", "") || "หน้า" }]
}

/** Breadcrumb สำหรับโซน /admin */
export function adminBreadcrumbItems(pathname: string): BreadcrumbItem[] {
  const p = pathname.replace(/\/$/, "") || "/admin"

  if (p === "/admin") {
    return [{ title: "แดชบอร์ดผู้ดูแล" }]
  }

  const root = crumbLink("/admin", "ผู้ดูแลระบบ")

  const routes: Record<string, BreadcrumbItem[]> = {
    "/admin/users": [root, { title: "จัดการผู้ใช้" }],
    "/admin/organizations": [root, { title: "องค์กร" }],
    "/admin/factors": [root, { title: "ปัจจัยการปล่อย" }],
    "/admin/monitoring": [root, { title: "ตรวจสอบข้อมูล" }],
    "/admin/announcements": [root, { title: "ประกาศ" }],
    "/admin/settings": [root, { title: "ตั้งค่าผู้ดูแล" }],
    "/admin/logs": [root, { title: "บันทึกและตรวจสอบ" }],
    "/admin/terminal": [root, { title: "Terminal — บันทึกระบบ" }],
  }

  return routes[p] ?? [root, { title: p.replace("/admin", "") || "หน้า" }]
}
