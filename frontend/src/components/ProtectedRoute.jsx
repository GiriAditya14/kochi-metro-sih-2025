import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function ProtectedRoute({ children, roles }) {
  const { user, loading, hasRole } = useAuth()

  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  if (roles && !hasRole(roles)) return <Navigate to="/login" replace />

  return children
}

