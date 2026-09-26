import axios, { AxiosError, AxiosHeaders, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import client, { refreshAuthToken } from './client'
import type { AuthResponse } from './auth'
import { clearAuthSession, getAccessToken, getAuthSessionVersion, getStoredUser, handleAuthStorageEvent, setAuthSession } from '../auth/tokenStorage'

const originalAdapter = client.defaults.adapter

function session(id: number, suffix = ''): AuthResponse {
  return {
    accessToken: `test-access-${id}${suffix}`, refreshToken: `test-refresh-${id}${suffix}`, tokenType: 'Bearer',
    user: { id, email: `member${id}@example.com`, name: 'Test member', nickname: null, birthDate: null,
      gender: null, department: '', lab: null, studentId: '', grade: null, githubId: null, linkedinUrl: null,
      academicStatus: 'GENERAL', verified: true, createdAt: '', updatedAt: '' },
  }
}

function response<T>(data: T, config = { headers: new AxiosHeaders() } as InternalAxiosRequestConfig): AxiosResponse<T> {
  return { data, status: 200, statusText: 'OK', headers: new AxiosHeaders(), config }
}

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason: unknown) => void
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no })
  return { promise, resolve, reject }
}

function unauthorized(config = { headers: new AxiosHeaders() } as InternalAxiosRequestConfig) {
  return new AxiosError('Unauthorized', 'ERR_BAD_REQUEST', config, undefined, { ...response({}, config), status: 401 })
}

beforeEach(() => {
  clearAuthSession()
  // Every request in these tests is intercepted; none reaches a real backend.
  client.defaults.adapter = async () => { throw new Error('Unexpected API request') }
})
afterEach(() => { client.defaults.adapter = originalAdapter; clearAuthSession(); vi.restoreAllMocks() })

describe('session-bound refresh', () => {
  it('shares concurrent refreshes and stores the rotated tokens once', async () => {
    const initial = session(1)
    setAuthSession(initial)
    const request = deferred<AxiosResponse<AuthResponse>>()
    const post = vi.spyOn(axios, 'post').mockReturnValue(request.promise)
    const first = refreshAuthToken(initial.refreshToken)
    const second = refreshAuthToken(initial.refreshToken)
    expect(first).toBe(second)
    request.resolve(response(session(1, '-rotated')))
    await Promise.all([first, second])
    expect(post).toHaveBeenCalledTimes(1)
    expect(getAccessToken()).toBe('test-access-1-rotated')
  })

  it('cannot restore a session after logout', async () => {
    const initial = session(1)
    setAuthSession(initial)
    const request = deferred<AxiosResponse<AuthResponse>>()
    vi.spyOn(axios, 'post').mockReturnValue(request.promise)
    const result = refreshAuthToken(initial.refreshToken).catch((error: unknown) => error)
    clearAuthSession()
    request.resolve(response(session(1, '-rotated')))
    expect(axios.isCancel(await result)).toBe(true)
    expect(getAccessToken()).toBeNull()
  })

  it('does not replace a newly logged-in account', async () => {
    setAuthSession(session(1))
    const request = deferred<AxiosResponse<AuthResponse>>()
    vi.spyOn(axios, 'post').mockReturnValue(request.promise)
    const result = refreshAuthToken(session(1).refreshToken).catch((error: unknown) => error)
    setAuthSession(session(2))
    request.resolve(response(session(1, '-rotated')))
    await result
    expect(getStoredUser()?.id).toBe(2)
  })

  it('does not clear the new account when an old refresh fails', async () => {
    setAuthSession(session(1))
    const request = deferred<AxiosResponse<AuthResponse>>()
    vi.spyOn(axios, 'post').mockReturnValue(request.promise)
    const result = refreshAuthToken(session(1).refreshToken).catch(() => undefined)
    setAuthSession(session(2))
    request.reject(unauthorized())
    await result
    expect(getStoredUser()?.id).toBe(2)
  })

  it('retains the session on a network failure but clears rejected credentials', async () => {
    setAuthSession(session(1))
    const post = vi.spyOn(axios, 'post').mockRejectedValueOnce(new AxiosError('Offline', 'ERR_NETWORK'))
    await expect(refreshAuthToken(session(1).refreshToken)).rejects.toThrow('Offline')
    expect(getAccessToken()).toBe(session(1).accessToken)
    post.mockRejectedValueOnce(unauthorized())
    await expect(refreshAuthToken(session(1).refreshToken)).rejects.toThrow('Unauthorized')
    expect(getAccessToken()).toBeNull()
  })

  it('does not replay an old request as another user', async () => {
    setAuthSession(session(1))
    const request = deferred<AxiosResponse>()
    let config: InternalAxiosRequestConfig | undefined
    client.defaults.adapter = async (value) => { config = value; return request.promise }
    const post = vi.spyOn(axios, 'post')
    const result = client.get('/api/users/me/overview').catch(() => undefined)
    await vi.waitFor(() => expect(config).toBeDefined())
    setAuthSession(session(2))
    request.reject(unauthorized(config))
    await result
    expect(post).not.toHaveBeenCalled()
    expect(getStoredUser()?.id).toBe(2)
  })

  it('retries a late 401 with the token already refreshed by a sibling request', async () => {
    setAuthSession(session(1))
    const delayed = deferred<AxiosResponse>()
    let firstConfig: InternalAxiosRequestConfig | undefined
    let requests = 0
    client.defaults.adapter = async (config) => {
      requests += 1
      if (requests === 1) { firstConfig = config; return delayed.promise }
      return response({ authorization: config.headers.Authorization }, config)
    }
    const post = vi.spyOn(axios, 'post').mockResolvedValue(response(session(1, '-rotated')))
    const result = client.get('/api/users/me/overview')
    await vi.waitFor(() => expect(firstConfig).toBeDefined())
    await refreshAuthToken(session(1).refreshToken)
    delayed.reject(unauthorized(firstConfig))
    expect((await result).data.authorization).toBe('Bearer test-access-1-rotated')
    expect(post).toHaveBeenCalledTimes(1)
  })

  it('invalidates pending requests when another browser tab changes auth storage', () => {
    const version = getAuthSessionVersion()
    handleAuthStorageEvent(new StorageEvent('storage', { key: 'theme' }))
    expect(getAuthSessionVersion()).toBe(version)
    handleAuthStorageEvent(new StorageEvent('storage', { key: 'refreshToken' }))
    expect(getAuthSessionVersion()).toBe(version + 1)
  })
})
