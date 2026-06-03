import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import LanguageSwitcher from '../LanguageSwitcher'
import {
  LayoutDashboard, MessageSquare, Leaf, Building2,
  Mic, User, LogOut, Sprout, Menu, X, Cloud, Shield
} from 'lucide-react'
import { useState } from 'react'

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, key: 'dashboard' },
  { to: '/chat',      icon: MessageSquare,   key: 'chat'      },
  { to: '/crop',      icon: Leaf,            key: 'crop'      },
  { to: '/weather',   icon: Cloud,           key: 'weather'   },
  { to: '/schemes',   icon: Building2,       key: 'schemes'   },
  { to: '/voice',     icon: Mic,             key: 'voice'     },
  { to: '/profile',   icon: User,            key: 'profile'   },
]

export default function AppLayout() {
  const { t } = useTranslation()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-6 border-b border-white/5">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-900/40">
          <Sprout className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="font-display font-bold text-white text-sm leading-none">{t('app.name')}</p>
          <p className="text-gray-500 text-xs mt-0.5">{t('app.tagline')}</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-hide">
        {NAV_ITEMS.map(({ to, icon: Icon, key }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {t(`nav.${key}`)}
          </NavLink>
        ))}
        {user?.isAdmin && (
          <NavLink
            to="/admin"
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) => `nav-item mt-2 ${isActive ? 'active' : ''} border-t border-white/5 pt-3`}
          >
            <Shield className="w-4 h-4 flex-shrink-0 text-amber-400" />
            <span className="text-amber-300">Admin Panel</span>
          </NavLink>
        )}
      </nav>

      {/* Bottom section */}
      <div className="px-3 py-4 border-t border-white/5 space-y-3">
        <LanguageSwitcher />
        {/* User info */}
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-600 to-earth-500 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-200 truncate">{user?.name}</p>
            <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="nav-item w-full text-red-400 hover:text-red-300 hover:bg-red-950/30">
          <LogOut className="w-4 h-4" />
          {t('nav.logout')}
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen overflow-hidden bg-dark-900">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-60 flex-col glass rounded-none border-r border-white/5 flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-64 h-full glass rounded-none border-r border-white/5 flex flex-col animate-slide-in-left">
            <button onClick={() => setSidebarOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-white/5 glass rounded-none">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-400 hover:text-white transition-colors">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Sprout className="w-5 h-5 text-primary-400" />
            <span className="font-display font-bold text-white text-sm">{t('app.name')}</span>
          </div>
          <div className="w-5" />
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
