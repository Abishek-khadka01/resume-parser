import { useState, useEffect } from 'react'
import { jwtDecode } from 'jwt-decode'
import type { User } from '@/types'

interface JwtPayload {
  sub: string
  email: string
  exp: number
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (token) {
      try {
        const decoded = jwtDecode<JwtPayload>(token)
        if (decoded.exp * 1000 > Date.now()) {
          setUser({ id: decoded.sub, email: decoded.email, auth_provider: 'local', created_at: '' })
        } else {
          localStorage.removeItem('access_token')
        }
      } catch {
        localStorage.removeItem('access_token')
      }
    }
    setLoading(false)
  }, [])

  const logout = () => {
    localStorage.removeItem('access_token')
    setUser(null)
    window.location.href = '/login'
  }

  return { user, loading, logout }
}
