import { Router } from 'express';
import { CustomerController } from '../controllers/customer.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// All customer routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/customers
 * @desc    Get all customers with filters and pagination
 * @access  Private (Admin, Zone User)
 */
router.get('/', CustomerController.getCustomers);

/**
 * @route   GET /api/customers/:id/stats
 * @desc    Get customer statistics
 * @access  Private (Admin, Zone User)
 */
router.get('/:id/stats', CustomerController.getCustomerStats);

/**
 * @route   GET /api/customers/:id
 * @desc    Get customer by ID
 * @access  Private (Admin, Zone User)
 */
router.get('/:id', CustomerController.getCustomer);

/**
 * @route   POST /api/customers
 * @desc    Create new customer
 * @access  Private (Admin only)
 */
router.post('/', authorize('ADMIN'), CustomerController.createCustomer);

/**
 * @route   PUT /api/customers/:id
 * @desc    Update customer
 * @access  Private (Admin only)
 */
router.put('/:id', authorize('ADMIN'), CustomerController.updateCustomer);

/**
 * @route   DELETE /api/customers/:id
 * @desc    Delete customer (soft delete)
 * @access  Private (Admin only)
 */
router.delete('/:id', authorize('ADMIN'), CustomerController.deleteCustomer);

/**
 * @route   GET /api/customers/:id/contacts
 * @desc    Get all contacts for a customer
 * @access  Private
 */
router.get('/:id/contacts', CustomerController.getCustomerContacts);

/**
 * @route   POST /api/customers/:id/contacts
 * @desc    Create new contact for a customer
 * @access  Private (Admin only)
 */
router.post('/:id/contacts', authorize('ADMIN'), CustomerController.createContact);

/**
 * @route   GET /api/customers/:id/assets
 * @desc    Get all assets for a customer
 * @access  Private
 */
router.get('/:id/assets', CustomerController.getCustomerAssets);

/**
 * @route   POST /api/customers/:id/assets
 * @desc    Create new asset for a customer
 * @access  Private (Admin only)
 */
router.post('/:id/assets', authorize('ADMIN'), CustomerController.createAsset);

export default router;
