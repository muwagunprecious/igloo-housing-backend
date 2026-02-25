const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/role.middleware');

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(requireAdmin);

/**
 * @route   GET /api/admin/stats
 * @desc    Get platform statistics
 * @access  Admin only
 */
router.get('/stats', adminController.getStats);

/**
 * @route   GET /api/admin/agents/pending
 * @desc    Get pending agents for verification
 * @access  Admin only
 */
router.get('/agents/pending', adminController.getPendingAgents);

/**
 * @route   PUT /api/admin/agents/verify/:id
 * @desc    Verify an agent
 * @access  Admin only
 */
router.put('/agents/verify/:id', adminController.verifyAgent);

/**
 * @route   PUT /api/admin/agents/reject/:id
 * @desc    Reject an agent application
 * @access  Admin only
 */
router.put('/agents/reject/:id', adminController.rejectAgent);

/**
 * @route   PUT /api/admin/block/:id
 * @desc    Block a user
 * @access  Admin only
 */
router.put('/block/:id', adminController.blockUser);

/**
 * @route   PUT /api/admin/unblock/:id
 * @desc    Unblock a user
 * @access  Admin only
 */
router.put('/unblock/:id', adminController.unblockUser);

/**
 * @route   DELETE /api/admin/property/:id
 * @desc    Remove a property
 * @access  Admin only
 */
router.delete('/property/:id', adminController.removeProperty);

/**
 * @route   PUT /api/admin/property/approve/:id
 * @desc    Approve a property
 * @access  Admin only
 */
router.put('/property/approve/:id', adminController.approveProperty);

/**
 * @route   PUT /api/admin/property/reject/:id
 * @desc    Reject a property
 * @access  Admin only
 */
router.put('/property/reject/:id', adminController.rejectProperty);

/**
 * @route   GET /api/admin/messages
 * @desc    Get all messages (for monitoring)
 * @access  Admin only
 */
router.get('/messages', adminController.getAllMessages);

/**
 * @route   GET /api/admin/users
 * @desc    Get all users
 * @access  Admin only
 */
router.get('/users', adminController.getAllUsers);

/**
 * @route   GET /api/admin/actions
 * @desc    Get admin actions log
 * @access  Admin only
 */
router.get('/actions', adminController.getAdminActions);

/**
 * @route   GET /api/admin/transactions
 * @desc    Get all transactions
 * @access  Admin only
 */
router.get('/transactions', adminController.getAllTransactions);

/**
 * @route   POST /api/admin/users/create
 * @desc    Create a new user
 * @access  Admin only
 */
router.post('/users/create', adminController.createUser);

module.exports = router;
