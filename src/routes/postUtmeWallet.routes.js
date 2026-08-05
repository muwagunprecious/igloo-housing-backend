const express = require('express');
const router = express.Router();
const walletController = require('../controllers/postUtmeWallet.controller');
const refundController = require('../controllers/postUtmeRefund.controller');
const { authenticate } = require('../middleware/auth.middleware');

// All wallet routes require auth
router.use(authenticate);

router.get('/wallet', walletController.getWallet);
router.get('/wallet/transactions', walletController.getTransactions);
router.post('/payouts', walletController.requestPayout);
router.get('/payouts/mine', walletController.getMyPayouts);

// Refunds
const postUtmeRefundService = require('../services/postUtmeRefund.service');
const Response = require('../utils/response');

router.post('/refunds', async (req, res, next) => {
    try {
        const { bookingId, reason, description } = req.body;
        const refund = await postUtmeRefundService.requestRefund(req.user.id, { bookingId, reason, description });
        return Response.created(res, 'Refund request submitted', refund);
    } catch (error) { next(error); }
});

router.get('/refunds/mine', async (req, res, next) => {
    try {
        const refunds = await postUtmeRefundService.getStudentRefunds(req.user.id);
        return Response.success(res, 'Refunds retrieved', refunds);
    } catch (error) { next(error); }
});

// Disputes
router.post('/disputes', async (req, res, next) => {
    try {
        const { bookingId, subject, description } = req.body;
        const { prisma } = require('../config/db');
        const booking = await prisma.postUtmeBooking.findUnique({ where: { id: bookingId } });
        if (!booking) return Response.notFound(res, 'Booking not found');
        const dispute = await prisma.dispute.create({
            data: {
                bookingId,
                studentId: req.user.id,
                renterId: booking.renterId,
                filedBy: req.user.id,
                subject,
                description
            }
        });
        return Response.created(res, 'Dispute filed', dispute);
    } catch (error) { next(error); }
});

module.exports = router;
