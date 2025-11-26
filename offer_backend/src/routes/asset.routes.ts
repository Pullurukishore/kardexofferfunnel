import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { listAssets, getAsset, createAsset, updateAsset, deleteAsset } from '../controllers/asset.controller';

const router = Router();

// All asset routes require authentication
router.use(authenticate);

// List assets (supports search/status/customerId/pagination)
router.get('/', listAssets);

// Get asset by id
router.get('/:id', getAsset);

// Create asset
router.post('/', createAsset);

// Update asset
router.put('/:id', updateAsset);

// Delete asset
router.delete('/:id', deleteAsset);

export default router;
