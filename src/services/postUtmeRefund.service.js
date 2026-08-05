const { prisma } = require('../config/db');
const NotificationService = require('./notification.service');

class PostUtmeRefundService {
    async requestRefund(studentId, data) {
        const { bookingId, reason, description } = data;

        const booking = await prisma.postUtmeBooking.findUnique({
            where: { id: bookingId },
            include: {
                property: { select: { id: true, title: true } },
                student: { select: { id: true, fullName: true } },
                renter: { select: { id: true, fullName: true } },
                payment: { select: { amount: true } },
            },
        });

        if (!booking) {
            throw { message: 'Booking not found', statusCode: 404 };
        }

        if (booking.studentId !== studentId) {
            throw { message: 'This booking does not belong to you', statusCode: 403 };
        }

        if (booking.renterConfirmed) {
            throw { message: 'Cannot request a refund after the renter has confirmed your booking code', statusCode: 400 };
        }

        if (booking.status === 'CHECKED_IN') {
            throw { message: 'Cannot request a refund after check-in', statusCode: 400 };
        }

        const allowedStatuses = [
            'STUDENT_ARRIVED',
            'AWAITING_CHECKIN',
            'BOOKING_CONFIRMED',
            'PAYMENT_SUCCESSFUL',
        ];

        if (!allowedStatuses.includes(booking.status)) {
            throw {
                message: `Cannot request refund for a booking with status "${booking.status}". Bookings must be in one of: ${allowedStatuses.join(', ')}`,
                statusCode: 400,
            };
        }

        const existingRefund = await prisma.refundRequest.findUnique({
            where: { bookingId },
        });

        if (existingRefund) {
            throw { message: 'A refund request already exists for this booking', statusCode: 400 };
        }

        const refundAmount = booking.payment ? booking.payment.amount : booking.totalPayable;

        const refundRequest = await prisma.$transaction(async (tx) => {
            const refund = await tx.refundRequest.create({
                data: {
                    bookingId,
                    studentId,
                    renterId: booking.renterId,
                    amount: refundAmount,
                    reason,
                    description: description || '',
                    status: 'REQUESTED',
                },
                include: {
                    booking: {
                        include: {
                            property: { select: { id: true, title: true, area: true } },
                            student: { select: { id: true, fullName: true } },
                        },
                    },
                },
            });

            return refund;
        });

        await NotificationService.createNotification(
            booking.renterId,
            'Refund Request Received',
            `A student (${booking.student.fullName}) has requested a refund for the booking at "${booking.property.title}". Reason: ${reason}. Please review this request.`,
            'REFUND'
        );

        const admins = await prisma.user.findMany({
            where: { role: 'ADMIN' },
            select: { id: true },
        });

        for (const admin of admins) {
            await NotificationService.createNotification(
                admin.id,
                'New Refund Request',
                `A refund request has been submitted for the property "${booking.property.title}" by student ${booking.student.fullName}. Amount: ₦${refundAmount.toLocaleString()}. Reason: ${reason}.`,
                'REFUND'
            );
        }

        return refundRequest;
    }

    async getStudentRefunds(studentId) {
        const refunds = await prisma.refundRequest.findMany({
            where: { studentId },
            orderBy: { createdAt: 'desc' },
            include: {
                booking: {
                    include: {
                        property: {
                            select: {
                                id: true,
                                title: true,
                                address: true,
                                area: true,
                            },
                        },
                        renter: {
                            select: { id: true, fullName: true, avatar: true },
                        },
                    },
                },
            },
        });

        return refunds;
    }

    async processRefund(refundId, adminId, action, adminNotes = '') {
        const refund = await prisma.refundRequest.findUnique({
            where: { id: refundId },
            include: {
                student: { select: { id: true, fullName: true } },
                renter: { select: { id: true, fullName: true, walletBalance: true } },
                booking: {
                    include: {
                        property: { select: { id: true, title: true, totalRooms: true, availableRooms: true } },
                        payment: { select: { amount: true } },
                    },
                },
            },
        });

        if (!refund) {
            throw { message: 'Refund request not found', statusCode: 404 };
        }

        if (refund.status !== 'REQUESTED') {
            throw { message: 'This refund request has already been processed', statusCode: 400 };
        }

        const validActions = ['APPROVE', 'REJECT'];
        if (!validActions.includes(action)) {
            throw { message: 'Invalid action. Must be APPROVE or REJECT', statusCode: 400 };
        }

        const result = await prisma.$transaction(async (tx) => {
            let updatedRefund;

            if (action === 'APPROVE') {
                updatedRefund = await tx.refundRequest.update({
                    where: { id: refundId },
                    data: {
                        status: 'APPROVED',
                        adminNotes: adminNotes || 'Refund approved by admin',
                        processedAt: new Date(),
                    },
                    include: {
                        booking: {
                            include: {
                                property: { select: { id: true, title: true } },
                            },
                        },
                    },
                });

                const newRenterBalance = refund.renter.walletBalance - refund.amount;

                await tx.user.update({
                    where: { id: refund.renterId },
                    data: { walletBalance: newRenterBalance },
                });

                await tx.walletTransaction.create({
                    data: {
                        userId: refund.renterId,
                        type: 'REFUND_DEDUCTION',
                        amount: -refund.amount,
                        balance: newRenterBalance,
                        description: `Refund of ₦${refund.amount.toLocaleString()} processed for booking at "${refund.booking.property.title}"`,
                        bookingId: refund.bookingId,
                        reference: refundId,
                    },
                });

                const newAvailable = Math.min(
                    refund.booking.property.totalRooms,
                    refund.booking.property.availableRooms + 1
                );
                await tx.postUtmeProperty.update({
                    where: { id: refund.booking.property.id },
                    data: { availableRooms: newAvailable },
                });

                await tx.postUtmeBooking.update({
                    where: { id: refund.bookingId },
                    data: { status: 'CANCELLED' },
                });

                await tx.adminAction.create({
                    data: {
                        adminId,
                        actionType: 'APPROVE_REFUND',
                        targetUserId: refund.studentId,
                        description: `Approved refund of ₦${refund.amount.toLocaleString()} for ${refund.student.fullName} for booking at "${refund.booking.property.title}". Reason: ${refund.reason}. ${adminNotes || ''}`,
                    },
                });
            } else {
                updatedRefund = await tx.refundRequest.update({
                    where: { id: refundId },
                    data: {
                        status: 'REJECTED',
                        adminNotes: adminNotes || 'Refund rejected by admin',
                        processedAt: new Date(),
                    },
                    include: {
                        booking: {
                            include: {
                                property: { select: { id: true, title: true } },
                            },
                        },
                    },
                });

                await tx.adminAction.create({
                    data: {
                        adminId,
                        actionType: 'REJECT_REFUND',
                        targetUserId: refund.studentId,
                        description: `Rejected refund of ₦${refund.amount.toLocaleString()} for ${refund.student.fullName} for booking at "${refund.booking.property.title}". Reason: ${refund.reason}. ${adminNotes || ''}`,
                    },
                });
            }

            return updatedRefund;
        });

        if (action === 'APPROVE') {
            await NotificationService.createNotification(
                refund.studentId,
                'Refund Approved',
                `Your refund request of ₦${refund.amount.toLocaleString()} for the booking at "${refund.booking.property.title}" has been approved. The amount will be refunded to you shortly.`,
                'REFUND'
            );

            await NotificationService.createNotification(
                refund.renterId,
                'Refund Processed',
                `A refund of ₦${refund.amount.toLocaleString()} has been approved for the booking at "${refund.booking.property.title}". ₦${refund.amount.toLocaleString()} has been deducted from your wallet.`,
                'REFUND'
            );
        } else {
            await NotificationService.createNotification(
                refund.studentId,
                'Refund Rejected',
                `Your refund request of ₦${refund.amount.toLocaleString()} for the booking at "${refund.booking.property.title}" has been rejected. ${adminNotes || 'No additional details provided.'}`,
                'REFUND'
            );

            await NotificationService.createNotification(
                refund.renterId,
                'Refund Request Rejected',
                `The refund request of ₦${refund.amount.toLocaleString()} for the booking at "${refund.booking.property.title}" has been rejected by admin.`,
                'REFUND'
            );
        }

        return result;
    }

    async getAllRefunds(page = 1, limit = 20) {
        const pageNum = Math.max(1, Number(page));
        const take = Math.max(1, Number(limit));
        const skip = (pageNum - 1) * take;

        const [refunds, total] = await Promise.all([
            prisma.refundRequest.findMany({
                orderBy: { createdAt: 'desc' },
                skip,
                take,
                include: {
                    student: {
                        select: { id: true, fullName: true, email: true, avatar: true },
                    },
                    renter: {
                        select: { id: true, fullName: true, email: true, avatar: true },
                    },
                    booking: {
                        include: {
                            property: {
                                select: { id: true, title: true, address: true, area: true },
                            },
                        },
                    },
                },
            }),
            prisma.refundRequest.count(),
        ]);

        const totalPages = Math.ceil(total / take);

        return { refunds, total, page: pageNum, totalPages };
    }
}

module.exports = new PostUtmeRefundService();
