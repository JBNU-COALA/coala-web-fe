import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'

type RequireAuthProps = {
  children: ReactNode
}

export function RequireAuth({ children }: RequireAuthProps) {
  const location = useLocation()
  const { isLoggedIn, user } = useAuth()

  if (!isLoggedIn) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (user?.verified === false) {
    return <Navigate to="/email-verification" replace state={{ email: user.email, from: location }} />
  }

  return children
}
