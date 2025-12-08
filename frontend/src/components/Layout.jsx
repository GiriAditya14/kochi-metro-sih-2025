import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Train, 
  Calendar, 
  FlaskConical,
  Database,
  Bell,
  MessageSquare,
  Menu,
  X,
  ChevronRight,
  Gauge,
  Zap
} from 'lucide-react'
import AICopilot from './AICopilot'

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/planner', icon: Calendar, label: 'Night Induction Planner' },
  { path: '/what-if', icon: FlaskConical, label: 'What-If Scenarios' },
  { path: '/simulator', icon: Zap, label: 'Operations Simulator' },
  { path: '/data', icon: Database, label: 'Data Playground' },
  { path: '/alerts', icon: Bell, label: 'Alerts' },
]

export default function Layout({ children }) {
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [copilotOpen, setCopilotOpen] = useState(false)

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside 
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-slate-900/95 backdrop-blur-xl border-r border-slate-800 flex flex-col transition-all duration-300`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Train className="w-6 h-6 text-white" />
            </div>
            {sidebarOpen && (
              <div className="animate-fade-in">
                <div className="font-display font-bold text-white">KMRL</div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider">Induction Planner</div>
              </div>
            )}
          </div>
        </div>

        {/* Toggle button */}
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute top-4 -right-3 w-6 h-6 bg-slate-800 border border-slate-700 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors z-50"
        >
          <ChevronRight className={`w-4 h-4 transition-transform ${sidebarOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
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

        {/* AI Copilot Toggle */}
        <div className="p-4 border-t border-slate-800">
          <button
            onClick={() => setCopilotOpen(!copilotOpen)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              copilotOpen 
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/20' 
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <MessageSquare className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && (
              <div className="text-left animate-fade-in">
                <div className="font-medium">AI Copilot</div>
                <div className="text-xs opacity-75">Ask anything</div>
              </div>
            )}
          </button>
        </div>

        {/* Version */}
        {sidebarOpen && (
          <div className="p-4 text-center">
            <div className="text-xs text-slate-600">v1.0.0 • SIH 2025</div>
          </div>
        )}
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <header className="h-16 bg-slate-900/50 backdrop-blur-xl border-b border-slate-800 flex items-center justify-between px-6">
          <div>
            <h1 className="text-lg font-display font-semibold text-white">
              {navItems.find(item => item.path === location.pathname)?.label || 'KMRL'}
            </h1>
            <p className="text-xs text-slate-500">Kochi Metro Rail Limited - Train Operations</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm font-medium text-white">Muttom Depot</div>
              <div className="text-xs text-slate-500">
                {new Date().toLocaleDateString('en-IN', { 
                  weekday: 'short', 
                  day: 'numeric', 
                  month: 'short',
                  year: 'numeric'
                })}
              </div>
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white font-medium">
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

