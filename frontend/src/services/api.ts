import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for auth tokens
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized
      localStorage.removeItem('token');
    }
    return Promise.reject(error);
  }
);

// Dashboard APIs
export const dashboardApi = {
  getInductionList: (date?: string) =>
    api.get('/dashboard/induction-list', {
      params: { date, includeReasoning: true },
    }),
  
  runWhatIfSimulation: (scenario: any, targetDate?: string) =>
    api.post('/dashboard/what-if', { scenario, targetDate }),
  
  getConflicts: () =>
    api.get('/dashboard/conflicts'),
  
  getDigitalTwin: () =>
    api.get('/dashboard/digital-twin'),
  
  processNaturalLanguage: (query: string, language: string) =>
    api.post('/dashboard/natural-language', { query, language }),
};

// Emergency APIs
export const emergencyApi = {
  getActiveEmergencies: () =>
    api.get('/emergency/active'),
  
  getEmergencyPlan: (emergencyLogId: number) =>
    api.get(`/emergency/plan/${emergencyLogId}`),
  
  approveEmergencyPlan: (planId: number, approved: boolean, approvedBy: string, notes?: string) =>
    api.post('/emergency/plan/approve', { planId, approved, approvedBy, notes }),
  
  getCrisisMode: () =>
    api.get('/emergency/crisis'),
  
  triggerFullFleetReoptimization: () =>
    api.post('/emergency/crisis/reoptimize'),
  
  resolveEmergency: (emergencyLogId: number, resolutionNotes?: string) =>
    api.post(`/emergency/${emergencyLogId}/resolve`, { resolutionNotes }),
};

// History APIs
export const historyApi = {
  getDecisions: (startDate?: string, endDate?: string, trainId?: number) =>
    api.get('/history/decisions', {
      params: { startDate, endDate, trainId },
    }),
  
  submitFeedback: (decisionId: number, feedback: any) =>
    api.post('/history/feedback', { decisionId, feedback }),
};

export default api;

