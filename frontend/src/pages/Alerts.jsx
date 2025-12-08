import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  Bell, 
  AlertTriangle, 
  AlertCircle,
  Info,
  CheckCircle,
  Filter,
  Search,
  Loader2,
  Check,
  X,
  Clock,
  Train
} from 'lucide-react'
import { getAlerts, acknowledgeAlert, resolveAlert } from '../services/api'

function AlertCard({ alert, onAcknowledge, onResolve }) {
  const [resolving, setResolving] = useState(false)
  const [resolutionNotes, setResolutionNotes] = useState('')
  const [showResolve, setShowResolve] = useState(false)

  const severityConfig = {
    critical: { 
      color: 'red', 
      icon: AlertCircle, 
      bg: 'bg-red-500/10',
      border: 'border-red-500/30'
    },
    warning: { 
      color: 'amber', 
      icon: AlertTriangle, 
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/30'
    },
    error: { 
      color: 'red', 
      icon: AlertCircle, 
      bg: 'bg-red-500/10',
      border: 'border-red-500/30'
    },
    info: { 
      color: 'blue', 
      icon: Info, 
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/30'
    }
  }

  const config = severityConfig[alert.severity] || severityConfig.info
  const Icon = config.icon

  const handleResolve = async () => {
    setResolving(true)
    try {
      await onResolve(alert.id, resolutionNotes)
      setShowResolve(false)
    } finally {
      setResolving(false)
    }
  }

  return (
    <div className={`card ${config.border} ${alert.is_resolved ? 'opacity-50' : ''}`}>
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg ${config.bg}`}>
            <Icon className={`w-5 h-5 text-${config.color}-400`} />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-white">{alert.title}</h3>
              <span className={`badge badge-${
                alert.severity === 'critical' ? 'danger' :
                alert.severity === 'warning' ? 'warning' :
                'info'
              }`}>
                {alert.severity}
              </span>
              {alert.is_resolved && (
                <span className="badge badge-success">Resolved</span>
              )}
            </div>
            
            <p className="text-sm text-slate-300 mt-1">{alert.message}</p>
            
            <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
              {alert.train_id && (
                <Link 
                  to={`/trains/${alert.train_id}`}
                  className="flex items-center gap-1 hover:text-blue-400 transition-colors"
                >
                  <Train className="w-3 h-3" />
                  Train #{alert.train_id}
                </Link>
              )}
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {new Date(alert.created_at).toLocaleString()}
              </div>
              {alert.is_acknowledged && (
                <span className="text-emerald-400">
                  ✓ Acknowledged by {alert.acknowledged_by}
                </span>
              )}
            </div>
          </div>

          {!alert.is_resolved && (
            <div className="flex gap-2">
              {!alert.is_acknowledged && (
                <button
                  onClick={() => onAcknowledge(alert.id)}
                  className="btn btn-ghost text-xs"
                  title="Acknowledge"
                >
                  <Check className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => setShowResolve(!showResolve)}
                className="btn btn-secondary text-xs"
              >
                Resolve
              </button>
            </div>
          )}
        </div>

        {showResolve && (
          <div className="mt-4 pt-4 border-t border-slate-800 animate-fade-in">
            <label className="text-sm text-slate-400 block mb-2">Resolution Notes</label>
            <textarea
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              placeholder="Describe how this was resolved..."
              className="input w-full h-20 resize-none"
            />
            <div className="flex justify-end gap-2 mt-3">
              <button 
                onClick={() => setShowResolve(false)}
                className="btn btn-ghost text-sm"
              >
                Cancel
              </button>
              <button 
                onClick={handleResolve}
                disabled={resolving}
                className="btn btn-success text-sm"
              >
                {resolving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                Mark Resolved
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function Alerts() {
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('unresolved')
  const [severityFilter, setSeverityFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  const fetchAlerts = async () => {
    setLoading(true)
    try {
      const params = {}
      if (filter === 'unresolved') params.resolved = false
      if (filter === 'resolved') params.resolved = true
      if (severityFilter !== 'all') params.severity = severityFilter
      
      const response = await getAlerts(params)
      setAlerts(response.data.alerts || [])
    } catch (err) {
      console.error('Failed to fetch alerts:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAlerts()
  }, [filter, severityFilter])

  const handleAcknowledge = async (alertId) => {
    try {
      await acknowledgeAlert(alertId, 'Supervisor')
      await fetchAlerts()
    } catch (err) {
      console.error('Failed to acknowledge:', err)
    }
  }

  const handleResolve = async (alertId, notes) => {
    try {
      await resolveAlert(alertId, { 
        resolved_by: 'Supervisor',
        resolution_notes: notes 
      })
      await fetchAlerts()
    } catch (err) {
      console.error('Failed to resolve:', err)
    }
  }

  const filteredAlerts = alerts.filter(alert => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        alert.title?.toLowerCase().includes(query) ||
        alert.message?.toLowerCase().includes(query)
      )
    }
    return true
  })

  // Stats
  const stats = {
    total: alerts.length,
    critical: alerts.filter(a => a.severity === 'critical' && !a.is_resolved).length,
    warning: alerts.filter(a => a.severity === 'warning' && !a.is_resolved).length,
    unresolved: alerts.filter(a => !a.is_resolved).length
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Alerts</h1>
          <p className="text-slate-400 text-sm mt-1">
            Monitor and manage system alerts and notifications
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <Bell className="w-4 h-4" />
            <span className="text-xs">Total Alerts</span>
          </div>
          <p className="text-2xl font-display font-bold text-white">{stats.total}</p>
        </div>
        <div className="card p-4 border-red-500/20">
          <div className="flex items-center gap-2 text-red-400 mb-2">
            <AlertCircle className="w-4 h-4" />
            <span className="text-xs">Critical</span>
          </div>
          <p className="text-2xl font-display font-bold text-red-400">{stats.critical}</p>
        </div>
        <div className="card p-4 border-amber-500/20">
          <div className="flex items-center gap-2 text-amber-400 mb-2">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-xs">Warnings</span>
          </div>
          <p className="text-2xl font-display font-bold text-amber-400">{stats.warning}</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <Clock className="w-4 h-4" />
            <span className="text-xs">Unresolved</span>
          </div>
          <p className="text-2xl font-display font-bold text-white">{stats.unresolved}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-sm text-slate-400">Status:</span>
          {['all', 'unresolved', 'resolved'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                filter === f 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-400">Severity:</span>
          {['all', 'critical', 'warning', 'info'].map(s => (
            <button
              key={s}
              onClick={() => setSeverityFilter(s)}
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                severityFilter === s 
                  ? s === 'critical' ? 'bg-red-600 text-white' :
                    s === 'warning' ? 'bg-amber-600 text-white' :
                    s === 'info' ? 'bg-blue-600 text-white' :
                    'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        <div className="flex-1 flex justify-end">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search alerts..."
              className="input pl-10 w-64"
            />
          </div>
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-3">
        {filteredAlerts.length > 0 ? (
          filteredAlerts.map(alert => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onAcknowledge={handleAcknowledge}
              onResolve={handleResolve}
            />
          ))
        ) : (
          <div className="card p-12 text-center">
            <CheckCircle className="w-12 h-12 text-emerald-500/50 mx-auto" />
            <h3 className="text-lg font-display font-semibold text-white mt-4">
              No alerts found
            </h3>
            <p className="text-slate-400 text-sm mt-2">
              {filter === 'unresolved' 
                ? 'All alerts have been resolved. Great job!' 
                : 'No alerts match your current filters.'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

