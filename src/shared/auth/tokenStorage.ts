import type { AuthResponse, UserData } from '../api/auth'

const ACCESS_TOKEN_KEY = 'accessToken'
const REFRESH_TOKEN_KEY = 'refreshToken'
const USER_KEY = 'user'
export const AUTH_SESSION_EVENT = 'coala:auth-session-changed'
let sessionVersion = 0

export function getAuthSessionVersion() {
  return sessionVersion
}

function notifySessionChanged() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(AUTH_SESSION_EVENT))
}

export function handleAuthStorageEvent(event: StorageEvent) {
  if (event.key !== null && ![ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, USER_KEY].includes(event.key)) return
  sessionVersion += 1
  notifySessionChanged()
}

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

function storeAuthSession(data: AuthResponse) {
  const storage = getStorage()
  if (!storage) return

  storage.setItem(ACCESS_TOKEN_KEY, data.accessToken)
  storage.setItem(REFRESH_TOKEN_KEY, data.refreshToken)
  storage.setItem(USER_KEY, JSON.stringify(data.user))
  notifySessionChanged()
}

export function setAuthSession(data: AuthResponse) {
  sessionVersion += 1
  storeAuthSession(data)
}

export function replaceRefreshedSession(data: AuthResponse, refreshToken: string, version: number) {
  if (version !== sessionVersion || getRefreshToken() !== refreshToken) return false
  storeAuthSession(data)
  return true
}

export function setStoredUser(user: UserData) {
  const storage = getStorage()
  if (!storage) return

  storage.setItem(USER_KEY, JSON.stringify(user))
}

export function clearAuthSession() {
  sessionVersion += 1
  const storage = getStorage()
  if (!storage) return

  storage.removeItem(ACCESS_TOKEN_KEY)
  storage.removeItem(REFRESH_TOKEN_KEY)
  storage.removeItem(USER_KEY)
  notifySessionChanged()
}
