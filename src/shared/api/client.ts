import axios, { type InternalAxiosRequestConfig } from 'axios'
import {
  clearAuthSession,
  getAccessToken,
  getRefreshToken,
  setAuthSession,
} from '../auth/tokenStorage'
import type { AuthResponse } from './auth'

// vite.config.ts 의 envPrefix='API_' 와 일치.
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

const apiBaseUrl = resolveApiBaseUrl()

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean
}

const client = axios.create({
  baseURL: apiBaseUrl || undefined,
})

client.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config as RetryableRequestConfig | undefined
    if (error.response?.status === 401 && original && !original._retry) {
      original._retry = true
      const refreshToken = getRefreshToken()
      if (refreshToken) {
        try {
          const { data } = await axios.post(
            `${apiBaseUrl || ''}/api/auth/refresh`,
            { refreshToken },
          ) as { data: AuthResponse }
          setAuthSession(data)
          original.headers.Authorization = `Bearer ${data.accessToken}`
          return client(original)
        } catch {
          clearAuthSession()
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(error)
  },
)

export default client
