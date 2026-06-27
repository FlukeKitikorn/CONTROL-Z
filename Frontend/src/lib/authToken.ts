const CONTROL_Z_ACCESS_TOKEN_KEY = "control-z-access-token"
const CONTROL_Z_ACCESS_TOKEN_EXPIRES_AT_KEY = "control-z-access-token-expires-at"
const CONTROL_Z_SESSION_ID_KEY = "control-z-session-id"

export function getSessionId(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(CONTROL_Z_SESSION_ID_KEY)
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(CONTROL_Z_ACCESS_TOKEN_KEY)
}

export function getAccessTokenExpiresAt(): number | null {
  if (typeof window === "undefined") return null
  const raw = localStorage.getItem(CONTROL_Z_ACCESS_TOKEN_EXPIRES_AT_KEY)
  if (!raw) return null
  const n = Number(raw)
  return Number.isFinite(n) ? n : null
}

export function isSessionExpired(nowMs = Date.now()): boolean {
  const token = getAccessToken()
  if (!token) return false
  const expiresAt = getAccessTokenExpiresAt()
  if (!expiresAt) return false
  return nowMs >= expiresAt
}

export function setAccessToken(token: string | null): void {
  if (typeof window === "undefined") return
  if (token) localStorage.setItem(CONTROL_Z_ACCESS_TOKEN_KEY, token)
  else {
    localStorage.removeItem(CONTROL_Z_ACCESS_TOKEN_KEY)
    localStorage.removeItem(CONTROL_Z_ACCESS_TOKEN_EXPIRES_AT_KEY)
    localStorage.removeItem(CONTROL_Z_SESSION_ID_KEY)
  }
}

export function setSessionId(sessionId: string | null): void {
  if (typeof window === "undefined") return
  if (sessionId) localStorage.setItem(CONTROL_Z_SESSION_ID_KEY, sessionId)
  else localStorage.removeItem(CONTROL_Z_SESSION_ID_KEY)
}

export function setSessionToken(
  token: string,
  expiresInSeconds?: number | null,
  sessionId?: string | null,
): void {
  if (typeof window === "undefined") return
  localStorage.setItem(CONTROL_Z_ACCESS_TOKEN_KEY, token)
  setSessionId(sessionId ?? null)
  if (typeof expiresInSeconds === "number" && Number.isFinite(expiresInSeconds) && expiresInSeconds > 0) {
    const expiresAt = Date.now() + Math.floor(expiresInSeconds * 1000)
    localStorage.setItem(CONTROL_Z_ACCESS_TOKEN_EXPIRES_AT_KEY, String(expiresAt))
  } else {
    localStorage.removeItem(CONTROL_Z_ACCESS_TOKEN_EXPIRES_AT_KEY)
  }
}

export function clearSessionToken(): void {
  setAccessToken(null)
}
