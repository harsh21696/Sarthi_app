import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'
import toast from 'react-hot-toast'
import {
  Cloud, Sun, CloudRain, Wind, Droplets, Thermometer,
  MapPin, Search, Loader2, AlertTriangle, RefreshCw,
  Wheat, Bell, BellOff, ChevronRight, Zap, Snowflake
} from 'lucide-react'

const WEATHER_ICONS = {
  0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️',
  45: '🌫️', 48: '🌫️',
  51: '🌦️', 53: '🌦️', 55: '🌧️',
  61: '🌧️', 63: '🌧️', 65: '🌧️',
  71: '🌨️', 73: '🌨️', 75: '❄️',
  80: '🌦️', 81: '🌧️', 82: '⛈️',
  95: '⛈️', 96: '⛈️', 99: '⛈️',
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const SEVERITY_STYLES = {
  high:   { bg: 'bg-red-950/40',    border: 'border-red-700/40',    text: 'text-red-400' },
  medium: { bg: 'bg-amber-950/40',  border: 'border-amber-700/40',  text: 'text-amber-400' },
  info:   { bg: 'bg-green-950/40',  border: 'border-green-700/40',  text: 'text-green-400' },
}

export default function WeatherPage() {
  const { user } = useAuth()
  const [weather, setWeather]     = useState(null)
  const [advice, setAdvice]       = useState('')
  const [loading, setLoading]     = useState(false)
  const [adviceLoading, setAdviceLoading] = useState(false)
  const [alertLoading, setAlertLoading]  = useState(false)
  const [city, setCity]           = useState(user?.city || '')
  const [inputCity, setInputCity] = useState(user?.city || '')
  const [crop, setCrop]           = useState(user?.primaryCrop || '')
  const [inputCrop, setInputCrop] = useState(user?.primaryCrop || '')

  useEffect(() => {
    if (user?.city) fetchWeather(user.city)
  }, [])

  const fetchWeather = async (cityName) => {
    if (!cityName?.trim()) { toast.error('Enter a city name'); return }
    setLoading(true)
    setWeather(null)
    setAdvice('')
    try {
      const { data } = await api.get(`/weather?city=${encodeURIComponent(cityName)}&crop=${encodeURIComponent(crop || '')}`)
      setWeather(data)
      setCity(cityName)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to fetch weather')
    } finally {
      setLoading(false)
    }
  }

  const getAdvice = async () => {
    setAdviceLoading(true)
    try {
      const { data } = await api.post('/weather/advice', { city, crop: crop || 'general crops' })
      setAdvice(data.advice)
    } catch {
      toast.error('Failed to get AI advice')
    } finally {
      setAdviceLoading(false)
    }
  }

  const checkAlerts = async () => {
    setAlertLoading(true)
    try {
      const { data } = await api.post('/weather/check-alerts', { city, crop })
      if (data.emailSent) {
        toast.success(`🚨 Alert email sent to ${user?.email}!`)
      } else if (data.alertCount === 0) {
        toast.success('✅ No severe weather threats detected. Your crops are safe!')
      } else {
        toast('⚠️ Alerts found but email not sent (verify your email first)', { icon: '⚠️' })
      }
    } catch {
      toast.error('Failed to check alerts')
    } finally {
      setAlertLoading(false)
    }
  }

  const saveLocation = async () => {
    try {
      await api.put('/weather/location', { city: inputCity, primaryCrop: inputCrop })
      setCrop(inputCrop)
      await fetchWeather(inputCity)
      toast.success('Location & crop saved to your profile!')
    } catch {
      toast.error('Failed to save')
    }
  }

  const current = weather?.current
  const daily   = weather?.daily
  const alerts  = weather?.alerts || []

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-white flex items-center gap-2">
            <Cloud className="w-7 h-7 text-primary-400" /> Weather & Crop Intelligence
          </h1>
          <p className="text-gray-400 text-sm mt-1">AI-powered weather analysis to protect and grow your crops</p>
        </div>
        {weather && (
          <button onClick={() => fetchWeather(city)} className="btn-secondary text-sm px-4 py-2">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="glass rounded-2xl p-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-1">
            <label className="text-xs text-gray-500 mb-1 block">Your City / District</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                value={inputCity}
                onChange={e => setInputCity(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && saveLocation()}
                placeholder="e.g. Pune, Jaipur, Lucknow"
                className="input w-full pl-9 text-sm"
              />
            </div>
          </div>
          <div className="sm:col-span-1">
            <label className="text-xs text-gray-500 mb-1 block">Primary Crop (optional)</label>
            <div className="relative">
              <Wheat className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                value={inputCrop}
                onChange={e => setInputCrop(e.target.value)}
                placeholder="e.g. Wheat, Rice, Cotton"
                className="input w-full pl-9 text-sm"
              />
            </div>
          </div>
          <div className="flex items-end">
            <button
              onClick={saveLocation}
              disabled={loading || !inputCity.trim()}
              className="btn-primary w-full justify-center py-2.5 text-sm"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              {loading ? 'Loading...' : 'Get Weather'}
            </button>
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="glass rounded-2xl p-16 flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
          <p className="text-gray-400">Fetching weather data...</p>
        </div>
      )}

      {/* Weather Data */}
      {weather && current && (
        <>
          {/* Current Weather */}
          <div className="glass rounded-2xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <MapPin className="w-4 h-4 text-primary-400" />
                  <span className="text-primary-300 text-sm font-medium">{city}</span>
                </div>
                <div className="flex items-end gap-3">
                  <span className="text-6xl">{WEATHER_ICONS[current.weathercode] || '🌡️'}</span>
                  <div>
                    <p className="text-6xl font-bold text-white leading-none">{Math.round(current.temperature_2m)}°</p>
                    <p className="text-gray-400 text-sm mt-1">Feels like {Math.round(current.apparent_temperature)}°C</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-dark-800/50 rounded-xl">
                  <Droplets className="w-5 h-5 text-blue-400 mx-auto mb-1" />
                  <p className="text-white font-semibold">{current.relative_humidity_2m}%</p>
                  <p className="text-gray-500 text-xs">Humidity</p>
                </div>
                <div className="text-center p-3 bg-dark-800/50 rounded-xl">
                  <Wind className="w-5 h-5 text-gray-400 mx-auto mb-1" />
                  <p className="text-white font-semibold">{Math.round(current.wind_speed_10m)}</p>
                  <p className="text-gray-500 text-xs">km/h Wind</p>
                </div>
                <div className="text-center p-3 bg-dark-800/50 rounded-xl">
                  <CloudRain className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                  <p className="text-white font-semibold">{current.precipitation}</p>
                  <p className="text-gray-500 text-xs">mm Rain</p>
                </div>
              </div>
            </div>
          </div>

          {/* Alerts */}
          {alerts.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-400" /> Crop Risk Alerts
                </h2>
                <button
                  onClick={checkAlerts}
                  disabled={alertLoading}
                  className="btn-secondary text-xs px-3 py-2"
                >
                  {alertLoading
                    ? <Loader2 className="w-3 h-3 animate-spin" />
                    : <Bell className="w-3 h-3" />}
                  Send Email Alert
                </button>
              </div>
              {alerts.map((alert, i) => {
                const style = SEVERITY_STYLES[alert.severity] || SEVERITY_STYLES.info
                return (
                  <div key={i} className={`rounded-2xl p-4 border ${style.bg} ${style.border}`}>
                    <div className="flex items-start gap-3">
                      <span className="text-2xl flex-shrink-0">{alert.icon}</span>
                      <div className="flex-1">
                        <p className={`font-semibold ${style.text} mb-1`}>{alert.title}</p>
                        <p className="text-gray-400 text-sm mb-2">{alert.description}</p>
                        <div className="flex items-start gap-2">
                          <Zap className="w-3.5 h-3.5 text-primary-400 flex-shrink-0 mt-0.5" />
                          <p className="text-primary-300 text-sm"><strong>Action:</strong> {alert.action}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {alerts.length === 0 && (
            <div className="glass rounded-2xl p-5 border border-green-800/30 bg-green-950/20 flex items-center gap-3">
              <span className="text-3xl">✅</span>
              <div>
                <p className="text-green-400 font-semibold">No Severe Threats Detected</p>
                <p className="text-gray-400 text-sm">Weather conditions look safe for your crops this week.</p>
              </div>
            </div>
          )}

          {/* 7-day Forecast */}
          {daily && (
            <div className="glass rounded-2xl p-5">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Sun className="w-5 h-5 text-amber-400" /> 7-Day Forecast
              </h2>
              <div className="grid grid-cols-7 gap-2">
                {daily.time.map((date, i) => {
                  const d = new Date(date)
                  return (
                    <div key={i} className="text-center p-2 bg-dark-800/50 rounded-xl">
                      <p className="text-gray-500 text-xs mb-1">{WEEKDAYS[d.getDay()]}</p>
                      <p className="text-xl mb-1">{WEATHER_ICONS[daily.weathercode[i]] || '🌡️'}</p>
                      <p className="text-white text-xs font-semibold">{Math.round(daily.temperature_2m_max[i])}°</p>
                      <p className="text-gray-500 text-xs">{Math.round(daily.temperature_2m_min[i])}°</p>
                      {daily.precipitation_sum[i] > 0 && (
                        <p className="text-blue-400 text-xs mt-1">{Math.round(daily.precipitation_sum[i])}mm</p>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* AI Crop Advice */}
          <div className="glass rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                🤖 AI Crop Advice
              </h2>
              <button
                onClick={getAdvice}
                disabled={adviceLoading}
                className="btn-primary text-sm px-4 py-2"
              >
                {adviceLoading
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing...</>
                  : <><Zap className="w-4 h-4" /> Get AI Advice</>
                }
              </button>
            </div>

            {advice ? (
              <div className="bg-dark-800/50 rounded-xl p-4 text-gray-300 text-sm whitespace-pre-wrap leading-relaxed">
                {advice}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Wheat className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p>Click "Get AI Advice" for personalized crop recommendations based on this week's weather.</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Empty state */}
      {!weather && !loading && (
        <div className="glass rounded-2xl p-16 text-center">
          <Cloud className="w-16 h-16 mx-auto mb-4 text-gray-600" />
          <h3 className="text-white font-semibold text-lg mb-2">Enter your city to get started</h3>
          <p className="text-gray-500 text-sm">Get real-time weather, crop risk alerts, and AI-powered farming advice.</p>
        </div>
      )}
    </div>
  )
}
