const { prisma } = require('../config/db');

class RoommateService {
    /**
     * Create roommate request
     */
    async createRequest(userId, data) {
        const { propertyId, budget, roomType, genderPref, bio, houseLink, media } = data;

        if (propertyId) {
            // Check if property exists
            const property = await prisma.property.findUnique({
                where: { id: propertyId },
                include: {
                    agent: {
                        select: {
                            id: true,
                            fullName: true,
                        },
                    },
                },
            });

            if (!property) {
                throw { message: 'Property not found', statusCode: 404 };
            }

            if (!property.isAvailable) {
                throw { message: 'Property is not available', statusCode: 400 };
            }

            if (!property.roommatesAllowed) {
                throw { message: 'This property does not allow roommates', statusCode: 400 };
            }

            // Check if user already has a pending or accepted request for this property
            const existingRequest = await prisma.roommateRequest.findFirst({
                where: {
                    userId,
                    propertyId,
                    status: {
                        in: ['PENDING', 'ACCEPTED'],
                    },
                },
            });

            if (existingRequest) {
                if (existingRequest.status === 'PENDING') {
                    throw { message: 'You already have a pending request for this property', statusCode: 400 };
                }
                if (existingRequest.status === 'ACCEPTED') {
                    throw { message: 'Your request for this property has already been accepted', statusCode: 400 };
                }
            }

            // Create request
            const request = await prisma.roommateRequest.create({
                data: {
                    userId,
                    propertyId,
                    budget: budget ? parseFloat(budget) : null,
                    roomType: roomType || null,
                    genderPref: genderPref || null,
                    bio: bio || null,
                    houseLink: houseLink || null,
                    media: media ? (typeof media === 'string' ? media : JSON.stringify(media)) : null,
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            fullName: true,
                            email: true,
                            avatar: true,
                        },
                    },
                    property: {
                        select: {
                            id: true,
                            title: true,
                            location: true,
                            price: true,
                            images: true,
                        },
                    },
                },
            });

            return request;
        }

        // General Request (No Property ID)
        // Check if user already has a pending general request
        const existingRequest = await prisma.roommateRequest.findFirst({
            where: {
                userId,
                propertyId: null,
                status: 'PENDING'
            }
        });

        if (existingRequest) {
            throw { message: 'You already have a pending general roommate request', statusCode: 400 };
        }

        const request = await prisma.roommateRequest.create({
            data: {
                userId,
                propertyId: null,
                budget: budget ? parseFloat(budget) : null,
                roomType: roomType || null,
                genderPref: genderPref || null,
                bio: bio || null,
                houseLink: houseLink || null,
                media: media ? (typeof media === 'string' ? media : JSON.stringify(media)) : null,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                        avatar: true,
                    },
                },
            },
        });

        return request;
    }

    /**
     * Get all roommate requests (Feed)
     * Filter by university
     */
    async getAllRequests(userUniversityId, filters = {}) {
        const where = {
            status: 'PENDING',
            user: {
                universityId: userUniversityId
            }
        };

        if (filters.genderPref) {
            where.genderPref = filters.genderPref;
        }

        const requests = await prisma.roommateRequest.findMany({
            where,
            include: {
                user: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                        avatar: true,
                        bio: true,
                        role: true,
                    },
                },
                property: {
                    select: {
                        id: true,
                        title: true,
                        location: true,
                        price: true,
                        images: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        return requests;
    }

    /**
     * Get user's roommate requests
     */
    async getUserRequests(userId) {
        const requests = await prisma.roommateRequest.findMany({
            where: { userId },
            include: {
                property: {
                    include: {
                        agent: {
                            select: {
                                id: true,
                                fullName: true,
                                email: true,
                                avatar: true,
                            },
                        },
                        university: {
                            select: {
                                id: true,
                                name: true,
                                state: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        return requests;
    }

    /**
     * Get requests for agent's properties
     */
    async getAgentRequests(agentId) {
        const requests = await prisma.roommateRequest.findMany({
            where: {
                property: {
                    agentId,
                },
            },
            include: {
                user: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                        avatar: true,
                        bio: true,
                    },
                },
                property: {
                    select: {
                        id: true,
                        title: true,
                        location: true,
                        price: true,
                        images: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        return requests;
    }

    /**
     * Update request status (Agent only)
     */
    async updateRequestStatus(requestId, agentId, status) {
        const request = await prisma.roommateRequest.findUnique({
            where: { id: requestId },
            include: {
                property: true,
            },
        });

        if (!request) {
            throw { message: 'Request not found', statusCode: 404 };
        }

        // Check if agent owns the property
        if (request.property.agentId !== agentId) {
            throw { message: 'You can only update requests for your own properties', statusCode: 403 };
        }

        // Validate status
        if (!['PENDING', 'ACCEPTED', 'REJECTED'].includes(status)) {
            throw { message: 'Invalid status', statusCode: 400 };
        }

        const updated = await prisma.roommateRequest.update({
            where: { id: requestId },
            data: { status },
            include: {
                user: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                        avatar: true,
                    },
                },
                property: {
                    select: {
                        id: true,
                        title: true,
                        location: true,
                    },
                },
            },
        });

        return updated;
    }

    /**
     * Delete request
     */
    async deleteRequest(requestId, userId) {
        const request = await prisma.roommateRequest.findUnique({
            where: { id: requestId },
        });

        if (!request) {
            throw { message: 'Request not found', statusCode: 404 };
        }

        // Check ownership
        if (request.userId !== userId) {
            throw { message: 'You can only delete your own requests', statusCode: 403 };
        }

        await prisma.roommateRequest.delete({
            where: { id: requestId },
        });

        return true;
    }
}

module.exports = new RoommateService();
