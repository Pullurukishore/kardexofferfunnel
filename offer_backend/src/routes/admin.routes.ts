import { Router } from 'express';
import {
  getDashboardStats,
  getAllOffers,
  getAllUsers,
  createUser,
  getAllZones,
  getAnalytics,
  getActivityLogs
} from '../controllers/admin.controller';
import { authenticateToken, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// Apply authentication and admin check to all routes
router.use(authenticateToken);
router.use(requireAdmin);

// Dashboard routes
router.get('/dashboard/stats', getDashboardStats);

// Offer management routes
router.get('/offers', getAllOffers);

// User management routes
router.get('/users', getAllUsers);
router.post('/users', createUser);

// Zone management routes
router.get('/zones', getAllZones);

// Analytics routes
router.get('/analytics', getAnalytics);

// Activity logs routes
router.get('/activity-logs', getActivityLogs);

export default router;
