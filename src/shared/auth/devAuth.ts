import type { UserData } from '../api/auth'

const sessionKey = 'coala.local-preview-session'

function enabled() {
  return import.meta.env.DEV && typeof window !== 'undefined' && ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname)
}

function previewUser(): UserData {
  return {
    id: -1, email: 'test@coala.local', name: '테스트 사용자', nickname: '테스트 코알라',
    birthDate: null, gender: null, department: '컴퓨터인공지능학부', lab: null,
    studentId: 'TEST-LOCAL', grade: 1, githubId: null, linkedinUrl: null,
    academicStatus: 'ENROLLED', verified: true, role: 'USER',
    createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
  }
}

export function getDevUser(): UserData | null {
  if (!enabled()) return null
  return window.sessionStorage.getItem(sessionKey) === 'active' ? previewUser() : null
}

export function loginDevUser(email: string, password: string): UserData | null {
  if (!enabled() || email !== 'test@coala.local') return null
  if (password !== 'CoalaTest!2026') throw new Error('테스트 계정의 비밀번호를 확인해 주세요.')
  window.sessionStorage.setItem(sessionKey, 'active')
  return previewUser()
}

export function clearDevUser() {
  if (typeof window !== 'undefined') window.sessionStorage.removeItem(sessionKey)
}
