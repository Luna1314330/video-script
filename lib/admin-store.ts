import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AdminState {
  isAuthenticated: boolean
  admin: {
    username: string
    loginTime: string
  } | null
  login: (username: string, password: string) => Promise<boolean>
  restoreSession: (username: string) => void
  logout: () => Promise<void>
}

export const useAdminStore = create<AdminState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      admin: null,

      login: async (username: string, password: string) => {
        const res = await fetch('/api/admin/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ username, password }),
        })

        const data = await res.json().catch(() => ({}))

        if (!res.ok || !data.success) {
          return false
        }

        set({
          isAuthenticated: true,
          admin: {
            username: data.username || username,
            loginTime: new Date().toISOString(),
          },
        })
        return true
      },

      restoreSession: (username: string) => {
        set({
          isAuthenticated: true,
          admin: {
            username,
            loginTime: new Date().toISOString(),
          },
        })
      },

      logout: async () => {
        try {
          await fetch('/api/admin/logout', { method: 'POST' })
        } catch {
          // 忽略网络错误，本地仍清除状态
        }
        set({
          isAuthenticated: false,
          admin: null,
        })
      },
    }),
    {
      name: 'admin-storage',
    },
  ),
)
