import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { clearDevUser, getDevUser, loginDevUser } from './devAuth'

beforeEach(() => {
  vi.stubEnv('DEV', true)
  window.sessionStorage.clear()
})
afterEach(() => { window.sessionStorage.clear(); vi.unstubAllEnvs(); vi.unstubAllGlobals() })

it('creates only a local normal-user session, survives reload reads, and logs out', () => {
  expect(loginDevUser('test@coala.local', 'CoalaTest!2026')).toMatchObject({ id: -1, role: 'USER', verified: true })
  expect(getDevUser()?.email).toBe('test@coala.local')
  clearDevUser()
  expect(getDevUser()).toBeNull()
})

it('rejects a wrong password and leaves normal logins to the API', () => {
  expect(() => loginDevUser('test@coala.local', 'wrong')).toThrow()
  expect(getDevUser()).toBeNull()
  expect(loginDevUser('member@example.com', 'password')).toBeNull()
})

it('cannot activate or restore a test session in production', () => {
  loginDevUser('test@coala.local', 'CoalaTest!2026')
  vi.stubEnv('DEV', false)
  expect(getDevUser()).toBeNull()
  expect(loginDevUser('test@coala.local', 'CoalaTest!2026')).toBeNull()
})

it('does not enable the test account on a non-local host', () => {
  vi.stubGlobal('window', { location: { hostname: 'coala.example.com' }, sessionStorage: window.sessionStorage })
  expect(loginDevUser('test@coala.local', 'CoalaTest!2026')).toBeNull()
  expect(getDevUser()).toBeNull()
})
