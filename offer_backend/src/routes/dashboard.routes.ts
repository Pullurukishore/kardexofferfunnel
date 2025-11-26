import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { cacheMiddleware } from '../middleware/cache.middleware';
import { rateLimitMiddleware } from '../middleware/rateLimit.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Apply rate limiting for 20-user performance (reduced from 100 to 60 requests per minute)
router.use(rateLimitMiddleware({
  windowMs: 60000,    // 1 minute
  max: 60,            // 60 requests per minute per user (reduced from 100)
  keyGenerator: (req) => (req.user?.id || req.ip || 'unknown').toString()
}));

// Sidebar stats (all authenticated users) - cached for 30 seconds
router.get('/sidebar-stats', 
  cacheMiddleware({ ttl: 30000 }), 
  DashboardController.getSidebarStats
);

// Admin dashboard (admin only) - cached for 2 minutes
router.get('/admin', 
  authorize('ADMIN'), 
  cacheMiddleware({ ttl: 120000 }), 
  DashboardController.getAdminDashboard
);

// Zone dashboard (zone users and admin) - cached for 1 minute
router.get('/zone', 
  cacheMiddleware({ ttl: 60000 }), 
  DashboardController.getZoneDashboard
);

// Zone Manager dashboard (zone managers only) - cached for 1 minute
router.get('/zone-manager', 
  authorize('ZONE_MANAGER'), 
  cacheMiddleware({ ttl: 60000 }), 
  DashboardController.getZoneManagerDashboard
);

export default router;
