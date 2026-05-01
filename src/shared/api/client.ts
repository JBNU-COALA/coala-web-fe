import axios, { type InternalAxiosRequestConfig } from 'axios'

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

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
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
      const refreshToken = localStorage.getItem('refreshToken')
      if (refreshToken) {
        try {
          const { data } = await axios.post(
            `${apiBaseUrl}/api/auth/refresh`,
            { refreshToken },
          )
          localStorage.setItem('accessToken', data.accessToken)
          localStorage.setItem('refreshToken', data.refreshToken)
          if (data.user) localStorage.setItem('user', JSON.stringify(data.user))
          original.headers.Authorization = `Bearer ${data.accessToken}`
          return client(original)
        } catch {
          localStorage.removeItem('accessToken')
          localStorage.removeItem('refreshToken')
          localStorage.removeItem('user')
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(error)
  },
)

export default client
