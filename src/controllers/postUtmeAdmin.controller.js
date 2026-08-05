const postUtmeAdminService = require('../services/postUtmeAdmin.service');
const postUtmeWalletService = require('../services/postUtmeWallet.service');
const postUtmeRefundService = require('../services/postUtmeRefund.service');
const Response = require('../utils/response');

class PostUtmeAdminController {
    // GET /api/post-utme/admin/stats
    async getStats(req, res, next) {
        try {
            const stats = await postUtmeAdminService.getStats();
            return Response.success(res, 'Stats retrieved', stats);
        } catch (error) { next(error); }
    }

    // GET /api/post-utme/admin/properties
    async getAllProperties(req, res, next) {
        try {
            const { status, area, isVerified, page, limit } = req.query;
            const result = await postUtmeAdminService.getAllProperties(
                { status, area, isVerified: isVerified === 'true' ? true : isVerified === 'false' ? false : undefined },
                parseInt(page) || 1, parseInt(limit) || 20
            );
            return Response.success(res, 'Properties retrieved', result);
        } catch (error) { next(error); }
    }

    // PUT /api/post-utme/admin/properties/:id/approve
    async approveProperty(req, res, next) {
        try {
            const property = await postUtmeAdminService.approveProperty(req.params.id, req.user.id);
            return Response.success(res, 'Property approved', property);
        } catch (error) { next(error); }
    }

    // PUT /api/post-utme/admin/properties/:id/reject
    async rejectProperty(req, res, next) {
        try {
            const { reason } = req.body;
            const property = await postUtmeAdminService.rejectProperty(req.params.id, req.user.id, reason);
            return Response.success(res, 'Property rejected', property);
        } catch (error) { next(error); }
    }

    // PUT /api/post-utme/admin/properties/:id/suspend
    async suspendProperty(req, res, next) {
        try {
            const { reason } = req.body;
            const property = await postUtmeAdminService.suspendProperty(req.params.id, req.user.id, reason);
            return Response.success(res, 'Property suspended', property);
        } catch (error) { next(error); }
    }

    // GET /api/post-utme/admin/bookings
    async getAllBookings(req, res, next) {
        try {
            const { status, propertyId, studentId, renterId, page, limit } = req.query;
            const result = await postUtmeAdminService.getAllBookings(
                { status, propertyId, studentId, renterId },
                parseInt(page) || 1, parseInt(limit) || 20
            );
            return Response.success(res, 'Bookings retrieved', result);
        } catch (error) { next(error); }
    }

    // GET /api/post-utme/admin/transactions
    async getAllTransactions(req, res, next) {
        try {
            const { page, limit } = req.query;
            const result = await postUtmeAdminService.getAllTransactions(parseInt(page) || 1, parseInt(limit) || 20);
            return Response.success(res, 'Transactions retrieved', result);
        } catch (error) { next(error); }
    }

    // PUT /api/post-utme/admin/payouts/:id
    async processPayout(req, res, next) {
        try {
            const { action, adminNotes } = req.body;
            const payout = await postUtmeWalletService.processPayout(req.params.id, req.user.id, action, adminNotes);
            return Response.success(res, `Payout ${action.toLowerCase()}d`, payout);
        } catch (error) { next(error); }
    }

    // GET /api/post-utme/admin/payouts
    async getAllPayouts(req, res, next) {
        try {
            const { status, page, limit } = req.query;
            const result = await postUtmeWalletService.getAllPayouts(status, parseInt(page) || 1, parseInt(limit) || 20);
            return Response.success(res, 'Payouts retrieved', result);
        } catch (error) { next(error); }
    }

    // PUT /api/post-utme/admin/refunds/:id
    async processRefund(req, res, next) {
        try {
            const { action, adminNotes } = req.body;
            const refund = await postUtmeRefundService.processRefund(req.params.id, req.user.id, action, adminNotes);
            return Response.success(res, `Refund ${action.toLowerCase()}d`, refund);
        } catch (error) { next(error); }
    }

    // GET /api/post-utme/admin/refunds
    async getAllRefunds(req, res, next) {
        try {
            const { page, limit } = req.query;
            const result = await postUtmeRefundService.getAllRefunds(parseInt(page) || 1, parseInt(limit) || 20);
            return Response.success(res, 'Refunds retrieved', result);
        } catch (error) { next(error); }
    }

    // GET /api/post-utme/admin/disputes
    async getAllDisputes(req, res, next) {
        try {
            const { page, limit } = req.query;
            const result = await postUtmeAdminService.getAllDisputes(parseInt(page) || 1, parseInt(limit) || 20);
            return Response.success(res, 'Disputes retrieved', result);
        } catch (error) { next(error); }
    }
}

module.exports = new PostUtmeAdminController();
