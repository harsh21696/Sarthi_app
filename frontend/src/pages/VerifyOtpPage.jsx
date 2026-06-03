import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api from '../utils/api'
import toast from 'react-hot-toast'
import { ShieldCheck, RefreshCw, Mail, ArrowRight, Loader2 } from 'lucide-react'

export default function VerifyOtpPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const email = location.state?.email || ''

  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [countdown, setCountdown] = useState(60)
  const [canResend, setCanResend] = useState(false)
  const inputs = useRef([])

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) { setCanResend(true); return }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  const handleChange = (idx, val) => {
    if (!/^\d?$/.test(val)) return
    const next = [...otp]
    next[idx] = val
    setOtp(next)
    if (val && idx < 5) inputs.current[idx + 1]?.focus()
    if (next.every(d => d) && next.join('').length === 6) handleVerify(next.join(''))
  }

  const handleKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      inputs.current[idx - 1]?.focus()
    }
  }

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length === 6) {
      setOtp(pasted.split(''))
      handleVerify(pasted)
    }
  }

  const handleVerify = async (code) => {
    if (loading) return
    const otpCode = code || otp.join('')
    if (otpCode.length !== 6) { toast.error('Please enter all 6 digits'); return }
    setLoading(true)
    try {
      const { data } = await api.post('/auth/verify-otp', { email, otp: otpCode })
      // Save tokens
      localStorage.setItem('accessToken', data.accessToken)
      localStorage.setItem('refreshToken', data.refreshToken)
      toast.success('✅ Email verified! Welcome to GramSaathi AI 🌿')
      navigate('/dashboard', { replace: true })
      window.location.reload()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid OTP. Please try again.')
      setOtp(['', '', '', '', '', ''])
      inputs.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (!canResend || resending) return
    setResending(true)
    try {
      await api.post('/auth/resend-otp', { email })
      toast.success('New OTP sent to your email!')
      setCountdown(60)
      setCanResend(false)
      setOtp(['', '', '', '', '', ''])
      inputs.current[0]?.focus()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to resend OTP')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md animate-fade-in">
        {/* Card */}
        <div className="glass rounded-3xl p-8 text-center">
          {/* Icon */}
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center shadow-2xl shadow-primary-900/50">
            <ShieldCheck className="w-10 h-10 text-white" />
          </div>

          <h1 className="text-2xl font-display font-bold text-white mb-2">Verify Your Email</h1>
          <p className="text-gray-400 text-sm mb-2">We sent a 6-digit OTP to</p>
          <div className="flex items-center justify-center gap-2 mb-8">
            <Mail className="w-4 h-4 text-primary-400" />
            <span className="text-primary-300 font-medium text-sm">{email || 'your email'}</span>
          </div>

          {/* OTP Input Boxes */}
          <div className="flex gap-3 justify-center mb-8" onPaste={handlePaste}>
            {otp.map((digit, idx) => (
              <input
                key={idx}
                ref={el => inputs.current[idx] = el}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={e => handleChange(idx, e.target.value)}
                onKeyDown={e => handleKeyDown(idx, e)}
                className={`w-12 h-14 text-center text-xl font-bold rounded-xl border-2 bg-dark-800 text-white
                  transition-all outline-none
                  ${digit ? 'border-primary-500 bg-primary-950/30' : 'border-dark-600 focus:border-primary-500'}
                `}
                autoFocus={idx === 0}
              />
            ))}
          </div>

          {/* Verify Button */}
          <button
            onClick={() => handleVerify('')}
            disabled={loading || otp.join('').length !== 6}
            className="btn-primary w-full justify-center py-3.5 text-base mb-4 disabled:opacity-50"
          >
            {loading
              ? <><Loader2 className="w-5 h-5 animate-spin" /> Verifying...</>
              : <><ShieldCheck className="w-5 h-5" /> Verify Email <ArrowRight className="w-4 h-4" /></>
            }
          </button>

          {/* Resend */}
          <div className="text-sm text-gray-500">
            Didn't receive it?{' '}
            {canResend ? (
              <button
                onClick={handleResend}
                disabled={resending}
                className="text-primary-400 hover:text-primary-300 font-medium transition-colors inline-flex items-center gap-1"
              >
                {resending ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                Resend OTP
              </button>
            ) : (
              <span className="text-gray-600">Resend in {countdown}s</span>
            )}
          </div>
        </div>

        {/* Bottom note */}
        <p className="text-center text-gray-600 text-xs mt-6">
          Check your spam folder if you don't see the email. OTP expires in 15 minutes.
        </p>
      </div>
    </div>
  )
}
