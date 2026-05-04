import { createContext, useContext, useState, type ReactNode } from 'react'
import { authApi, type UserData, type SignupRequest } from '../api/auth'
import { createDemoAuthResponse, isDemoCredential } from './demoAccount'
import { clearAuthSession, getStoredUser, setAuthSession } from './tokenStorage'

type AuthState = {
  user: UserData | null
  isLoggedIn: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (data: SignupRequest) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserData | null>(getStoredUser)

  const login = async (email: string, password: string) => {
    const canUseDemoAccount = import.meta.env.DEV && isDemoCredential(email, password)
    const data = canUseDemoAccount
      ? createDemoAuthResponse()
      : await authApi.login({ email, password })
    setAuthSession(data)
    setUser(data.user)
  }

  const signup = async (signupData: SignupRequest) => {
    const data = await authApi.signup(signupData)
    setAuthSession(data)
    setUser(data.user)
  }

  const logout = async () => {
    await authApi.logout().catch(() => {})
    clearAuthSession()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, isLoggedIn: user !== null, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
