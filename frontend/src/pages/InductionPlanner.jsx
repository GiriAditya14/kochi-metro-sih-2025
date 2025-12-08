import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  Train, 
  CheckCircle, 
  AlertTriangle,
  Clock,
  Wrench,
  Target,
  Filter,
  Download,
  RefreshCw,
  Loader2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  GripVertical,
  Check,
  X
} from 'lucide-react'
import { getPlans, getPlan, generatePlan, approvePlan, overrideAssignment, getAlerts } from '../services/api'

function TrainCard({ assignment, onOverride }) {
  const [expanded, setExpanded] = useState(false)
  const train = assignment.train
  
  const assignmentColors = {
    SERVICE: 'emerald',
    STANDBY: 'blue',
    IBL_MAINTENANCE: 'amber',
    IBL_CLEANING: 'amber',
    IBL_BOTH: 'amber',
    OUT_OF_SERVICE: 'slate'
  }
  
  const color = assignmentColors[assignment.assignment_type] || 'slate'

  return (
    <div className={`card border-l-4 border-l-${color}-500 hover:border-slate-700 transition-all`}>
      <div 
        className="p-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-${color}-500/10`}>
              <Train className={`w-5 h-5 text-${color}-400`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-semibold text-white">
                  {train?.train_id || `Train #${assignment.train_id}`}
                </span>
                {assignment.service_rank && (
                  <span className="text-xs bg-slate-700 px-2 py-0.5 rounded">
                    #{assignment.service_rank}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Track: {assignment.assigned_track || 'N/A'} • 
                Position: {assignment.assigned_position ?? 'N/A'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className={`badge badge-${
              assignment.assignment_type === 'SERVICE' ? 'success' :
              assignment.assignment_type === 'STANDBY' ? 'info' :
              assignment.assignment_type?.includes('IBL') ? 'warning' :
              'danger'
            }`}>
              {assignment.assignment_type?.replace('_', ' ')}
            </div>
            {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </div>
        </div>
        
        {/* Score bar */}
        <div className="mt-3 flex items-center gap-2">
          <span className="text-xs text-slate-500 w-20">Overall Score</span>
          <div className="flex-1 score-bar">
            <div 
              className={`score-fill ${
                assignment.overall_score >= 80 ? 'excellent' :
                assignment.overall_score >= 60 ? 'good' :
                assignment.overall_score >= 40 ? 'warning' :
                'danger'
              }`}
              style={{ width: `${assignment.overall_score || 0}%` }}
            />
          </div>
          <span className="text-xs text-slate-400 w-10 text-right">
            {assignment.overall_score?.toFixed(0) || 0}
          </span>
        </div>
      </div>
      
      {expanded && (
        <div className="px-4 pb-4 pt-2 border-t border-slate-800 animate-fade-in">
          {/* Detailed scores */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <p className="text-xs text-slate-500">Fitness</p>
              <p className={`text-lg font-semibold ${
                assignment.fitness_score >= 80 ? 'text-emerald-400' :
                assignment.fitness_score >= 50 ? 'text-amber-400' :
                'text-red-400'
              }`}>
                {assignment.fitness_score?.toFixed(0) || 0}%
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Maintenance</p>
              <p className={`text-lg font-semibold ${
                assignment.maintenance_score >= 80 ? 'text-emerald-400' :
                assignment.maintenance_score >= 50 ? 'text-amber-400' :
                'text-red-400'
              }`}>
                {assignment.maintenance_score?.toFixed(0) || 0}%
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Branding</p>
              <p className="text-lg font-semibold text-blue-400">
                {assignment.branding_score?.toFixed(0) || 0}%
              </p>
            </div>
          </div>
          
          {/* Reason */}
          <div className="bg-slate-800/50 rounded-lg p-3 mb-3">
            <p className="text-xs text-slate-400 mb-1">Assignment Reason</p>
            <p className="text-sm text-slate-200">{assignment.assignment_reason || 'No specific reason recorded'}</p>
          </div>
          
          {/* Override button */}
          {assignment.is_manual_override ? (
            <div className="flex items-center gap-2 text-amber-400 text-sm">
              <AlertTriangle className="w-4 h-4" />
              <span>Manually overridden by {assignment.override_by}</span>
            </div>
          ) : (
            <div className="flex justify-end gap-2">
              <Link 
                to={`/trains/${assignment.train_id}`}
                className="btn btn-ghost text-sm"
              >
                View Details
              </Link>
              <button 
                onClick={(e) => {
                  e.stopPropagation()
                  onOverride(assignment)
                }}
                className="btn btn-secondary text-sm"
              >
                <GripVertical className="w-4 h-4" />
                Override
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function OverrideModal({ assignment, planId, onClose, onSubmit }) {
  const [newAssignment, setNewAssignment] = useState(assignment.assignment_type)
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!reason.trim()) return
    setLoading(true)
    try {
      await onSubmit({
        train_id: assignment.train_id,
        new_assignment: newAssignment,
        reason: reason,
        override_by: 'Supervisor',
        reason_category: 'Operational'
      })
      onClose()
    } catch (err) {
      console.error('Override failed:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="card max-w-md w-full mx-4 animate-in">
        <div className="card-header flex items-center justify-between">
          <h3 className="font-display font-semibold text-white">Override Assignment</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-700 rounded">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>
        <div className="card-body space-y-4">
          <div>
            <p className="text-sm text-slate-400">Train</p>
            <p className="text-lg font-semibold text-white">
              {assignment.train?.train_id || `Train #${assignment.train_id}`}
            </p>
          </div>
          
          <div>
            <label className="text-sm text-slate-400 block mb-2">New Assignment</label>
            <select
              value={newAssignment}
              onChange={(e) => setNewAssignment(e.target.value)}
              className="input w-full"
            >
              <option value="SERVICE">SERVICE</option>
              <option value="STANDBY">STANDBY</option>
              <option value="IBL_MAINTENANCE">IBL - Maintenance</option>
              <option value="IBL_CLEANING">IBL - Cleaning</option>
              <option value="IBL_BOTH">IBL - Both</option>
              <option value="OUT_OF_SERVICE">Out of Service</option>
            </select>
          </div>
          
          <div>
            <label className="text-sm text-slate-400 block mb-2">Reason for Override *</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why this override is necessary..."
              className="input w-full h-24 resize-none"
            />
          </div>
          
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={onClose} className="btn btn-ghost">
              Cancel
            </button>
            <button 
              onClick={handleSubmit}
              disabled={!reason.trim() || loading}
              className="btn btn-primary"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Confirm Override
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function InductionPlanner() {
  const [plans, setPlans] = useState([])
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [assignments, setAssignments] = useState([])
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [filter, setFilter] = useState('all')
  const [overrideModal, setOverrideModal] = useState(null)

  const fetchPlans = async () => {
    try {
      setLoading(true)
      const response = await getPlans({ limit: 10 })
      setPlans(response.data.plans || [])
      
      if (response.data.plans?.length > 0) {
        const latestPlan = response.data.plans[0]
        await loadPlanDetails(latestPlan.id)
      }
    } catch (err) {
      console.error('Failed to fetch plans:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadPlanDetails = async (planId) => {
    try {
      const [planResponse, alertsResponse] = await Promise.all([
        getPlan(planId),
        getAlerts({ plan_id: planId })
      ])
      
      setSelectedPlan(planResponse.data.plan)
      setAssignments(planResponse.data.assignments || [])
      setAlerts(alertsResponse.data.alerts || [])
    } catch (err) {
      console.error('Failed to load plan details:', err)
    }
  }

  useEffect(() => {
    fetchPlans()
  }, [])

  const handleGeneratePlan = async () => {
    setGenerating(true)
    try {
      const response = await generatePlan()
      await fetchPlans()
    } catch (err) {
      console.error('Failed to generate plan:', err)
    } finally {
      setGenerating(false)
    }
  }

  const handleApprovePlan = async () => {
    if (!selectedPlan) return
    try {
      await approvePlan(selectedPlan.id, 'Supervisor')
      await loadPlanDetails(selectedPlan.id)
    } catch (err) {
      console.error('Failed to approve plan:', err)
    }
  }

  const handleOverride = async (data) => {
    if (!selectedPlan) return
    await overrideAssignment(selectedPlan.id, data)
    await loadPlanDetails(selectedPlan.id)
  }

  const filteredAssignments = assignments.filter(a => {
    if (filter === 'all') return true
    if (filter === 'service') return a.assignment_type === 'SERVICE'
    if (filter === 'standby') return a.assignment_type === 'STANDBY'
    if (filter === 'ibl') return a.assignment_type?.includes('IBL')
    if (filter === 'oos') return a.assignment_type === 'OUT_OF_SERVICE'
    return true
  })

  // Sort by service rank for SERVICE, otherwise by overall score
  const sortedAssignments = [...filteredAssignments].sort((a, b) => {
    if (a.assignment_type === 'SERVICE' && b.assignment_type === 'SERVICE') {
      return (a.service_rank || 999) - (b.service_rank || 999)
    }
    return (b.overall_score || 0) - (a.overall_score || 0)
  })

  const stats = {
    service: assignments.filter(a => a.assignment_type === 'SERVICE').length,
    standby: assignments.filter(a => a.assignment_type === 'STANDBY').length,
    ibl: assignments.filter(a => a.assignment_type?.includes('IBL')).length,
    oos: assignments.filter(a => a.assignment_type === 'OUT_OF_SERVICE').length
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto" />
          <p className="text-slate-400 mt-4">Loading plans...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Night Induction Planner</h1>
          <p className="text-slate-400 text-sm mt-1">
            Review and approve train assignments for tomorrow's service
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleGeneratePlan}
            disabled={generating}
            className="btn btn-secondary"
          >
            {generating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Regenerate Plan
          </button>
          {selectedPlan && selectedPlan.status !== 'approved' && (
            <button 
              onClick={handleApprovePlan}
              className="btn btn-success"
            >
              <Check className="w-4 h-4" />
              Approve Plan
            </button>
          )}
        </div>
      </div>

      {/* Plan selector and stats */}
      {selectedPlan && (
        <div className="card">
          <div className="p-4 flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <select
                value={selectedPlan.id}
                onChange={(e) => loadPlanDetails(parseInt(e.target.value))}
                className="input"
              >
                {plans.map(plan => (
                  <option key={plan.id} value={plan.id}>
                    {plan.plan_id} - {new Date(plan.plan_date).toLocaleDateString()}
                  </option>
                ))}
              </select>
              <div className={`badge ${
                selectedPlan.status === 'approved' ? 'badge-success' :
                selectedPlan.status === 'proposed' ? 'badge-info' :
                selectedPlan.status === 'modified' ? 'badge-warning' :
                'badge-danger'
              }`}>
                {selectedPlan.status?.toUpperCase()}
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="status-dot status-dot-success" />
                <span className="text-sm text-slate-300">{stats.service} Service</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="status-dot" style={{ background: '#3b82f6' }} />
                <span className="text-sm text-slate-300">{stats.standby} Standby</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="status-dot status-dot-warning" />
                <span className="text-sm text-slate-300">{stats.ibl} IBL</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="status-dot" style={{ background: '#64748b' }} />
                <span className="text-sm text-slate-300">{stats.oos} OOS</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="card border-amber-500/20">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <span className="font-medium text-amber-400">{alerts.length} Alerts for this Plan</span>
            </div>
            <div className="space-y-2">
              {alerts.slice(0, 3).map((alert, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm text-slate-300">
                  <span className={`badge ${
                    alert.severity === 'critical' ? 'badge-danger' :
                    alert.severity === 'warning' ? 'badge-warning' :
                    'badge-info'
                  }`}>
                    {alert.severity}
                  </span>
                  <span>{alert.message}</span>
                </div>
              ))}
              {alerts.length > 3 && (
                <Link to="/alerts" className="text-sm text-blue-400 hover:text-blue-300">
                  View all {alerts.length} alerts →
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-slate-400" />
        <span className="text-sm text-slate-400">Filter:</span>
        {['all', 'service', 'standby', 'ibl', 'oos'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 text-sm rounded-lg transition-colors ${
              filter === f 
                ? 'bg-blue-600 text-white' 
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            {f.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Assignments list */}
      <div className="space-y-3">
        {sortedAssignments.length > 0 ? (
          sortedAssignments.map((assignment) => (
            <TrainCard 
              key={assignment.id} 
              assignment={assignment}
              onOverride={() => setOverrideModal(assignment)}
            />
          ))
        ) : (
          <div className="card p-12 text-center">
            <Train className="w-12 h-12 text-slate-600 mx-auto" />
            <p className="text-slate-400 mt-4">No trains match the current filter</p>
          </div>
        )}
      </div>

      {/* Override Modal */}
      {overrideModal && (
        <OverrideModal
          assignment={overrideModal}
          planId={selectedPlan?.id}
          onClose={() => setOverrideModal(null)}
          onSubmit={handleOverride}
        />
      )}
    </div>
  )
}

