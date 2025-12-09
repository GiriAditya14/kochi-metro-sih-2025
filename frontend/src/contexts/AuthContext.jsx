import { createContext, useContext, useEffect, useState } from 'react'
import * as api from '../services/api'

const AuthContext = createContext(null)
const TOKEN_KEY = 'auth_token'
const USER_KEY = 'auth_user'

// Role hierarchy for permission checks
const ROLE_HIERARCHY = {
  user: 1,
  worker: 2,
  admin: 3,
}

// Role-based feature access
export const ROLE_PERMISSIONS = {
  // Features accessible by role
  dashboard: ['user', 'worker', 'admin'],
  inductionPlanner: ['user', 'worker', 'admin'],
  whatIfSimulator: ['worker', 'admin'],
  dataPlayground: ['worker', 'admin'],
  dataInjection: ['user', 'worker', 'admin'],
  alerts: ['user', 'worker', 'admin'],
  aiCopilot: ['user', 'worker', 'admin'],
  resilienceLab: ['worker', 'admin'],
  // Actions
  approvePlan: ['admin'],
  overrideAssignment: ['worker', 'admin'],
  generatePlan: ['worker', 'admin'],
  uploadData: ['user', 'worker', 'admin'],
  importData: ['worker', 'admin'],
  acknowledgeAlert: ['worker', 'admin'],
  resolveAlert: ['admin'],
}

// Predefined users for dev mode
const PREDEFINED_USERS = {
  '9165926808': { name: 'Chaitanya', role: 'admin' },
  '9977433610': { name: 'Dhruv', role: 'user' },
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  const saveAuth = (newToken, newUser) => {
    if (newToken && newUser) {
      localStorage.setItem(TOKEN_KEY, newToken)
      localStorage.setItem(USER_KEY, JSON.stringify(newUser))
      setToken(newToken)
      setUser(newUser)
    } else {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
      setToken(null)
      setUser(null)
    }
  }

  const loadStoredAuth = async () => {
    const storedToken = localStorage.getItem(TOKEN_KEY)
    const storedUser = localStorage.getItem(USER_KEY)
    
    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser)
        if (parsedUser.id && parsedUser.role) {
          setToken(storedToken)
          setUser(parsedUser)
        } else {
          saveAuth(null, null)
        }
      } catch (e) {
        saveAuth(null, null)
      }
    }
    setLoading(false)
  }

  useEffect(() => {
    loadStoredAuth()
  }, [])

  // OTP-based login
  const verifyOTP = async (phoneNumber, otpCode) => {
    // Generate mock token for dev mode
    const mockIdToken = `dev_token_${Date.now()}_${phoneNumber}`
    
    const res = await api.verifyPhoneToken(mockIdToken, `+91${phoneNumber}`)
    saveAuth(res.data.token, res.data.user)
    return res.data.user
  }

  const logout = () => {
    saveAuth(null, null)
  }

  // Check if user has at least the required role level
  const hasPermission = (requiredRole) => {
    if (!user) return false
    return ROLE_HIERARCHY[user.role] >= ROLE_HIERARCHY[requiredRole]
  }

  // Check if user can access a specific feature
  const canAccess = (feature) => {
    if (!user) return false
    const allowedRoles = ROLE_PERMISSIONS[feature]
    return allowedRoles?.includes(user.role) || false
  }

  // Legacy hasRole for backward compatibility
  const hasRole = (roles) => {
    if (!user) return false
    if (Array.isArray(roles)) return roles.includes(user.role)
    return user.role === roles
  }

  // Get human-readable role label
  const getRoleLabel = () => {
    if (!user) return 'Guest'
    switch (user.role) {
      case 'admin': return 'Administrator'
      case 'worker': return 'Operations Staff'
      case 'user': return 'Viewer'
      default: return 'Unknown'
    }
  }

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user && !!token,
    verifyOTP,
    logout,
    hasPermission,
    canAccess,
    hasRole,
    getRoleLabel,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
