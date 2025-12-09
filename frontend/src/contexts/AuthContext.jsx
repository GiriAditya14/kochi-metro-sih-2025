import { createContext, useContext, useEffect, useState } from 'react'
import * as api from '../services/api'

const AuthContext = createContext(null)
const TOKEN_KEY = 'auth_token'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const saveToken = (token) => {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  }

  const fetchMe = async () => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) {
      setUser(null)
      return
    }
    try {
      const res = await api.me()
      setUser(res.data.user)
    } catch (e) {
      console.error('[AUTH] me failed', e?.response?.data || e?.message)
      saveToken(null)
      setUser(null)
    }
  }

  useEffect(() => {
    fetchMe().finally(() => setLoading(false))
  }, [])

  const login = async (email, password) => {
    const res = await api.login(email, password)
    saveToken(res.data.token)
    setUser(res.data.user)
    return res.data.user
  }

  const signup = async (email, password, role = 'worker') => {
    const res = await api.signup(email, password, role)
    saveToken(res.data.token)
    setUser(res.data.user)
    return res.data.user
  }

  const logout = () => {
    saveToken(null)
    setUser(null)
  }

  const hasRole = (roles) => {
    if (!user) return false
    if (Array.isArray(roles)) return roles.includes(user.role)
    return user.role === roles
  }

  const value = { user, loading, login, signup, logout, hasRole }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

