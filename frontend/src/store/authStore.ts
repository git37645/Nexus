import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User } from '../types'
import { connectSocket, disconnectSocket } from '../lib/socket'

interface AuthStore {
  user: User | null
  accessToken: string | null
  isAuthenticated: boolean

  setAuth: (user: User, accessToken: string, refreshToken: string) => void
  setAccessToken: (token: string) => void
  updateUser: (user: Partial<User>) => void
  logout: () => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,

      setAuth: (user, accessToken, refreshToken) => {
        localStorage.setItem('refreshToken', refreshToken)
        connectSocket(accessToken)
        set({ user, accessToken, isAuthenticated: true })
      },

      setAccessToken: (token) => {
        set({ accessToken: token })
        connectSocket(token)
      },

      updateUser: (partial) => {
        const current = get().user
        if (current) set({ user: { ...current, ...partial } })
      },

      logout: () => {
        const refreshToken = localStorage.getItem('refreshToken')
        if (refreshToken) {
          fetch('/api/auth/logout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
          }).catch(() => {})
        }
        localStorage.removeItem('refreshToken')
        disconnectSocket()
        set({ user: null, accessToken: null, isAuthenticated: false })
      },
    }),
    {
      name: 'nexus-auth',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
)
