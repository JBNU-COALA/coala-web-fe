import type { UserData } from '../api/auth'

export function isAdminUser(user: UserData | null) {
  if (!user) return false

  const role = user.role?.replace(/^ROLE_/, '').toUpperCase()
  return role === 'SUPER_ADMIN' || role === 'STAFF'
}
