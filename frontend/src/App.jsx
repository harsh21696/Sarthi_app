import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import OfflineBanner from './components/OfflineBanner'

import LandingPage    from './pages/LandingPage'
import LoginPage      from './pages/LoginPage'
import RegisterPage   from './pages/RegisterPage'
import VerifyOtpPage  from './pages/VerifyOtpPage'
import DashboardPage  from './pages/DashboardPage'
import ChatPage       from './pages/ChatPage'
import CropPage       from './pages/CropPage'
import SchemesPage    from './pages/SchemesPage'
import VoicePage      from './pages/VoicePage'
import ProfilePage    from './pages/ProfilePage'
import WeatherPage    from './pages/WeatherPage'
import AdminPage      from './pages/AdminPage'
import AppLayout      from './components/layout/AppLayout'

// Protected route wrapper
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-dark-900">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full border-2 border-primary-500 border-t-transparent animate-spin" />
        <p className="text-gray-400 text-sm">Loading GramSaathi...</p>
      </div>
    </div>
  )
  return user ? children : <Navigate to="/login" replace />
}

// Public route — redirect to dashboard if already logged in
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth()
  if (loading) return null
  return user ? <Navigate to="/dashboard" replace /> : children
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <OfflineBanner />
        <Toaster
          position="top-right"
          toastOptions={{
            style: { background: '#172317', color: '#e2e8f0', border: '1px solid rgba(255,255,255,0.08)' },
            success: { iconTheme: { primary: '#22c55e', secondary: '#052e16' } },
            error:   { iconTheme: { primary: '#f87171', secondary: '#1a0a0a' } },
          }}
        />
        <Routes>
          <Route path="/" element={<PublicRoute><LandingPage /></PublicRoute>} />
          <Route path="/login"      element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/register"   element={<PublicRoute><RegisterPage /></PublicRoute>} />
          <Route path="/verify-otp" element={<VerifyOtpPage />} />

          {/* Protected — inside sidebar layout */}
          <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="chat"      element={<ChatPage />} />
            <Route path="chat/:id"  element={<ChatPage />} />
            <Route path="crop"      element={<CropPage />} />
            <Route path="schemes"   element={<SchemesPage />} />
            <Route path="voice"     element={<VoicePage />} />
            <Route path="weather"   element={<WeatherPage />} />
            <Route path="admin"     element={<AdminPage />} />
            <Route path="profile"   element={<ProfilePage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
