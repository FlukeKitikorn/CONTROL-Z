import { create } from "zustand"

type UserRole = "USER" | "ADMIN"

/** โปรไฟล์ผู้ใช้ (สอดคล้องฟิลด์ลงทะเบียน / ตั้งค่า) */
export interface UserProfile {
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
  loginAs: (role: UserRole, user: UserProfile) => void
  updateUserProfile: (partial: Partial<UserProfile>) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  role: null,
  user: null,
  loginAs: (role, user) => set({ isAuthenticated: true, role, user }),
  updateUserProfile: (partial) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...partial } : null,
    })),
  logout: () => set({ isAuthenticated: false, role: null, user: null }),
}))

export type { UserRole }
