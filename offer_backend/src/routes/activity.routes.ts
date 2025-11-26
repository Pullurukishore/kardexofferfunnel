import { Router } from 'express';
import { ActivityController } from '../controllers/activity.controller';
import { authenticate, requireAdmin, requireZoneManagerOrAdmin } from '../middleware/auth.middleware';

const router = Router();

// Apply auth middleware to all routes
router.use(authenticate);

/**
 * Activity/Audit Routes
 * Provides comprehensive activity logging and retrieval with advanced analytics
 */

// ============================================
// ADMIN-ONLY ROUTES (Analytics & Monitoring)
// ============================================

// Get all activities with filtering and pagination (admin only)
router.get('/', requireAdmin, ActivityController.getAllActivities);

// Get comprehensive activity statistics (admin only)
router.get('/stats', requireAdmin, ActivityController.getActivityStats);

// Get real-time activity stream (admin only)
router.get('/realtime', requireAdmin, ActivityController.getRealtimeActivities);

// Get activity heatmap data (admin only)
router.get('/heatmap', requireAdmin, ActivityController.getActivityHeatmap);

// Get activity comparison between periods (admin only)
router.get('/comparison', requireAdmin, ActivityController.getActivityComparison);

// Get activity summary by entity type (admin only)
router.get('/by-entity', requireAdmin, ActivityController.getActivityByEntity);

// Get user activity leaderboard (admin only)
router.get('/leaderboard', requireAdmin, ActivityController.getUserLeaderboard);

// Export activities to CSV/JSON (admin only)
router.get('/export', requireAdmin, ActivityController.exportActivities);

// Get activities by specific user (admin only)
router.get('/user/:userId', requireAdmin, ActivityController.getUserActivities);

// ============================================
// ZONE MANAGER ROUTES (Zone-Specific Activities)
// ============================================

// Get activities for zone manager's zone only (zone manager + admin)
router.get('/zone', requireZoneManagerOrAdmin, ActivityController.getZoneActivities);

// ============================================
// SECURITY & COMPLIANCE ROUTES
// ============================================

// Get security alerts and suspicious activities (admin only)
router.get('/security-alerts', requireAdmin, ActivityController.getSecurityAlerts);

// Get workflow analysis and business process insights (admin only)
router.get('/workflow-analysis', requireAdmin, ActivityController.getWorkflowAnalysis);

// Get compliance and audit report (admin only)
router.get('/compliance-report', requireAdmin, ActivityController.getComplianceReport);

// ============================================
// USER-ACCESSIBLE ROUTES
// ============================================

// Get activities for a specific offer (accessible by zone users for their offers)
router.get('/offer/:offerReferenceNumber', ActivityController.getOfferActivities);

export default router;
