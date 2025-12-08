import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { 
  Train, 
  ArrowLeft,
  Shield,
  Wrench,
  Tag,
  Gauge,
  Sparkles,
  Clock,
  AlertTriangle,
  CheckCircle,
  Loader2,
  MapPin
} from 'lucide-react'
import { getTrain } from '../services/api'

function StatusBadge({ status, type = 'default' }) {
  const getClasses = () => {
    if (type === 'certificate') {
      if (status === 'Valid') return 'badge-success'
      if (status === 'ExpiringSoon') return 'badge-warning'
      if (status === 'Expired' || status === 'Suspended') return 'badge-danger'
      return 'badge-info'
    }
    if (type === 'job') {
      if (status === 'CLOSED') return 'badge-success'
      if (status === 'IN_PROGRESS') return 'badge-info'
      if (status === 'OPEN') return 'badge-warning'
      if (status === 'PENDING_PARTS') return 'badge-danger'
      return 'badge-info'
    }
    if (status === 'active') return 'badge-success'
    if (status === 'under_maintenance') return 'badge-warning'
    return 'badge-danger'
  }

  return <span className={`badge ${getClasses()}`}>{status}</span>
}

function ScoreBar({ score, label, showValue = true }) {
  const getColor = () => {
    if (score >= 80) return 'from-emerald-500 to-emerald-400'
    if (score >= 60) return 'from-blue-500 to-blue-400'
    if (score >= 40) return 'from-amber-500 to-amber-400'
    return 'from-red-500 to-red-400'
  }

  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-slate-400">{label}</span>
        {showValue && <span className="text-slate-300">{score?.toFixed(0) || 0}%</span>}
      </div>
      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full bg-gradient-to-r ${getColor()} transition-all duration-500`}
          style={{ width: `${score || 0}%` }}
        />
      </div>
    </div>
  )
}

function SectionCard({ title, icon: Icon, children, badge }) {
  return (
    <div className="card">
      <div className="card-header flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="w-5 h-5 text-blue-400" />
          <h3 className="font-display font-semibold text-white">{title}</h3>
        </div>
        {badge}
      </div>
      <div className="card-body">{children}</div>
    </div>
  )
}

export default function TrainDetails() {
  const { id } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTrain = async () => {
      try {
        const response = await getTrain(id)
        setData(response.data)
      } catch (err) {
        console.error('Failed to fetch train:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchTrain()
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    )
  }

  if (!data || !data.train) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
        <h2 className="text-xl font-display font-semibold text-white mt-4">Train Not Found</h2>
        <Link to="/" className="btn btn-secondary mt-4">
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
      </div>
    )
  }

  const { train, fitness_certificates, job_cards, branding_contracts, mileage, cleaning, position } = data

  // Calculate overall health metrics
  const validCerts = fitness_certificates?.filter(c => c.status === 'Valid' || c.is_currently_valid).length || 0
  const totalCerts = fitness_certificates?.length || 0
  const openJobs = job_cards?.filter(j => j.status !== 'CLOSED').length || 0
  const safetyJobs = job_cards?.filter(j => j.safety_critical && j.status !== 'CLOSED').length || 0

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link to="/" className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-display font-bold text-white">{train.train_id}</h1>
              <StatusBadge status={train.status} />
            </div>
            <p className="text-slate-400 text-sm mt-1">
              {train.configuration} • {train.manufacturer} • Commissioned {train.commissioning_date ? new Date(train.commissioning_date).toLocaleDateString() : 'N/A'}
            </p>
          </div>
        </div>
        
        <div className="text-right">
          <p className="text-sm text-slate-400">Overall Health Score</p>
          <p className={`text-3xl font-display font-bold ${
            train.overall_health_score >= 80 ? 'text-emerald-400' :
            train.overall_health_score >= 60 ? 'text-amber-400' :
            'text-red-400'
          }`}>
            {train.overall_health_score?.toFixed(0)}%
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <Shield className="w-4 h-4" />
            <span className="text-xs">Certificates</span>
          </div>
          <p className="text-2xl font-display font-bold text-white">{validCerts}/{totalCerts}</p>
          <p className="text-xs text-slate-500">Valid</p>
        </div>
        
        <div className="card p-4">
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <Wrench className="w-4 h-4" />
            <span className="text-xs">Open Jobs</span>
          </div>
          <p className="text-2xl font-display font-bold text-white">{openJobs}</p>
          <p className="text-xs text-slate-500">{safetyJobs} safety critical</p>
        </div>
        
        <div className="card p-4">
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <Gauge className="w-4 h-4" />
            <span className="text-xs">Mileage</span>
          </div>
          <p className="text-2xl font-display font-bold text-white">
            {mileage ? `${(mileage.lifetime_km / 1000).toFixed(1)}k` : 'N/A'}
          </p>
          <p className="text-xs text-slate-500">km lifetime</p>
        </div>
        
        <div className="card p-4">
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <MapPin className="w-4 h-4" />
            <span className="text-xs">Location</span>
          </div>
          <p className="text-2xl font-display font-bold text-white">{train.current_track || 'N/A'}</p>
          <p className="text-xs text-slate-500">Position {train.current_position ?? 'N/A'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fitness Certificates */}
        <SectionCard 
          title="Fitness Certificates" 
          icon={Shield}
          badge={<span className={`badge ${validCerts === totalCerts ? 'badge-success' : 'badge-warning'}`}>
            {validCerts}/{totalCerts} Valid
          </span>}
        >
          <div className="space-y-3">
            {fitness_certificates?.map((cert, idx) => (
              <div key={idx} className="bg-slate-800/50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-white">{cert.department}</span>
                  <StatusBadge status={cert.status} type="certificate" />
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500">Valid Until:</span>
                    <span className="text-slate-300 ml-1">
                      {cert.valid_to ? new Date(cert.valid_to).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">Hours Left:</span>
                    <span className={`ml-1 ${
                      cert.hours_until_expiry < 24 ? 'text-red-400' :
                      cert.hours_until_expiry < 48 ? 'text-amber-400' :
                      'text-slate-300'
                    }`}>
                      {cert.hours_until_expiry?.toFixed(1)}h
                    </span>
                  </div>
                </div>
                {cert.remarks && (
                  <p className="text-xs text-slate-400 mt-2 italic">{cert.remarks}</p>
                )}
                {cert.emergency_override && (
                  <div className="mt-2 text-xs text-amber-400 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Emergency override active
                  </div>
                )}
              </div>
            ))}
            {(!fitness_certificates || fitness_certificates.length === 0) && (
              <p className="text-slate-500 text-center py-4">No certificates found</p>
            )}
          </div>
        </SectionCard>

        {/* Job Cards */}
        <SectionCard 
          title="Job Cards" 
          icon={Wrench}
          badge={openJobs > 0 && <span className="badge badge-warning">{openJobs} Open</span>}
        >
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {job_cards?.map((job, idx) => (
              <div key={idx} className="bg-slate-800/50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs text-slate-400">{job.job_id}</span>
                  <StatusBadge status={job.status} type="job" />
                </div>
                <p className="text-sm text-white mb-2">{job.title}</p>
                <div className="flex items-center gap-3 text-xs">
                  <span className={`${job.safety_critical ? 'text-red-400' : 'text-slate-500'}`}>
                    {job.safety_critical ? '⚠ Safety Critical' : job.job_type}
                  </span>
                  <span className="text-slate-500">•</span>
                  <span className="text-slate-500">
                    Priority {job.priority}
                  </span>
                  {job.due_date && (
                    <>
                      <span className="text-slate-500">•</span>
                      <span className={job.is_overdue ? 'text-red-400' : 'text-slate-500'}>
                        Due: {new Date(job.due_date).toLocaleDateString()}
                      </span>
                    </>
                  )}
                </div>
              </div>
            ))}
            {(!job_cards || job_cards.length === 0) && (
              <p className="text-slate-500 text-center py-4">No job cards found</p>
            )}
          </div>
        </SectionCard>

        {/* Branding Contracts */}
        <SectionCard 
          title="Branding Contracts" 
          icon={Tag}
          badge={branding_contracts?.length > 0 && 
            <span className="badge badge-info">{branding_contracts.length} Active</span>
          }
        >
          {branding_contracts?.length > 0 ? (
            <div className="space-y-3">
              {branding_contracts.map((contract, idx) => (
                <div key={idx} className="bg-slate-800/50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-white">{contract.brand_name}</span>
                    <span className={`badge ${
                      contract.priority === 'platinum' ? 'badge-danger' :
                      contract.priority === 'gold' ? 'badge-warning' :
                      'badge-info'
                    }`}>
                      {contract.priority}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <ScoreBar 
                      score={(contract.current_exposure_hours_week / contract.target_exposure_hours_weekly) * 100}
                      label={`Weekly: ${contract.current_exposure_hours_week?.toFixed(1)}h / ${contract.target_exposure_hours_weekly}h`}
                    />
                    {contract.urgency_score > 50 && (
                      <div className="text-xs text-amber-400 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        {contract.urgency_score?.toFixed(0)}% urgency - needs attention
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-center py-4">No active branding contracts</p>
          )}
        </SectionCard>

        {/* Mileage & Cleaning */}
        <div className="space-y-6">
          {/* Mileage */}
          <SectionCard title="Mileage" icon={Gauge}>
            {mileage ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-500">Lifetime</p>
                    <p className="text-xl font-display font-bold text-white">
                      {(mileage.lifetime_km / 1000).toFixed(1)}k km
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Since Service</p>
                    <p className="text-xl font-display font-bold text-white">
                      {mileage.km_since_last_service?.toFixed(0)} km
                    </p>
                  </div>
                </div>
                <ScoreBar 
                  score={100 - mileage.threshold_risk_score}
                  label={`${mileage.km_to_threshold?.toFixed(0)} km to service threshold`}
                />
                {mileage.is_near_threshold && (
                  <div className="text-xs text-amber-400 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Approaching maintenance threshold
                  </div>
                )}
              </div>
            ) : (
              <p className="text-slate-500 text-center py-4">No mileage data</p>
            )}
          </SectionCard>

          {/* Cleaning */}
          <SectionCard title="Cleaning Status" icon={Sparkles}>
            {cleaning ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Status</span>
                  <StatusBadge status={cleaning.status} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Last Cleaned</span>
                  <span className="text-white">
                    {cleaning.days_since_last_cleaning?.toFixed(1)} days ago
                  </span>
                </div>
                {cleaning.special_clean_required && (
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                    <p className="text-amber-400 text-sm font-medium">Special Cleaning Required</p>
                    <p className="text-xs text-slate-400 mt-1">{cleaning.special_clean_reason}</p>
                  </div>
                )}
                {cleaning.vip_inspection_tomorrow && (
                  <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3">
                    <p className="text-purple-400 text-sm font-medium">VIP Inspection Tomorrow</p>
                    <p className="text-xs text-slate-400 mt-1">{cleaning.vip_inspection_notes}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-slate-500 text-center py-4">No cleaning data</p>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  )
}

