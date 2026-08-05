const { prisma } = require('../config/db');
const NotificationService = require('./notification.service');

class PostUtmeAdminService {
    async getStats() {
        const [
            totalProperties,
            pendingApprovals,
            approvedProperties,
            rejectedProperties,
            totalBookings,
            pendingPayouts,
            completedPayouts,
            pendingRefunds,
            completedRefunds,
            totalRenters,
            totalStudents,
        ] = await Promise.all([
            prisma.postUtmeProperty.count(),
            prisma.postUtmeProperty.count({ where: { status: 'PENDING_REVIEW' } }),
            prisma.postUtmeProperty.count({ where: { status: 'APPROVED' } }),
            prisma.postUtmeProperty.count({ where: { status: 'REJECTED' } }),
            prisma.postUtmeBooking.count(),
            prisma.payoutRequest.count({ where: { status: 'PENDING' } }),
            prisma.payoutRequest.count({ where: { status: 'PAID' } }),
            prisma.refundRequest.count({ where: { status: 'REQUESTED' } }),
            prisma.refundRequest.count({ where: { status: { in: ['APPROVED', 'REJECTED'] } } }),
            prisma.postUtmeBooking.findMany({
                select: { renterId: true },
                distinct: ['renterId'],
            }),
            prisma.postUtmeBooking.findMany({
                select: { studentId: true },
                distinct: ['studentId'],
            }),
        ]);

        const revenueResult = await prisma.postUtmePayment.aggregate({
            where: { status: 'SUCCESS' },
            _sum: { amount: true },
        });

        const totalRevenue = revenueResult._sum.amount || 0;

        return {
            totalProperties,
            pendingApprovals,
            approvedProperties,
            rejectedProperties,
            totalBookings,
            totalRevenue,
            pendingPayouts,
            completedPayouts,
            pendingRefunds,
            completedRefunds,
            totalRenters: totalRenters.length,
            totalStudents: totalStudents.length,
        };
    }

    async getAllProperties(filters = {}, page = 1, limit = 20) {
        const where = {};

        if (filters.status) {
            where.status = filters.status;
        }

        if (filters.isVerified !== undefined) {
            where.isVerified = filters.isVerified === 'true' || filters.isVerified === true;
        }

        if (filters.area) {
            where.area = { contains: filters.area, mode: 'insensitive' };
        }

        if (filters.ownerId) {
            where.ownerId = filters.ownerId;
        }

        const pageNum = Math.max(1, Number(page));
        const take = Math.max(1, Number(limit));
        const skip = (pageNum - 1) * take;

        const [properties, total] = await Promise.all([
            prisma.postUtmeProperty.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take,
                include: {
                    owner: {
                        select: { id: true, fullName: true, email: true, avatar: true },
                    },
                    _count: {
                        select: { images: true },
                    },
                },
            }),
            prisma.postUtmeProperty.count({ where }),
        ]);

        const propertiesWithImageCount = properties.map((p) => ({
            ...p,
            imageCount: p._count.images,
            _count: undefined,
        }));

        const totalPages = Math.ceil(total / take);

        return { properties: propertiesWithImageCount, total, page: pageNum, totalPages };
    }

    async approveProperty(propertyId, adminId) {
        const property = await prisma.postUtmeProperty.findUnique({
            where: { id: propertyId },
            include: {
                owner: { select: { id: true, fullName: true } },
            },
        });

        if (!property) {
            throw { message: 'Property not found', statusCode: 404 };
        }

        if (property.status === 'APPROVED') {
            throw { message: 'Property is already approved', statusCode: 400 };
        }

        const updatedProperty = await prisma.$transaction(async (tx) => {
            const updated = await tx.postUtmeProperty.update({
                where: { id: propertyId },
                data: {
                    status: 'APPROVED',
                    isVerified: true,
                },
                include: {
                    owner: {
                        select: { id: true, fullName: true, avatar: true },
                    },
                    images: { orderBy: { order: 'asc' } },
                },
            });

            await tx.adminAction.create({
                data: {
                    adminId,
                    actionType: 'APPROVE_POSTUTME_PROPERTY',
                    targetUserId: property.ownerId,
                    description: `Approved Post-UTME property: ${property.title} by ${property.owner.fullName}`,
                },
            });

            return updated;
        });

        await NotificationService.createNotification(
            property.ownerId,
            'Property Approved',
            `Your property "${property.title}" has been approved and is now live on the platform.`,
            'PROPERTY'
        );

        return updatedProperty;
    }

    async rejectProperty(propertyId, adminId, reason) {
        const property = await prisma.postUtmeProperty.findUnique({
            where: { id: propertyId },
            include: {
                owner: { select: { id: true, fullName: true } },
            },
        });

        if (!property) {
            throw { message: 'Property not found', statusCode: 404 };
        }

        if (!reason) {
            throw { message: 'Rejection reason is required', statusCode: 400 };
        }

        const updatedProperty = await prisma.$transaction(async (tx) => {
            const updated = await tx.postUtmeProperty.update({
                where: { id: propertyId },
                data: { status: 'REJECTED' },
                include: {
                    owner: {
                        select: { id: true, fullName: true, avatar: true },
                    },
                    images: { orderBy: { order: 'asc' } },
                },
            });

            await tx.adminAction.create({
                data: {
                    adminId,
                    actionType: 'REJECT_POSTUTME_PROPERTY',
                    targetUserId: property.ownerId,
                    description: `Rejected Post-UTME property: ${property.title} by ${property.owner.fullName}. Reason: ${reason}`,
                },
            });

            return updated;
        });

        await NotificationService.createNotification(
            property.ownerId,
            'Property Rejected',
            `Your property "${property.title}" has been rejected. Reason: ${reason}. Please review and make necessary changes before resubmitting.`,
            'PROPERTY'
        );

        return updatedProperty;
    }

    async suspendProperty(propertyId, adminId, reason) {
        const property = await prisma.postUtmeProperty.findUnique({
            where: { id: propertyId },
            include: {
                owner: { select: { id: true, fullName: true } },
            },
        });

        if (!property) {
            throw { message: 'Property not found', statusCode: 404 };
        }

        if (!reason) {
            throw { message: 'Suspension reason is required', statusCode: 400 };
        }

        if (property.status === 'SUSPENDED') {
            throw { message: 'Property is already suspended', statusCode: 400 };
        }

        const updatedProperty = await prisma.$transaction(async (tx) => {
            const updated = await tx.postUtmeProperty.update({
                where: { id: propertyId },
                data: { status: 'SUSPENDED' },
                include: {
                    owner: {
                        select: { id: true, fullName: true, avatar: true },
                    },
                    images: { orderBy: { order: 'asc' } },
                },
            });

            await tx.adminAction.create({
                data: {
                    adminId,
                    actionType: 'SUSPEND_POSTUTME_PROPERTY',
                    targetUserId: property.ownerId,
                    description: `Suspended Post-UTME property: ${property.title} by ${property.owner.fullName}. Reason: ${reason}`,
                },
            });

            return updated;
        });

        await NotificationService.createNotification(
            property.ownerId,
            'Property Suspended',
            `Your property "${property.title}" has been suspended. Reason: ${reason}. The property is no longer visible to students. Please contact support for assistance.`,
            'PROPERTY'
        );

        return updatedProperty;
    }

    async getAllBookings(filters = {}, page = 1, limit = 20) {
        const where = {};

        if (filters.status) {
            where.status = filters.status;
        }

        if (filters.propertyId) {
            where.propertyId = filters.propertyId;
        }

        if (filters.studentId) {
            where.studentId = filters.studentId;
        }

        if (filters.renterId) {
            where.renterId = filters.renterId;
        }

        const pageNum = Math.max(1, Number(page));
        const take = Math.max(1, Number(limit));
        const skip = (pageNum - 1) * take;

        const [bookings, total] = await Promise.all([
            prisma.postUtmeBooking.findMany({
                where,
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
                    property: {
                        select: { id: true, title: true, address: true, area: true, pricePerNight: true },
                    },
                    payment: true,
                },
            }),
            prisma.postUtmeBooking.count({ where }),
        ]);

        const totalPages = Math.ceil(total / take);

        return { bookings, total, page: pageNum, totalPages };
    }

    async getAllTransactions(page = 1, limit = 20) {
        const pageNum = Math.max(1, Number(page));
        const take = Math.max(1, Number(limit));
        const skip = (pageNum - 1) * take;

        const [transactions, total] = await Promise.all([
            prisma.walletTransaction.findMany({
                orderBy: { createdAt: 'desc' },
                skip,
                take,
                include: {
                    user: {
                        select: { id: true, fullName: true, email: true, avatar: true },
                    },
                },
            }),
            prisma.walletTransaction.count(),
        ]);

        const totalPages = Math.ceil(total / take);

        return { transactions, total, page: pageNum, totalPages };
    }
}

module.exports = new PostUtmeAdminService();
