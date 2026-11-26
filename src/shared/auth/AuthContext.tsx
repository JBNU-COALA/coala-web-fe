/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import posthog, { isPostHogConfigured } from '../../posthog'
import { authApi, type UserData, type SignupRequest, type EmailVerificationResponse } from '../api/auth'
import { AUTH_SESSION_EVENT, clearAuthSession, getAuthSessionVersion, getRefreshToken, getStoredUser, handleAuthStorageEvent, setAuthSession, setStoredUser } from './tokenStorage'

type AuthState = {
  user: UserData | null
  isLoggedIn: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (data: SignupRequest) => Promise<EmailVerificationResponse>
  updateUser: (patch: Partial<UserData>) => void
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const identifiedUserId = useRef<string | null>(null)
  const [user, setUser] = useState<UserData | null>(() => {
    const storedUser = getStoredUser()
    if (!storedUser || !getRefreshToken()) {
      clearAuthSession()
      return null
    }
    return storedUser
  })

  useEffect(() => {
    const syncSession = () => setUser(getRefreshToken() ? getStoredUser() : null)
    window.addEventListener(AUTH_SESSION_EVENT, syncSession)
    window.addEventListener('storage', handleAuthStorageEvent)
    const refreshToken = getRefreshToken()
    // Bootstrap and expired API calls share one refresh, including StrictMode replays.
    if (refreshToken) void authApi.refresh(refreshToken).catch(() => {})

    return () => {
      window.removeEventListener(AUTH_SESSION_EVENT, syncSession)
      window.removeEventListener('storage', handleAuthStorageEvent)
    }
  }, [])

  useEffect(() => {
    if (!isPostHogConfigured) return

    if (!user) {
      if (identifiedUserId.current !== null) posthog.reset()
      identifiedUserId.current = null
      return
    }

    const distinctId = String(user.id)
    if (identifiedUserId.current === distinctId) return

    if (identifiedUserId.current !== null) posthog.reset()
    posthog.identify(distinctId, {
      email: user.email,
      name: user.name,
      role: user.role,
    })
    identifiedUserId.current = distinctId
  }, [user])

  const login = async (email: string, password: string) => {
    const data = await authApi.login({ email, password })
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
      setStoredUser(next)
      return next
    })
  }, [])

  const logout = async () => {
    const version = getAuthSessionVersion()
    await authApi.logout().catch(() => {})
    if (version !== getAuthSessionVersion()) return
    clearAuthSession()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, isLoggedIn: user !== null && Boolean(getRefreshToken()), login, signup, updateUser, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
