export const LOGIN_EMAIL_DOMAIN = '@jbnu.ac.kr'

export function normalizeLoginEmail(value: string) {
  const email = value.trim().toLowerCase()
  return email && !email.includes('@') ? `${email}${LOGIN_EMAIL_DOMAIN}` : email
}
