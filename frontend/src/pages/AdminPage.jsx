import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { Navigate } from 'react-router-dom'
import api from '../utils/api'
import toast from 'react-hot-toast'
import {
  Users, MessageSquare, Leaf, Building2, Activity,
  Shield, Trash2, CheckCircle, XCircle, Loader2,
  TrendingUp, Database, Mail, Zap, RefreshCw,
  Search, ChevronLeft, ChevronRight, Crown
} from 'lucide-react'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'

const COLORS = ['#22c55e', '#3b82f6', '#a855f7', '#f59e0b', '#ef4444']

const StatBox = ({ icon: Icon, label, value, sub, color }) => (
  <div className="glass p-5 flex items-center gap-4">
    <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center flex-shrink-0`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
    <div>
      <p className="text-2xl font-bold text-white">{value ?? '—'}</p>
      <p className="text-gray-400 text-sm">{label}</p>
      {sub && <p className="text-xs text-primary-400 mt-0.5">{sub} today</p>}
    </div>
  </div>
)

const StatusBadge = ({ ok, label }) => (
  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm ${ok ? 'bg-green-950/50 text-green-400 border border-green-800/30' : 'bg-red-950/50 text-red-400 border border-red-800/30'}`}>
    {ok ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
    {label}
  </div>
)

export default function AdminPage() {
  const { user } = useAuth()
  if (!user?.isAdmin) return <Navigate to="/dashboard" replace />

  const [tab, setTab]           = useState('overview')
  const [stats, setStats]       = useState(null)
  const [users, setUsers]       = useState([])
  const [activity, setActivity] = useState([])
  const [health, setHealth]     = useState(null)
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [page, setPage]         = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [deleting, setDeleting] = useState(null)

  useEffect(() => { fetchAll() }, [])
  useEffect(() => { if (tab === 'users') fetchUsers() }, [tab, page, search])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [s, a, h] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/activity'),
        api.get('/admin/health'),
      ])
      setStats(s.data)
      setActivity(a.data.activity)
      setHealth(h.data)
    } catch { toast.error('Failed to load admin data') }
    finally { setLoading(false) }
  }

  const fetchUsers = async () => {
    try {
      const { data } = await api.get(`/admin/users?page=${page}&limit=15&search=${search}`)
      setUsers(data.users)
      setTotalPages(data.pages)
    } catch { toast.error('Failed to load users') }
  }

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete user "${name}"? This cannot be undone.`)) return
    setDeleting(id)
    try {
      await api.delete(`/admin/users/${id}`)
      toast.success(`User "${name}" deleted`)
      fetchUsers()
    } catch (e) { toast.error(e.response?.data?.error || 'Delete failed') }
    finally { setDeleting(null) }
  }

  const handleToggleAdmin = async (id, current) => {
    try {
      await api.patch(`/admin/users/${id}`, { isAdmin: !current })
      toast.success(current ? 'Admin removed' : 'Admin granted')
      fetchUsers()
    } catch { toast.error('Update failed') }
  }

  const TABS = [
    { id: 'overview',  label: 'Overview',  icon: TrendingUp },
    { id: 'users',     label: 'Users',     icon: Users },
    { id: 'activity',  label: 'Activity',  icon: Activity },
    { id: 'health',    label: 'Health',    icon: Database },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-white flex items-center gap-2">
            <Shield className="w-7 h-7 text-amber-400" /> Admin Dashboard
          </h1>
          <p className="text-gray-400 text-sm mt-1">System management & analytics for GramSaathi AI</p>
        </div>
        <button onClick={fetchAll} className="btn-secondary text-sm px-4 py-2">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 glass rounded-xl w-fit">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
              ${tab === id ? 'bg-primary-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {loading && tab === 'overview' ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
        </div>
      ) : (
        <>
          {/* ─── OVERVIEW TAB ─────────────────────────────────────────────── */}
          {tab === 'overview' && stats && (
            <div className="space-y-6">
              {/* Stat boxes */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatBox icon={Users}        label="Total Users"     value={stats.overview.totalUsers}    sub={stats.today.users}   color="bg-gradient-to-br from-primary-600 to-primary-800" />
                <StatBox icon={MessageSquare} label="Total Chats"    value={stats.overview.totalChats}    sub={stats.today.chats}   color="bg-gradient-to-br from-blue-600 to-blue-800" />
                <StatBox icon={Leaf}          label="Crop Analyses"  value={stats.overview.totalCrops}    sub={stats.today.crops}   color="bg-gradient-to-br from-earth-600 to-earth-800" />
                <StatBox icon={Building2}     label="Scheme Queries" value={stats.overview.totalSchemes}  sub={null}                color="bg-gradient-to-br from-purple-600 to-purple-800" />
              </div>

              {/* Charts row */}
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Line chart — 7-day activity */}
                <div className="glass p-5">
                  <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-primary-400" /> 7-Day Activity
                  </h2>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={stats.charts.last7DaysChats}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1f2d1f" />
                      <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} />
                      <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} />
                      <Tooltip contentStyle={{ background: '#0f1a0f', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, color: '#e2e8f0' }} />
                      <Legend wrapperStyle={{ color: '#9ca3af', fontSize: 12 }} />
                      <Line type="monotone" dataKey="chats" stroke="#22c55e" strokeWidth={2} dot={{ fill: '#22c55e', r: 3 }} name="Chats" />
                      <Line type="monotone" dataKey="crops" stroke="#84cc16" strokeWidth={2} dot={{ fill: '#84cc16', r: 3 }} name="Crop Scans" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Pie chart — role distribution */}
                <div className="glass p-5">
                  <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary-400" /> User Roles
                  </h2>
                  <div className="flex items-center gap-4">
                    <ResponsiveContainer width="60%" height={180}>
                      <PieChart>
                        <Pie data={stats.charts.roleDistribution} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value" paddingAngle={3}>
                          {stats.charts.roleDistribution.map((_, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ background: '#0f1a0f', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, color: '#e2e8f0' }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-2">
                      {stats.charts.roleDistribution.map((d, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                          <span className="text-gray-300 text-sm capitalize">{d.name}</span>
                          <span className="text-white font-semibold ml-auto text-sm">{d.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bar chart — language distribution */}
              <div className="glass p-5">
                <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" /> Language Distribution
                </h2>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={stats.charts.langDistribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2d1f" />
                    <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: '#0f1a0f', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, color: '#e2e8f0' }} />
                    <Bar dataKey="value" name="Users" radius={[4, 4, 0, 0]}>
                      {stats.charts.langDistribution.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* ─── USERS TAB ────────────────────────────────────────────────── */}
          {tab === 'users' && (
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="relative flex-1 max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    value={search}
                    onChange={e => { setSearch(e.target.value); setPage(1) }}
                    placeholder="Search by name, email, state..."
                    className="input pl-9 text-sm w-full"
                  />
                </div>
                <span className="text-gray-500 text-sm self-center">{users.length} shown</span>
              </div>

              <div className="glass overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/5 text-gray-500 text-xs uppercase">
                        <th className="text-left px-4 py-3">User</th>
                        <th className="text-left px-4 py-3 hidden md:table-cell">Role</th>
                        <th className="text-left px-4 py-3 hidden lg:table-cell">Activity</th>
                        <th className="text-left px-4 py-3 hidden lg:table-cell">Joined</th>
                        <th className="text-left px-4 py-3">Status</th>
                        <th className="text-right px-4 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {users.map(u => (
                        <tr key={u.id} className="hover:bg-white/2 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-600 to-earth-500 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                                {u.name?.[0]?.toUpperCase()}
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <p className="text-white font-medium truncate max-w-[120px]">{u.name}</p>
                                  {u.isAdmin && <Crown className="w-3 h-3 text-amber-400 flex-shrink-0" />}
                                </div>
                                <p className="text-gray-500 text-xs truncate max-w-[140px]">{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell">
                            <span className="badge badge-green capitalize">{u.role}</span>
                          </td>
                          <td className="px-4 py-3 hidden lg:table-cell text-gray-400 text-xs">
                            💬 {u._count.chatSessions} · 🌿 {u._count.cropAnalyses} · 🏛️ {u._count.schemeQueries}
                          </td>
                          <td className="px-4 py-3 hidden lg:table-cell text-gray-500 text-xs">
                            {new Date(u.createdAt).toLocaleDateString('en-IN')}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`badge ${u.emailVerified ? 'badge-green' : 'badge-yellow'} text-xs`}>
                              {u.emailVerified ? '✓ Verified' : 'Unverified'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleToggleAdmin(u.id, u.isAdmin)}
                                title={u.isAdmin ? 'Remove admin' : 'Make admin'}
                                className="p-1.5 rounded-lg hover:bg-amber-950/40 text-amber-500 hover:text-amber-400 transition-colors"
                              >
                                <Crown className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(u.id, u.name)}
                                disabled={deleting === u.id || u.id === user.id}
                                className="p-1.5 rounded-lg hover:bg-red-950/40 text-red-500 hover:text-red-400 transition-colors disabled:opacity-30"
                              >
                                {deleting === u.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t border-white/5">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary text-sm px-3 py-1.5 disabled:opacity-30">
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-gray-500 text-sm">Page {page} of {totalPages}</span>
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-secondary text-sm px-3 py-1.5 disabled:opacity-30">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ─── ACTIVITY TAB ─────────────────────────────────────────────── */}
          {tab === 'activity' && (
            <div className="glass p-5">
              <h2 className="text-white font-semibold mb-4">Recent Activity</h2>
              <div className="space-y-2">
                {activity.map((a, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl hover:bg-dark-700/40 transition-colors">
                    <span className="text-xl flex-shrink-0">{a.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-200 text-sm">{a.text}</p>
                      <p className="text-gray-600 text-xs">{a.user.email}</p>
                    </div>
                    <span className="text-gray-600 text-xs flex-shrink-0">
                      {new Date(a.time).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ─── HEALTH TAB ───────────────────────────────────────────────── */}
          {tab === 'health' && health && (
            <div className="space-y-4">
              <div className="glass p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-3 h-3 rounded-full bg-primary-500 animate-pulse" />
                  <h2 className="text-white font-semibold">System Status</h2>
                  <span className="badge badge-green ml-auto">{health.status}</span>
                </div>
                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="p-4 bg-dark-800/50 rounded-xl">
                    <div className="flex items-center gap-2 mb-3">
                      <Database className="w-4 h-4 text-blue-400" />
                      <p className="text-gray-400 text-sm font-medium">PostgreSQL</p>
                    </div>
                    <StatusBadge ok={health.checks.database?.status === 'ok'} label={health.checks.database?.status === 'ok' ? 'Connected' : 'Error'} />
                  </div>
                  <div className="p-4 bg-dark-800/50 rounded-xl">
                    <div className="flex items-center gap-2 mb-3">
                      <Zap className="w-4 h-4 text-amber-400" />
                      <p className="text-gray-400 text-sm font-medium">Groq AI API</p>
                    </div>
                    <StatusBadge ok={health.checks.groq?.status === 'ok'} label={health.checks.groq?.status === 'ok' ? `OK · ${health.checks.groq.latency}ms` : 'Error'} />
                  </div>
                  <div className="p-4 bg-dark-800/50 rounded-xl">
                    <div className="flex items-center gap-2 mb-3">
                      <Mail className="w-4 h-4 text-green-400" />
                      <p className="text-gray-400 text-sm font-medium">Gmail SMTP</p>
                    </div>
                    <StatusBadge ok={health.checks.email?.status === 'configured'} label={health.checks.email?.status === 'configured' ? 'Configured' : 'Not Set'} />
                  </div>
                </div>
                <p className="text-gray-600 text-xs mt-4">Last checked: {new Date(health.timestamp).toLocaleString()}</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
