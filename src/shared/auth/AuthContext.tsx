/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { authApi, type UserData, type SignupRequest, type EmailVerificationResponse } from '../api/auth'
import { clearAuthSession, getRefreshToken, getStoredUser, setAuthSession, setStoredUser } from './tokenStorage'

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
  const [user, setUser] = useState<UserData | null>(getStoredUser)

  useEffect(() => {
    const refreshToken = getRefreshToken()
    if (!refreshToken) return

    let active = true

    authApi.refresh(refreshToken)
      .then((data) => {
        if (!active) return
        setAuthSession(data)
        setUser(data.user)
      })
      .catch(() => {
        if (!active) return
        clearAuthSession()
        setUser(null)
      })

    return () => {
      active = false
    }
  }, [])

  const login = async (email: string, password: string) => {
    const data = await authApi.login({ email, password })
    setAuthSession(data)
    setUser(data.user)
  }

  const signup = async (signupData: SignupRequest) => {
    const data = await authApi.signup(signupData)
    return data
  }

  const updateUser = (patch: Partial<UserData>) => {
    setUser((current) => {
      if (!current) return current
      const next = { ...current, ...patch }
      setStoredUser(next)
      return next
    })
  }

  const logout = async () => {
    await authApi.logout().catch(() => {})
    clearAuthSession()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, isLoggedIn: user !== null, login, signup, updateUser, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
