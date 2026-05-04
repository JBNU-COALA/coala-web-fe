import type { AuthResponse, UserData } from '../api/auth'

const ACCESS_TOKEN_KEY = 'accessToken'
const REFRESH_TOKEN_KEY = 'refreshToken'
const USER_KEY = 'user'

function getStorage() {
  if (typeof window === 'undefined') return null
  return window.localStorage
}

export function getAccessToken() {
  return getStorage()?.getItem(ACCESS_TOKEN_KEY) ?? null
}

export function getRefreshToken() {
  return getStorage()?.getItem(REFRESH_TOKEN_KEY) ?? null
}

export function getStoredUser(): UserData | null {
  const raw = getStorage()?.getItem(USER_KEY)
  if (!raw) return null

  try {
    return JSON.parse(raw) as UserData
  } catch {
    clearAuthSession()
    return null
  }
}

export function setAuthSession(data: AuthResponse) {
  const storage = getStorage()
  if (!storage) return

  storage.setItem(ACCESS_TOKEN_KEY, data.accessToken)
  storage.setItem(REFRESH_TOKEN_KEY, data.refreshToken)
  storage.setItem(USER_KEY, JSON.stringify(data.user))
}

export function clearAuthSession() {
  const storage = getStorage()
  if (!storage) return

  storage.removeItem(ACCESS_TOKEN_KEY)
  storage.removeItem(REFRESH_TOKEN_KEY)
  storage.removeItem(USER_KEY)
}
