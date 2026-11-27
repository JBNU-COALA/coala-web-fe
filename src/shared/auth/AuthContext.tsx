/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { authApi, type UserData, type SignupRequest, type EmailVerificationResponse } from '../api/auth'
import { AUTH_SESSION_EVENT, clearAuthSession, getAuthSessionVersion, getRefreshToken, getStoredUser, handleAuthStorageEvent, setAuthSession, setStoredUser } from './tokenStorage'
import { clearDevUser, getDevUser, loginDevUser } from './devAuth'

type AuthState = {
  user: UserData | null
  isLoggedIn: boolean
  isDevSession: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (data: SignupRequest) => Promise<EmailVerificationResponse>
  updateUser: (patch: Partial<UserData>) => void
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {

  const [user, setUser] = useState<UserData | null>(() => {
    const devUser = getDevUser()
    if (devUser) return devUser
    const storedUser = getStoredUser()
    if (!storedUser || !getRefreshToken()) {
      clearAuthSession()
      return null
    }
    return storedUser
  })

  useEffect(() => {
    const syncSession = () => setUser(getDevUser() ?? (getRefreshToken() ? getStoredUser() : null))
    window.addEventListener(AUTH_SESSION_EVENT, syncSession)
    window.addEventListener('storage', handleAuthStorageEvent)
    const refreshToken = getRefreshToken()
    // Bootstrap and expired API calls share one refresh, including StrictMode replays.
    if (refreshToken && !getDevUser()) void authApi.refresh(refreshToken).catch(() => {})

    return () => {
      window.removeEventListener(AUTH_SESSION_EVENT, syncSession)
      window.removeEventListener('storage', handleAuthStorageEvent)
    }
  }, [])


  const login = async (email: string, password: string) => {
    const devUser = loginDevUser(email, password)
    if (devUser) {
      clearAuthSession()
      setUser(devUser)
      return
    }
    const data = await authApi.login({ email, password })
    clearDevUser()
    setAuthSession(data)
    setUser(data.user)
  }

  const signup = async (signupData: SignupRequest) => {
    const data = await authApi.signup(signupData)
    return data
  }

  const updateUser = useCallback((patch: Partial<UserData>) => {
    setUser((current) => {
      if (!current) return current
      const next = { ...current, ...patch }
      if (!getDevUser()) setStoredUser(next)
      return next
    })
  }, [])

  const logout = async () => {
    if (getDevUser()) {
      clearDevUser()
      clearAuthSession()
      setUser(null)
      return
    }
    const version = getAuthSessionVersion()
    await authApi.logout().catch(() => {})
    if (version !== getAuthSessionVersion()) return
    clearAuthSession()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, isLoggedIn: user !== null && Boolean(getDevUser() || getRefreshToken()), isDevSession: Boolean(getDevUser()), login, signup, updateUser, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
