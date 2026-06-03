import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { Sprout, Eye, EyeOff, LogIn } from 'lucide-react'

export default function LoginPage() {
  const { t } = useTranslation()
  const { login } = useAuth()
  const navigate   = useNavigate()

  const [form, setForm]       = useState({ email: '', password: '' })
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(form.email, form.password)
      toast.success('Welcome back! 🌿')
      navigate('/dashboard')
    } catch (err) {
      const data = err.response?.data
      if (data?.requiresVerification) {
        toast('Please verify your email first 📧', { icon: '📬' })
        navigate('/verify-otp', { state: { email: data.email || form.email } })
      } else {
        toast.error(data?.error || 'Login failed')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      {/* Background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[400px] rounded-full bg-primary-600/8 blur-3xl pointer-events-none" />

      <div className="w-full max-w-md animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-xl shadow-primary-900/40">
              <Sprout className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="font-display font-bold text-xl text-white">{t('app.name')}</p>
              <p className="text-gray-500 text-sm">{t('app.tagline')}</p>
            </div>
          </Link>
        </div>

        <div className="glass p-8">
          <h1 className="font-display font-bold text-2xl text-white mb-1">{t('auth.login')}</h1>
          <p className="text-gray-400 text-sm mb-6">
            {t('auth.noAccount')}{' '}
            <Link to="/register" className="text-primary-400 hover:text-primary-300 font-medium">{t('auth.signUp')}</Link>
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="input-label">{t('auth.email')}</label>
              <input
                type="email" name="email" required
                value={form.email} onChange={handleChange}
                placeholder="you@example.com"
                className="input"
              />
            </div>

            <div>
              <label className="input-label">{t('auth.password')}</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'} name="password" required
                  value={form.password} onChange={handleChange}
                  placeholder="••••••••"
                  className="input pr-10"
                />
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3 mt-2">
              {loading ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{t('common.loading')}</>
              ) : (
                <><LogIn className="w-4 h-4" />{t('auth.loginBtn')}</>
              )}
            </button>
          </form>
        </div>

        {/* Demo hint */}
        <p className="text-center text-gray-600 text-xs mt-4">
          Don't have an account?{' '}
          <Link to="/register" className="text-primary-500 hover:text-primary-400">{t('auth.signUp')}</Link>
        </p>
      </div>
    </div>
  )
}
