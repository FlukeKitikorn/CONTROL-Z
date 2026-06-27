import type { UserProfile, UserRole } from "@/store/useAuthStore"

/** Response จาก POST /api/v1/auth/login | register */
export type AuthTokenResponse = {
  access_token: string
  token_type: string
  expires_in: number
  user: {
    user_id: number
    fname: string
    lname: string
    prefix?: string | null
    email: string
    username: string
    role: UserRole
    organization_id: number
    address?: string | null
    subdistrict?: string | null
    district?: string | null
    province?: string | null
    postal_code?: string | null
    phone?: string | null
    imageprofile?: string | null
  }
}

export function mapAuthUserToProfile(u: AuthTokenResponse["user"]): UserProfile {
  return {
    user_id: u.user_id,
    prefix: u.prefix ?? undefined,
    fname: u.fname,
    lname: u.lname,
    email: u.email,
    username: u.username,
    organization_id: u.organization_id,
    address: u.address ?? undefined,
    subdistrict: u.subdistrict ?? undefined,
    district: u.district ?? undefined,
    province: u.province ?? undefined,
    postal_code: u.postal_code ?? undefined,
    phone: u.phone ?? undefined,
    imageprofile: u.imageprofile ?? undefined,
  }
}
