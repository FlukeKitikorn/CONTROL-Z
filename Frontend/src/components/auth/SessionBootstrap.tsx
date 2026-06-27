import { App, Spin } from "antd"
import type { PropsWithChildren } from "react"
import { useEffect, useState } from "react"
import { getMe } from "@/lib/api/service"
import { mapAuthUserToProfile } from "@/lib/authApiTypes"
import {
  clearSessionToken,
  getAccessToken,
  getAccessTokenExpiresAt,
  isSessionExpired,
  setAccessToken,
} from "@/lib/authToken"
import { isUserProfileComplete } from "@/lib/userProfileComplete"
import { useAuthStore } from "@/store/useAuthStore"

/**
 * หลังรีเฟรช: มี access token ใน localStorage แต่ Zustand ว่าง — ดึง GET /me แล้ว hydrate
 */
export function SessionBootstrap({ children }: PropsWithChildren) {
  const { notification } = App.useApp()
  const logout = useAuthStore((state) => state.logout)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const [busy, setBusy] = useState(() => {
    const token = getAccessToken()
    if (!token) return false
    if (isSessionExpired()) {
      clearSessionToken()
      return false
    }
    return !useAuthStore.getState().isAuthenticated
  })

  useEffect(() => {
    const token = getAccessToken()
    if (!token) {
      setBusy(false)
      return
    }
    if (isSessionExpired()) {
      clearSessionToken()
      logout()
      notification.warning({
        message: "เซสชันหมดอายุ",
        description: "กรุณาเข้าสู่ระบบใหม่อีกครั้ง",
        placement: "topRight",
      })
      setBusy(false)
      return
    }
    if (useAuthStore.getState().isAuthenticated) {
      setBusy(false)
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const u = await getMe()
        if (cancelled) return
        const profile = mapAuthUserToProfile(u)
        useAuthStore.getState().loginAs(u.role, profile, token)
        if (u.role === "USER" && !isUserProfileComplete(profile)) {
          notification.warning({
            message: "กรุณากรอกข้อมูลส่วนตัวให้ครบ",
            description:
              "ระบบจะเปิดเฉพาะหน้าตั้งค่าจนกว่าจะกรอกชื่อ–ที่อยู่–เบอร์โทรให้ครบ (รูปประจำตัวไม่บังคับ)",
            placement: "topRight",
            duration: 8,
          })
        }
      } catch {
        if (!cancelled) setAccessToken(null)
      } finally {
        if (!cancelled) setBusy(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!isAuthenticated) return
    const token = getAccessToken()
    if (!token) return
    const expiresAt = getAccessTokenExpiresAt()
    if (!expiresAt) return

    const ms = expiresAt - Date.now()
    if (ms <= 0) {
      clearSessionToken()
      logout()
      notification.warning({
        message: "เซสชันหมดอายุ",
        description: "กรุณาเข้าสู่ระบบใหม่อีกครั้ง",
        placement: "topRight",
      })
      return
    }

    const timer = window.setTimeout(() => {
      clearSessionToken()
      logout()
      notification.warning({
        message: "เซสชันหมดอายุ",
        description: "กรุณาเข้าสู่ระบบใหม่อีกครั้ง",
        placement: "topRight",
      })
    }, ms)

    return () => window.clearTimeout(timer)
  }, [isAuthenticated, logout, notification])

  if (busy) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#f3f6fb]">
        <Spin size="large" tip="กำลังโหลดเซสชัน..." />
      </div>
    )
  }

  return children
}
