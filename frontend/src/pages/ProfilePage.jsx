import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'
import toast from 'react-hot-toast'
import { User, Save, Loader2, Globe, MapPin, Phone, Shield } from 'lucide-react'

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

export default function ProfilePage() {
  const { t }              = useTranslation()
  const { user, updateUser } = useAuth()

  const [form, setForm] = useState({
    name:              user?.name              || '',
    phone:             user?.phone             || '',
    role:              user?.role              || 'farmer',
    state:             user?.state             || '',
    preferredLanguage: user?.preferredLanguage || 'en',
    password: '',
    confirmPassword: '',
  })
  const [loading, setLoading] = useState(false)
  const [saved,   setSaved]   = useState(false)

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }))
    setSaved(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password && form.password !== form.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    setLoading(true)
    try {
      const payload = {
        name: form.name, phone: form.phone, role: form.role,
        state: form.state, preferredLanguage: form.preferredLanguage,
        ...(form.password ? { password: form.password } : {}),
      }
      const { data } = await api.patch('/user/profile', payload)
      updateUser(data.user)
      setSaved(true)
      setForm((p) => ({ ...p, password: '', confirmPassword: '' }))
      toast.success(t('profile.saved'))
    } catch (err) {
      toast.error(err.response?.data?.error || t('common.error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-600 to-earth-500 flex items-center justify-center text-white font-bold text-2xl shadow-lg">
          {user?.name?.[0]?.toUpperCase()}
        </div>
        <div>
          <h1 className="font-display font-bold text-2xl text-white">{user?.name}</h1>
          <p className="text-gray-400 text-sm capitalize">{user?.role} · {user?.email}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Personal Info */}
        <div className="glass p-6 space-y-4">
          <h2 className="font-semibold text-white flex items-center gap-2 text-sm uppercase tracking-wider text-gray-400">
            <User className="w-4 h-4" /> Personal Information
          </h2>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="input-label">Full Name</label>
              <input type="text" name="name" value={form.name} onChange={handleChange}
                required className="input" placeholder="Your full name" />
            </div>
            <div>
              <label className="input-label flex items-center gap-1">
                <Phone className="w-3 h-3" /> {t('auth.phone')}
              </label>
              <input type="tel" name="phone" value={form.phone} onChange={handleChange}
                className="input" placeholder="+91 98765 43210" />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="input-label">{t('auth.role')}</label>
              <select name="role" value={form.role} onChange={handleChange} className="input cursor-pointer">
                {ROLES.map((r) => <option key={r} value={r}>{t(`auth.${r}`)}</option>)}
              </select>
            </div>
            <div>
              <label className="input-label flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {t('auth.state')}
              </label>
              <select name="state" value={form.state} onChange={handleChange} className="input cursor-pointer">
                <option value="">Select state</option>
                {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Language */}
        <div className="glass p-6 space-y-4">
          <h2 className="font-semibold text-white flex items-center gap-2 text-sm uppercase tracking-wider text-gray-400">
            <Globe className="w-4 h-4" /> Language Preference
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {LANGUAGES.map(({ code, label }) => (
              <button
                key={code} type="button"
                onClick={() => { setForm((p) => ({ ...p, preferredLanguage: code })); setSaved(false) }}
                className={`px-4 py-2.5 rounded-xl border text-sm font-medium transition-all
                  ${form.preferredLanguage === code
                    ? 'bg-primary-950/60 border-primary-600/60 text-primary-300'
                    : 'border-white/10 text-gray-400 hover:border-primary-600/30 hover:text-gray-200'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Password */}
        <div className="glass p-6 space-y-4">
          <h2 className="font-semibold text-white flex items-center gap-2 text-sm uppercase tracking-wider text-gray-400">
            <Shield className="w-4 h-4" /> Change Password <span className="text-gray-600 font-normal normal-case">(optional)</span>
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="input-label">New Password</label>
              <input type="password" name="password" value={form.password} onChange={handleChange}
                className="input" placeholder="Min 6 characters" />
            </div>
            <div>
              <label className="input-label">Confirm Password</label>
              <input type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange}
                className="input" placeholder="Repeat new password" />
            </div>
          </div>
        </div>

        {/* Submit */}
        <button type="submit" disabled={loading || saved} className={`btn-primary w-full justify-center py-3 ${saved ? 'opacity-80' : ''}`}>
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" />{t('profile.saving')}</>
          ) : saved ? (
            <><span>✓</span> {t('profile.saved')}</>
          ) : (
            <><Save className="w-4 h-4" />{t('profile.save')}</>
          )}
        </button>

        {/* Read-only email */}
        <p className="text-center text-gray-600 text-xs">
          Email <span className="text-gray-400">{user?.email}</span> · Cannot be changed
        </p>
      </form>
    </div>
  )
}
