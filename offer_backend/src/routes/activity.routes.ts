import { Router } from 'express';
import { ActivityController } from '../controllers/activity.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// Apply auth middleware to all routes
router.use(authenticate);

/**
 * Activity/Audit Routes
 * Provides comprehensive activity logging and retrieval
 */

// Get activities for a specific offer (accessible by zone users for their offers)
router.get('/offer/:offerReferenceNumber', ActivityController.getOfferActivities);

// Get all activities (admin only)
router.get('/', requireAdmin, ActivityController.getAllActivities);

// Get activities by user (admin only)
router.get('/user/:userId', requireAdmin, ActivityController.getUserActivities);

// Get activity statistics (admin only)
router.get('/stats', requireAdmin, ActivityController.getActivityStats);

// Get real-time activities (admin only)
router.get('/realtime', requireAdmin, ActivityController.getRealtimeActivities);

// Get activity heatmap (admin only)
router.get('/heatmap', requireAdmin, ActivityController.getActivityHeatmap);

export default router;
