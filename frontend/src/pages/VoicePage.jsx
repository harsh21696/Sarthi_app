import { useState, useEffect, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'
import toast from 'react-hot-toast'
import { Mic, MicOff, Volume2, Bot, Loader2, Waves } from 'lucide-react'

// ── Waveform bars ─────────────────────────────────────────────────────────────
const WaveForm = ({ active }) => (
  <div className="flex items-end gap-1 h-10">
    {Array.from({ length: 7 }).map((_, i) => (
      <div
        key={i}
        className={`w-1.5 rounded-full transition-all ${active ? 'bg-primary-400 animate-wave' : 'bg-gray-700'}`}
        style={{
          height: active ? `${20 + Math.random() * 20}px` : '8px',
          animationDelay: `${i * 0.1}s`,
        }}
      />
    ))}
  </div>
)

export default function VoicePage() {
  const { t }    = useTranslation()
  const { user } = useAuth()

  const [state,      setState]      = useState('idle')   // idle | listening | processing | speaking
  const [transcript, setTranscript] = useState('')
  const [response,   setResponse]   = useState('')
  const [history,    setHistory]    = useState([])
  const [supported,  setSupported]  = useState(true)

  const recognitionRef = useRef(null)
  const synthRef       = useRef(window.speechSynthesis)

  // Check browser support
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) { setSupported(false) }
  }, [])

  const speak = useCallback((text) => {
    synthRef.current?.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = user?.preferredLanguage === 'hi' ? 'hi-IN'
                   : user?.preferredLanguage === 'ta' ? 'ta-IN'
                   : user?.preferredLanguage === 'te' ? 'te-IN'
                   : user?.preferredLanguage === 'bn' ? 'bn-IN'
                   : user?.preferredLanguage === 'mr' ? 'mr-IN'
                   : 'en-IN'
    utterance.rate   = 0.9
    utterance.pitch  = 1
    utterance.onstart = () => setState('speaking')
    utterance.onend   = () => setState('idle')
    utterance.onerror = () => setState('idle')
    synthRef.current.speak(utterance)
  }, [user?.preferredLanguage])

  const sendToAI = useCallback(async (text) => {
    setState('processing')
    try {
      const { data } = await api.post('/chat/send', {
        message: text,
        language: user?.preferredLanguage || 'en',
      })
      const aiText = data.message.content
      // Strip markdown for speech
      const plainText = aiText.replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*(.+?)\*/g, '$1').replace(/#+\s/g, '').replace(/\n+/g, ' ')
      setResponse(aiText)
      setHistory((p) => [...p, { user: text, ai: aiText }])
      speak(plainText)
    } catch (err) {
      toast.error('AI response failed')
      setState('idle')
    }
  }, [user?.preferredLanguage, speak])

  const startListening = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) return

    const recognition = new SpeechRecognition()
    recognitionRef.current = recognition

    recognition.lang = user?.preferredLanguage === 'hi' ? 'hi-IN'
                     : user?.preferredLanguage === 'ta' ? 'ta-IN'
                     : user?.preferredLanguage === 'te' ? 'te-IN'
                     : user?.preferredLanguage === 'bn' ? 'bn-IN'
                     : user?.preferredLanguage === 'mr' ? 'mr-IN'
                     : 'en-IN'
    recognition.continuous      = false
    recognition.interimResults  = true

    recognition.onstart  = () => setState('listening')
    recognition.onresult = (e) => {
      const text = Array.from(e.results).map(r => r[0].transcript).join('')
      setTranscript(text)
    }
    recognition.onend = () => {
      if (transcript.trim()) sendToAI(transcript.trim())
      else setState('idle')
    }
    recognition.onerror = () => { setState('idle'); toast.error('Microphone error. Please check permissions.') }

    recognition.start()
  }, [user?.preferredLanguage, transcript, sendToAI])

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop()
    synthRef.current?.cancel()
    setState('idle')
  }, [])

  const handleMicClick = () => {
    if (state === 'idle')      startListening()
    else if (state !== 'processing') stopListening()
  }

  const stateConfig = {
    idle:        { label: t('voice.start'),      color: 'from-primary-600 to-primary-800', pulse: false },
    listening:   { label: t('voice.listening'),  color: 'from-red-600 to-red-800',         pulse: true  },
    processing:  { label: t('voice.processing'), color: 'from-earth-600 to-earth-800',     pulse: true  },
    speaking:    { label: t('voice.speak'),      color: 'from-blue-600 to-blue-800',       pulse: true  },
  }
  const cfg = stateConfig[state]

  if (!supported) {
    return (
      <div className="max-w-md mx-auto text-center py-20">
        <MicOff className="w-16 h-16 text-gray-600 mx-auto mb-4" />
        <h2 className="font-display font-bold text-xl text-white mb-2">Not Supported</h2>
        <p className="text-gray-400 text-sm">Your browser doesn't support the Web Speech API. Please use Chrome or Edge.</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="text-center">
        <h1 className="font-display font-bold text-2xl md:text-3xl text-white mb-2">{t('voice.title')}</h1>
        <p className="text-gray-400 text-sm">Speak in your language · AI responds in your language</p>
        <div className="flex items-center justify-center gap-2 mt-2">
          {['हिंदी','Tamil','తెలుగు','বাংলা','मराठी','English'].map(l => (
            <span key={l} className="text-xs px-2 py-0.5 bg-dark-700 rounded-md text-gray-400">{l}</span>
          ))}
        </div>
      </div>

      {/* Main orb */}
      <div className="glass rounded-3xl p-10 flex flex-col items-center gap-8">
        {/* Mic button */}
        <div className="relative">
          {cfg.pulse && (
            <>
              <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${cfg.color} opacity-20 scale-150 animate-ping`} />
              <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${cfg.color} opacity-10 scale-[1.8]`} />
            </>
          )}
          <button
            onClick={handleMicClick}
            disabled={state === 'processing'}
            className={`relative w-28 h-28 rounded-full bg-gradient-to-br ${cfg.color} flex items-center justify-center shadow-2xl
              hover:scale-105 active:scale-95 transition-transform duration-200 disabled:opacity-70`}
          >
            {state === 'processing' ? (
              <Loader2 className="w-12 h-12 text-white animate-spin" />
            ) : state === 'speaking' ? (
              <Volume2 className="w-12 h-12 text-white" />
            ) : state === 'listening' ? (
              <MicOff className="w-12 h-12 text-white" />
            ) : (
              <Mic className="w-12 h-12 text-white" />
            )}
          </button>
        </div>

        {/* Waveform */}
        <WaveForm active={state === 'listening' || state === 'speaking'} />

        {/* Status */}
        <p className={`text-sm font-medium ${state === 'idle' ? 'text-gray-400' : 'text-primary-300'}`}>
          {cfg.label}
        </p>

        {/* Transcript */}
        {transcript && (
          <div className="w-full glass p-4 rounded-xl text-center">
            <p className="text-xs text-gray-500 mb-1">You said:</p>
            <p className="text-gray-200 text-sm italic">"{transcript}"</p>
          </div>
        )}
      </div>

      {/* Response */}
      {response && (
        <div className="glass p-5 animate-slide-up">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center">
              <Bot className="w-3.5 h-3.5 text-white" />
            </div>
            <p className="text-sm font-medium text-primary-300">GramSaathi AI</p>
            <button onClick={() => speak(response.replace(/\*\*/g,'').replace(/#+\s/g,'').replace(/\n+/g,' '))}
              className="ml-auto btn-ghost text-xs py-1">
              <Volume2 className="w-3.5 h-3.5" /> Replay
            </button>
          </div>
          <p className="text-gray-300 text-sm leading-relaxed">{response}</p>
        </div>
      )}

      {/* Conversation history */}
      {history.length > 1 && (
        <div className="glass p-5 space-y-3">
          <h3 className="text-sm font-medium text-gray-400 flex items-center gap-2">
            <Waves className="w-4 h-4" /> Conversation
          </h3>
          {history.slice(0, -1).map((h, i) => (
            <div key={i} className="space-y-2">
              <div className="flex justify-end">
                <div className="chat-bubble-user text-xs">{h.user}</div>
              </div>
              <div className="flex gap-2">
                <div className="w-5 h-5 rounded-md bg-primary-900 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-3 h-3 text-primary-400" />
                </div>
                <div className="chat-bubble-ai text-xs">{h.ai.slice(0, 200)}{h.ai.length > 200 ? '...' : ''}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
