import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useAuthStore } from './authStore'
import api from '@/lib/api'
import { jwtDecode } from 'jwt-decode'

vi.mock('jwt-decode', () => ({
  jwtDecode: vi.fn(),
}))

const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.fake.payload'
const mockDecoded = { sub: 'user-1', email: 'a@b.com', exp: Date.now() / 1000 + 3600 }

beforeEach(() => {
  localStorage.clear()
  useAuthStore.setState({ user: null, isLoggedIn: false, loading: false, authModalOpen: false })
  vi.mocked(jwtDecode).mockReturnValue(mockDecoded as never)
})

describe('authStore', () => {
  describe('login', () => {
    it('stores token and sets user on success', async () => {
      vi.mocked(api.post).mockResolvedValue({ data: { access_token: mockToken } })

      await useAuthStore.getState().login('a@b.com', 'pw')

      expect(localStorage.getItem('access_token')).toBe(mockToken)
      const state = useAuthStore.getState()
      expect(state.isLoggedIn).toBe(true)
      expect(state.user).toEqual({ id: 'user-1', email: 'a@b.com', auth_provider: 'local', created_at: '' })
    })

    it('calls the correct API endpoint', async () => {
      vi.mocked(api.post).mockResolvedValue({ data: { access_token: mockToken } })

      await useAuthStore.getState().login('a@b.com', 'pw')

      expect(api.post).toHaveBeenCalledWith('/auth/login', { email: 'a@b.com', password: 'pw' })
    })

    it('rejects on API error', async () => {
      vi.mocked(api.post).mockRejectedValue(new Error('Unauthorized'))

      await expect(useAuthStore.getState().login('a@b.com', 'bad')).rejects.toThrow('Unauthorized')
    })
  })

  describe('register', () => {
    it('calls the register endpoint', async () => {
      vi.mocked(api.post).mockResolvedValue({})

      await useAuthStore.getState().register('Jane', 'a@b.com', 'pw')

      expect(api.post).toHaveBeenCalledWith('/auth/register', {
        full_name: 'Jane',
        email: 'a@b.com',
        password: 'pw',
      })
    })
  })

  describe('logout', () => {
    it('clears token and user state', () => {
      localStorage.setItem('access_token', mockToken)
      useAuthStore.setState({ user: { id: 'u1', email: 'a@b.com', auth_provider: 'local', created_at: '' }, isLoggedIn: true })

      useAuthStore.getState().logout()

      expect(localStorage.getItem('access_token')).toBeNull()
      expect(useAuthStore.getState().isLoggedIn).toBe(false)
      expect(useAuthStore.getState().user).toBeNull()
    })
  })

  describe('setSession', () => {
    it('stores token and decodes user', () => {
      useAuthStore.getState().setSession(mockToken)

      expect(localStorage.getItem('access_token')).toBe(mockToken)
      expect(useAuthStore.getState().isLoggedIn).toBe(true)
    })
  })

  describe('setAuthModalOpen', () => {
    it('updates authModalOpen', () => {
      useAuthStore.getState().setAuthModalOpen(true)
      expect(useAuthStore.getState().authModalOpen).toBe(true)

      useAuthStore.getState().setAuthModalOpen(false)
      expect(useAuthStore.getState().authModalOpen).toBe(false)
    })
  })
})
