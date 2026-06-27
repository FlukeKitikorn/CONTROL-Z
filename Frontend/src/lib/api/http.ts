import { apiUrl } from "@/lib/apiBase"
import { clearSessionToken, getAccessToken, isSessionExpired } from "@/lib/authToken"
import { apiFetchCredentials, usesBearerToken } from "@/lib/sessionConfig"
import { useAuthStore } from "@/store/useAuthStore"

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.name = "ApiError"
    this.status = status
  }
}

function parseDetail(body: unknown): string {
  if (body == null) return "คำขอล้มเหลว"
  if (typeof body === "object" && body !== null && "detail" in body) {
    const d = (body as { detail: unknown }).detail
    if (typeof d === "string") return d
    if (Array.isArray(d)) {
      return d
        .map((x) => (typeof x === "object" && x && "msg" in x ? String((x as { msg: string }).msg) : String(x)))
        .filter(Boolean)
        .join(", ")
    }
  }
  return "คำขอล้มเหลว"
}

export type ApiRequestOptions = Omit<RequestInit, "body"> & {
  /** ส่งเป็น JSON (ตั้ง Content-Type ให้อัตโนมัติ) */
  json?: unknown
  body?: RequestInit["body"]
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const token = usesBearerToken() ? getAccessToken() : null
  if (token && isSessionExpired()) {
    clearSessionToken()
    useAuthStore.getState().logout()
    throw new ApiError(401, "เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่")
  }
  const headers = new Headers(options.headers)
  let body: BodyInit | undefined = options.body as BodyInit | undefined
  if (options.json !== undefined) {
    if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json")
    body = JSON.stringify(options.json)
  }
  if (token) headers.set("Authorization", `Bearer ${token}`)

  const res = await fetch(apiUrl(path), {
    ...options,
    headers,
    body,
    credentials: apiFetchCredentials(),
  })

  if (res.status === 204) {
    return undefined as T
  }

  const text = await res.text()
  let parsed: unknown = null
  if (text) {
    try {
      parsed = JSON.parse(text) as unknown
    } catch {
      parsed = null
    }
  }

  if (!res.ok) {
    if (res.status === 401) {
      clearSessionToken()
      useAuthStore.getState().logout()
    }
    throw new ApiError(res.status, parseDetail(parsed))
  }

  return (parsed ?? null) as T
}
