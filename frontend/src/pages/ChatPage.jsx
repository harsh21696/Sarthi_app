import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { useOnlineStatus } from '../hooks/useOnlineStatus'
import api from '../utils/api'
import ReactMarkdown from 'react-markdown'
import toast from 'react-hot-toast'
import {
  Send, Plus, Trash2, MessageSquare, Bot, User as UserIcon,
  Loader2, Sprout, ChevronRight, WifiOff
} from 'lucide-react'

export default function ChatPage() {
  const { t }           = useTranslation()
  const { user }        = useAuth()
  const { isOnline }    = useOnlineStatus()
  const { id: paramId } = useParams()
  const navigate        = useNavigate()

  const [sessions,    setSessions]    = useState([])
  const [activeId,    setActiveId]    = useState(paramId || null)
  const [messages,    setMessages]    = useState([])
  const [input,       setInput]       = useState('')
  const [sending,     setSending]     = useState(false)
  const [loadingSess, setLoadingSess] = useState(true)
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const bottomRef  = useRef(null)
  const inputRef   = useRef(null)
  const lang       = user?.preferredLanguage || 'en'

  // ── Load sessions ─────────────────────────────────────────────
  const fetchSessions = useCallback(async () => {
    try {
      const { data } = await api.get('/chat/sessions')
      setSessions(data.sessions)
    } catch (_) {}
    finally { setLoadingSess(false) }
  }, [])

  useEffect(() => { fetchSessions() }, [fetchSessions])

  // ── Load messages when session changes ────────────────────────
  useEffect(() => {
    if (!activeId) { setMessages([]); return }
    setLoadingMsgs(true)
    api.get(`/chat/sessions/${activeId}`)
      .then(({ data }) => setMessages(data.session.messages))
      .catch(() => setMessages([]))
      .finally(() => setLoadingMsgs(false))
  }, [activeId])

  // ── Auto-scroll ───────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, sending])

  // ── Send message ──────────────────────────────────────────────
  const sendMessage = async (e) => {
    e.preventDefault()
    if (!input.trim() || sending) return

    // Block if offline
    if (!isOnline) {
      toast.error('You\'re offline. Please reconnect to chat with AI.')
      return
    }

    const text = input.trim()
    setInput('')
    setSending(true)

    // Optimistic user message
    const tempMsg = { id: 'temp', role: 'user', content: text, createdAt: new Date().toISOString() }
    setMessages((p) => [...p, tempMsg])

    try {
      const { data } = await api.post('/chat/send', { message: text, sessionId: activeId, language: lang })
      if (!activeId) {
        setActiveId(data.sessionId)
        navigate(`/chat/${data.sessionId}`, { replace: true })
        fetchSessions()
      }
      setMessages((p) => [...p.filter(m => m.id !== 'temp'), { id: `u-${Date.now()}`, role: 'user', content: text }, data.message])
    } catch (err) {
      setMessages((p) => p.filter(m => m.id !== 'temp'))
      const isOfflineErr = err.response?.data?.offline || !navigator.onLine
      toast.error(isOfflineErr ? 'No internet connection. Please reconnect.' : (err.response?.data?.error || t('common.error')))
    } finally {
      setSending(false)
      inputRef.current?.focus()
    }
  }

  // ── Delete session ────────────────────────────────────────────
  const deleteSession = async (id, e) => {
    e.stopPropagation()
    try {
      await api.delete(`/chat/sessions/${id}`)
      setSessions((p) => p.filter(s => s.id !== id))
      if (activeId === id) { setActiveId(null); setMessages([]); navigate('/chat', { replace: true }) }
      toast.success('Chat deleted')
    } catch (_) { toast.error('Failed to delete') }
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] md:h-[calc(100vh-3rem)] gap-4">
      {/* ── Session Sidebar ──────────────────────────────── */}
      <div className={`
        ${sidebarOpen ? 'flex' : 'hidden'} md:flex
        flex-col w-64 glass rounded-2xl p-3 flex-shrink-0 overflow-hidden
      `}>
        <button onClick={() => { setActiveId(null); setMessages([]); navigate('/chat'); setSidebarOpen(false) }}
          className="btn-primary w-full justify-center mb-3 py-2.5">
          <Plus className="w-4 h-4" /> {t('chat.newChat')}
        </button>

        <p className="text-xs text-gray-500 font-medium px-2 mb-2">{t('chat.history')}</p>

        <div className="flex-1 overflow-y-auto space-y-1 scrollbar-hide">
          {loadingSess ? (
            Array.from({length: 4}).map((_, i) => (
              <div key={i} className="h-12 bg-dark-700/50 rounded-xl animate-pulse" />
            ))
          ) : sessions.length === 0 ? (
            <p className="text-center text-gray-600 text-xs py-8">{t('chat.noSessions')}</p>
          ) : (
            sessions.map((s) => (
              <div key={s.id}
                onClick={() => { setActiveId(s.id); navigate(`/chat/${s.id}`); setSidebarOpen(false) }}
                className={`group flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-all ${activeId === s.id ? 'bg-primary-950/60 border border-primary-800/40' : 'hover:bg-dark-700/50'}`}>
                <MessageSquare className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className={`text-xs truncate ${activeId === s.id ? 'text-primary-300' : 'text-gray-300'}`}>{s.title}</p>
                  <p className="text-gray-600 text-xs">{s._count?.messages} msgs</p>
                </div>
                <button onClick={(e) => deleteSession(s.id, e)}
                  className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-all flex-shrink-0">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Chat Area ────────────────────────────────────── */}
      <div className="flex-1 glass rounded-2xl flex flex-col overflow-hidden min-w-0">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/5">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="md:hidden text-gray-400 hover:text-white">
            <ChevronRight className={`w-4 h-4 transition-transform ${sidebarOpen ? 'rotate-180' : ''}`} />
          </button>
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-semibold text-white text-sm">{t('app.name')}</p>
            <p className="text-xs text-primary-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-500 inline-block animate-pulse-slow" />
              Online · {lang.toUpperCase()}
            </p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-hide">
          {loadingMsgs ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-6 h-6 text-primary-500 animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center py-10">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center shadow-xl">
                <Sprout className="w-8 h-8 text-white" />
              </div>
              <div>
                <p className="font-display font-bold text-xl text-white mb-1">Hello, {user?.name?.split(' ')[0]}!</p>
                <p className="text-gray-400 text-sm max-w-sm">I'm GramSaathi AI. Ask me about farming, schemes, or anything else!</p>
              </div>
              {['How to increase wheat yield?', 'PM Kisan benefits', 'Organic farming tips'].map((suggestion) => (
                <button key={suggestion} onClick={() => setInput(suggestion)}
                  className="text-sm px-4 py-2 glass rounded-xl text-primary-400 hover:border-primary-600/40 transition-all">
                  {suggestion}
                </button>
              ))}
            </div>
          ) : (
            messages.map((msg, i) => (
              <div key={msg.id || i} className={`flex gap-3 animate-slide-up ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center flex-shrink-0 mt-1">
                    <Bot className="w-3.5 h-3.5 text-white" />
                  </div>
                )}
                <div className={msg.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'}>
                  {msg.role === 'assistant' ? (
                    <ReactMarkdown
                      components={{
                        p: ({children}) => <p className="mb-2 last:mb-0">{children}</p>,
                        strong: ({children}) => <strong className="text-primary-300">{children}</strong>,
                        li: ({children}) => <li className="ml-4 list-disc">{children}</li>,
                      }}>
                      {msg.content}
                    </ReactMarkdown>
                  ) : msg.content}
                </div>
                {msg.role === 'user' && (
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary-600 to-earth-600 flex items-center justify-center flex-shrink-0 mt-1">
                    <UserIcon className="w-3.5 h-3.5 text-white" />
                  </div>
                )}
              </div>
            ))
          )}
          {sending && (
            <div className="flex gap-3 animate-fade-in">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center flex-shrink-0 mt-1">
                <Bot className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="chat-bubble-ai flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-primary-400" />
                <span className="text-gray-400">{t('chat.thinking')}</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <form onSubmit={sendMessage} className="px-4 pb-4 pt-2 border-t border-white/5">
          {/* Offline indicator */}
          {!isOnline && (
            <div className="flex items-center gap-2 mb-2 px-3 py-2 rounded-xl bg-red-950/50 border border-red-800/30">
              <WifiOff className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
              <p className="text-red-300 text-xs">Offline — reconnect to send messages</p>
            </div>
          )}
          <div className="flex gap-2 items-end">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(e) } }}
              placeholder={isOnline ? t('chat.placeholder') : 'No internet connection...'}
              rows={1}
              disabled={!isOnline}
              className="input flex-1 resize-none max-h-32 overflow-y-auto disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ minHeight: '44px' }}
            />
            <button type="submit" disabled={!input.trim() || sending || !isOnline}
              className="btn-primary px-4 py-3 flex-shrink-0 disabled:opacity-50">
              {sending
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : !isOnline
                  ? <WifiOff className="w-4 h-4" />
                  : <Send className="w-4 h-4" />
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
