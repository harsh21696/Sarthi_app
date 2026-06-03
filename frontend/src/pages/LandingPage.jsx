import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Sprout, MessageSquare, Leaf, Building2, Mic, Globe,
  ArrowRight, CheckCircle, Star
} from 'lucide-react'

const FEATURES = [
  { icon: MessageSquare, title: 'AI Chat Assistant',       desc: 'Get instant answers to agriculture, education, and daily life questions in your language.',     color: 'from-primary-600 to-primary-400' },
  { icon: Leaf,          title: 'Crop Disease Detection',  desc: 'Upload a photo of your crop and get instant disease diagnosis with organic treatment plans.',      color: 'from-earth-600 to-earth-400'   },
  { icon: Building2,     title: 'Government Schemes',      desc: 'Discover PM Kisan, student scholarships, and 100+ government schemes tailored for you.',          color: 'from-blue-600 to-blue-400'     },
  { icon: Mic,           title: 'Voice Assistant',         desc: 'Speak in your language — Hindi, Tamil, Telugu, Bengali, Marathi — and get spoken responses.',       color: 'from-purple-600 to-purple-400' },
  { icon: Globe,         title: 'Multilingual Support',    desc: 'Available in 6 Indian languages. No language barrier between you and modern technology.',          color: 'from-pink-600 to-pink-400'     },
  { icon: Star,          title: 'Personalized Dashboard',  desc: 'Track your crop analyses, scheme discoveries, and chat history all in one place.',                color: 'from-yellow-600 to-yellow-400' },
]

const STATS = [
  { value: '6+',    label: 'Indian Languages' },
  { value: '100+',  label: 'Government Schemes' },
  { value: 'Free',  label: 'For All Villagers' },
  { value: '24/7',  label: 'AI Availability' },
]

export default function LandingPage() {
  const { t } = useTranslation()

  return (
    <div className="min-h-screen bg-dark-900 overflow-x-hidden">
      {/* ── Navbar ──────────────────────────────────────────────────── */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-white/5 bg-dark-900/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
              <Sprout className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-bold text-white">{t('app.name')}</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login"    className="btn-ghost text-sm">Sign In</Link>
            <Link to="/register" className="btn-primary text-sm">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────── */}
      <section className="pt-32 pb-24 px-4 text-center relative">
        {/* Background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full bg-primary-600/10 blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-950/60 border border-primary-800/40 text-primary-400 text-xs font-semibold mb-6">
            <Sprout className="w-3.5 h-3.5" />
            Powered by Gemini AI · Made for Bharat
          </div>

          <h1 className="font-display font-extrabold text-5xl md:text-7xl text-white mb-6 leading-tight">
            AI for Every{' '}
            <span className="text-gradient">Rural Citizen</span>
            {' '}of India
          </h1>

          <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            GramSaathi brings the power of AI directly to farmers, students, and villagers.
            Diagnose crop diseases, find government schemes, and get answers — in your own language.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register" className="btn-primary text-base px-8 py-3.5">
              Start for Free <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/login" className="btn-secondary text-base px-8 py-3.5">
              I already have an account
            </Link>
          </div>

          {/* Trust badges */}
          <div className="flex items-center justify-center gap-2 mt-8 text-gray-500 text-sm">
            <CheckCircle className="w-4 h-4 text-primary-500" />
            No credit card required
            <span className="mx-2">·</span>
            <CheckCircle className="w-4 h-4 text-primary-500" />
            Works on any phone
            <span className="mx-2">·</span>
            <CheckCircle className="w-4 h-4 text-primary-500" />
            6 languages
          </div>
        </div>
      </section>

      {/* ── Stats ───────────────────────────────────────────────────── */}
      <section className="py-12 border-y border-white/5">
        <div className="max-w-4xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6">
          {STATS.map(({ value, label }) => (
            <div key={label} className="text-center">
              <p className="font-display font-extrabold text-4xl text-gradient mb-1">{value}</p>
              <p className="text-gray-500 text-sm">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────────── */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display font-bold text-3xl md:text-4xl text-white mb-4">
              Everything You Need, <span className="text-gradient">In One Place</span>
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              Designed for low-connectivity areas, simple language, and real-world problems of rural India.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="glass p-6 hover:border-primary-600/30 transition-all duration-300 group">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-semibold text-white mb-2">{title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────── */}
      <section className="py-20 px-4">
        <div className="max-w-2xl mx-auto text-center glass p-12 glow-green">
          <Sprout className="w-12 h-12 text-primary-400 mx-auto mb-4" />
          <h2 className="font-display font-bold text-3xl text-white mb-4">Ready to Get Started?</h2>
          <p className="text-gray-400 mb-8">Join thousands of rural citizens already using GramSaathi AI every day.</p>
          <Link to="/register" className="btn-primary text-base px-10 py-3.5">
            Create Free Account <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────── */}
      <footer className="border-t border-white/5 py-8 text-center text-gray-600 text-sm">
        <p>© 2024 GramSaathi AI · Built for Bharat · Powered by Gemini</p>
      </footer>
    </div>
  )
}
