import { Router } from 'express';
import {
  handleEmergencyBreakdown,
  getEmergencyPlan,
  approveEmergencyPlan,
  getActiveEmergencies,
  getCrisisMode,
  triggerFullFleetReoptimization,
  reassignRoute,
  reduceFrequency,
  resolveEmergency,
} from '../controllers/emergencyController';

const router = Router();

/**
 * Emergency Handling Routes
 */

// Emergency breakdown handling
router.post('/breakdown', handleEmergencyBreakdown);

// Emergency plan management
router.get('/plan/:emergencyLogId', getEmergencyPlan);
router.post('/plan/approve', approveEmergencyPlan);

// Active emergencies
router.get('/active', getActiveEmergencies);
router.post('/:emergencyLogId/resolve', resolveEmergency);

// Crisis mode
router.get('/crisis', getCrisisMode);
router.post('/crisis/reoptimize', triggerFullFleetReoptimization);

// Route and frequency management
router.post('/route/reassign', reassignRoute);
router.post('/frequency/reduce', reduceFrequency);

export default router;


