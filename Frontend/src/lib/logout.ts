import { postAuthLogout } from "@/lib/api/service"
import { clearSessionToken } from "@/lib/authToken"
import { sessionConfig } from "@/lib/sessionConfig"
import { useAuthStore } from "@/store/useAuthStore"

/** ล้างเซสชันฝั่ง client และ revoke บน server เมื่อเปิด Redis sessions */
export async function performLogout(): Promise<void> {
  if (sessionConfig.serverSessions) {
    try {
      await postAuthLogout()
    } catch {
      /* ล้าง local ต่อแม้ revoke ล้มเหลว */
    }
  }
  clearSessionToken()
  useAuthStore.getState().logout()
}
