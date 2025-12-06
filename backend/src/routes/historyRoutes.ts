import { Router } from 'express';
import {
  getDecisions,
  submitFeedback,
} from '../controllers/historyController';
import { validate } from '../middleware/validation';
import { feedbackSchema } from '../utils/validators';

const router = Router();

router.get('/decisions', getDecisions);
router.post('/feedback', validate(feedbackSchema), submitFeedback);

export default router;



