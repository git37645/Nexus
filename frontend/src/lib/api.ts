import axios, { AxiosError, AxiosRequestConfig } from 'axios'
import { useAuthStore } from '../store/authStore'

const baseURL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api'

export const api = axios.create({
  baseURL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

let isRefreshing = false
let refreshQueue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = []

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean }

    if (error.response?.status === 401 && !originalRequest._retry) {
      const refreshToken = localStorage.getItem('refreshToken')
      if (!refreshToken) {
        useAuthStore.getState().logout()
        return Promise.reject(error)
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push({ resolve, reject })
        }).then((token) => {
          if (originalRequest.headers) {
            originalRequest.headers['Authorization'] = `Bearer ${token}`
          }
          return api(originalRequest)
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const response = await axios.post(`${baseURL}/auth/refresh`, { refreshToken })
        const { accessToken, refreshToken: newRefresh } = response.data

        useAuthStore.getState().setAccessToken(accessToken)
        localStorage.setItem('refreshToken', newRefresh)

        refreshQueue.forEach(({ resolve }) => resolve(accessToken))
        refreshQueue = []

        if (originalRequest.headers) {
          originalRequest.headers['Authorization'] = `Bearer ${accessToken}`
        }
        return api(originalRequest)
      } catch (refreshError) {
        refreshQueue.forEach(({ reject }) => reject(refreshError))
        refreshQueue = []
        useAuthStore.getState().logout()
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export function getErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    return error.response?.data?.message ?? error.message
  }
  if (error instanceof Error) return error.message
  return 'An unexpected error occurred'
}
