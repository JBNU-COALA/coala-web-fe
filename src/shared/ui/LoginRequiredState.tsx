import { Navigate, useLocation } from 'react-router-dom'

export function LoginRequiredState() {
  const location = useLocation()
  return <Navigate to="/login" replace state={{ from: location }} />
}
