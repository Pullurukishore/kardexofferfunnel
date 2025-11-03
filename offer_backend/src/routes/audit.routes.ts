import { Router } from 'express';
import { AuditController } from '../controllers/audit.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Apply auth middleware to all routes
router.use(authenticate);

// Get audit logs for a specific offer
router.get('/offer/:offerReferenceNumber', AuditController.getOfferAuditLogs);

export default router;
