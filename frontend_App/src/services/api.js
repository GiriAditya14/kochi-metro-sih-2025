import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================
// API BASE URL CONFIGURATION
// ============================================
// Change this based on your setup:
//
// LOCAL DEVELOPMENT:
// - Android Emulator: http://10.0.2.2:8000
// - iOS Simulator: http://localhost:8000
// - Physical Device: http://YOUR_COMPUTER_IP:8000 (e.g., http://192.168.1.100:8000)
//
// DEPLOYED SERVER (Render, Railway, etc.):
// - Use your deployed backend URL (e.g., https://kmrl-backend.onrender.com)
// ============================================

// Toggle this for local vs deployed server
const USE_LOCAL_SERVER = true;

// Local development URL (Android emulator)
const LOCAL_API_URL = 'http://10.0.2.2:8000';

// Your deployed backend URL (update this when you deploy)
const DEPLOYED_API_URL = 'https://your-backend-server.onrender.com';

// Final API base URL
const API_BASE = USE_LOCAL_SERVER ? `${LOCAL_API_URL}/api` : `${DEPLOYED_API_URL}/api`;

console.log('[API] Using base URL:', API_BASE);

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// Add request interceptor for auth token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      console.log('[API] Error getting auth token:', e);
    }
    console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('[API] Request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNABORTED') {
      console.error('[API] Request timeout');
    } else if (error.code === 'ERR_NETWORK' || error.message.includes('Network Error')) {
      console.error('[API] Network error - check if backend is running');
      console.error('[API] Attempted URL:', error.config?.baseURL + error.config?.url);
    } else if (error.response) {
      console.error(`[API] Error ${error.response.status}:`, error.response.data);
    }
    return Promise.reject(error);
  }
);

// ============================================
// API ENDPOINTS
// ============================================

// System
export const getSystemStatus = () => api.get('/system/status');
export const getServicesStatus = () => api.get('/system/services');
export const getDatabaseStatus = () => api.get('/system/database');
export const getAIStatus = () => api.get('/system/ai-status');

// Mock Data
export const generateMockData = (clearExisting = true) => 
  api.post(`/mock-data/generate?clear_existing=${clearExisting}`);

// Trains
export const getTrains = (params = {}) => api.get('/trains', { params });
export const getTrain = (id) => api.get(`/trains/${id}`);
export const createTrain = (data) => api.post('/trains', data);
export const updateTrain = (id, data) => api.put(`/trains/${id}`, data);

// Fitness Certificates
export const getCertificates = (params = {}) => api.get('/fitness-certificates', { params });
export const createCertificate = (data) => api.post('/fitness-certificates', data);
export const updateCertificate = (id, data) => api.put(`/fitness-certificates/${id}`, data);

// Job Cards
export const getJobCards = (params = {}) => api.get('/job-cards', { params });
export const createJobCard = (data) => api.post('/job-cards', data);
export const updateJobCard = (id, data) => api.put(`/job-cards/${id}`, data);

// Branding
export const getBrandingContracts = (params = {}) => api.get('/branding-contracts', { params });
export const createBrandingContract = (data) => api.post('/branding-contracts', data);

// Mileage
export const getMileage = (params = {}) => api.get('/mileage', { params });
export const updateMileage = (id, data) => api.put(`/mileage/${id}`, data);

// Cleaning
export const getCleaningRecords = (params = {}) => api.get('/cleaning', { params });
export const updateCleaningRecord = (id, data) => api.put(`/cleaning/${id}`, data);
export const getCleaningBays = () => api.get('/cleaning-bays');

// Depot
export const getDepotTracks = (params = {}) => api.get('/depot/tracks', { params });
export const getTrainPositions = () => api.get('/depot/positions');

// Plans
export const generatePlan = (planDate = null) => 
  api.post('/plans/generate', null, { params: { plan_date: planDate } });
export const getPlans = (params = {}) => api.get('/plans', { params });
export const getPlan = (id) => api.get(`/plans/${id}`);
export const getPlanExplanation = (id, regenerate = false) =>
  api.get(`/plans/${id}/explanation`, { params: { regenerate } });
export const approvePlan = (id, approvedBy) => 
  api.put(`/plans/${id}/approve?approved_by=${encodeURIComponent(approvedBy)}`);
export const overrideAssignment = (planId, data) => 
  api.post(`/plans/${planId}/override`, data);

// Scenarios
export const runScenario = (data) => api.post('/scenarios/run', data);

// AI Copilot
export const chatWithCopilot = (message, context = {}) => 
  api.post('/copilot/chat', { message, context });
export const explainPlan = (planId) => 
  api.post(`/copilot/explain-plan?plan_id=${planId}`);
export const explainAssignment = (trainId, planId) =>
  api.post('/copilot/explain-assignment', { train_id: trainId, plan_id: planId });
export const parseScenario = (text) => 
  api.post('/copilot/parse-scenario', { text });
export const getDailyBriefing = () =>
  api.get('/copilot/daily-briefing');
export const validateData = (dataType, data) =>
  api.post('/copilot/validate-data', { data_type: dataType, data });

// Alerts
export const getAlerts = (params = {}) => api.get('/alerts', { params });
export const acknowledgeAlert = (id, acknowledgedBy) => 
  api.put(`/alerts/${id}/acknowledge?acknowledged_by=${encodeURIComponent(acknowledgedBy)}`);
export const resolveAlert = (id, data) => api.put(`/alerts/${id}/resolve`, data);

// Dashboard
export const getDashboardSummary = () => api.get('/dashboard/summary');

// Override Logs
export const getOverrideLogs = (params = {}) => api.get('/override-logs', { params });

// Simulation
export const getSimulationStations = () => api.get('/simulation/stations');
export const runPassengerSimulation = (params) => api.post('/simulation/passenger', params);
export const runEnergySimulation = (params) => api.post('/simulation/energy', params);
export const runCombinedSimulation = (params) => api.post('/simulation/combined', params);

// Auth
export const verifyPhoneToken = (idToken, phoneNumber) =>
  api.post('/auth/verify-token', { id_token: idToken, phone_number: phoneNumber });
export const me = () => api.get('/auth/me');
export const logout = () => api.post('/auth/logout');


// Data Injection / File Upload
export const extractDataFromFile = (file) => {
  const formData = new FormData();
  formData.append('file', {
    uri: file.uri,
    name: file.name,
    type: file.mimeType || 'application/octet-stream',
  });
  return api.post('/data-injection/extract', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const importExtractedData = (dataType, data) =>
  api.post('/data-injection/import', { data_type: dataType, data });

export const analyzeFile = (file) => {
  const formData = new FormData();
  formData.append('file', {
    uri: file.uri,
    name: file.name,
    type: file.mimeType || 'application/octet-stream',
  });
  return api.post('/data-injection/analyze', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const uploadFileIntelligent = (file, dataType, storeInCloudinary = false) => {
  const formData = new FormData();
  
  // React Native requires this specific format for file uploads
  formData.append('file', {
    uri: file.uri,
    name: file.name || 'upload.file',
    type: file.mimeType || 'application/octet-stream',
  });
  formData.append('data_type', dataType);
  formData.append('store_in_cloudinary', String(storeInCloudinary));
  
  console.log('[API] Uploading file:', file.name, 'as', dataType);
  
  return api.post('/upload/intelligent', formData, {
    headers: { 
      'Content-Type': 'multipart/form-data',
    },
    timeout: 60000, // 60 second timeout for uploads
  });
};

// Helper to update API URL at runtime (useful for settings screen)
export const setApiBaseUrl = (newUrl) => {
  api.defaults.baseURL = `${newUrl}/api`;
  console.log('[API] Base URL updated to:', api.defaults.baseURL);
};

export const getApiBaseUrl = () => api.defaults.baseURL;

export default api;
