const { prisma } = require('../config/db');
const Validators = require('../utils/validators');

class PropertyService {
    /**
     * Get all properties with filters
     */
    async getAllProperties(filters = {}) {
        const where = {
            isAvailable: true,
            status: filters.status || 'APPROVED' // Default to APPROVED
        };

        if (filters.category) {
            where.category = filters.category;
        }

        if (filters.campus) {
            where.campus = filters.campus;
        }

        if (filters.universityId) {
            where.universityId = filters.universityId;
        }

        if (filters.minPrice || filters.maxPrice) {
            where.price = {};
            if (filters.minPrice) where.price.gte = parseFloat(filters.minPrice);
            if (filters.maxPrice) where.price.lte = parseFloat(filters.maxPrice);
        }

        if (filters.bedrooms) {
            where.bedrooms = parseInt(filters.bedrooms);
        }

        if (filters.roommatesAllowed !== undefined) {
            where.roommatesAllowed = filters.roommatesAllowed === 'true';
        }

        console.log('🔍 getAllProperties WHERE clause:', JSON.stringify(where, null, 2));

        const properties = await prisma.property.findMany({
            where,
            include: {
                agent: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                        avatar: true,
                        isVerified: true,
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
            orderBy: {
                createdAt: 'desc',
            },
        });
        console.log('🔍 Found properties count:', properties.length);

        return properties;
    }

    /**
     * Get property by ID
     */
    async getPropertyById(id) {
        const property = await prisma.property.findUnique({
            where: { id },
            include: {
                agent: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                        avatar: true,
                        bio: true,
                        isVerified: true,
                    },
                },
                university: {
                    select: {
                        id: true,
                        name: true,
                        state: true,
                    },
                },
                roommateRequests: {
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
                },
            },
        });

        if (!property) {
            throw { message: 'Property not found', statusCode: 404 };
        }

        return property;
    }

    /**
     * Create new property (Agent only)
     */
    async createProperty(callerId, data, images = []) {
        // Validate input
        const validation = Validators.validateProperty(data);
        if (!validation.isValid) {
            throw { name: 'ValidationError', errors: validation.errors };
        }

        // Determine target agent (admins can create on behalf of others)
        let targetAgentId = callerId;
        const caller = await prisma.user.findUnique({ where: { id: callerId } });

        if (caller && caller.role === 'ADMIN' && data.agentId) {
            targetAgentId = data.agentId;
        }

        // Fetch Agent details to get their University ID
        const agent = await prisma.user.findUnique({
            where: { id: targetAgentId },
            select: { universityId: true, role: true }
        });

        if (!agent) {
            throw { message: 'Target agent not found', statusCode: 404 };
        }

        if (agent.role !== 'AGENT' && agent.role !== 'ADMIN') {
            throw { message: 'Properties can only be assigned to agents or admins', statusCode: 400 };
        }

        // Create property
        const property = await prisma.property.create({
            data: {
                agentId: targetAgentId,
                title: Validators.sanitize(data.title),
                description: Validators.sanitize(data.description),
                price: parseFloat(data.price),
                location: Validators.sanitize(data.location),
                campus: data.campus || agent.universityId, // Use agent's university automatically
                universityId: agent.universityId, // Enforce agent's university
                category: data.category,
                images: JSON.stringify(images),
                bedrooms: parseInt(data.bedrooms),
                bathrooms: parseInt(data.bathrooms),
                rooms: parseInt(data.rooms || 1),
                roommatesAllowed: data.roommatesAllowed === 'true' || data.roommatesAllowed === true,
            },
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
        });

        return property;
    }

    /**
     * Update property (Agent only - own properties)
     */
    async updateProperty(propertyId, agentId, data, newImages = []) {
        const property = await prisma.property.findUnique({
            where: { id: propertyId },
        });

        if (!property) {
            throw { message: 'Property not found', statusCode: 404 };
        }

        // Check ownership
        if (property.agentId !== agentId) {
            throw { message: 'You can only update your own properties', statusCode: 403 };
        }

        const updateData = {};

        if (data.title) updateData.title = Validators.sanitize(data.title);
        if (data.description) updateData.description = Validators.sanitize(data.description);
        if (data.price) updateData.price = parseFloat(data.price);
        if (data.location) updateData.location = Validators.sanitize(data.location);
        if (data.category && Validators.isValidCategory(data.category)) {
            updateData.category = data.category;
        }
        if (data.bedrooms) updateData.bedrooms = parseInt(data.bedrooms);
        if (data.bathrooms) updateData.bathrooms = parseInt(data.bathrooms);
        if (data.roommatesAllowed !== undefined) {
            updateData.roommatesAllowed = data.roommatesAllowed === 'true' || data.roommatesAllowed === true;
        }
        if (data.isAvailable !== undefined) {
            updateData.isAvailable = data.isAvailable === 'true' || data.isAvailable === true;
        }

        // Handle images
        if (newImages.length > 0) {
            const existingImages = JSON.parse(property.images || '[]');
            updateData.images = JSON.stringify([...existingImages, ...newImages]);
        }

        // Verify campus if changing
        if (data.campus && data.campus !== property.campus) {
            const university = await prisma.university.findUnique({
                where: { id: data.campus },
            });

            if (!university) {
                throw { message: 'University not found', statusCode: 404 };
            }

            updateData.campus = data.campus;
        }

        const updated = await prisma.property.update({
            where: { id: propertyId },
            data: updateData,
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
        });

        return updated;
    }

    /**
     * Delete property (Agent only - own properties)
     */
    async deleteProperty(propertyId, agentId) {
        const property = await prisma.property.findUnique({
            where: { id: propertyId },
        });

        if (!property) {
            throw { message: 'Property not found', statusCode: 404 };
        }

        // Check ownership
        if (property.agentId !== agentId) {
            throw { message: 'You can only delete your own properties', statusCode: 403 };
        }

        await prisma.property.delete({
            where: { id: propertyId },
        });

        return true;
    }

    /**
     * Get agent's properties
     */
    async getAgentProperties(agentId) {
        const properties = await prisma.property.findMany({
            where: { agentId },
            include: {
                university: {
                    select: {
                        id: true,
                        name: true,
                        state: true,
                    },
                },
                _count: {
                    select: {
                        roommateRequests: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        return properties;
    }

    /**
     * Increment property views
     */
    async incrementViews(propertyId) {
        await prisma.property.update({
            where: { id: propertyId },
            data: {
                views: {
                    increment: 1
                }
            }
        });
    }
}

module.exports = new PropertyService();
