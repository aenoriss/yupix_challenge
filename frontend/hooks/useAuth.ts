import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authApi, User } from '@/lib/api'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string) => Promise<void>
  logout: () => void
  deleteAccount: () => Promise<void>
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: async (email: string, password: string) => {
        const { user, token } = await authApi.login(email, password)
        localStorage.setItem('token', token)
        set({ user, token, isAuthenticated: true })
      },

      signup: async (email: string, password: string) => {
        await authApi.signup(email, password)
      },

      logout: () => {
        localStorage.removeItem('token')
        set({ user: null, token: null, isAuthenticated: false })
      },

      deleteAccount: async () => {
        await authApi.deleteAccount()
        localStorage.removeItem('token')
        set({ user: null, token: null, isAuthenticated: false })
      },
    }),
    {
      name: 'auth-storage',
    }
  )
)