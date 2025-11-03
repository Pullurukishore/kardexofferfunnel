import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Sidebar stats (all authenticated users)
router.get('/sidebar-stats', DashboardController.getSidebarStats);

// Admin dashboard (admin only)
router.get('/admin', authorize('ADMIN'), DashboardController.getAdminDashboard);

// Zone dashboard (zone users)
router.get('/zone', authorize('ZONE_USER'), DashboardController.getZoneDashboard);

export default router;
