import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Database,
  Train,
  Shield,
  Wrench,
  Tag,
  Gauge,
  Sparkles,
  Plus,
  Upload,
  Loader2,
  CheckCircle,
  RefreshCw,
  FileSpreadsheet,
  Save,
  X,
  AlertTriangle
} from 'lucide-react'
import {
  getTrains,
  getCertificates,
  getJobCards,
  getBrandingContracts,
  getMileage,
  getCleaningRecords,
  generateMockData
} from '../services/api'
import api from '../services/api'
import { useDepot } from '../contexts/DepotContext'

const getTabs = (t) => [
  { id: 'trains', label: t('dataPlayground.trains'), icon: Train },
  { id: 'certificates', label: t('dataPlayground.certificates'), icon: Shield },
  { id: 'jobs', label: t('dataPlayground.jobs'), icon: Wrench },
  { id: 'branding', label: t('dataPlayground.branding'), icon: Tag },
  { id: 'mileage', label: t('dataPlayground.mileage'), icon: Gauge },
  { id: 'cleaning', label: t('dataPlayground.cleaning'), icon: Sparkles },
]

function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="card max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in">
        <div className="card-header flex items-center justify-between sticky top-0 z-10" style={{ background: 'var(--glass-bg-strong)' }}>
          <h3 className="font-display font-semibold text-slate-900 dark:text-white">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="card-body">{children}</div>
      </div>
    </div>
  )
}

function FormField({ label, required, children, hint }) {
  return (
    <div>
      <label className="text-sm text-slate-600 dark:text-slate-400 block mb-1.5">
        {label} {required && <span className="text-red-600 dark:text-red-400">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">{hint}</p>}
    </div>
  )
}

function TrainForm({ onSubmit, onClose, trains }) {
  const [form, setForm] = useState({
    train_id: '',
    train_number: '',
    name: '',
    configuration: '3-car',
    status: 'active',
    depot_id: 'MUTTOM'
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/trains', form)
      onSubmit()
      onClose()
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Train ID" required hint="e.g., TS-201">
          <input
            type="text"
            value={form.train_id}
            onChange={e => setForm({ ...form, train_id: e.target.value })}
            placeholder="TS-201"
            className="input w-full"
            required
          />
        </FormField>
        <FormField label="Train Number" required>
          <input
            type="number"
            value={form.train_number}
            onChange={e => setForm({ ...form, train_number: e.target.value })}
            placeholder="1"
            className="input w-full"
            required
          />
        </FormField>
      </div>

      <FormField label="Name">
        <input
          type="text"
          value={form.name}
          onChange={e => setForm({ ...form, name: e.target.value })}
          placeholder="KMRL Trainset 1"
          className="input w-full"
        />
      </FormField>

      <div className="grid grid-cols-3 gap-4">
        <FormField label="Configuration">
          <select
            value={form.configuration}
            onChange={e => setForm({ ...form, configuration: e.target.value })}
            className="input w-full"
          >
            <option value="3-car">3-car</option>
            <option value="6-car">6-car</option>
          </select>
        </FormField>
        <FormField label="Status">
          <select
            value={form.status}
            onChange={e => setForm({ ...form, status: e.target.value })}
            className="input w-full"
          >
            <option value="active">Active</option>
            <option value="under_maintenance">Under Maintenance</option>
            <option value="out_of_service">Out of Service</option>
          </select>
        </FormField>
        <FormField label="Depot">
          <select
            value={form.depot_id}
            onChange={e => setForm({ ...form, depot_id: e.target.value })}
            className="input w-full"
          >
            <option value="MUTTOM">Muttom</option>
            <option value="DEPOT2">Future Depot</option>
          </select>
        </FormField>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
        <button type="button" onClick={onClose} className="btn btn-ghost">Cancel</button>
        <button type="submit" disabled={loading} className="btn btn-primary">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Add Train
        </button>
      </div>
    </form>
  )
}

function CertificateForm({ onSubmit, onClose, trains }) {
  const [form, setForm] = useState({
    train_id: '',
    department: 'RollingStock',
    status: 'Valid',
    criticality: 'hard',
    valid_from: new Date().toISOString().split('T')[0],
    valid_to: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    remarks: '',
    is_conditional: false,
    condition_notes: '',
    emergency_override: false,
    override_approved_by: '',
    override_reason: ''
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/fitness-certificates', {
        ...form,
        valid_from: new Date(form.valid_from).toISOString(),
        valid_to: new Date(form.valid_to).toISOString()
      })
      onSubmit()
      onClose()
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Train" required>
          <select
            value={form.train_id}
            onChange={e => setForm({ ...form, train_id: e.target.value })}
            className="input w-full"
            required
          >
            <option value="">Select Train</option>
            {trains.map(t => (
              <option key={t.id} value={t.id}>{t.train_id}</option>
            ))}
          </select>
        </FormField>
        <FormField label="Department" required>
          <select
            value={form.department}
            onChange={e => setForm({ ...form, department: e.target.value })}
            className="input w-full"
          >
            <option value="RollingStock">Rolling Stock</option>
            <option value="Signalling">Signalling (CBTC/ATP)</option>
            <option value="Telecom">Telecom</option>
          </select>
        </FormField>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <FormField label="Status">
          <select
            value={form.status}
            onChange={e => setForm({ ...form, status: e.target.value })}
            className="input w-full"
          >
            <option value="Valid">Valid</option>
            <option value="ExpiringSoon">Expiring Soon</option>
            <option value="Expired">Expired</option>
            <option value="Suspended">Suspended</option>
            <option value="Conditional">Conditional</option>
          </select>
        </FormField>
        <FormField label="Valid From">
          <input
            type="date"
            value={form.valid_from}
            onChange={e => setForm({ ...form, valid_from: e.target.value })}
            className="input w-full"
          />
        </FormField>
        <FormField label="Valid To">
          <input
            type="date"
            value={form.valid_to}
            onChange={e => setForm({ ...form, valid_to: e.target.value })}
            className="input w-full"
          />
        </FormField>
      </div>

      <FormField label="Remarks">
        <textarea
          value={form.remarks}
          onChange={e => setForm({ ...form, remarks: e.target.value })}
          placeholder="Any observations or notes..."
          className="input w-full h-20 resize-none"
        />
      </FormField>

      <div className="bg-slate-800/50 rounded-lg p-4 space-y-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.is_conditional}
            onChange={e => setForm({ ...form, is_conditional: e.target.checked })}
            className="rounded"
          />
          <span className="text-sm text-slate-700 dark:text-slate-300">Conditional Validity</span>
        </label>
        {form.is_conditional && (
          <FormField label="Condition Notes" hint="e.g., Valid only at reduced speed">
            <input
              type="text"
              value={form.condition_notes}
              onChange={e => setForm({ ...form, condition_notes: e.target.value })}
              placeholder="Valid only at reduced speed..."
              className="input w-full"
            />
          </FormField>
        )}

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.emergency_override}
            onChange={e => setForm({ ...form, emergency_override: e.target.checked })}
            className="rounded"
          />
          <span className="text-sm text-amber-400">Emergency Override</span>
        </label>
        {form.emergency_override && (
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Approved By">
              <input
                type="text"
                value={form.override_approved_by}
                onChange={e => setForm({ ...form, override_approved_by: e.target.value })}
                placeholder="Operations Manager"
                className="input w-full"
              />
            </FormField>
            <FormField label="Override Reason">
              <input
                type="text"
                value={form.override_reason}
                onChange={e => setForm({ ...form, override_reason: e.target.value })}
                placeholder="Critical service requirement"
                className="input w-full"
              />
            </FormField>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
        <button type="button" onClick={onClose} className="btn btn-ghost">Cancel</button>
        <button type="submit" disabled={loading} className="btn btn-primary">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Add Certificate
        </button>
      </div>
    </form>
  )
}

function JobCardForm({ onSubmit, onClose, trains }) {
  const [form, setForm] = useState({
    train_id: '',
    job_type: 'preventive',
    priority: 3,
    status: 'OPEN',
    title: '',
    description: '',
    related_component: '',
    due_date: '',
    estimated_downtime_hours: 0,
    safety_critical: false,
    requires_ibl: false,
    parts_available: true
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/job-cards', {
        ...form,
        due_date: form.due_date ? new Date(form.due_date).toISOString() : null
      })
      onSubmit()
      onClose()
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Train" required>
          <select
            value={form.train_id}
            onChange={e => setForm({ ...form, train_id: e.target.value })}
            className="input w-full"
            required
          >
            <option value="">Select Train</option>
            {trains.map(t => (
              <option key={t.id} value={t.id}>{t.train_id}</option>
            ))}
          </select>
        </FormField>
        <FormField label="Job Type">
          <select
            value={form.job_type}
            onChange={e => setForm({ ...form, job_type: e.target.value })}
            className="input w-full"
          >
            <option value="preventive">Preventive (Scheduled)</option>
            <option value="corrective">Corrective (Fault-based)</option>
            <option value="inspection">Inspection</option>
            <option value="overhaul">Overhaul</option>
            <option value="emergency">Emergency</option>
          </select>
        </FormField>
      </div>

      <FormField label="Title" required>
        <input
          type="text"
          value={form.title}
          onChange={e => setForm({ ...form, title: e.target.value })}
          placeholder="Brake pad replacement"
          className="input w-full"
          required
        />
      </FormField>

      <FormField label="Description">
        <textarea
          value={form.description}
          onChange={e => setForm({ ...form, description: e.target.value })}
          placeholder="Detailed work description..."
          className="input w-full h-20 resize-none"
        />
      </FormField>

      <div className="grid grid-cols-3 gap-4">
        <FormField label="Component">
          <select
            value={form.related_component}
            onChange={e => setForm({ ...form, related_component: e.target.value })}
            className="input w-full"
          >
            <option value="">Select Component</option>
            <option value="bogie">Bogie</option>
            <option value="brake">Brake System</option>
            <option value="door">Door Mechanism</option>
            <option value="HVAC">HVAC</option>
            <option value="traction">Traction Motor</option>
            <option value="pantograph">Pantograph</option>
            <option value="coupler">Coupler</option>
            <option value="PA_system">PA System</option>
          </select>
        </FormField>
        <FormField label="Priority" hint="1=Critical, 5=Routine">
          <select
            value={form.priority}
            onChange={e => setForm({ ...form, priority: parseInt(e.target.value) })}
            className="input w-full"
          >
            <option value={1}>1 - Critical (Immediate)</option>
            <option value={2}>2 - High (24 hours)</option>
            <option value={3}>3 - Medium (72 hours)</option>
            <option value={4}>4 - Low (1 week)</option>
            <option value={5}>5 - Routine (Planned)</option>
          </select>
        </FormField>
        <FormField label="Status">
          <select
            value={form.status}
            onChange={e => setForm({ ...form, status: e.target.value })}
            className="input w-full"
          >
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="PENDING_PARTS">Pending Parts</option>
            <option value="DEFERRED">Deferred</option>
            <option value="CLOSED">Closed</option>
          </select>
        </FormField>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Due Date">
          <input
            type="date"
            value={form.due_date}
            onChange={e => setForm({ ...form, due_date: e.target.value })}
            className="input w-full"
          />
        </FormField>
        <FormField label="Est. Downtime (hours)">
          <input
            type="number"
            step="0.5"
            value={form.estimated_downtime_hours}
            onChange={e => setForm({ ...form, estimated_downtime_hours: parseFloat(e.target.value) })}
            className="input w-full"
          />
        </FormField>
      </div>

      <div className="bg-slate-800/50 rounded-lg p-4 space-y-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.safety_critical}
            onChange={e => setForm({ ...form, safety_critical: e.target.checked })}
            className="rounded"
          />
          <span className="text-sm text-red-600 dark:text-red-400 font-medium">⚠️ Safety Critical</span>
          <span className="text-xs text-slate-500 dark:text-slate-500">(Blocks revenue service)</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.requires_ibl}
            onChange={e => setForm({ ...form, requires_ibl: e.target.checked })}
            className="rounded"
          />
          <span className="text-sm text-amber-400">Requires IBL</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.parts_available}
            onChange={e => setForm({ ...form, parts_available: e.target.checked })}
            className="rounded"
          />
          <span className="text-sm text-slate-700 dark:text-slate-300">Parts Available</span>
        </label>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
        <button type="button" onClick={onClose} className="btn btn-ghost">Cancel</button>
        <button type="submit" disabled={loading} className="btn btn-primary">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Add Job Card
        </button>
      </div>
    </form>
  )
}

function BrandingForm({ onSubmit, onClose, trains }) {
  const [form, setForm] = useState({
    train_id: '',
    brand_name: '',
    campaign_name: '',
    priority: 'silver',
    campaign_start: new Date().toISOString().split('T')[0],
    campaign_end: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    target_exposure_hours_weekly: 50,
    target_exposure_hours_monthly: 200,
    required_time_band: 'all_day',
    penalty_per_hour_shortfall: 100
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/branding-contracts', {
        ...form,
        campaign_start: new Date(form.campaign_start).toISOString(),
        campaign_end: new Date(form.campaign_end).toISOString()
      })
      onSubmit()
      onClose()
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Train" required>
          <select
            value={form.train_id}
            onChange={e => setForm({ ...form, train_id: e.target.value })}
            className="input w-full"
            required
          >
            <option value="">Select Train</option>
            {trains.map(t => (
              <option key={t.id} value={t.id}>{t.train_id}</option>
            ))}
          </select>
        </FormField>
        <FormField label="Brand Name" required>
          <input
            type="text"
            value={form.brand_name}
            onChange={e => setForm({ ...form, brand_name: e.target.value })}
            placeholder="Muthoot Finance"
            className="input w-full"
            required
          />
        </FormField>
      </div>

      <FormField label="Campaign Name">
        <input
          type="text"
          value={form.campaign_name}
          onChange={e => setForm({ ...form, campaign_name: e.target.value })}
          placeholder="Summer Campaign 2024"
          className="input w-full"
        />
      </FormField>

      <div className="grid grid-cols-3 gap-4">
        <FormField label="Priority">
          <select
            value={form.priority}
            onChange={e => setForm({ ...form, priority: e.target.value })}
            className="input w-full"
          >
            <option value="platinum">Platinum (Premium)</option>
            <option value="gold">Gold (High)</option>
            <option value="silver">Silver (Standard)</option>
            <option value="bronze">Bronze (Basic)</option>
          </select>
        </FormField>
        <FormField label="Campaign Start">
          <input
            type="date"
            value={form.campaign_start}
            onChange={e => setForm({ ...form, campaign_start: e.target.value })}
            className="input w-full"
          />
        </FormField>
        <FormField label="Campaign End">
          <input
            type="date"
            value={form.campaign_end}
            onChange={e => setForm({ ...form, campaign_end: e.target.value })}
            className="input w-full"
          />
        </FormField>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Target Weekly Hours">
          <input
            type="number"
            value={form.target_exposure_hours_weekly}
            onChange={e => setForm({ ...form, target_exposure_hours_weekly: parseFloat(e.target.value) })}
            className="input w-full"
          />
        </FormField>
        <FormField label="Target Monthly Hours">
          <input
            type="number"
            value={form.target_exposure_hours_monthly}
            onChange={e => setForm({ ...form, target_exposure_hours_monthly: parseFloat(e.target.value) })}
            className="input w-full"
          />
        </FormField>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Required Time Band">
          <select
            value={form.required_time_band}
            onChange={e => setForm({ ...form, required_time_band: e.target.value })}
            className="input w-full"
          >
            <option value="all_day">All Day</option>
            <option value="peak_only">Peak Hours Only</option>
            <option value="off_peak">Off-Peak Only</option>
          </select>
        </FormField>
        <FormField label="Penalty Rate (₹/hour shortfall)">
          <input
            type="number"
            value={form.penalty_per_hour_shortfall}
            onChange={e => setForm({ ...form, penalty_per_hour_shortfall: parseFloat(e.target.value) })}
            className="input w-full"
          />
        </FormField>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
        <button type="button" onClick={onClose} className="btn btn-ghost">Cancel</button>
        <button type="submit" disabled={loading} className="btn btn-primary">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Add Contract
        </button>
      </div>
    </form>
  )
}

function IntelligentUploadModal({ isOpen, onClose, onUpload, dataType }) {
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [previewing, setPreviewing] = useState(false)
  const [result, setResult] = useState(null)
  const [preview, setPreview] = useState(null)
  const [storeInCloud, setStoreInCloud] = useState(true)
  const [useIntelligent, setUseIntelligent] = useState(true)

  const sampleFormats = {
    trains: 'train_id,train_number,name,configuration,status,depot_id\nTS-201,1,Trainset 1,3-car,active,MUTTOM',
    certificates: 'train_id,department,status,valid_from,valid_to,remarks\nTS-201,RollingStock,Valid,2024-01-01,2024-12-31,All systems nominal',
    'job-cards': 'train_id,job_id,title,job_type,priority,status,safety_critical,due_date\nTS-201,WO-001,Brake inspection,preventive,3,OPEN,false,2024-03-15',
    branding: 'train_id,brand_name,priority,campaign_start,campaign_end,target_weekly_hours,penalty_rate\nTS-201,Muthoot Finance,gold,2024-01-01,2024-06-30,50,100'
  }

  const handlePreview = async () => {
    if (!file) return
    setPreviewing(true)
    setPreview(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('data_type', dataType === 'jobs' ? 'job-cards' : dataType)

      const response = await api.post('/upload/parse-preview', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      setPreview(response.data)
    } catch (err) {
      setPreview({ parsing_success: false, error: err.message })
    } finally {
      setPreviewing(false)
    }
  }

  const handleUpload = async () => {
    if (!file) return
    setLoading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('data_type', dataType === 'jobs' ? 'job-cards' : dataType)
      formData.append('store_in_cloudinary', storeInCloud)

      const endpoint = useIntelligent ? '/upload/intelligent' : `/upload/${dataType === 'jobs' ? 'job-cards' : dataType}`

      const response = await api.post(endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      setResult(response.data)
      if (response.data.status === 'success' || response.data.records_saved > 0) {
        onUpload()
      }
    } catch (err) {
      setResult({ status: 'error', message: err.message })
    } finally {
      setLoading(false)
    }
  }

  const resetModal = () => {
    setFile(null)
    setResult(null)
    setPreview(null)
  }

  const fileExt = file?.name?.split('.').pop()?.toLowerCase()
  const isPDF = fileExt === 'pdf'

  return (
    <Modal isOpen={isOpen} onClose={() => { resetModal(); onClose(); }} title={`Upload ${dataType}`}>
      <div className="space-y-4">
        {/* AI Badge */}
        <div className="flex items-center gap-2 text-purple-400 bg-purple-500/10 border border-purple-500/20 rounded-lg p-3">
          <Sparkles className="w-5 h-5" />
          <div>
            <p className="text-sm font-medium">AI-Powered Data Ingestion</p>
            <p className="text-xs text-purple-300">Supports CSV, PDF, and text files with intelligent parsing</p>
          </div>
        </div>

        {/* Sample Format */}
        {!isPDF && (
          <div className="rounded-lg p-4" style={{ background: 'rgba(var(--color-bg-tertiary), 0.5)' }}>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Expected CSV format:</p>
            <pre className="text-xs text-slate-700 dark:text-slate-300 p-3 rounded overflow-x-auto" style={{ background: 'rgba(var(--color-bg-tertiary), 0.8)' }}>
              {sampleFormats[dataType] || 'train_id,field1,field2,...'}
            </pre>
          </div>
        )}

        {/* File Drop Zone */}
        <div className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${file ? 'border-blue-500/50 bg-blue-500/5' : 'border-slate-700 hover:border-slate-600'
          }`}>
          <input
            type="file"
            accept=".csv,.pdf,.txt"
            onChange={e => { setFile(e.target.files[0]); setResult(null); setPreview(null); }}
            className="hidden"
            id="intelligent-upload"
          />
          <label htmlFor="intelligent-upload" className="cursor-pointer">
            {isPDF ? (
              <Database className="w-12 h-12 text-purple-600 dark:text-purple-400 mx-auto mb-3" />
            ) : (
              <FileSpreadsheet className="w-12 h-12 text-slate-500 dark:text-slate-500 mx-auto mb-3" />
            )}
            <p className="text-slate-700 dark:text-slate-300">
              {file ? file.name : 'Click to select file'}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
              Supports CSV, PDF, and TXT files
            </p>
            {isPDF && (
              <p className="text-xs text-purple-400 mt-2">
                📄 PDF detected - will use Groq LLM for intelligent extraction
              </p>
            )}
          </label>
        </div>

        {/* Options */}
        <div className="bg-slate-800/50 rounded-lg p-4 space-y-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={storeInCloud}
              onChange={e => setStoreInCloud(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-slate-700 dark:text-slate-300">Store file in Cloudinary</span>
            <span className="text-xs text-slate-500 dark:text-slate-500">(recommended for audit)</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={useIntelligent}
              onChange={e => setUseIntelligent(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-slate-700 dark:text-slate-300">Use AI-powered parsing</span>
            <span className="text-xs text-slate-500 dark:text-slate-500">(Groq LLM for better mapping)</span>
          </label>
        </div>

        {/* Preview Results */}
        {preview && (
          <div className={`rounded-lg p-4 ${preview.parsing_success ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
            {preview.parsing_success ? (
              <div>
                <div className="flex items-center gap-2 text-emerald-400 mb-2">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">Preview: {preview.records_count} records found</span>
                </div>
                {preview.method && (
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">Method: {preview.method}</p>
                )}
                {preview.preview?.length > 0 && (
                  <div className="rounded p-2 max-h-40 overflow-auto" style={{ background: 'rgba(var(--color-bg-tertiary), 0.8)' }}>
                    <pre className="text-xs text-slate-700 dark:text-slate-300">
                      {JSON.stringify(preview.preview[0], null, 2)}
                    </pre>
                    {preview.preview.length > 1 && (
                      <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">...and {preview.preview.length - 1} more</p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-red-400">
                <AlertTriangle className="w-5 h-5" />
                <span>Preview failed: {preview.error}</span>
              </div>
            )}
          </div>
        )}

        {/* Upload Results */}
        {result && (
          <div className={`rounded-lg p-4 ${result.status === 'success' ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-amber-500/10 border border-amber-500/30'}`}>
            {result.status === 'success' || result.records_saved > 0 ? (
              <div>
                <div className="flex items-center gap-2 text-emerald-400 mb-2">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">Upload Successful!</span>
                </div>
                <div className="text-sm text-slate-700 dark:text-slate-300 space-y-1">
                  <p>📊 Records parsed: {result.records_parsed}</p>
                  <p>✅ Records saved: {result.records_saved}</p>
                  {result.cloudinary_url && (
                    <p>☁️ File stored: <a href={result.cloudinary_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">View in Cloudinary</a></p>
                  )}
                  {result.parsing_method && (
                    <p>🤖 Method: {result.parsing_method}</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-amber-400">
                <AlertTriangle className="w-5 h-5" />
                <span>Error: {result.message || 'Upload failed'}</span>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-4 border-t border-slate-800">
          <button
            onClick={handlePreview}
            disabled={!file || previewing || loading}
            className="btn btn-ghost text-sm"
          >
            {previewing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
            Preview Data
          </button>

          <div className="flex gap-3">
            <button onClick={() => { resetModal(); onClose(); }} className="btn btn-ghost">Cancel</button>
            <button onClick={handleUpload} disabled={!file || loading} className="btn btn-primary">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              Upload & Save
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}

function DataTable({ columns, data, onEdit }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b" style={{ borderColor: 'rgb(var(--color-border))' }}>
            {columns.map(col => (
              <th key={col.key} className="text-left text-xs text-slate-600 dark:text-slate-400 font-medium px-4 py-3">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr key={idx} className="table-row">
              {columns.map(col => (
                <td key={col.key} className="px-4 py-3 text-sm">
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {data.length === 0 && (
        <div className="text-center py-12 text-slate-500">
          <Database className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No data available</p>
          <p className="text-xs mt-1">Add records using the form or upload a CSV file</p>
        </div>
      )}
    </div>
  )
}

function StatusBadge({ value, type = 'default' }) {
  const getColor = () => {
    if (type === 'status') {
      if (value === 'Valid' || value === 'active' || value === 'CLOSED' || value === 'ok') return 'badge-success'
      if (value === 'ExpiringSoon' || value === 'DEFERRED' || value === 'due') return 'badge-warning'
      if (value === 'Expired' || value === 'Suspended' || value === 'OPEN' || value === 'overdue') return 'badge-danger'
      return 'badge-info'
    }
    if (type === 'priority') {
      if (value === 1 || value === 'platinum') return 'badge-danger'
      if (value === 2 || value === 'gold') return 'badge-warning'
      return 'badge-info'
    }
    return 'badge-info'
  }

  return <span className={`badge ${getColor()}`}>{value}</span>
}

export default function DataPlayground() {
  const { t } = useTranslation()
  const tabs = getTabs(t)
  const [activeTab, setActiveTab] = useState('trains')
  const [data, setData] = useState({})
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [success, setSuccess] = useState(null)
  const [modalOpen, setModalOpen] = useState(null) // 'add' | 'csv' | null
  const [csvUploadType, setCsvUploadType] = useState(null)
  const { selectedDepot, updateFromTrains } = useDepot()

  const fetchData = async () => {
    setLoading(true)
    try {
      const [trains, certs, jobs, branding, mileage, cleaning] = await Promise.all([
        getTrains(),
        getCertificates(),
        getJobCards(),
        getBrandingContracts(),
        getMileage(),
        getCleaningRecords()
      ])

      setData({
        trains: trains.data.trains || [],
        certificates: certs.data.certificates || [],
        jobs: jobs.data.job_cards || [],
        branding: branding.data.contracts || [],
        mileage: mileage.data.mileage_data || [],
        cleaning: cleaning.data.cleaning_records || []
      })
      updateFromTrains(trains.data.trains || [])
    } catch (err) {
      console.error('Failed to fetch data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const trainFilter = useMemo(() => {
    const ids = new Set()
    const codes = new Set()
    ;(data.trains || []).forEach(t => {
      const matchesDepot = selectedDepot === 'ALL' || t.depot_id === selectedDepot
      if (matchesDepot) {
        if (t.id) ids.add(t.id)
        if (t.train_id) codes.add(t.train_id)
      }
    })
    return { ids, codes }
  }, [data.trains, selectedDepot])

  const filterDataByDepot = (rows, tabId) => {
    const list = rows || []
    if (selectedDepot === 'ALL') return list
    if (tabId === 'trains') return list.filter(t => t.depot_id === selectedDepot)
    return list.filter(item => trainFilter.ids.has(item.train_id) || trainFilter.codes.has(item.train_id))
  }

  const handleGenerateMock = async () => {
    setGenerating(true)
    try {
      await generateMockData(true)
      await fetchData()
      setSuccess('Demo data generated! This includes 25 trains with realistic edge cases.')
      setTimeout(() => setSuccess(null), 5000)
    } catch (err) {
      console.error('Failed to generate:', err)
    } finally {
      setGenerating(false)
    }
  }

  const trainColumns = [
    { key: 'train_id', label: 'Train ID', render: v => <span className="font-mono text-slate-900 dark:text-white">{v}</span> },
    { key: 'configuration', label: 'Config' },
    { key: 'status', label: 'Status', render: v => <StatusBadge value={v} type="status" /> },
    { key: 'depot_id', label: 'Depot' },
    { key: 'current_track', label: 'Track' },
    {
      key: 'overall_health_score', label: 'Health', render: v => (
        <div className="flex items-center gap-2">
          <div className="w-16 h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${v >= 80 ? 'bg-emerald-500' : v >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
              style={{ width: `${v}%` }}
            />
          </div>
          <span className="text-xs text-slate-600 dark:text-slate-400">{v?.toFixed(0)}%</span>
        </div>
      )
    },
  ]

  const certColumns = [
    { key: 'certificate_number', label: 'Cert #', render: v => <span className="font-mono text-xs">{v}</span> },
    { key: 'train_id', label: 'Train ID' },
    { key: 'department', label: 'Dept', render: v => <span className="text-blue-400">{v}</span> },
    { key: 'status', label: 'Status', render: v => <StatusBadge value={v} type="status" /> },
    { key: 'valid_to', label: 'Valid Until', render: v => v ? new Date(v).toLocaleDateString() : '-' },
    {
      key: 'hours_until_expiry', label: 'Hours Left', render: v => (
        <span className={v < 24 ? 'text-red-600 dark:text-red-400' : v < 48 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-600 dark:text-slate-400'}>
          {v?.toFixed(1)}h
        </span>
      )
    },
  ]

  const jobColumns = [
    { key: 'job_id', label: 'Job ID', render: v => <span className="font-mono text-xs">{v}</span> },
    { key: 'train_id', label: 'Train ID' },
    { key: 'title', label: 'Title', render: v => <span className="truncate max-w-xs block">{v}</span> },
    { key: 'priority', label: 'Priority', render: v => <StatusBadge value={v} type="priority" /> },
    { key: 'status', label: 'Status', render: v => <StatusBadge value={v} type="status" /> },
    { key: 'safety_critical', label: 'Safety', render: v => v ? <span className="text-red-600 dark:text-red-400 font-medium">⚠️ Critical</span> : <span className="text-slate-500 dark:text-slate-500">-</span> },
    { key: 'due_date', label: 'Due', render: v => v ? new Date(v).toLocaleDateString() : '-' },
  ]

  const brandingColumns = [
    { key: 'brand_name', label: 'Brand', render: v => <span className="text-slate-900 dark:text-white font-medium">{v}</span> },
    { key: 'train_id', label: 'Train ID' },
    { key: 'priority', label: 'Priority', render: v => <StatusBadge value={v} type="priority" /> },
    { key: 'target_exposure_hours_weekly', label: 'Target Weekly', render: v => `${v?.toFixed(0)}h` },
    {
      key: 'weekly_deficit', label: 'Deficit', render: v => (
        <span className={v > 0 ? 'text-red-400' : 'text-emerald-400'}>
          {v > 0 ? `-${v?.toFixed(1)}h` : 'On track'}
        </span>
      )
    },
    {
      key: 'urgency_score', label: 'Urgency', render: v => (
        <span className={v > 70 ? 'text-red-400' : v > 40 ? 'text-amber-400' : 'text-emerald-400'}>
          {v?.toFixed(0)}%
        </span>
      )
    },
  ]

  const mileageColumns = [
    { key: 'train_id', label: 'Train ID' },
    { key: 'lifetime_km', label: 'Lifetime', render: v => `${(v / 1000)?.toFixed(1)}k km` },
    { key: 'km_since_last_service', label: 'Since Service', render: v => `${v?.toFixed(0)} km` },
    {
      key: 'km_to_threshold', label: 'To Threshold', render: (v, row) => (
        <span className={row.is_near_threshold ? 'text-amber-600 dark:text-amber-400' : 'text-slate-600 dark:text-slate-400'}>
          {v?.toFixed(0)} km
        </span>
      )
    },
    {
      key: 'threshold_risk_score', label: 'Risk', render: v => (
        <span className={v >= 70 ? 'text-red-400' : v >= 40 ? 'text-amber-400' : 'text-emerald-400'}>
          {v?.toFixed(0)}%
        </span>
      )
    },
  ]

  const cleaningColumns = [
    { key: 'train_id', label: 'Train ID' },
    { key: 'status', label: 'Status', render: v => <StatusBadge value={v} type="status" /> },
    {
      key: 'days_since_last_cleaning', label: 'Days Since', render: v => (
        <span className={v > 2 ? 'text-red-400' : v > 1 ? 'text-amber-400' : 'text-emerald-400'}>
          {v?.toFixed(1)} days
        </span>
      )
    },
    { key: 'special_clean_required', label: 'Special', render: v => v ? <span className="text-amber-400">Required</span> : '-' },
    { key: 'vip_inspection_tomorrow', label: 'VIP', render: v => v ? <span className="text-purple-400">Tomorrow</span> : '-' },
  ]

  const getColumns = () => {
    switch (activeTab) {
      case 'trains': return trainColumns
      case 'certificates': return certColumns
      case 'jobs': return jobColumns
      case 'branding': return brandingColumns
      case 'mileage': return mileageColumns
      case 'cleaning': return cleaningColumns
      default: return []
    }
  }

  const getData = (tabId = activeTab) => filterDataByDepot(data[tabId] || [], tabId)

  const renderForm = () => {
    switch (activeTab) {
      case 'trains':
        return <TrainForm onSubmit={fetchData} onClose={() => setModalOpen(null)} trains={getData('trains')} />
      case 'certificates':
        return <CertificateForm onSubmit={fetchData} onClose={() => setModalOpen(null)} trains={getData('trains')} />
      case 'jobs':
        return <JobCardForm onSubmit={fetchData} onClose={() => setModalOpen(null)} trains={getData('trains')} />
      case 'branding':
        return <BrandingForm onSubmit={fetchData} onClose={() => setModalOpen(null)} trains={getData('trains')} />
      default:
        return <p className="text-slate-600 dark:text-slate-400">Form not available for this data type.</p>
    }
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
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white">{t('dataPlayground.title')}</h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
            {t('dataPlayground.subtitle')}
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchData} className="btn btn-ghost">
            <RefreshCw className="w-4 h-4" />
            {t('common.refresh')}
          </button>
          <button
            onClick={handleGenerateMock}
            disabled={generating}
            className="btn btn-secondary"
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {t('dataPlayground.generateDemo')}
          </button>
        </div>
      </div>

      {/* Success message */}
      {success && (
        <div className="card border-emerald-500/20 bg-emerald-500/10 p-4 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-400" />
          <span className="text-emerald-400">{success}</span>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-6 gap-4">
        {tabs.map(tab => {
          const Icon = tab.icon
          const count = getData(tab.id).length
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`card p-4 text-left transition-all ${activeTab === tab.id
                ? 'border-blue-500/50 bg-blue-500/10'
                : 'hover:border-slate-700'
                }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400'}`} />
                <span className={`text-xs ${activeTab === tab.id ? 'text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400'}`}>
                  {tab.label}
                </span>
              </div>
              <p className="text-2xl font-display font-bold text-slate-900 dark:text-white">{count}</p>
            </button>
          )
        })}
      </div>

      {/* Data Table */}
      <div className="card">
        <div className="card-header flex items-center justify-between">
          <h2 className="font-display font-semibold text-slate-900 dark:text-white">
            {tabs.find(t => t.id === activeTab)?.label}
          </h2>
          <div className="flex gap-2">
            {['trains', 'certificates', 'jobs', 'branding'].includes(activeTab) && (
              <>
                <button
                  onClick={() => { setCsvUploadType(activeTab); setModalOpen('csv') }}
                  className="btn btn-ghost text-sm"
                >
                  <Upload className="w-4 h-4" />
                  {t('dataPlayground.uploadFile')}
                </button>
                <button
                  onClick={() => setModalOpen('add')}
                  className="btn btn-primary text-sm"
                >
                  <Plus className="w-4 h-4" />
                  {t('dataPlayground.add')} {tabs.find(t => t.id === activeTab)?.label}
                </button>
              </>
            )}
          </div>
        </div>
        <DataTable columns={getColumns()} data={getData()} />
      </div>

      {/* Info Card */}
      <div className="card p-4">
        <h3 className="font-medium text-slate-900 dark:text-white mb-3">{t('dataPlayground.integrationSources')}</h3>
        <div className="grid grid-cols-4 gap-4 text-sm">
          <div className="rounded-lg p-3" style={{ background: 'rgba(var(--color-bg-tertiary), 0.5)' }}>
            <p className="text-blue-600 dark:text-blue-400 font-medium">IBM Maximo</p>
            <p className="text-slate-600 dark:text-slate-400 text-xs mt-1">{t('dataPlayground.maximoDesc')}</p>
          </div>
          <div className="rounded-lg p-3" style={{ background: 'rgba(var(--color-bg-tertiary), 0.5)' }}>
            <p className="text-emerald-600 dark:text-emerald-400 font-medium">UNS/IoT Streams</p>
            <p className="text-slate-600 dark:text-slate-400 text-xs mt-1">{t('dataPlayground.iotDesc')}</p>
          </div>
          <div className="rounded-lg p-3" style={{ background: 'rgba(var(--color-bg-tertiary), 0.5)' }}>
            <p className="text-amber-600 dark:text-amber-400 font-medium">{t('dataPlayground.manualEntry')}</p>
            <p className="text-slate-600 dark:text-slate-400 text-xs mt-1">{t('dataPlayground.manualDesc')}</p>
          </div>
          <div className="rounded-lg p-3" style={{ background: 'rgba(var(--color-bg-tertiary), 0.5)' }}>
            <p className="text-purple-600 dark:text-purple-400 font-medium">{t('dataPlayground.csvImport')}</p>
            <p className="text-slate-600 dark:text-slate-400 text-xs mt-1">{t('dataPlayground.csvDesc')}</p>
          </div>
        </div>
      </div>

      {/* Add Form Modal */}
      <Modal
        isOpen={modalOpen === 'add'}
        onClose={() => setModalOpen(null)}
        title={`Add ${tabs.find(t => t.id === activeTab)?.label.slice(0, -1) || 'Record'}`}
      >
        {renderForm()}
      </Modal>

      {/* Intelligent File Upload Modal */}
      <IntelligentUploadModal
        isOpen={modalOpen === 'csv'}
        onClose={() => setModalOpen(null)}
        onUpload={fetchData}
        dataType={csvUploadType}
      />
    </div>
  )
}
