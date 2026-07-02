import { create } from 'zustand'
import { jwtDecode } from 'jwt-decode'
import type { User } from '@/types'
import api from '@/lib/api'

interface JwtPayload {
  sub: string
  email: string
  exp: number
}

function decodeToken(token: string): User | null {
  try {
    const decoded = jwtDecode<JwtPayload>(token)
    if (decoded.exp * 1000 > Date.now()) {
      return { id: decoded.sub, email: decoded.email, auth_provider: 'local' as const, created_at: '' }
    }
  } catch {
    /* invalid token */
  }
  return null
}

function getPersistedUser(): User | null {
  const token = localStorage.getItem('access_token')
  return token ? decodeToken(token) : null
}

interface AuthState {
  user: User | null
  isLoggedIn: boolean
  loading: boolean
  authModalOpen: boolean
  login: (email: string, password: string) => Promise<void>
  register: (fullName: string, email: string, password: string) => Promise<void>
  logout: () => void
  setAuthModalOpen: (open: boolean) => void
  setSession: (token: string) => void
}

const initialUser = getPersistedUser()

export const useAuthStore = create<AuthState>()((set) => ({
  user: initialUser,
  isLoggedIn: !!initialUser,
  loading: false,
  authModalOpen: false,

  login: async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password })
    const token: string = res.data.access_token
    localStorage.setItem('access_token', token)
    const user = decodeToken(token)
    set({ user, isLoggedIn: !!user })
  },

  register: async (fullName: string, email: string, password: string) => {
    await api.post('/auth/register', { full_name: fullName, email, password })
  },

  logout: () => {
    localStorage.removeItem('access_token')
    set({ user: null, isLoggedIn: false })
  },

  setSession: (token: string) => {
    localStorage.setItem('access_token', token)
    const user = decodeToken(token)
    set({ user, isLoggedIn: !!user })
  },

  setAuthModalOpen: (open: boolean) => {
    set({ authModalOpen: open })
  },
}))
