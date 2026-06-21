import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AdminState {
  isAuthenticated: boolean
  admin: {
    username: string
    loginTime: string
  } | null
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
}

// Mock admin credentials
const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'admin123',
}

export const useAdminStore = create<AdminState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      admin: null,

      login: async (username: string, password: string) => {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500))

        if (
          username === ADMIN_CREDENTIALS.username &&
          password === ADMIN_CREDENTIALS.password
        ) {
          set({
            isAuthenticated: true,
            admin: {
              username,
              loginTime: new Date().toISOString(),
            },
          })
          return true
        }
        return false
      },

      logout: () => {
        set({
          isAuthenticated: false,
          admin: null,
        })
      },
    }),
    {
      name: 'admin-storage',
    }
  )
)
