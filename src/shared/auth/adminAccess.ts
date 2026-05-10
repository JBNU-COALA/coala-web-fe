import type { UserData } from '../api/auth'

export function isAdminUser(user: UserData | null) {
  if (!user) return false

  const role = user.role?.toUpperCase()
  if (role === 'ADMIN' || role === 'ROLE_ADMIN') return true

  const email = user.email.toLowerCase()
  const localPart = email.includes('@') ? email.slice(0, email.indexOf('@')) : email
  return (
    localPart === 'admin' ||
    localPart.endsWith('.admin') ||
    localPart.endsWith('_admin') ||
    user.name.includes('관리자')
  )
}
