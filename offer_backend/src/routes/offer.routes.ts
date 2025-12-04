import { Router } from 'express';
import { OfferController } from '../controllers/offer.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get next offer reference number (for preview)
router.get('/next-reference', OfferController.getNextOfferReferenceNumber);

// Quote generation endpoints (must come before /:id route)
// Zone manager/user quote endpoint
router.get('/quote/zone/:id', OfferController.getOfferForQuote);

// Admin quote endpoint
router.get('/quote/admin/:id', authorize('ADMIN'), OfferController.getOfferForQuoteAdmin);

// Get all offers (both admin and zone users)
router.get('/', OfferController.getOffers);

// Get single offer
router.get('/:id', OfferController.getOffer);

// Create offer (both admin and zone users)
router.post('/', OfferController.createOffer);

// Update offer (both admin and zone users)
router.put('/:id', OfferController.updateOffer);

// Update status (both admin and zone users)
router.patch('/:id/status', OfferController.updateStatus);

// Delete offer (admin only)
router.delete('/:id', authorize('ADMIN'), OfferController.deleteOffer);

// Add note to offer
router.post('/:id/notes', OfferController.addNote);

export default router;
