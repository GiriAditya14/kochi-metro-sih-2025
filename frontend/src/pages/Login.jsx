import { useState, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const { verifyOTP } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState('phone') // 'phone' or 'otp'
  const [phoneNumber, setPhoneNumber] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const otpRefs = useRef([])

  const formatPhoneNumber = (text) => {
    return text.replace(/\D/g, '').slice(0, 10)
  }

  const handleSendOTP = async (e) => {
    e.preventDefault()
    if (phoneNumber.length !== 10) {
      setError('Please enter a valid 10-digit phone number')
      return
    }

    setLoading(true)
    setError('')
    
    // DEV MODE: Simulate OTP sent
    await new Promise(resolve => setTimeout(resolve, 1000))
    setStep('otp')
    setLoading(false)
  }

  const handleOtpChange = (value, index) => {
    const newOtp = [...otp]
    newOtp[index] = value.slice(-1)
    setOtp(newOtp)

    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus()
    }
  }

  const handleOtpKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }
  }

  const handleVerifyOTP = async (e) => {
    e.preventDefault()
    const otpCode = otp.join('')
    if (otpCode.length !== 6) {
      setError('Please enter the 6-digit OTP')
      return
    }

    setLoading(true)
    setError('')

    try {
      const user = await verifyOTP(phoneNumber, otpCode)
      navigate('/')
    } catch (err) {
      setError(err?.response?.data?.detail || err.message || 'Verification failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 rounded-2xl mb-4">
            <span className="text-4xl">🚇</span>
          </div>
          <h1 className="text-3xl font-bold text-white">KMRL</h1>
          <p className="text-slate-400 text-sm tracking-widest uppercase">Induction Planner</p>
        </div>

        {/* Login Form */}
        <div className="bg-slate-800 rounded-2xl p-6 shadow-xl">
          <h2 className="text-xl font-semibold text-white mb-2">
            {step === 'phone' ? 'Login with Phone' : 'Enter OTP'}
          </h2>
          <p className="text-slate-400 text-sm mb-6">
            {step === 'phone'
              ? 'Enter your phone number to receive OTP'
              : `OTP sent to +91 ${phoneNumber}`}
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {step === 'phone' ? (
            <form onSubmit={handleSendOTP}>
              <div className="flex mb-6">
                <div className="bg-slate-700 px-4 flex items-center rounded-l-lg border-r border-slate-600">
                  <span className="text-white font-medium">+91</span>
                </div>
                <input
                  type="tel"
                  className="flex-1 bg-slate-700 text-white px-4 py-3 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter phone number"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(formatPhoneNumber(e.target.value))}
                  maxLength={10}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Send OTP'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOTP}>
              <div className="flex gap-2 mb-6 justify-center">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (otpRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    className="w-12 h-14 bg-slate-700 text-white text-center text-2xl font-bold rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={digit}
                    onChange={(e) => handleOtpChange(e.target.value, index)}
                    onKeyDown={(e) => handleOtpKeyDown(e, index)}
                    maxLength={1}
                  />
                ))}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50"
              >
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep('phone')
                  setOtp(['', '', '', '', '', ''])
                  setError('')
                }}
                className="w-full mt-3 text-blue-400 hover:text-blue-300 text-sm"
              >
                Change phone number
              </button>
            </form>
          )}

          {/* Dev mode indicator */}
          <div className="mt-6 p-3 bg-amber-500/20 border border-amber-500/30 rounded-lg">
            <p className="text-amber-400 text-xs text-center">
              🔧 Dev Mode - Any 6-digit OTP works
            </p>
            <p className="text-slate-400 text-xs text-center mt-1">
              Try: 9165926808 (Admin) or 9977433610 (User)
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
