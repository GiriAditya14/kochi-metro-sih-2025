import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  AlertTriangle, 
  GitBranch, 
  History,
  Train,
  Menu,
  X,
  Bell,
  Settings
} from 'lucide-react';
import { cn } from '../lib/utils';

interface LayoutProps {
  children: ReactNode;
}

const navItems = [
  { 
    path: '/', 
    label: 'Dashboard', 
    icon: LayoutDashboard,
    description: 'Ranked induction list with 6-agent analysis'
  },
  { 
    path: '/emergency', 
    label: 'Emergency', 
    icon: AlertTriangle,
    description: 'Sudden breakdown handling & crisis management'
  },
  { 
    path: '/what-if', 
    label: 'What-If', 
    icon: GitBranch,
    description: 'Scenario simulation & impact analysis'
  },
  { 
    path: '/history', 
    label: 'History', 
    icon: History,
    description: 'Past decisions & outcomes'
  },
];

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Top Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg">
                  <Train className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                    NeuralInduction AI
                  </h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Multi-Agent Train Induction System
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 rounded-full border border-green-200 dark:border-green-800">
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium text-green-700 dark:text-green-300">
                  System Active
                </span>
              </div>
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-full">
                <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                  6 AI Agents Running
                </span>
              </div>
              <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 relative">
                <Bell className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={cn(
            "fixed lg:static inset-y-0 left-0 z-40 w-72 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 shadow-lg lg:shadow-none transform transition-transform duration-300 ease-in-out lg:translate-x-0",
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="h-full flex flex-col pt-4 pb-6">
            <nav className="flex-1 px-3 space-y-2">
              <div className="px-3 py-2 mb-2">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Navigation
                </p>
              </div>
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      "group flex flex-col gap-1 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                    )}
                    title={item.description}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={cn("h-5 w-5 shrink-0", isActive && "text-white")} />
                      <span className="font-semibold">{item.label}</span>
                    </div>
                    {isActive && (
                      <p className="text-xs opacity-80 ml-8 leading-tight">
                        {item.description}
                      </p>
                    )}
                  </Link>
                );
              })}
            </nav>
            <div className="px-4 pt-4 border-t border-gray-200 dark:border-gray-800">
              <div className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg">
                <p className="text-xs font-semibold text-gray-900 dark:text-white mb-1">
                  System Status
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  All systems operational
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          <div className="p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
