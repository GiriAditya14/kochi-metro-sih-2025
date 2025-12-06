import { Router } from 'express';
import {
  ingestMaximoData,
  ingestFitnessCertificate,
  ingestMileage,
  ingestWhatsAppLog,
} from '../controllers/ingestionController';
import { validate } from '../middleware/validation';
import {
  maximoIngestionSchema,
  fitnessCertificateSchema,
  mileageIngestionSchema,
  whatsappLogSchema,
} from '../utils/validators';

const router = Router();

router.post('/maximo', validate(maximoIngestionSchema), ingestMaximoData);
router.post('/fitness-certificate', validate(fitnessCertificateSchema), ingestFitnessCertificate);
router.post('/mileage', validate(mileageIngestionSchema), ingestMileage);
router.post('/whatsapp-log', validate(whatsappLogSchema), ingestWhatsAppLog);

export default router;



