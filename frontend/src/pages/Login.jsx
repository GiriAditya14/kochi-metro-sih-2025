import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Train, Lock, User } from 'lucide-react'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()

  const handleLogin = (e) => {
    e.preventDefault()
    // Store login state
    localStorage.setItem('isLoggedIn', 'true')
    // Navigate to animation transition
    navigate('/transition')
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/Metro%20Paris%20Pigalle.jpeg')" }}
      />
      
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/50" />
      
      <div className="max-w-md w-full p-8 relative z-10 rounded-2xl backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 mb-4 shadow-lg">
            <Train className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-display font-bold text-white drop-shadow-lg">
            Metro Operations
          </h1>
          <p className="text-white/90 mt-2 drop-shadow">
            Sign in to access your dashboard
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/90 mb-2">
              Username
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-white/30 rounded-lg bg-white/20 backdrop-blur-sm text-white placeholder-white/50 focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none"
                placeholder="Enter your username"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/90 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-white/30 rounded-lg bg-white/20 backdrop-blur-sm text-white placeholder-white/50 focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none"
                placeholder="Enter your password"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full btn btn-primary py-3 text-lg font-medium bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg shadow-lg transition-all"
          >
            Sign In
          </button>
        </form>

        <p className="text-center text-sm text-white/70 mt-6">
          Kochi Metro Rail Operations System
        </p>
      </div>
    </div>
  )
}
