import type { AuthResponse, UserData } from '../api/auth'

export const DEMO_ACCOUNT = {
  email: 'demo@coala.dev',
  password: 'coala1234',
  name: '코알라 데모',
  department: '컴퓨터공학부',
  studentId: '20260001',
} as const

export const demoUser: UserData = {
  id: 9001,
  email: DEMO_ACCOUNT.email,
  name: DEMO_ACCOUNT.name,
  nickname: 'demo',
  birthDate: null,
  gender: 'PREFER_NOT_TO_SAY',
  department: DEMO_ACCOUNT.department,
  studentId: DEMO_ACCOUNT.studentId,
  grade: 3,
  githubId: 'coala-demo',
  linkedinUrl: null,
  academicStatus: 'ENROLLED',
  createdAt: '2026-03-01T00:00:00.000Z',
  updatedAt: '2026-05-02T00:00:00.000Z',
}

export function isDemoCredential(email: string, password: string) {
  return email.trim().toLowerCase() === DEMO_ACCOUNT.email && password === DEMO_ACCOUNT.password
}

export function createDemoAuthResponse(): AuthResponse {
  return {
    accessToken: 'demo-access-token',
    refreshToken: 'demo-refresh-token',
    tokenType: 'Bearer',
    user: demoUser,
  }
}
