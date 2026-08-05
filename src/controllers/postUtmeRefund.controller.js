const postUtmeRefundService = require('../services/postUtmeRefund.service');
const Response = require('../utils/response');

class PostUtmeRefundController {
    async requestRefund(req, res, next) {
        try {
            const { bookingId, reason, description } = req.body;
            const refund = await postUtmeRefundService.requestRefund(req.user.id, { bookingId, reason, description });
            return Response.created(res, 'Refund request submitted', refund);
        } catch (error) { next(error); }
    }

    async getMyRefunds(req, res, next) {
        try {
            const refunds = await postUtmeRefundService.getStudentRefunds(req.user.id);
            return Response.success(res, 'Refunds retrieved', refunds);
        } catch (error) { next(error); }
    }
}

module.exports = new PostUtmeRefundController();
