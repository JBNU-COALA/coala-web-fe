import client from './client'

export type LoginRequest = {
  email: string
  password: string
}

export type SignupRequest = {
  email: string
  password: string
  name: string
  nickname?: string
  birthDate?: string
  gender: 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY'
  department?: string
  studentId: string
  grade: number
  githubId: string
  linkedinUrl?: string
  academicStatus: 'ENROLLED' | 'ON_LEAVE' | 'GRADUATED'
}

export type UserData = {
  id: number
  email: string
  name: string
  nickname: string | null
  birthDate: string | null
  gender: 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY' | null
  department: string
  studentId: string
  grade: number | null
  githubId: string | null
  linkedinUrl: string | null
  academicStatus: 'ENROLLED' | 'ON_LEAVE' | 'GRADUATED'
  verified: boolean
  role?: 'USER' | 'ADMIN' | 'ROLE_USER' | 'ROLE_ADMIN' | string
  createdAt: string
  updatedAt: string
}

export type AuthResponse = {
  accessToken: string
  refreshToken: string
  tokenType: string
  user: UserData
}

export type EmailVerificationResponse = {
  email: string
  verified: boolean
  message: string
}

export const authApi = {
  login: (data: LoginRequest) =>
    client.post<AuthResponse>('/api/auth/login', data).then((r) => r.data),

  signup: (data: SignupRequest) =>
    client.post<EmailVerificationResponse>('/api/auth/signup', data).then((r) => r.data),

  resendEmailVerification: (email: string) =>
    client
      .post<EmailVerificationResponse>('/api/auth/email-verification/resend', { email })
      .then((r) => r.data),

  confirmEmailVerification: (email: string, code: string) =>
    client
      .post<EmailVerificationResponse>('/api/auth/email-verification/confirm', { email, code })
      .then((r) => r.data),

  logout: () => client.post('/api/auth/logout'),

  refresh: (refreshToken: string) =>
    client.post<AuthResponse>('/api/auth/refresh', { refreshToken }).then((r) => r.data),
}
