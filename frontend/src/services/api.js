import axios from 'axios'

const API_BASE = '/api'

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  }
})

// System
export const getSystemStatus = () => api.get('/system/status')
export const getServicesStatus = () => api.get('/system/services')
export const getDatabaseStatus = () => api.get('/system/database')
export const getAIStatus = () => api.get('/system/ai-status')

// Mock Data
export const generateMockData = (clearExisting = true) => 
  api.post(`/mock-data/generate?clear_existing=${clearExisting}`)

// Trains
export const getTrains = (params = {}) => api.get('/trains', { params })
export const getTrain = (id) => api.get(`/trains/${id}`)
export const createTrain = (data) => api.post('/trains', data)
export const updateTrain = (id, data) => api.put(`/trains/${id}`, data)

// Fitness Certificates
export const getCertificates = (params = {}) => api.get('/fitness-certificates', { params })
export const createCertificate = (data) => api.post('/fitness-certificates', data)
export const updateCertificate = (id, data) => api.put(`/fitness-certificates/${id}`, data)

// Job Cards
export const getJobCards = (params = {}) => api.get('/job-cards', { params })
export const createJobCard = (data) => api.post('/job-cards', data)
export const updateJobCard = (id, data) => api.put(`/job-cards/${id}`, data)

// Branding
export const getBrandingContracts = (params = {}) => api.get('/branding-contracts', { params })
export const createBrandingContract = (data) => api.post('/branding-contracts', data)

// Mileage
export const getMileage = (params = {}) => api.get('/mileage', { params })
export const updateMileage = (id, data) => api.put(`/mileage/${id}`, data)

// Cleaning
export const getCleaningRecords = (params = {}) => api.get('/cleaning', { params })
export const updateCleaningRecord = (id, data) => api.put(`/cleaning/${id}`, data)
export const getCleaningBays = () => api.get('/cleaning-bays')

// Depot
export const getDepotTracks = (params = {}) => api.get('/depot/tracks', { params })
export const getTrainPositions = () => api.get('/depot/positions')

// Plans
export const generatePlan = (planDate = null) => 
  api.post('/plans/generate', null, { params: { plan_date: planDate } })
export const getPlans = (params = {}) => api.get('/plans', { params })
export const getPlan = (id) => api.get(`/plans/${id}`)
export const getPlanExplanation = (id, regenerate = false) =>
  api.get(`/plans/${id}/explanation`, { params: { regenerate } })
export const approvePlan = (id, approvedBy) => 
  api.put(`/plans/${id}/approve?approved_by=${encodeURIComponent(approvedBy)}`)
export const overrideAssignment = (planId, data) => 
  api.post(`/plans/${planId}/override`, data)

// Scenarios
export const runScenario = (data) => api.post('/scenarios/run', data)

// AI Copilot
export const chatWithCopilot = (message, context = {}) => 
  api.post('/copilot/chat', { message, context })
export const explainPlan = (planId) => 
  api.post(`/copilot/explain-plan?plan_id=${planId}`)
export const explainAssignment = (trainId, planId) =>
  api.post('/copilot/explain-assignment', { train_id: trainId, plan_id: planId })
export const parseScenario = (text) => 
  api.post('/copilot/parse-scenario', { text })
export const getDailyBriefing = () =>
  api.get('/copilot/daily-briefing')
export const validateData = (dataType, data) =>
  api.post('/copilot/validate-data', { data_type: dataType, data })

// Intelligent File Upload
export const uploadFileIntelligent = (file, dataType, storeInCloudinary = true) => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('data_type', dataType)
  formData.append('store_in_cloudinary', storeInCloudinary)
  return api.post('/upload/intelligent', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

export const previewFileParsing = (file, dataType) => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('data_type', dataType)
  return api.post('/upload/parse-preview', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

export const getUploadSchema = (dataType) =>
  api.get(`/upload/schema/${dataType}`)

// Alerts
export const getAlerts = (params = {}) => api.get('/alerts', { params })
export const acknowledgeAlert = (id, acknowledgedBy) => 
  api.put(`/alerts/${id}/acknowledge?acknowledged_by=${encodeURIComponent(acknowledgedBy)}`)
export const resolveAlert = (id, data) => api.put(`/alerts/${id}/resolve`, data)

// Dashboard
export const getDashboardSummary = () => api.get('/dashboard/summary')

// Override Logs
export const getOverrideLogs = (params = {}) => api.get('/override-logs', { params })

export default api
