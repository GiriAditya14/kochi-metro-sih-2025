import { Router } from 'express';
import {
  agentQuery,
  getTrainStatus,
  submitDecision,
} from '../controllers/agentController';
import { validate } from '../middleware/validation';
import {
  agentQuerySchema,
  decisionSubmitSchema,
} from '../utils/validators';

const router = Router();

router.post('/query', validate(agentQuerySchema), agentQuery);
router.get('/train-status/:trainId', getTrainStatus);
router.post('/decision-submit', validate(decisionSubmitSchema), submitDecision);

export default router;



