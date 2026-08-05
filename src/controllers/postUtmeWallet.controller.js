const postUtmeWalletService = require('../services/postUtmeWallet.service');
const Response = require('../utils/response');

class PostUtmeWalletController {
    // GET /api/post-utme/wallet
    async getWallet(req, res, next) {
        try {
            const wallet = await postUtmeWalletService.getWallet(req.user.id);
            return Response.success(res, 'Wallet retrieved', wallet);
        } catch (error) { next(error); }
    }

    // GET /api/post-utme/wallet/transactions
    async getTransactions(req, res, next) {
        try {
            const { page, limit } = req.query;
            const result = await postUtmeWalletService.getTransactions(req.user.id, parseInt(page) || 1, parseInt(limit) || 20);
            return Response.success(res, 'Transactions retrieved', result);
        } catch (error) { next(error); }
    }

    // POST /api/post-utme/payouts
    async requestPayout(req, res, next) {
        try {
            const { bankName, accountNumber, accountName, amount } = req.body;
            const payout = await postUtmeWalletService.requestPayout(req.user.id, {
                bankName, accountNumber, accountName, amount: parseFloat(amount)
            });
            return Response.created(res, 'Payout request submitted', payout);
        } catch (error) { next(error); }
    }

    // GET /api/post-utme/payouts/mine
    async getMyPayouts(req, res, next) {
        try {
            const { page, limit } = req.query;
            const result = await postUtmeWalletService.getPayoutRequests(req.user.id, parseInt(page) || 1, parseInt(limit) || 20);
            return Response.success(res, 'Payout requests retrieved', result);
        } catch (error) { next(error); }
    }
}

module.exports = new PostUtmeWalletController();
