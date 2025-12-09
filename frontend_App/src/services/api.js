import axios from 'axios';

// For development, use your local IP or localhost
// Change this to your backend URL based on your setup:
// - Android emulator: http://10.0.2.2:8000/api
// - iOS simulator: http://localhost:8000/api  
// - Physical device: http://YOUR_COMPUTER_IP:8000/api (e.g., http://192.168.1.100:8000/api)

const API_BASE = 'http://10.0.2.2:8000/api'; // Android emulator default

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// System
export const getSystemStatus = () => api.get('/system/status');
export const getServicesStatus = () => api.get('/system/services');
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

// Job Cards
export const getJobCards = (params = {}) => api.get('/job-cards', { params });
export const createJobCard = (data) => api.post('/job-cards', data);

// Branding
export const getBrandingContracts = (params = {}) => api.get('/branding-contracts', { params });
export const createBrandingContract = (data) => api.post('/branding-contracts', data);

// Mileage
export const getMileage = (params = {}) => api.get('/mileage', { params });

// Cleaning
export const getCleaningRecords = (params = {}) => api.get('/cleaning', { params });

// Plans
export const generatePlan = (planDate = null) => 
  api.post('/plans/generate', null, { params: { plan_date: planDate } });
export const getPlans = (params = {}) => api.get('/plans', { params });
export const getPlan = (id) => api.get(`/plans/${id}`);
export const approvePlan = (id, approvedBy) => 
  api.put(`/plans/${id}/approve?approved_by=${encodeURIComponent(approvedBy)}`);
export const overrideAssignment = (planId, data) => 
  api.post(`/plans/${planId}/override`, data);

// Scenarios
export const runScenario = (data) => api.post('/scenarios/run', data);

// AI Copilot
export const chatWithCopilot = (message, context = {}) => 
  api.post('/copilot/chat', { message, context });
export const getDailyBriefing = () => api.get('/copilot/daily-briefing');

// Alerts
export const getAlerts = (params = {}) => api.get('/alerts', { params });
export const acknowledgeAlert = (id, acknowledgedBy) => 
  api.put(`/alerts/${id}/acknowledge?acknowledged_by=${encodeURIComponent(acknowledgedBy)}`);
export const resolveAlert = (id, data) => api.put(`/alerts/${id}/resolve`, data);

// Dashboard
export const getDashboardSummary = () => api.get('/dashboard/summary');

// Simulation
export const getSimulationStations = () => api.get('/simulation/stations');
export const runPassengerSimulation = (params) => api.post('/simulation/passenger', params);
export const runEnergySimulation = (params) => api.post('/simulation/energy', params);
export const runCombinedSimulation = (params) => api.post('/simulation/combined', params);

export default api;
