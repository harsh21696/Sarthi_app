import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'
import ReactMarkdown from 'react-markdown'
import toast from 'react-hot-toast'
import { Building2, Search, Loader2, Clock, ChevronDown, ChevronUp, Sparkles } from 'lucide-react'

const QUICK_QUERIES = [
  'Crop insurance schemes for farmers',
  'Student scholarships for rural areas',
  'Women self-help group loans',
  'PM Kisan benefits and eligibility',
  'Free electricity scheme for farmers',
  'Skill development for villagers',
]

export default function SchemesPage() {
  const { t }    = useTranslation()
  const { user } = useAuth()

  const [query,    setQuery]    = useState('')
  const [result,   setResult]   = useState(null)
  const [loading,  setLoading]  = useState(false)
  const [history,  setHistory]  = useState([])
  const [loadHist, setLoadHist] = useState(false)
  const [showHist, setShowHist] = useState(false)
  const [expandId, setExpandId] = useState(null)

  const search = async (q) => {
    const text = q || query
    if (!text.trim()) return
    setQuery(text)
    setLoading(true)
    setResult(null)
    try {
      const { data } = await api.post('/schemes/recommend', { query: text, language: user?.preferredLanguage || 'en' })
      setResult(data.record)
      toast.success(`Found ${data.record.schemesFound} schemes!`)
    } catch (err) {
      toast.error(err.response?.data?.error || t('common.error'))
    } finally {
      setLoading(false)
    }
  }

  const loadHistory = async () => {
    if (showHist) { setShowHist(false); return }
    setShowHist(true)
    if (history.length) return
    setLoadHist(true)
    try {
      const { data } = await api.get('/schemes/history')
      setHistory(data.queries)
    } catch (_) {}
    finally { setLoadHist(false) }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl md:text-3xl text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            {t('schemes.title')}
          </h1>
          <p className="text-gray-400 text-sm mt-1 ml-[52px]">
            Discover Central & State schemes tailored to your profile
            <span className="ml-2 badge badge-green capitalize">{user?.role}</span>
            {user?.state && <span className="ml-1 badge badge-green">{user?.state}</span>}
          </p>
        </div>
        <button onClick={loadHistory} className="btn-secondary text-sm hidden sm:flex">
          <Clock className="w-4 h-4" /> {t('schemes.history')}
        </button>
      </div>

      {/* Search bar */}
      <div className="glass p-5 space-y-4">
        <label className="input-label text-base font-medium text-gray-300">{t('schemes.query')}</label>
        <div className="flex gap-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && search()}
            placeholder={t('schemes.placeholder')}
            className="input flex-1"
          />
          <button onClick={() => search()} disabled={!query.trim() || loading} className="btn-primary px-5 flex-shrink-0">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            <span className="hidden sm:inline">{loading ? t('schemes.finding') : t('schemes.find')}</span>
          </button>
        </div>

        {/* Quick query chips */}
        <div>
          <p className="text-xs text-gray-500 mb-2 flex items-center gap-1.5">
            <Sparkles className="w-3 h-3" /> Quick searches
          </p>
          <div className="flex flex-wrap gap-2">
            {QUICK_QUERIES.map((q) => (
              <button key={q} onClick={() => search(q)}
                className="text-xs px-3 py-1.5 glass rounded-lg text-gray-300 hover:text-primary-300 hover:border-primary-600/40 transition-all">
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="glass p-10 flex flex-col items-center gap-3 animate-pulse">
          <div className="w-12 h-12 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
          <p className="text-gray-400">{t('schemes.finding')}</p>
          <p className="text-gray-600 text-sm">Searching Central & State government databases...</p>
        </div>
      )}

      {/* Result */}
      {result && !loading && (
        <div className="glass p-6 animate-slide-up space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-semibold text-lg text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-400" />
              Results for: <span className="text-primary-300 truncate max-w-xs">{result.query}</span>
            </h2>
            <span className="badge badge-green text-xs flex-shrink-0">
              ~{result.schemesFound} {t('schemes.schemesFound')}
            </span>
          </div>
          <div className="prose prose-sm prose-invert max-w-none">
            <ReactMarkdown
              components={{
                h1: ({children}) => <h1 className="text-blue-300 font-bold text-base mt-4 mb-1 border-b border-white/10 pb-1">{children}</h1>,
                h2: ({children}) => <h2 className="text-primary-300 font-bold text-sm mt-4 mb-1">{children}</h2>,
                strong: ({children}) => <strong className="text-primary-300">{children}</strong>,
                p: ({children}) => <p className="mb-2 text-sm text-gray-300 leading-relaxed">{children}</p>,
                li: ({children}) => <li className="ml-4 list-disc text-sm text-gray-300 mb-1">{children}</li>,
                a: ({href, children}) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline hover:text-blue-300">{children}</a>,
              }}>
              {result.response}
            </ReactMarkdown>
          </div>
        </div>
      )}

      {/* History */}
      {showHist && (
        <div className="glass p-5 animate-slide-up">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-400" /> {t('schemes.history')}
          </h3>
          {loadHist ? (
            <div className="flex items-center gap-2 text-gray-400 text-sm"><Loader2 className="w-4 h-4 animate-spin" /> {t('common.loading')}</div>
          ) : history.length === 0 ? (
            <p className="text-gray-500 text-sm">{t('schemes.noHistory')}</p>
          ) : (
            <div className="space-y-2">
              {history.map((h) => (
                <div key={h.id} className="rounded-xl overflow-hidden border border-white/5">
                  <button
                    onClick={() => setExpandId(expandId === h.id ? null : h.id)}
                    className="w-full flex items-center justify-between p-3 hover:bg-dark-700/50 transition-colors text-left">
                    <div>
                      <p className="text-sm text-gray-200">{h.query}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {h.schemesFound} schemes · {new Date(h.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    {expandId === h.id ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                  </button>
                  {expandId === h.id && (
                    <div className="px-4 pb-4 text-sm text-gray-400 border-t border-white/5 pt-3">
                      <ReactMarkdown>{h.response.slice(0, 600)}...</ReactMarkdown>
                      <button onClick={() => search(h.query)} className="text-primary-400 text-xs hover:underline mt-2">
                        Search again
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
