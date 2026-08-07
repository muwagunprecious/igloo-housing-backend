const { prisma } = require('../config/db');
const NotificationService = require('./notification.service');

class PostUtmeWalletService {
    async getWallet(userId) {
        const walletTransactions = await prisma.walletTransaction.findMany({
            where: { userId, type: 'BOOKING_PAYMENT' },
            select: { amount: true },
        });

        const totalEarnings = walletTransactions.reduce((sum, t) => sum + t.amount, 0);
        const totalBookings = walletTransactions.length;

        const successfulBookings = await prisma.walletTransaction.count({
            where: { userId, type: 'BOOKING_PAYMENT', amount: { gt: 0 } },
        });

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { walletBalance: true, pendingBalance: true },
        });

        return {
            walletBalance: user.walletBalance,
            pendingBalance: user.pendingBalance,
            totalEarnings,
            totalBookings,
            successfulBookings,
        };
    }

    async getTransactions(userId, page = 1, limit = 20) {
        const pageNum = Math.max(1, Number(page));
        const take = Math.max(1, Number(limit));
        const skip = (pageNum - 1) * take;

        const [transactions, total] = await Promise.all([
            prisma.walletTransaction.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                skip,
                take,
            }),
            prisma.walletTransaction.count({ where: { userId } }),
        ]);

        const totalPages = Math.ceil(total / take);

        return { transactions, total, page: pageNum, totalPages };
    }

    async requestPayout(userId, data) {
        const { bankName, accountNumber, accountName, amount } = data;

        if (!amount || amount <= 0) {
            throw { message: 'Amount must be greater than zero', statusCode: 400 };
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { walletBalance: true, fullName: true },
        });

        if (!user) {
            throw { message: 'User not found', statusCode: 404 };
        }

        if (amount > user.walletBalance) {
            throw { message: 'Insufficient wallet balance', statusCode: 400 };
        }

        const newBalance = user.walletBalance - amount;

        const payoutRequest = await prisma.$transaction(async (tx) => {
            await tx.user.update({
                where: { id: userId },
                data: { walletBalance: newBalance },
            });

            const payout = await tx.payoutRequest.create({
                data: {
                    userId,
                    amount,
                    bankName,
                    accountNumber,
                    accountName,
                    status: 'PENDING',
                },
            });

            await tx.walletTransaction.create({
                data: {
                    userId,
                    type: 'PENDING_WITHDRAWAL',
                    amount: -amount,
                    balance: newBalance,
                    description: `Payout request of ₦${amount.toLocaleString()}`,
                },
            });

            return payout;
        });

        await NotificationService.createNotification(
            userId,
            'Payout Request Submitted',
            `Your payout request of ₦${amount.toLocaleString()} has been submitted and is pending review.`,
            'PAYOUT'
        );

        return payoutRequest;
    }

    async getPayoutRequests(userId, page = 1, limit = 20) {
        const pageNum = Math.max(1, Number(page));
        const take = Math.max(1, Number(limit));
        const skip = (pageNum - 1) * take;

        const [payoutRequests, total] = await Promise.all([
            prisma.payoutRequest.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                skip,
                take,
            }),
            prisma.payoutRequest.count({ where: { userId } }),
        ]);

        const totalPages = Math.ceil(total / take);

        return { payoutRequests, total, page: pageNum, totalPages };
    }

    async getAllPayouts(status, page = 1, limit = 20) {
        const pageNum = Math.max(1, Number(page));
        const take = Math.max(1, Number(limit));
        const skip = (pageNum - 1) * take;

        const where = {};
        if (status) where.status = status;

        const [payouts, total] = await Promise.all([
            prisma.payoutRequest.findMany({
                where,
                include: {
                    user: {
                        select: { id: true, fullName: true, email: true },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take,
            }),
            prisma.payoutRequest.count({ where }),
        ]);

        const totalPages = Math.ceil(total / take);

        // Rename user → renter to match what the frontend expects
        const payoutsWithRenter = payouts.map(({ user, ...rest }) => ({
            ...rest,
            renter: user,
        }));

        return { payouts: payoutsWithRenter, total, page: pageNum, totalPages };
    }

    async processPayout(payoutId, adminId, action, adminNotes = '') {
        const payout = await prisma.payoutRequest.findUnique({
            where: { id: payoutId },
            include: {
                user: {
                    select: { id: true, fullName: true, walletBalance: true },
                },
            },
        });

        if (!payout) {
            throw { message: 'Payout request not found', statusCode: 404 };
        }

        if (payout.status !== 'PENDING') {
            throw { message: 'Payout request has already been processed', statusCode: 400 };
        }

        const validActions = ['APPROVE', 'REJECT', 'MARK_PAID'];
        if (!validActions.includes(action)) {
            throw { message: 'Invalid action. Must be APPROVE, REJECT, or MARK_PAID', statusCode: 400 };
        }

        const result = await prisma.$transaction(async (tx) => {
            let updatedPayout;
            let notificationTitle;
            let notificationMessage;

            if (action === 'REJECT') {
                const refundBalance = payout.user.walletBalance + payout.amount;

                await tx.user.update({
                    where: { id: payout.userId },
                    data: { walletBalance: refundBalance },
                });

                updatedPayout = await tx.payoutRequest.update({
                    where: { id: payoutId },
                    data: {
                        status: 'REJECTED',
                        adminNotes: adminNotes || 'Request rejected by admin',
                    },
                });

                await tx.walletTransaction.create({
                    data: {
                        userId: payout.userId,
                        type: 'WITHDRAWAL_REVERSAL',
                        amount: payout.amount,
                        balance: refundBalance,
                        description: `Payout request of ₦${payout.amount.toLocaleString()} rejected. Amount refunded to wallet.`,
                        reference: payoutId,
                    },
                });

                notificationTitle = 'Payout Request Rejected';
                notificationMessage = `Your payout request of ₦${payout.amount.toLocaleString()} has been rejected. The amount has been returned to your wallet.`;
            } else if (action === 'APPROVE') {
                updatedPayout = await tx.payoutRequest.update({
                    where: { id: payoutId },
                    data: {
                        status: 'APPROVED',
                        adminNotes: adminNotes || 'Request approved by admin',
                    },
                });

                notificationTitle = 'Payout Request Approved';
                notificationMessage = `Your payout request of ₦${payout.amount.toLocaleString()} has been approved. Payment will be processed shortly.`;
            } else if (action === 'MARK_PAID') {
                updatedPayout = await tx.payoutRequest.update({
                    where: { id: payoutId },
                    data: {
                        status: 'PAID',
                        adminNotes: adminNotes || 'Payment marked as completed',
                        processedAt: new Date(),
                    },
                });

                notificationTitle = 'Payout Completed';
                notificationMessage = `Your payout of ₦${payout.amount.toLocaleString()} has been successfully processed and sent to your bank account.`;
            }

            await tx.adminAction.create({
                data: {
                    adminId,
                    actionType: `PAYOUT_${action}`,
                    targetUserId: payout.userId,
                    description: `${action} payout request of ₦${payout.amount.toLocaleString()} for ${payout.user.fullName}. ${adminNotes || ''}`,
                },
            });

            return updatedPayout;
        });

        let renterNotificationMessage;
        if (action === 'REJECT') {
            renterNotificationMessage = `Payout request of ₦${payout.amount.toLocaleString()} rejected by admin. Amount refunded to wallet.`;
        } else if (action === 'APPROVE') {
            renterNotificationMessage = `Payout request of ₦${payout.amount.toLocaleString()} approved by admin. Awaiting payment processing.`;
        } else {
            renterNotificationMessage = `Payout of ₦${payout.amount.toLocaleString()} has been processed and sent to your bank account.`;
        }

        await NotificationService.createNotification(
            payout.userId,
            `Payout ${action.charAt(0) + action.slice(1).toLowerCase()}`,
            renterNotificationMessage,
            'PAYOUT'
        );

        return result;
    }
}

module.exports = new PostUtmeWalletService();
