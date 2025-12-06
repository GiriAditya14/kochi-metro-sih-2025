import { Router } from 'express';
import {
  getInductionList,
  runWhatIfSimulation,
  getConflicts,
  getDigitalTwin,
  processNaturalLanguage,
} from '../controllers/dashboardController';
import { validate } from '../middleware/validation';
import {
  whatIfSimulationSchema,
  naturalLanguageQuerySchema,
} from '../utils/validators';

const router = Router();

router.get('/induction-list', getInductionList);
router.post('/what-if', validate(whatIfSimulationSchema), runWhatIfSimulation);
router.get('/conflicts', getConflicts);
router.get('/digital-twin', getDigitalTwin);
router.post('/natural-language', validate(naturalLanguageQuerySchema), processNaturalLanguage);

export default router;



