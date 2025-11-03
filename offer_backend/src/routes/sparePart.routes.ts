import { Router } from 'express';
import { SparePartController } from '../controllers/sparePart.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all spare parts (both admin and zone users)
router.get('/', SparePartController.getSpareParts);

// Get spare part categories
router.get('/categories', SparePartController.getCategories);

// Get single spare part
router.get('/:id', SparePartController.getSparePart);

// Create spare part (admin only)
router.post('/', authorize('ADMIN'), SparePartController.createSparePart);

// Update spare part (admin only)
router.put('/:id', authorize('ADMIN'), SparePartController.updateSparePart);

// Delete spare part (admin only)
router.delete('/:id', authorize('ADMIN'), SparePartController.deleteSparePart);

// Bulk update prices (admin only)
router.patch('/bulk/prices', authorize('ADMIN'), SparePartController.bulkUpdatePrices);

export default router;
