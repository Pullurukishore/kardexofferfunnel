import { Router } from 'express';
import { ReportsController } from '../controllers/reports.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get analytics report
router.get('/analytics', ReportsController.getAnalyticsReport);

// Export report
router.post('/export/:format', ReportsController.exportReport);

export default router;
