import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const { login, signup } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('worker')
  const [isSignup, setIsSignup] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (isSignup) {
        await signup(email, password, role)
      } else {
        await login(email, password)
      }
      navigate('/')
    } catch (err) {
      setError(err?.response?.data?.detail || err.message || 'Failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg-primary)' }}>
      <div className="w-full max-w-md rounded-lg p-6 shadow-lg" style={{ 
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid var(--glass-border)'
      }}>
        <h1 className="text-2xl font-bold mb-4" style={{ color: 'rgb(var(--color-text-primary))' }}>
          {isSignup ? 'Sign Up' : 'Login'}
        </h1>
        {error && <div className="mb-3 text-red-600 text-sm">{error}</div>}
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="block text-sm mb-1" style={{ color: 'rgb(var(--color-text-secondary))' }}>Email</label>
            <input 
              className="w-full rounded px-3 py-2 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{
                background: 'rgba(var(--color-bg-secondary), 0.5)',
                border: '1px solid rgb(var(--color-border))',
                color: 'rgb(var(--color-text-primary))'
              }}
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
            />
          </div>
          <div>
            <label className="block text-sm mb-1" style={{ color: 'rgb(var(--color-text-secondary))' }}>Password</label>
            <input 
              className="w-full rounded px-3 py-2 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500" 
              type="password"
              style={{
                background: 'rgba(var(--color-bg-secondary), 0.5)',
                border: '1px solid rgb(var(--color-border))',
                color: 'rgb(var(--color-text-primary))'
              }}
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
          </div>
          {isSignup && (
            <div>
              <label className="block text-sm mb-1" style={{ color: 'rgb(var(--color-text-secondary))' }}>Role</label>
              <select 
                className="w-full rounded px-3 py-2 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500" 
                style={{
                  background: 'rgba(var(--color-bg-secondary), 0.5)',
                  border: '1px solid rgb(var(--color-border))',
                  color: 'rgb(var(--color-text-primary))'
                }}
                value={role} 
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="worker">Worker</option>
                <option value="supervisor">Supervisor</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          )}
          <button 
            type="submit" 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
            disabled={loading}
          >
            {loading ? 'Please wait...' : isSignup ? 'Sign Up' : 'Login'}
          </button>
        </form>
        <div className="mt-4 text-sm text-center">
          <button 
            className="text-blue-600 hover:text-blue-700 transition-colors" 
            onClick={() => { setIsSignup(!isSignup); setError('') }}
          >
            {isSignup ? 'Have an account? Login' : 'Need an account? Sign up'}
          </button>
        </div>
      </div>
    </div>
  )
}

