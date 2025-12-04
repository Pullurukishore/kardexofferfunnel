import { Router } from 'express';
import { ForecastController } from '../controllers/forecast.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/summary', ForecastController.getSummary);
router.get('/zone-user-breakdown', ForecastController.getBreakdown);
router.get('/po-expected', ForecastController.getPoExpected);
router.get('/highlights', ForecastController.getHighlights);
router.get('/export', ForecastController.exportExcel);

export default router;
