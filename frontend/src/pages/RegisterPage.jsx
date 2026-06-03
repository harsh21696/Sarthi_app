import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'
import toast from 'react-hot-toast'
import { Sprout, Eye, EyeOff, UserPlus } from 'lucide-react'

const ROLES    = ['farmer', 'student', 'villager']
const LANGUAGES = [
  { code: 'en', label: 'English' }, { code: 'hi', label: 'हिंदी' },
  { code: 'ta', label: 'தமிழ்'  }, { code: 'te', label: 'తెలుగు' },
  { code: 'bn', label: 'বাংলা'  }, { code: 'mr', label: 'मराठी'  },
]
const STATES = [
  'Andhra Pradesh','Assam','Bihar','Chhattisgarh','Delhi','Goa','Gujarat',
  'Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh',
  'Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab',
  'Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh',
  'Uttarakhand','West Bengal',
]

export default function RegisterPage() {
  const { t }     = useTranslation()
  const { register } = useAuth()
  const navigate  = useNavigate()

  const [form, setForm]       = useState({ name: '', email: '', password: '', phone: '', role: 'farmer', state: '', preferredLanguage: 'en' })
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await api.post('/auth/register', form)
      toast.success('Account created! Check your email for the OTP 📧')
      navigate('/verify-otp', { state: { email: form.email } })
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 py-10 relative">
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
          <h1 className="font-display font-bold text-2xl text-white mb-1">{t('auth.register')}</h1>
          <p className="text-gray-400 text-sm mb-6">
            {t('auth.haveAccount')}{' '}
            <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium">{t('auth.signIn')}</Link>
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="input-label">{t('auth.name')}</label>
              <input type="text" name="name" required value={form.name} onChange={handleChange}
                placeholder="Ramesh Kumar" className="input" />
            </div>

            {/* Email */}
            <div>
              <label className="input-label">{t('auth.email')}</label>
              <input type="email" name="email" required value={form.email} onChange={handleChange}
                placeholder="you@example.com" className="input" />
            </div>

            {/* Password */}
            <div>
              <label className="input-label">{t('auth.password')}</label>
              <div className="relative">
                <input type={showPwd ? 'text' : 'password'} name="password" required
                  value={form.password} onChange={handleChange}
                  placeholder="Min 6 characters" className="input pr-10" />
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="input-label">{t('auth.phone')} <span className="text-gray-600 text-xs">(optional)</span></label>
              <input type="tel" name="phone" value={form.phone} onChange={handleChange}
                placeholder="+91 98765 43210" className="input" />
            </div>

            {/* Role + State in 2 columns */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="input-label">{t('auth.role')}</label>
                <select name="role" value={form.role} onChange={handleChange} className="input cursor-pointer">
                  {ROLES.map((r) => <option key={r} value={r}>{t(`auth.${r}`)}</option>)}
                </select>
              </div>
              <div>
                <label className="input-label">{t('auth.state')}</label>
                <select name="state" value={form.state} onChange={handleChange} className="input cursor-pointer">
                  <option value="">Select state</option>
                  {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            {/* Language */}
            <div>
              <label className="input-label">{t('auth.language')}</label>
              <select name="preferredLanguage" value={form.preferredLanguage} onChange={handleChange} className="input cursor-pointer">
                {LANGUAGES.map(({ code, label }) => <option key={code} value={code}>{label}</option>)}
              </select>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3 mt-2">
              {loading ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{t('common.loading')}</>
              ) : (
                <><UserPlus className="w-4 h-4" />{t('auth.registerBtn')}</>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
