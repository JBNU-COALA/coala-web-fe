import axios, { type InternalAxiosRequestConfig } from 'axios'
import {
  clearAuthSession,
  getAccessToken,
  getRefreshToken,
  setAuthSession,
} from '../auth/tokenStorage'
import type { AuthResponse } from './auth'

// vite.config.ts 의 envPrefix='API_' 와 일치. dev 모드에서는 vite proxy(/api)를 사용하므로
// API_BASE_URL 미설정도 정상이며, prod 빌드시에는 .env.production 에 정의해야 한다.
const rawBaseUrl = (import.meta.env.API_BASE_URL as string | undefined) ?? ''
const apiBaseUrl = rawBaseUrl.replace(/\/$/, '')

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean
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
  ].some((endpoint) => pathname.startsWith(endpoint))
}

client.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token && !isAuthEndpoint(config.url)) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config as RetryableRequestConfig | undefined
    if (error.response?.status === 401 && original && !original._retry && !isAuthEndpoint(original.url)) {
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
