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
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md border rounded-lg p-6 shadow">
        <h1 className="text-2xl font-bold mb-4">{isSignup ? 'Sign Up' : 'Login'}</h1>
        {error && <div className="mb-3 text-red-600 text-sm">{error}</div>}
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="block text-sm mb-1">Email</label>
            <input className="w-full border rounded px-3 py-2"
              value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm mb-1">Password</label>
            <input className="w-full border rounded px-3 py-2" type="password"
              value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          {isSignup && (
            <div>
              <label className="block text-sm mb-1">Role</label>
              <select className="w-full border rounded px-3 py-2" value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="worker">Worker</option>
                <option value="supervisor">Supervisor</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          )}
          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded" disabled={loading}>
            {loading ? 'Please wait...' : isSignup ? 'Sign Up' : 'Login'}
          </button>
        </form>
        <div className="mt-4 text-sm">
          <button className="text-blue-600" onClick={() => { setIsSignup(!isSignup); setError('') }}>
            {isSignup ? 'Have an account? Login' : 'Need an account? Sign up'}
          </button>
        </div>
      </div>
    </div>
  )
}

