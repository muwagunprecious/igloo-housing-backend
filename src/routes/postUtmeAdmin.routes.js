const express = require('express');
const router = express.Router();
const controller = require('../controllers/postUtmeAdmin.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/role.middleware');

// All routes require admin auth
router.use(authenticate, requireAdmin);

router.get('/stats', controller.getStats);
router.get('/properties', controller.getAllProperties);
router.put('/properties/:id/approve', controller.approveProperty);
router.put('/properties/:id/reject', controller.rejectProperty);
router.put('/properties/:id/suspend', controller.suspendProperty);
router.get('/bookings', controller.getAllBookings);
router.get('/transactions', controller.getAllTransactions);
router.get('/payouts', controller.getAllPayouts);
router.put('/payouts/:id', controller.processPayout);
router.get('/refunds', controller.getAllRefunds);
router.put('/refunds/:id', controller.processRefund);
router.get('/disputes', controller.getAllDisputes);

module.exports = router;
