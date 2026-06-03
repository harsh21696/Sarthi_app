import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import api from '../utils/api'
import ReactMarkdown from 'react-markdown'
import toast from 'react-hot-toast'
import { Upload, Leaf, Loader2, Clock, X, ImagePlus, AlertCircle, CheckCircle } from 'lucide-react'

export default function CropPage() {
  const { t } = useTranslation()
  const [file,      setFile]      = useState(null)
  const [preview,   setPreview]   = useState(null)
  const [cropName,  setCropName]  = useState('')
  const [result,    setResult]    = useState(null)
  const [loading,   setLoading]   = useState(false)
  const [history,   setHistory]   = useState([])
  const [loadHist,  setLoadHist]  = useState(false)
  const [showHist,  setShowHist]  = useState(false)
  const [dragging,  setDragging]  = useState(false)

  const handleFile = (f) => {
    if (!f) return
    if (!['image/jpeg','image/jpg','image/png','image/webp'].includes(f.type)) {
      toast.error('Only JPEG, PNG, WebP images allowed')
      return
    }
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setResult(null)
  }

  const onDrop = useCallback((e) => {
    e.preventDefault(); setDragging(false)
    const f = e.dataTransfer.files[0]
    handleFile(f)
  }, [])

  const analyze = async () => {
    if (!file) return
    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('image', file)
      if (cropName) fd.append('cropName', cropName)
      const { data } = await api.post('/crop/analyze', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setResult(data.analysis)
      toast.success('Analysis complete!')
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
      const { data } = await api.get('/crop/history')
      setHistory(data.analyses)
    } catch (_) {} finally { setLoadHist(false) }
  }

  const clear = () => { setFile(null); setPreview(null); setResult(null); setCropName('') }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl md:text-3xl text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-earth-600 to-earth-800 flex items-center justify-center">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            {t('crop.title')}
          </h1>
          <p className="text-gray-400 text-sm mt-1 ml-[52px]">AI-powered plant disease diagnosis for farmers</p>
        </div>
        <button onClick={loadHistory} className="btn-secondary text-sm flex items-center gap-2">
          <Clock className="w-4 h-4" />
          {t('crop.history')}
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Upload panel */}
        <div className="space-y-4">
          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className={`relative rounded-2xl border-2 border-dashed transition-all duration-300 overflow-hidden
              ${dragging ? 'border-primary-400 bg-primary-950/20' : 'border-white/10 hover:border-primary-600/40'}
              ${preview ? 'aspect-video' : 'aspect-square'}`}
          >
            {preview ? (
              <>
                <img src={preview} alt="crop" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button onClick={clear} className="btn-secondary text-sm">
                    <X className="w-4 h-4" /> Remove
                  </button>
                </div>
              </>
            ) : (
              <label className="flex flex-col items-center justify-center h-full cursor-pointer gap-4 p-6">
                <div className="w-16 h-16 rounded-2xl bg-dark-700 border border-white/10 flex items-center justify-center">
                  <ImagePlus className="w-7 h-7 text-gray-400" />
                </div>
                <div className="text-center">
                  <p className="text-gray-300 font-medium text-sm">{t('crop.dragDrop')}</p>
                  <p className="text-gray-500 text-xs mt-1">JPG, PNG, WebP · Max 5MB</p>
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />
              </label>
            )}
          </div>

          {/* Crop name */}
          <div>
            <label className="input-label">{t('crop.cropName')}</label>
            <input type="text" value={cropName} onChange={(e) => setCropName(e.target.value)}
              placeholder="e.g. Wheat, Rice, Tomato..." className="input" />
          </div>

          <button onClick={analyze} disabled={!file || loading}
            className="btn-primary w-full justify-center py-3">
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" />{t('crop.analyzing')}</>
            ) : (
              <><Leaf className="w-4 h-4" />{t('crop.analyze')}</>
            )}
          </button>
        </div>

        {/* Results panel */}
        <div className="glass rounded-2xl p-5 min-h-[300px] flex flex-col">
          {!result && !loading && (
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-dark-700 border border-white/5 flex items-center justify-center">
                <Leaf className="w-7 h-7 text-gray-600" />
              </div>
              <p className="text-gray-500 text-sm">Upload a crop image to get an instant AI diagnosis</p>
            </div>
          )}

          {loading && (
            <div className="flex-1 flex flex-col items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-full border-2 border-earth-500 border-t-transparent animate-spin" />
              <p className="text-gray-400 text-sm animate-pulse">{t('crop.analyzing')}</p>
              <p className="text-gray-600 text-xs">Analyzing image with Gemini AI...</p>
            </div>
          )}

          {result && !loading && (
            <div className="space-y-4 overflow-y-auto scrollbar-hide">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-primary-400" />
                <h3 className="font-semibold text-white">{t('crop.diagnosis')}</h3>
                {result.confidence && (
                  <span className={`badge ml-auto ${result.confidence > 0.7 ? 'badge-red' : result.confidence > 0.4 ? 'badge-yellow' : 'badge-green'}`}>
                    {Math.round(result.confidence * 100)}% {t('crop.confidence')}
                  </span>
                )}
              </div>
              <div className="prose prose-sm prose-invert max-w-none text-gray-300 leading-relaxed">
                <ReactMarkdown
                  components={{
                    h1: ({children}) => <h1 className="text-primary-300 font-bold text-base mt-3 mb-1">{children}</h1>,
                    h2: ({children}) => <h2 className="text-primary-300 font-bold text-sm mt-3 mb-1">{children}</h2>,
                    strong: ({children}) => <strong className="text-primary-300">{children}</strong>,
                    p: ({children}) => <p className="mb-2 text-sm text-gray-300">{children}</p>,
                    li: ({children}) => <li className="ml-4 list-disc text-sm text-gray-300 mb-0.5">{children}</li>,
                  }}>
                  {result.diagnosis}
                </ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* History */}
      {showHist && (
        <div className="glass p-5 animate-slide-up">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-400" />{t('crop.history')}
          </h3>
          {loadHist ? (
            <div className="flex items-center gap-2 text-gray-400 text-sm"><Loader2 className="w-4 h-4 animate-spin" />{t('common.loading')}</div>
          ) : history.length === 0 ? (
            <p className="text-gray-500 text-sm">{t('crop.noHistory')}</p>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {history.map((h) => (
                <div key={h.id} className="flex gap-3 p-3 rounded-xl bg-dark-700/50">
                  <img src={h.imageUrl} alt="" className="w-14 h-14 rounded-lg object-cover bg-dark-600 flex-shrink-0" onError={(e)=>e.target.style.display='none'} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-200 truncate">{h.cropName || 'Unknown Crop'}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{new Date(h.createdAt).toLocaleDateString()}</p>
                    {h.confidence && <span className="badge badge-yellow mt-1">{Math.round(h.confidence*100)}%</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
