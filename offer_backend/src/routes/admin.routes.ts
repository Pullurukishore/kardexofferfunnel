import { Router } from 'express';
import {
  getDashboardStats,
  getAllOffers,
  getAllUsers,
  createUser,
  getAllZones,
  getAnalytics,
  getActivityLogs,
  getZoneUsers
} from '../controllers/admin.controller';
import { authenticateToken, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// Zone management routes - Allow all authenticated users (zone managers, admins, etc.)
router.get('/zones', authenticateToken, getAllZones);

// User management routes - Allow all authenticated users to view users
router.get('/users', authenticateToken, getAllUsers);

// Zone-specific users route - For zone managers to get filtered users
router.get('/zone-users', authenticateToken, getZoneUsers);

// Apply authentication and admin check to remaining routes
router.use(authenticateToken);
router.use(requireAdmin);

// Dashboard routes
router.get('/dashboard/stats', getDashboardStats);

// Offer management routes
router.get('/offers', getAllOffers);

// User management routes (admin-only)
router.post('/users', createUser);

// Analytics routes
router.get('/analytics', getAnalytics);

// Activity logs routes
router.get('/activity-logs', getActivityLogs);

export default router;
