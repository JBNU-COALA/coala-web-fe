import axios, { type InternalAxiosRequestConfig } from 'axios'
import {
  clearAuthSession,
  getAccessToken,
  getRefreshToken,
  getAuthSessionVersion,
  replaceRefreshedSession,
} from '../auth/tokenStorage'
import type { AuthResponse } from './auth'

// vite.config.ts exposes only this public URL through an explicit define.
// same-origin 배포에서는 API_BASE_URL 을 비워두고, https 페이지에서 http API 주소가 들어오면
// 혼합 콘텐츠 문제를 피하기 위해 same-origin /api 로 되돌린다.
const rawBaseUrl = ((import.meta.env.API_BASE_URL as string | undefined) ?? '').trim()
const normalizedBaseUrl = rawBaseUrl.replace(/\/$/, '')

function resolveApiBaseUrl() {
  if (!normalizedBaseUrl) return ''
  if (typeof window === 'undefined') return normalizedBaseUrl

  try {
    const resolvedUrl = new URL(normalizedBaseUrl, window.location.origin)
    if (window.location.protocol === 'https:' && resolvedUrl.protocol === 'http:') {
      return ''
    }
    return normalizedBaseUrl
  } catch {
    return ''
  }
}

export const apiBaseUrl = resolveApiBaseUrl()

const attachmentAssetPathPattern = /^\/(?:api|media)\/attachments\/(\d+)\/download(?:([?#].*)?)$/i

function normalizeAttachmentAssetUrl(url: string) {
  const relativeAttachment = url.match(attachmentAssetPathPattern)
  if (relativeAttachment) {
    return `/api/attachments/${relativeAttachment[1]}/download${relativeAttachment[2] ?? ''}`
  }

  try {
    const parsed = new URL(url)
    const attachment = parsed.pathname.match(attachmentAssetPathPattern)
    if (attachment) {
      return `${parsed.origin}/api/attachments/${attachment[1]}/download${parsed.search}${parsed.hash}`
    }
  } catch {
    return url
  }

  return url
}

export function resolveApiAssetUrl(url: string) {
  const normalizedUrl = normalizeAttachmentAssetUrl(url)
  if (!normalizedUrl || /^(?:data:|blob:|https?:\/\/|\/\/)/i.test(normalizedUrl)) return normalizedUrl
  if (!normalizedUrl.startsWith('/api/') && !normalizedUrl.startsWith('/media/')) return normalizedUrl

  try {
    const baseUrl = apiBaseUrl || (typeof window !== 'undefined' ? window.location.origin : '')
    return baseUrl ? new URL(normalizedUrl, baseUrl).toString() : normalizedUrl
  } catch {
    return normalizedUrl
  }
}

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean
  _sessionVersion?: number
  _accessToken?: string | null
}

let refreshInFlight: { version: number; token: string; promise: Promise<AuthResponse> } | null = null

export function refreshAuthToken(refreshToken: string): Promise<AuthResponse> {
  const version = getAuthSessionVersion()
  if (getRefreshToken() !== refreshToken) return Promise.reject(new axios.CanceledError('Session changed'))
  if (refreshInFlight?.version === version && refreshInFlight.token === refreshToken) return refreshInFlight.promise

  const promise = axios.post<AuthResponse>(`${apiBaseUrl || ''}/api/auth/refresh`, { refreshToken })
    .then(({ data }) => {
      if (!replaceRefreshedSession(data, refreshToken, version)) throw new axios.CanceledError('Session changed')
      return data
    })
    .catch((error: unknown) => {
      if (version === getAuthSessionVersion() && getRefreshToken() === refreshToken &&
        axios.isAxiosError(error) && [400, 401, 403].includes(error.response?.status ?? 0)) {
        clearAuthSession()
      }
      throw error
    })
    .finally(() => { if (refreshInFlight?.promise === promise) refreshInFlight = null })
  refreshInFlight = { version, token: refreshToken, promise }
  return promise
}

const client = axios.create({
  baseURL: apiBaseUrl || undefined,
})

function isAuthEndpoint(url?: string) {
  if (!url) return false

  const pathname = url.startsWith('http') ? new URL(url).pathname : url.split('?')[0]
  return [
    '/api/auth/login',
    '/api/auth/signup',
    '/api/auth/refresh',
    '/api/auth/email-verification',
    '/api/auth/password-reset',
  ].some((endpoint) => pathname.startsWith(endpoint))
}

client.interceptors.request.use((config: RetryableRequestConfig) => {
  if (config._sessionVersion !== undefined && config._sessionVersion !== getAuthSessionVersion()) {
    throw new axios.CanceledError('Session changed')
  }
  config._sessionVersion = getAuthSessionVersion()
  const token = getAccessToken()
  config._accessToken = token
  if (token && !isAuthEndpoint(config.url)) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config as RetryableRequestConfig | undefined
    const status = error.response?.status
    const refreshToken = getRefreshToken()
    const shouldRefresh =
      status === 401 &&
      original &&
      !original._retry &&
      original._sessionVersion === getAuthSessionVersion() &&
      !isAuthEndpoint(original.url) &&
      Boolean(refreshToken)

    if (shouldRefresh) {
      original._retry = true
      try {
        // A sibling request may already have rotated this session's access token.
        const currentToken = getAccessToken()
        if (currentToken && currentToken !== original._accessToken) {
          original.headers.Authorization = `Bearer ${currentToken}`
        } else {
          const data = await refreshAuthToken(refreshToken!)
          original.headers.Authorization = `Bearer ${data.accessToken}`
        }
        return client(original)
      } catch { /* Keep transient failures from discarding the session or draft. */ }
    }
    return Promise.reject(error)
  },
)

export default client
