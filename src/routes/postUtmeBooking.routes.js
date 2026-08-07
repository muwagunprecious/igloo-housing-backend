const express = require('express');
const router = express.Router();
const controller = require('../controllers/postUtmeBooking.controller');
const { authenticate } = require('../middleware/auth.middleware');

// Student bookings
router.post('/', authenticate, controller.createBooking);
router.get('/mine', authenticate, controller.getMyBookings);
router.get('/renter/mine', authenticate, controller.getRenterBookings);

// Paystack Webhook (No auth middleware required, signature verified via HMAC)
router.post('/webhook', controller.handlePaystackWebhook);

// Booking by ID
router.get('/:id', authenticate, controller.getBookingById);
router.post('/:id/pay', authenticate, controller.initializePayment);
router.post('/:id/cancel', authenticate, controller.cancelBooking);
router.put('/:id/status', authenticate, controller.updateBookingStatus);
router.post('/:id/verify', authenticate, controller.confirmArrival);

module.exports = router;
