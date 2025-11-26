import { Router } from 'express';
import { ReportsController } from '../controllers/reports.controller';
import { TargetController } from '../controllers/target.controller';
import { authenticate } from '../middleware/auth.middleware';
import { cacheMiddleware } from '../middleware/cache.middleware';
import { rateLimitMiddleware } from '../middleware/rateLimit.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Apply rate limiting for reports (heavy queries)
router.use(rateLimitMiddleware({
  windowMs: 60000,    // 1 minute
  max: 50,            // 50 report requests per minute per user
  keyGenerator: (req) => (req.user?.id || req.ip || 'unknown').toString()
}));

// Main report generation endpoint (new comprehensive system) - cached for 2 minutes
router.get('/generate', 
  cacheMiddleware({ ttl: 120000 }), 
  ReportsController.generateReport
);

// Offer summary report - cached for 1 minute
router.get('/offer-summary', 
  cacheMiddleware({ ttl: 60000 }), 
  ReportsController.generateReport
);

// Target report - cached for 2 minutes
router.get('/target-report', 
  cacheMiddleware({ ttl: 120000 }), 
  ReportsController.generateTargetReport
);

// Get analytics report - cached for 2 minutes
router.get('/analytics', 
  cacheMiddleware({ ttl: 120000 }), 
  ReportsController.getAnalyticsReport
);

// Export report - cached for 5 minutes
router.get('/export', 
  cacheMiddleware({ ttl: 300000 }), 
  ReportsController.exportReport
);

// Get full offer details for view option - cached for 5 minutes
router.get('/offers/:offerId', 
  cacheMiddleware({ ttl: 300000 }), 
  ReportsController.getOfferDetails
);

// Get full target details (unified endpoint for zone and user targets) - cached for 5 minutes
router.get('/targets/:targetId', 
  cacheMiddleware({ ttl: 300000 }), 
  ReportsController.getOfferDetails
);

// User target details - cached for 5 minutes
router.get('/user-targets/details', 
  cacheMiddleware({ ttl: 300000 }), 
  TargetController.getUserTargetDetails
);

// Zone target details - cached for 5 minutes
router.get('/zone-targets/details', 
  cacheMiddleware({ ttl: 300000 }), 
  TargetController.getZoneTargetDetails
);

// Product Type Analysis Report - cached for 2 minutes
router.get('/product-type-analysis', 
  cacheMiddleware({ ttl: 120000 }), 
  ReportsController.getProductTypeAnalysis
);

// Customer Performance Report - cached for 2 minutes
router.get('/customer-performance', 
  cacheMiddleware({ ttl: 120000 }), 
  ReportsController.getCustomerPerformance
);

export default router;
