const { prisma } = require('../config/db');
const postUtmeBookingService = require('./postUtmeBooking.service');

class PostUtmePropertyService {
    async getAllApproved(filters = {}) {
        await postUtmeBookingService.restoreExpiredRooms();
        const {
            area,
            minPrice,
            maxPrice,
            minGuests,
            maxGuests,
            minRooms,
            maxRooms,
            isVerified,
            minRating,
            sortBy = 'newest',
            page = 1,
            limit = 12,
        } = filters;

        const where = { status: 'APPROVED' };

        if (area) {
            where.area = { contains: area, mode: 'insensitive' };
        }

        if (minPrice !== undefined || maxPrice !== undefined) {
            where.pricePerNight = {};
            if (minPrice !== undefined) where.pricePerNight.gte = Number(minPrice);
            if (maxPrice !== undefined) where.pricePerNight.lte = Number(maxPrice);
        }

        if (minGuests !== undefined || maxGuests !== undefined) {
            where.maxGuests = {};
            if (minGuests !== undefined) where.maxGuests.gte = Number(minGuests);
            if (maxGuests !== undefined) where.maxGuests.lte = Number(maxGuests);
        }

        if (minRooms !== undefined || maxRooms !== undefined) {
            where.totalRooms = {};
            if (minRooms !== undefined) where.totalRooms.gte = Number(minRooms);
            if (maxRooms !== undefined) where.totalRooms.lte = Number(maxRooms);
        }

        if (isVerified !== undefined) {
            where.isVerified = isVerified === 'true' || isVerified === true;
        }

        if (minRating !== undefined) {
            where.rating = { gte: Number(minRating) };
        }

        let orderBy = { createdAt: 'desc' };

        switch (sortBy) {
            case 'price_asc':
                orderBy = { pricePerNight: 'asc' };
                break;
            case 'price_desc':
                orderBy = { pricePerNight: 'desc' };
                break;
            case 'rating':
                orderBy = { rating: 'desc' };
                break;
            case 'newest':
                orderBy = { createdAt: 'desc' };
                break;
            case 'distance':
                orderBy = { distanceFromOOU: 'asc' };
                break;
        }

        const pageNum = Math.max(1, Number(page));
        const take = Math.max(1, Number(limit));
        const skip = (pageNum - 1) * take;

        const [properties, total] = await Promise.all([
            prisma.postUtmeProperty.findMany({
                where,
                orderBy,
                skip,
                take,
                select: {
                    id: true,
                    title: true,
                    description: true,
                    address: true,
                    area: true,
                    distanceFromOOU: true,
                    latitude: true,
                    longitude: true,
                    pricePerNight: true,
                    fullBookingPrice: true,
                    totalRooms: true,
                    availableRooms: true,
                    totalBeds: true,
                    maxGuests: true,
                    checkInDate: true,
                    checkOutDate: true,
                    amenities: true,
                    rules: true,
                    checkInInfo: true,
                    status: true,
                    views: true,
                    rating: true,
                    reviewCount: true,
                    isVerified: true,
                    createdAt: true,
                    updatedAt: true,
                    images: {
                        orderBy: { order: 'asc' },
                        take: 1,
                        select: { id: true, url: true, order: true },
                    },
                    owner: {
                        select: {
                            id: true,
                            fullName: true,
                            avatar: true,
                        },
                    },
                },
            }),
            prisma.postUtmeProperty.count({ where }),
        ]);

        const totalPages = Math.ceil(total / take);

        return { properties, total, page: pageNum, totalPages };
    }

    async getPropertyById(id) {
        await postUtmeBookingService.restoreExpiredRooms();

        const property = await prisma.postUtmeProperty.findUnique({
            where: { id },
            include: {
                images: {
                    orderBy: { order: 'asc' },
                },
                owner: {
                    select: {
                        id: true,
                        fullName: true,
                        avatar: true,
                        whatsapp: true,
                    },
                },
                reviews: {
                    orderBy: { createdAt: 'desc' },
                    include: {
                        student: {
                            select: {
                                id: true,
                                fullName: true,
                                avatar: true,
                            },
                        },
                    },
                },
            },
        });

        if (!property) return null;

        const activeBookings = await prisma.postUtmeBooking.count({
            where: {
                propertyId: id,
                status: { notIn: ['CANCELLED', 'COMPLETED'] },
            },
        });

        await prisma.postUtmeProperty.update({
            where: { id },
            data: { views: { increment: 1 } },
        });

        return { ...property, activeBookings };
    }

    async createProperty(ownerId, data) {
        const {
            title,
            description,
            address,
            area,
            distanceFromOOU,
            latitude,
            longitude,
            pricePerNight,
            fullBookingPrice,
            totalRooms,
            availableRooms,
            totalBeds,
            maxGuests,
            checkInDate,
            checkOutDate,
            amenities,
            rules,
            checkInInfo,
            images,
        } = data;

        const property = await prisma.postUtmeProperty.create({
            data: {
                ownerId,
                title,
                description,
                address,
                area,
                distanceFromOOU: distanceFromOOU || null,
                latitude: latitude !== undefined ? Number(latitude) : undefined,
                longitude: longitude !== undefined ? Number(longitude) : undefined,
                pricePerNight: Number(pricePerNight),
                fullBookingPrice: fullBookingPrice !== undefined ? Number(fullBookingPrice) : undefined,
                totalRooms: Number(totalRooms),
                availableRooms: Number(availableRooms),
                totalBeds: totalBeds !== undefined ? Number(totalBeds) : undefined,
                maxGuests: Number(maxGuests),
                checkInDate: checkInDate ? new Date(checkInDate + 'T00:00:00.000Z') : null,
                checkOutDate: checkOutDate ? new Date(checkOutDate + 'T00:00:00.000Z') : null,
                amenities: Array.isArray(amenities) ? JSON.stringify(amenities) : amenities,
                rules,
                checkInInfo,
                status: 'PENDING_REVIEW',
                images: images && images.length > 0
                    ? {
                        create: images.map((img, index) => ({
                            url: img.url,
                            order: img.order !== undefined ? img.order : index,
                        })),
                    }
                    : undefined,
            },
            include: {
                images: { orderBy: { order: 'asc' } },
                owner: {
                    select: { id: true, fullName: true, avatar: true },
                },
            },
        });

        return property;
    }

    async updateProperty(propertyId, ownerId, data) {
        const existing = await prisma.postUtmeProperty.findUnique({
            where: { id: propertyId },
            select: { ownerId: true, status: true },
        });

        if (!existing) throw new Error('Property not found');
        if (existing.ownerId !== ownerId) throw new Error('Not authorized to update this property');

        const {
            images: newImages,
            amenities,
            distanceFromOOU,
            latitude,
            longitude,
            pricePerNight,
            fullBookingPrice,
            totalRooms,
            availableRooms,
            totalBeds,
            maxGuests,
            ...rest
        } = data;

        const updateData = { ...rest };

        if (updateData.checkInDate) updateData.checkInDate = new Date(updateData.checkInDate + 'T00:00:00.000Z');
        else if (updateData.checkInDate === '' || updateData.checkInDate === undefined) delete updateData.checkInDate;
        if (updateData.checkOutDate) updateData.checkOutDate = new Date(updateData.checkOutDate + 'T00:00:00.000Z');
        else if (updateData.checkOutDate === '' || updateData.checkOutDate === undefined) delete updateData.checkOutDate;

        if (amenities !== undefined) {
            updateData.amenities = Array.isArray(amenities) ? JSON.stringify(amenities) : amenities;
        }
        if (distanceFromOOU !== undefined) updateData.distanceFromOOU = distanceFromOOU || null;
        if (latitude !== undefined) updateData.latitude = latitude ? Number(latitude) : null;
        if (longitude !== undefined) updateData.longitude = longitude ? Number(longitude) : null;
        if (pricePerNight !== undefined) updateData.pricePerNight = Number(pricePerNight);
        if (fullBookingPrice !== undefined) updateData.fullBookingPrice = Number(fullBookingPrice);
        if (totalRooms !== undefined) updateData.totalRooms = Number(totalRooms);
        if (availableRooms !== undefined) updateData.availableRooms = Number(availableRooms);
        if (totalBeds !== undefined) updateData.totalBeds = Number(totalBeds);
        if (maxGuests !== undefined) updateData.maxGuests = Number(maxGuests);

        if (existing.status === 'REJECTED') {
            updateData.status = 'PENDING_REVIEW';
        }

        const property = await prisma.$transaction(async (tx) => {
            if (newImages && newImages.length > 0) {
                await tx.postUtmePropertyImage.deleteMany({
                    where: { propertyId },
                });

                await tx.postUtmePropertyImage.createMany({
                    data: newImages.map((img, index) => ({
                        propertyId,
                        url: img.url,
                        order: img.order !== undefined ? img.order : index,
                    })),
                });
            }

            const updated = await tx.postUtmeProperty.update({
                where: { id: propertyId },
                data: updateData,
                include: {
                    images: { orderBy: { order: 'asc' } },
                    owner: {
                        select: { id: true, fullName: true, avatar: true },
                    },
                },
            });

            return updated;
        });

        return property;
    }

    async deleteProperty(propertyId, ownerId) {
        const existing = await prisma.postUtmeProperty.findUnique({
            where: { id: propertyId },
            select: { ownerId: true },
        });

        if (!existing) throw new Error('Property not found');
        if (existing.ownerId !== ownerId) throw new Error('Not authorized to delete this property');

        const activeBooking = await prisma.postUtmeBooking.findFirst({
            where: {
                propertyId,
                status: { in: ['PENDING', 'CONFIRMED', 'CHECKED_IN'] },
            },
        });

        if (activeBooking) {
            throw new Error('Cannot delete property with active bookings');
        }

        await prisma.$transaction(async (tx) => {
            await tx.postUtmePropertyImage.deleteMany({
                where: { propertyId },
            });

            await tx.postUtmeReview.deleteMany({
                where: { propertyId },
            });

            await tx.postUtmeProperty.delete({
                where: { id: propertyId },
            });
        });

        return { message: 'Property deleted successfully' };
    }

    async getRenterProperties(ownerId) {
        const properties = await prisma.postUtmeProperty.findMany({
            where: { ownerId },
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: { images: true, bookings: true },
                },
            },
        });

        return properties.map((p) => ({
            id: p.id,
            title: p.title,
            address: p.address,
            area: p.area,
            pricePerNight: p.pricePerNight,
            totalRooms: p.totalRooms,
            availableRooms: p.availableRooms,
            maxGuests: p.maxGuests,
            status: p.status,
            views: p.views,
            rating: p.rating,
            reviewCount: p.reviewCount,
            isVerified: p.isVerified,
            createdAt: p.createdAt,
            imageCount: p._count.images,
            bookingCount: p._count.bookings,
        }));
    }

    async submitForReview(propertyId, ownerId) {
        const existing = await prisma.postUtmeProperty.findUnique({
            where: { id: propertyId },
            select: { ownerId: true, status: true },
        });

        if (!existing) throw new Error('Property not found');
        if (existing.ownerId !== ownerId) throw new Error('Not authorized');

        if (!['DRAFT', 'REJECTED'].includes(existing.status)) {
            throw new Error('Property cannot be submitted for review in its current status');
        }

        const property = await prisma.postUtmeProperty.update({
            where: { id: propertyId },
            data: { status: 'PENDING_REVIEW' },
            include: {
                images: { orderBy: { order: 'asc' } },
                owner: {
                    select: { id: true, fullName: true, avatar: true },
                },
            },
        });

        return property;
    }

    async addReview(studentId, propertyId, rating, comment) {
        const property = await prisma.postUtmeProperty.findUnique({
            where: { id: propertyId },
            select: { id: true },
        });

        if (!property) throw new Error('Property not found');

        const completedBooking = await prisma.postUtmeBooking.findFirst({
            where: {
                studentId,
                propertyId,
                status: 'COMPLETED',
            },
        });

        if (!completedBooking) {
            throw new Error('You can only review properties you have completed a booking for');
        }

        const existingReview = await prisma.postUtmeReview.findUnique({
            where: {
                studentId_propertyId: { studentId, propertyId },
            },
        });

        if (existingReview) {
            throw new Error('You have already reviewed this property');
        }

        const review = await prisma.$transaction(async (tx) => {
            const newReview = await tx.postUtmeReview.create({
                data: {
                    studentId,
                    propertyId,
                    rating: Number(rating),
                    comment,
                },
                include: {
                    student: {
                        select: { id: true, fullName: true, avatar: true },
                    },
                },
            });

            const agg = await tx.postUtmeReview.aggregate({
                where: { propertyId },
                _avg: { rating: true },
                _count: { rating: true },
            });

            await tx.postUtmeProperty.update({
                where: { id: propertyId },
                data: {
                    rating: agg._avg.rating ? Math.round(agg._avg.rating * 10) / 10 : 0,
                    reviewCount: agg._count.rating,
                },
            });

            return newReview;
        });

        return review;
    }

    async getReviews(propertyId, page = 1, limit = 10) {
        const pageNum = Math.max(1, Number(page));
        const take = Math.max(1, Number(limit));
        const skip = (pageNum - 1) * take;

        const [reviews, total] = await Promise.all([
            prisma.postUtmeReview.findMany({
                where: { propertyId },
                orderBy: { createdAt: 'desc' },
                skip,
                take,
                include: {
                    student: {
                        select: {
                            id: true,
                            fullName: true,
                            avatar: true,
                        },
                    },
                },
            }),
            prisma.postUtmeReview.count({ where: { propertyId } }),
        ]);

        const totalPages = Math.ceil(total / take);

        return { reviews, total, page: pageNum, totalPages };
    }
}

module.exports = new PostUtmePropertyService();
