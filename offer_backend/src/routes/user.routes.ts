import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// Admin only routes
router.use(requireAdmin);

/**
 * User Management Routes
 * All routes require admin privileges
 */

// Get all users with filters
router.get('/', UserController.getAllUsers);

// Get user statistics
router.get('/stats', UserController.getUserStats);

// Get single user
router.get('/:userId', UserController.getUserById);

// Create new user
router.post('/', UserController.createUser);

// Update user
router.put('/:userId', UserController.updateUser);

// Delete user
router.delete('/:userId', UserController.deleteUser);

// Bulk update user status
router.post('/bulk/status', UserController.bulkUpdateStatus);

// Change user password
router.post('/:userId/change-password', UserController.changePassword);

export default router;
