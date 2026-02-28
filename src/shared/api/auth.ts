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
  gender?: 'MALE' | 'FEMALE' | 'NONE'
  department: string
  studentId: string
  grade?: number
  academicStatus: 'ENROLLED' | 'ON_LEAVE' | 'GRADUATED'
}

export type UserData = {
  id: number
  email: string
  name: string
  nickname: string | null
  birthDate: string | null
  gender: 'MALE' | 'FEMALE' | 'NONE' | null
  department: string
  studentId: string
  grade: number | null
  academicStatus: 'ENROLLED' | 'ON_LEAVE' | 'GRADUATED'
  createdAt: string
  updatedAt: string
}

export type AuthResponse = {
  accessToken: string
  refreshToken: string
  tokenType: string
  user: UserData
}

export const authApi = {
  login: (data: LoginRequest) =>
    client.post<AuthResponse>('/api/auth/login', data).then((r) => r.data),

  signup: (data: SignupRequest) =>
    client.post<AuthResponse>('/api/auth/signup', data).then((r) => r.data),

  logout: () => client.post('/api/auth/logout'),

  refresh: (refreshToken: string) =>
    client.post<AuthResponse>('/api/auth/refresh', { refreshToken }).then((r) => r.data),
}
