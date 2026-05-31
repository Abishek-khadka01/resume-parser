import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthStore()

  if (loading) return <div className="flex h-screen items-center justify-center"><span className="text-muted-foreground">Loading...</span></div>
  if (!user) return <Navigate to="/login" replace />

  return <>{children}</>
}
