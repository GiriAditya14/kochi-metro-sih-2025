import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { 
  LayoutDashboard, 
  Train, 
  Calendar, 
  FlaskConical,
  Database,
  Bell,
  MessageSquare,
  ChevronRight,
  Zap,
  LogOut,
  Shield
} from 'lucide-react'
import AICopilot from './AICopilot'
import ThemeToggle from './ThemeToggle'
import LanguageSelector from './LanguageSelector'
import { useAuth } from '../contexts/AuthContext'

export default function Layout({ children }) {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const { logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [copilotOpen, setCopilotOpen] = useState(false)

  const navItems = [
    { path: '/', icon: LayoutDashboard, label: t('nav.dashboard') },
    { path: '/planner', icon: Calendar, label: t('nav.planner') },
    { path: '/what-if', icon: FlaskConical, label: t('nav.whatif') },
    { path: '/simulator', icon: Zap, label: t('nav.simulator') },
    { path: '/resilience', icon: Shield, label: t('nav.resilience') },
    { path: '/data', icon: Database, label: t('nav.data') },
    { path: '/alerts', icon: Bell, label: t('nav.alerts') },
  ]

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside 
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } fixed left-0 top-0 h-screen flex flex-col transition-all duration-300 z-40`}
        style={{
          background: 'var(--glass-bg)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRight: '1px solid var(--glass-border)'
        }}
      >
        {/* Logo - Fixed at top */}
        <div className="flex-shrink-0 h-16 flex items-center px-4 border-b" style={{ borderColor: 'rgb(var(--color-border))' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Train className="w-6 h-6 text-white" />
            </div>
            {sidebarOpen && (
              <div className="animate-fade-in">
                <div className="font-display font-bold" style={{ color: 'rgb(var(--color-text-primary))' }}>{t('app.title')}</div>
                <div className="text-[10px] uppercase tracking-wider" style={{ color: 'rgb(var(--color-text-tertiary))' }}>{t('app.subtitle')}</div>
              </div>
            )}
          </div>
        </div>

        {/* Toggle button */}
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute top-4 -right-3 w-6 h-6 rounded-full flex items-center justify-center transition-colors z-50 border"
          style={{
            background: 'var(--glass-bg)',
            borderColor: 'rgb(var(--color-border))',
            color: 'rgb(var(--color-text-tertiary))'
          }}
        >
          <ChevronRight className={`w-4 h-4 transition-transform ${sidebarOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Navigation - Scrollable middle section */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto min-h-0">
          {navItems.map(({ path, icon: Icon, label }) => (
            <Link
              key={path}
              to={path}
              className={`sidebar-link ${location.pathname === path ? 'active' : ''}`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span className="animate-fade-in">{label}</span>}
            </Link>
          ))}
        </nav>

        {/* AI Copilot Toggle - Fixed at bottom */}
        <div className="flex-shrink-0 p-4 border-t" style={{ borderColor: 'rgb(var(--color-border))' }}>
          <button
            onClick={() => setCopilotOpen(!copilotOpen)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              copilotOpen 
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/30' 
                : 'hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
            style={!copilotOpen ? {
              background: 'rgba(var(--color-bg-tertiary), 0.5)',
              color: 'rgb(var(--color-text-secondary))'
            } : {}}
          >
            <MessageSquare className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && (
              <div className="text-left animate-fade-in">
                <div className="font-medium">{t('nav.copilot')}</div>
                <div className="text-xs opacity-75">{t('nav.copilotDesc')}</div>
              </div>
            )}
          </button>
        </div>

        {/* Version - Fixed at bottom */}
        {sidebarOpen && (
          <div className="flex-shrink-0 p-4 text-center">
            <div className="text-xs" style={{ color: 'rgb(var(--color-text-tertiary))' }}>{t('app.version')}</div>
          </div>
        )}
      </aside>

      {/* Main content */}
      <div className={`flex-1 flex flex-col min-h-screen ${sidebarOpen ? 'ml-64' : 'ml-20'} transition-all duration-300`}>
        {/* Header */}
        <header 
          className="h-16 border-b flex items-center justify-between px-6"
          style={{
            background: 'var(--glass-bg)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderColor: 'rgb(var(--color-border))'
          }}
        >
          <div>
            <h1 className="text-lg font-display font-semibold" style={{ color: 'rgb(var(--color-text-primary))' }}>
              {navItems.find(item => item.path === location.pathname)?.label || 'KMRL'}
            </h1>
            <p className="text-xs" style={{ color: 'rgb(var(--color-text-tertiary))' }}>{t('app.operations')}</p>
          </div>
          
          <div className="flex items-center gap-4">
            <LanguageSelector />
            <ThemeToggle />
            <div className="relative group">
              <button
                onClick={() => {
                  logout()
                  navigate('/login')
                }}
                className="p-2 rounded-full border transition hover:bg-slate-200 dark:hover:bg-slate-800"
                style={{
                  background: 'var(--glass-bg)',
                  borderColor: 'rgb(var(--color-border))',
                  color: 'rgb(var(--color-text-primary))'
                }}
                aria-label="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
              <div
                className="absolute right-0 mt-2 px-2 py-1 rounded text-xs shadow-lg transition-opacity opacity-0 group-hover:opacity-100 z-50"
                style={{
                  background: 'var(--glass-bg)',
                  border: '1px solid var(--glass-border)',
                  color: 'rgb(var(--color-text-primary))'
                }}
              >
                Logout
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium" style={{ color: 'rgb(var(--color-text-primary))' }}>{t('app.location')}</div>
              <div className="text-xs" style={{ color: 'rgb(var(--color-text-tertiary))' }}>
                {new Date().toLocaleDateString('en-IN', { 
                  weekday: 'short', 
                  day: 'numeric', 
                  month: 'short',
                  year: 'numeric'
                })}
              </div>
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white font-medium shadow-lg">
              OP
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>

      {/* AI Copilot Panel */}
      <AICopilot isOpen={copilotOpen} onClose={() => setCopilotOpen(false)} />
    </div>
  )
}

