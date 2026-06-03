import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'
import {
  MessageSquare, Leaf, Building2, ArrowRight,
  TrendingUp, Clock, Sprout, Mic, Cloud, Droplets, Wind, Thermometer
} from 'lucide-react'

const StatCard = ({ icon: Icon, label, value, color, to }) => (
  <Link to={to} className="stat-card group hover:scale-[1.02] transition-all duration-300">
    <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
    <div>
      <p className="text-2xl font-display font-bold text-white">{value}</p>
      <p className="text-gray-400 text-sm">{label}</p>
    </div>
  </Link>
)

const QuickAction = ({ icon: Icon, label, desc, to, color }) => (
  <Link to={to} className="glass p-5 flex items-start gap-4 hover:border-primary-600/30 hover:scale-[1.02] transition-all duration-300 group">
    <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
      <Icon className="w-5 h-5 text-white" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="font-semibold text-white text-sm">{label}</p>
      <p className="text-gray-400 text-xs mt-0.5">{desc}</p>
    </div>
    <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-primary-400 group-hover:translate-x-1 transition-all flex-shrink-0 mt-0.5" />
  </Link>
)

export default function DashboardPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [data, setData]         = useState(null)
  const [loading, setLoading]   = useState(true)
  const [weather, setWeather]   = useState(null)

  useEffect(() => {
    api.get('/user/dashboard')
      .then(({ data }) => setData(data))
      .catch(console.error)
      .finally(() => setLoading(false))

    // Fetch weather if user has city saved
    if (user?.city) {
      api.get(`/weather?city=${encodeURIComponent(user.city)}`)
        .then(({ data }) => setWeather(data))
        .catch(() => {}) // silently fail — weather is optional
    }
  }, [])

  const stats  = data?.stats  || {}
  const recent = data?.recentActivity || {}

  const formatTime = (iso) => {
    const d = new Date(iso)
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
      {/* ── Header ───────────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl md:text-3xl text-white">
            {t('dashboard.welcome')},{' '}
            <span className="text-gradient">{user?.name?.split(' ')[0]}</span> 👋
          </h1>
          <p className="text-gray-400 mt-1 text-sm capitalize">
            {user?.role} · {user?.state || 'India'} · {user?.preferredLanguage?.toUpperCase()}
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-4 py-2 glass rounded-xl">
          <div className="w-2 h-2 rounded-full bg-primary-500 animate-pulse-slow" />
          <span className="text-primary-400 text-sm font-medium">AI Online</span>
        </div>
      </div>

      {/* ── Stats ────────────────────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="stat-card animate-pulse"><div className="w-12 h-12 rounded-xl bg-dark-600" /><div className="space-y-2"><div className="h-6 w-16 bg-dark-600 rounded" /><div className="h-4 w-24 bg-dark-600 rounded" /></div></div>)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard icon={MessageSquare} label={t('dashboard.chats')}   value={stats.chatSessions  || 0} color="bg-gradient-to-br from-primary-600 to-primary-800" to="/chat"    />
          <StatCard icon={Leaf}          label={t('dashboard.crops')}   value={stats.cropAnalyses  || 0} color="bg-gradient-to-br from-earth-600 to-earth-800"   to="/crop"    />
          <StatCard icon={Building2}     label={t('dashboard.schemes')} value={stats.schemeQueries || 0} color="bg-gradient-to-br from-blue-600 to-blue-800"     to="/schemes" />
        </div>
      )}

      {/* ── Quick Actions ─────────────────────────────────────────── */}
      <div>
        <h2 className="font-display font-semibold text-lg text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary-400" />
          {t('dashboard.quickActions')}
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <QuickAction icon={MessageSquare} label={t('dashboard.startChat')}   desc="Ask AI anything"              to="/chat"    color="bg-gradient-to-br from-primary-600 to-primary-800" />
          <QuickAction icon={Leaf}          label={t('dashboard.analyzeCrop')} desc="Upload crop image"            to="/crop"    color="bg-gradient-to-br from-earth-600 to-earth-800"   />
          <QuickAction icon={Cloud}         label={t('nav.weather')}            desc="Forecasts & crop alerts"      to="/weather" color="bg-gradient-to-br from-sky-600 to-sky-800"       />
          <QuickAction icon={Building2}     label={t('dashboard.findSchemes')} desc="PM Kisan & more"              to="/schemes" color="bg-gradient-to-br from-blue-600 to-blue-800"     />
        </div>
      </div>

      {/* ── Weather Widget ─────────────────────────────────────────── */}
      {weather && (
        <Link to="/weather" className="glass p-5 flex flex-wrap items-center gap-4 hover:border-sky-600/30 transition-all group">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-600 to-sky-800 flex items-center justify-center flex-shrink-0">
              <Cloud className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-0.5">Current Weather — {weather.location?.city}</p>
              <p className="text-white font-bold text-lg">{Math.round(weather.current?.temperature_2m)}°C</p>
            </div>
          </div>
          <div className="flex gap-5">
            <div className="text-center">
              <Droplets className="w-4 h-4 text-blue-400 mx-auto mb-1" />
              <p className="text-white text-sm font-semibold">{weather.current?.relative_humidity_2m}%</p>
              <p className="text-gray-500 text-xs">Humidity</p>
            </div>
            <div className="text-center">
              <Wind className="w-4 h-4 text-gray-400 mx-auto mb-1" />
              <p className="text-white text-sm font-semibold">{Math.round(weather.current?.wind_speed_10m)} km/h</p>
              <p className="text-gray-500 text-xs">Wind</p>
            </div>
            {weather.alerts?.length > 0 && (
              <div className="text-center">
                <span className="text-2xl">⚠️</span>
                <p className="text-amber-400 text-sm font-semibold">{weather.alerts.length}</p>
                <p className="text-gray-500 text-xs">Alerts</p>
              </div>
            )}
          </div>
          <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-sky-400 group-hover:translate-x-1 transition-all ml-auto" />
        </Link>
      )}

      {/* No city set — invite to set weather */}
      {!weather && !user?.city && (
        <Link to="/weather" className="glass p-5 flex items-center gap-4 border-dashed border-sky-900/40 hover:border-sky-600/30 transition-all group">
          <div className="w-10 h-10 rounded-xl bg-sky-950/50 flex items-center justify-center">
            <Cloud className="w-5 h-5 text-sky-400" />
          </div>
          <div className="flex-1">
            <p className="text-white font-medium text-sm">Set up Weather Alerts</p>
            <p className="text-gray-500 text-xs">Enter your city to get real-time weather & crop risk alerts</p>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-sky-400 transition-colors" />
        </Link>
      )}

      {/* ── Recent Activity ───────────────────────────────────────── */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Chats */}
        <div className="glass p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary-400" />
              {t('dashboard.recentChats')}
            </h3>
            <Link to="/chat" className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {recent.recentChats?.length ? (
            <div className="space-y-2">
              {recent.recentChats.map((s) => (
                <Link key={s.id} to={`/chat/${s.id}`}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-dark-700/50 transition-colors group">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-primary-950/60 flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="w-3.5 h-3.5 text-primary-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-gray-200 truncate group-hover:text-primary-300 transition-colors">{s.title}</p>
                      <p className="text-xs text-gray-500">{s._count?.messages || 0} messages</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-gray-600 text-xs flex-shrink-0 ml-2">
                    <Clock className="w-3 h-3" />
                    {formatTime(s.updatedAt)}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-600">
              <Sprout className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">{t('chat.noSessions')}</p>
              <Link to="/chat" className="text-primary-400 text-xs hover:underline mt-1 inline-block">{t('chat.newChat')}</Link>
            </div>
          )}
        </div>

        {/* Recent Crops */}
        <div className="glass p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <Leaf className="w-4 h-4 text-earth-400" />
              {t('dashboard.recentCrops')}
            </h3>
            <Link to="/crop" className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {recent.recentCrops?.length ? (
            <div className="space-y-2">
              {recent.recentCrops.map((c) => (
                <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-dark-700/50 transition-colors">
                  <img src={c.imageUrl} alt={c.cropName} className="w-10 h-10 rounded-lg object-cover flex-shrink-0 bg-dark-600" onError={(e) => { e.target.style.display='none' }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-200 truncate">{c.cropName || 'Crop Analysis'}</p>
                    <p className="text-xs text-gray-500">{formatTime(c.createdAt)}</p>
                  </div>
                  {c.confidence && (
                    <span className={`badge text-xs flex-shrink-0 ${c.confidence > 0.7 ? 'badge-red' : c.confidence > 0.4 ? 'badge-yellow' : 'badge-green'}`}>
                      {Math.round(c.confidence * 100)}%
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-600">
              <Leaf className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">{t('crop.noHistory')}</p>
              <Link to="/crop" className="text-primary-400 text-xs hover:underline mt-1 inline-block">{t('crop.analyze')}</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
