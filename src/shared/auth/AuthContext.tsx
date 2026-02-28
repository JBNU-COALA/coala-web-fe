import { createContext, useContext, useState, type ReactNode } from 'react'
import { authApi, type UserData, type SignupRequest } from '../api/auth'

type AuthState = {
  user: UserData | null
  isLoggedIn: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (data: SignupRequest) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

function loadUserFromStorage(): UserData | null {
  try {
    const stored = localStorage.getItem('user')
    return stored ? (JSON.parse(stored) as UserData) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserData | null>(loadUserFromStorage)

  const login = async (email: string, password: string) => {
    const data = await authApi.login({ email, password })
    localStorage.setItem('accessToken', data.accessToken)
    localStorage.setItem('refreshToken', data.refreshToken)
    localStorage.setItem('user', JSON.stringify(data.user))
    setUser(data.user)
  }

  const signup = async (signupData: SignupRequest) => {
    const data = await authApi.signup(signupData)
    localStorage.setItem('accessToken', data.accessToken)
    localStorage.setItem('refreshToken', data.refreshToken)
    localStorage.setItem('user', JSON.stringify(data.user))
    setUser(data.user)
  }

  const logout = async () => {
    await authApi.logout().catch(() => {})
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
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
