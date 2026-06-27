import { create } from "zustand"

import { setAccessToken } from "@/lib/authToken"

type UserRole = "USER" | "ADMIN"

/** โปรไฟล์ผู้ใช้ (สอดคล้องฟิลด์ลงทะเบียน / ตั้งค่า) */
export interface UserProfile {
  user_id?: number
  prefix?: string
  fname: string
  lname: string
  address?: string
  subdistrict?: string
  district?: string
  province?: string
  postal_code?: string
  phone?: string
  email: string
  username?: string
  /** URL หรือ data URL ของรูปประจำตัว */
  imageprofile?: string
  organization_id?: string | number
}

interface AuthState {
  isAuthenticated: boolean
  role: UserRole | null
  user: UserProfile | null
  accessToken: string | null
  loginAs: (role: UserRole, user: UserProfile, accessToken?: string | null) => void
  updateUserProfile: (partial: Partial<UserProfile>) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  role: null,
  user: null,
  accessToken: null,
  loginAs: (role, user, accessToken = null) =>
    set({
      isAuthenticated: true,
      role,
      user,
      accessToken: accessToken ?? null,
    }),
  updateUserProfile: (partial) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...partial } : null,
    })),
  logout: () => {
    setAccessToken(null)
    set({ isAuthenticated: false, role: null, user: null, accessToken: null })
  },
}))

export type { UserRole }
