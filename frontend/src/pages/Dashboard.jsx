import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Train,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Wrench,
  Sparkles,
  BarChart3,
  ChevronRight,
  Loader2,
  RefreshCw,
  Target,
  Shield,
  Zap,
  Brain,
  FileText,
  Calendar
} from 'lucide-react'
import { getDashboardSummary, generateMockData, generatePlan } from '../services/api'
import api from '../services/api'

function StatCard({ icon: Icon, label, value, subValue, trend, color = 'blue', alert = false }) {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-emerald-500 to-emerald-600',
    orange: 'from-orange-500 to-orange-600',
    red: 'from-red-500 to-red-600',
    purple: 'from-purple-500 to-purple-600'
  }

  return (
    <div className={`card p-5 relative overflow-hidden group transition-all ${alert ? 'border-red-500/30' : ''}`}>
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${colorClasses[color]} opacity-5 rounded-full -mr-10 -mt-10 group-hover:opacity-10 transition-opacity`} />

      {alert && (
        <div className="absolute top-2 right-2">
          <span className="flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
        </div>
      )}

      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-600 dark:text-slate-400 text-sm">{label}</p>
          <p className="text-3xl font-display font-bold text-slate-900 dark:text-white mt-1">{value}</p>
          {subValue && (
            <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">{subValue}</p>
          )}
        </div>
        <div className={`p-3 rounded-xl bg-gradient-to-br ${colorClasses[color]} shadow-lg`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>

      {trend !== undefined && (
        <div className={`flex items-center gap-1 mt-3 text-xs ${trend >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
          <TrendingUp className={`w-3 h-3 ${trend < 0 ? 'rotate-180' : ''}`} />
          <span>{Math.abs(trend)}% from yesterday</span>
        </div>
      )}
    </div>
  )
}

function AIStatusCard({ enabled, t }) {
  return (
    <div className={`card p-5 ${enabled ? 'border-purple-500/30' : 'border-amber-500/30'}`}>
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-xl ${enabled ? 'bg-purple-500/20' : 'bg-amber-500/20'}`}>
          <Brain className={`w-6 h-6 ${enabled ? 'text-purple-500 dark:text-purple-400' : 'text-amber-500 dark:text-amber-400'}`} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-slate-900 dark:text-white">{t('dashboard.aiCopilot')}</h3>
            <span className={`badge ${enabled ? 'badge-success' : 'badge-warning'}`}>
              {enabled ? t('dashboard.active') : t('dashboard.disabled')}
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            {enabled
              ? t('dashboard.aiProviding')
              : t('dashboard.setApiKey')
            }
          </p>
        </div>
        {enabled && (
          <div className="text-right">
            <p className="text-xs text-slate-500 dark:text-slate-500">{t('dashboard.poweredBy')}</p>
            <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">{t('dashboard.googleGemini')}</p>
          </div>
        )}
      </div>
    </div>
  )
}

function AlertItem({ severity, title, message, time }) {
  const severityConfig = {
    critical: { color: 'red', icon: AlertTriangle },
    warning: { color: 'amber', icon: AlertTriangle },
    info: { color: 'blue', icon: Clock }
  }

  const config = severityConfig[severity] || severityConfig.info
  const Icon = config.icon

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800/50 transition-colors">
      <div className={`p-2 rounded-lg bg-${config.color}-500/20`}>
        <Icon className={`w-4 h-4 text-${config.color}-600 dark:text-${config.color}-400`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{title}</p>
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 truncate">{message}</p>
      </div>
      <span className="text-xs text-slate-500 dark:text-slate-500">{time}</span>
    </div>
  )
}

export default function Dashboard() {
  const { t } = useTranslation()
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [planLoading, setPlanLoading] = useState(false)
  const [briefing, setBriefing] = useState(null)
  const [briefingLoading, setBriefingLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchSummary = async () => {
    try {
      setLoading(true)
      const response = await getDashboardSummary()
      setSummary(response.data)
      setError(null)
    } catch (err) {
      console.error('Failed to fetch summary:', err)
      setError('Failed to connect to server. Is the backend running on port 8000?')
    } finally {
      setLoading(false)
    }
  }

  const fetchBriefing = async () => {
    setBriefingLoading(true)
    try {
      const response = await api.get('/copilot/daily-briefing')
      setBriefing(response.data)
    } catch (err) {
      console.error('Failed to fetch briefing:', err)
    } finally {
      setBriefingLoading(false)
    }
  }

  useEffect(() => {
    fetchSummary()
  }, [])

  useEffect(() => {
    if (summary?.ai_enabled) {
      fetchBriefing()
    }
  }, [summary?.ai_enabled])

  const handleGenerateMockData = async () => {
    setGenerating(true)
    try {
      await generateMockData(true)
      await fetchSummary()
    } catch (err) {
      console.error('Failed to generate mock data:', err)
      setError('Failed to generate mock data')
    } finally {
      setGenerating(false)
    }
  }

  const handleGeneratePlan = async () => {
    setPlanLoading(true)
    try {
      await generatePlan()
      await fetchSummary()
    } catch (err) {
      console.error('Failed to generate plan:', err)
    } finally {
      setPlanLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto" />
          <p className="text-slate-600 dark:text-slate-400 mt-4">{t('common.loading')}</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center max-w-md">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
          <h2 className="text-xl font-display font-semibold text-slate-900 dark:text-white mt-4">Connection Error</h2>
          <p className="text-slate-600 dark:text-slate-400 mt-2">{error}</p>
          <div className="flex gap-3 justify-center mt-6">
            <button onClick={fetchSummary} className="btn btn-secondary">
              <RefreshCw className="w-4 h-4" />
              Retry Connection
            </button>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-500 mt-4">
            Make sure the backend is running: <code className="text-blue-600 dark:text-blue-400">python -m uvicorn app.main:app --reload --port 8000</code>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white">{t('dashboard.title')}</h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
            {t('app.operations')}
          </p>
        </div>
        <div className="flex gap-3">
          {summary?.fleet?.total === 0 && (
            <button
              onClick={handleGenerateMockData}
              disabled={generating}
              className="btn btn-secondary"
            >
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {t('dashboard.loadDemoData')}
            </button>
          )}
          <button
            onClick={handleGeneratePlan}
            disabled={planLoading || summary?.fleet?.total === 0}
            className="btn btn-primary"
          >
            {planLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Target className="w-4 h-4" />}
            {t('dashboard.generateTonightsPlan')}
          </button>
        </div>
      </div>

      {/* AI Status */}
      <AIStatusCard enabled={summary?.ai_enabled} t={t} />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Train}
          label={t('dashboard.activeTrains')}
          value={summary?.fleet?.active || 0}
          subValue={`${t('dashboard.of')} ${summary?.fleet?.total || 0} ${t('dashboard.trainsActive')}`}
          color="blue"
        />
        <StatCard
          icon={Shield}
          label={t('dashboard.certificatesValid')}
          value={summary?.fleet?.total ? (summary.fleet.total * 3 - (summary?.certificates?.expired || 0) - (summary?.certificates?.expiring_soon || 0)) : 0}
          subValue={`${summary?.certificates?.expiring_soon || 0} ${t('dashboard.expiringWithin48h')}`}
          color={summary?.certificates?.expired > 0 ? 'red' : 'green'}
          alert={summary?.certificates?.expired > 0}
        />
        <StatCard
          icon={Wrench}
          label={t('dashboard.openJobs')}
          value={summary?.maintenance?.open_jobs || 0}
          subValue={`${summary?.maintenance?.safety_critical || 0} ${t('dashboard.safetyCritical')}`}
          color={summary?.maintenance?.safety_critical > 0 ? 'orange' : 'blue'}
          alert={summary?.maintenance?.safety_critical > 0}
        />
        <StatCard
          icon={BarChart3}
          label={t('dashboard.brandingSLAs')}
          value={summary?.branding?.active_contracts || 0}
          subValue={`${summary?.branding?.at_risk || 0} ${t('dashboard.atRiskOfPenalty')}`}
          color={summary?.branding?.at_risk > 0 ? 'orange' : 'green'}
        />
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Latest Plan */}
        <div className="lg:col-span-2 card">
          <div className="card-header flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h2 className="font-display font-semibold text-slate-900 dark:text-white">{t('dashboard.latestPlan')}</h2>
            </div>
            <Link
              to="/planner"
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1"
            >
              {t('dashboard.viewDetails')} <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="card-body">
            {summary?.latest_plan ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 dark:text-slate-400 text-sm">{t('dashboard.planId')}</p>
                    <p className="text-slate-900 dark:text-white font-mono">{summary.latest_plan.plan_id}</p>
                  </div>
                  <div className={`badge ${summary.latest_plan.status === 'approved' ? 'badge-success' :
                    summary.latest_plan.status === 'proposed' ? 'badge-info' :
                      'badge-warning'
                    }`}>
                    {summary.latest_plan.status?.toUpperCase()}
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4 pt-4 border-t" style={{ borderColor: 'rgb(var(--color-border))' }}>
                  <div className="text-center">
                    <p className="text-2xl font-display font-bold text-emerald-600 dark:text-emerald-400">
                      {summary.latest_plan.trains_in_service || 0}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{t('dashboard.service')}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-display font-bold text-blue-600 dark:text-blue-400">
                      {summary.latest_plan.trains_standby || 0}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{t('dashboard.standby')}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-display font-bold text-amber-600 dark:text-amber-400">
                      {summary.latest_plan.trains_ibl || 0}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{t('dashboard.ibl')}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-display font-bold text-slate-600 dark:text-slate-400">
                      {summary.latest_plan.trains_out_of_service || 0}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{t('dashboard.outOfService')}</p>
                  </div>
                </div>

                {summary.latest_plan.ai_explanation && (
                  <div className="pt-4 border-t" style={{ borderColor: 'rgb(var(--color-border))' }}>
                    <div className="flex items-center gap-2 mb-2">
                      <Brain className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">{t('dashboard.aiGeneratedExplanation')}</span>
                    </div>
                    <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-3">
                      {summary.latest_plan.ai_explanation.substring(0, 300)}...
                    </p>
                    <Link to="/planner" className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mt-2 inline-block">
                      {t('dashboard.readFullExplanation')}
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <Train className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto" />
                <p className="text-slate-600 dark:text-slate-400 mt-4">{t('dashboard.noPlanGenerated')}</p>
                <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                  {summary?.fleet?.total > 0
                    ? t('dashboard.clickGeneratePlan')
                    : t('dashboard.loadDemoDataFirst')
                  }
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Alerts */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h2 className="font-display font-semibold text-slate-900 dark:text-white">{t('dashboard.activeAlerts')}</h2>
            <Link
              to="/alerts"
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1"
            >
              {t('dashboard.viewAll')} <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="p-2 space-y-1 max-h-80 overflow-y-auto">
            {(summary?.alerts?.unresolved > 0 || summary?.certificates?.expired > 0 || summary?.maintenance?.safety_critical > 0) ? (
              <>
                {summary.alerts?.critical > 0 && (
                  <AlertItem
                    severity="critical"
                    title={`${summary.alerts.critical} ${t('dashboard.criticalAlerts')}`}
                    message={t('dashboard.requireAttention')}
                    time={t('dashboard.now')}
                  />
                )}
                {summary.certificates?.expired > 0 && (
                  <AlertItem
                    severity="warning"
                    title={t('dashboard.certificatesExpired')}
                    message={`${summary.certificates.expired} ${t('dashboard.certificatesNeedRenewal')}`}
                    time={t('dashboard.today')}
                  />
                )}
                {summary.maintenance?.safety_critical > 0 && (
                  <AlertItem
                    severity="warning"
                    title={t('dashboard.safetyJobsPending')}
                    message={`${summary.maintenance.safety_critical} ${t('dashboard.safetyCriticalJobsOpen')}`}
                    time={t('dashboard.today')}
                  />
                )}
                {summary.branding?.at_risk > 0 && (
                  <AlertItem
                    severity="info"
                    title={t('dashboard.brandingSLARisk')}
                    message={`${summary.branding.at_risk} ${t('dashboard.contractsNeedAttention')}`}
                    time={t('dashboard.thisWeek')}
                  />
                )}
                {summary.cleaning?.overdue > 0 && (
                  <AlertItem
                    severity="info"
                    title={t('dashboard.cleaningOverdue')}
                    message={`${summary.cleaning.overdue} ${t('dashboard.trainsNeedCleaning')}`}
                    time={t('dashboard.today')}
                  />
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-emerald-500/50 mx-auto" />
                <p className="text-slate-600 dark:text-slate-400 mt-4">All systems operational</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI Daily Briefing */}
      {summary?.ai_enabled && (
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <h2 className="font-display font-semibold text-slate-900 dark:text-white">{t('dashboard.aiDailyBriefing')}</h2>
            </div>
            <button
              onClick={fetchBriefing}
              disabled={briefingLoading}
              className="btn btn-ghost text-sm"
            >
              {briefingLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              {t('common.refresh')}
            </button>
          </div>
          <div className="card-body">
            {briefingLoading ? (
              <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>{t('dashboard.generatingBriefing')}</span>
              </div>
            ) : briefing ? (
              <div className="prose prose-sm max-w-none">
                <div
                  className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{
                    __html: briefing.briefing
                      .replace(/#{1,3}\s/g, '')
                      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-slate-900 dark:text-white">$1</strong>')
                      .replace(/\n/g, '<br />')
                  }}
                />
              </div>
            ) : (
              <p className="text-slate-500 dark:text-slate-500">{t('dashboard.clickRefresh')}</p>
            )}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          to="/planner"
          className="card p-5 hover:border-blue-500/50 transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:bg-blue-500/20 transition-colors">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-slate-900 dark:text-white">{t('dashboard.nightInductionPlanner')}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">{t('dashboard.reviewApprove')}</p>
            </div>
          </div>
        </Link>

        <Link
          to="/simulator"
          className="card p-5 hover:border-purple-500/50 transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 group-hover:bg-purple-500/20 transition-colors">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-slate-900 dark:text-white">{t('dashboard.whatIfSimulator')}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">{t('dashboard.testScenarios')}</p>
            </div>
          </div>
        </Link>

        <Link
          to="/data"
          className="card p-5 hover:border-orange-500/50 transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 group-hover:bg-orange-500/20 transition-colors">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-slate-900 dark:text-white">{t('dashboard.dataPlayground')}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">{t('dashboard.uploadData')}</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  )
}
