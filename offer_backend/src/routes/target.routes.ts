import { Router } from 'express';
import { TargetController } from '../controllers/target.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// Zone Targets - Admin only for write operations, Zone users can view their zone
router.post('/zones', authenticate, requireAdmin, TargetController.setZoneTarget);
router.put('/zones/:targetId', authenticate, requireAdmin, TargetController.updateZoneTarget);
router.get('/zones', authenticate, TargetController.getZoneTargets); // Allow zone users to view
router.delete('/zones/:targetId', authenticate, requireAdmin, TargetController.deleteZoneTarget);

// User Targets - Admin only for write operations, Zone users can view their zone users
router.post('/users', authenticate, requireAdmin, TargetController.setUserTarget);
router.put('/users/:targetId', authenticate, requireAdmin, TargetController.updateUserTarget);
router.get('/users', authenticate, TargetController.getUserTargets); // Allow zone users to view
router.delete('/users/:targetId', authenticate, requireAdmin, TargetController.deleteUserTarget);

// Dashboard - Allow zone users to view their zone
router.get('/dashboard', authenticate, TargetController.getTargetDashboard);

export default router;
