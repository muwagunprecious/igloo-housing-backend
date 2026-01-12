const { prisma } = require('../config/db');
const Validators = require('../utils/validators');

class UniversityService {
    /**
     * Get all universities
     */
    async getAllUniversities() {
        const universities = await prisma.university.findMany({
            orderBy: {
                name: 'asc',
            },
        });

        return universities;
    }

    /**
     * Get university by ID
     */
    async getUniversityById(id) {
        const university = await prisma.university.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        properties: true,
                    },
                },
            },
        });

        if (!university) {
            throw { message: 'University not found', statusCode: 404 };
        }

        return university;
    }

    /**
     * Create new university (Admin only)
     */
    async createUniversity(adminId, data) {
        // Validate input
        const validation = Validators.validateUniversity(data);
        if (!validation.isValid) {
            throw { name: 'ValidationError', errors: validation.errors };
        }

        // Check if university already exists
        const existing = await prisma.university.findUnique({
            where: { name: data.name },
        });

        if (existing) {
            throw { message: 'University with this name already exists', statusCode: 400 };
        }

        // Create university and log action
        const [university] = await prisma.$transaction([
            prisma.university.create({
                data: {
                    name: Validators.sanitize(data.name),
                    state: Validators.sanitize(data.state),
                },
            }),
            prisma.adminAction.create({
                data: {
                    adminId,
                    actionType: 'ADD_UNIVERSITY',
                    description: `Added university: ${data.name}, ${data.state}`,
                },
            }),
        ]);

        return university;
    }

    /**
     * Update university (Admin only)
     */
    async updateUniversity(id, data) {
        const university = await prisma.university.findUnique({
            where: { id },
        });

        if (!university) {
            throw { message: 'University not found', statusCode: 404 };
        }

        const updateData = {};

        if (data.name) {
            updateData.name = Validators.sanitize(data.name);
        }

        if (data.state) {
            updateData.state = Validators.sanitize(data.state);
        }

        const updated = await prisma.university.update({
            where: { id },
            data: updateData,
        });

        return updated;
    }

    /**
     * Delete university (Admin only)
     */
    async deleteUniversity(adminId, id) {
        const university = await prisma.university.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        properties: true,
                    },
                },
            },
        });

        if (!university) {
            throw { message: 'University not found', statusCode: 404 };
        }

        // Check if university has properties
        if (university._count.properties > 0) {
            throw {
                message: `Cannot delete university. It has ${university._count.properties} associated properties.`,
                statusCode: 400
            };
        }

        // Delete university and log action
        await prisma.$transaction([
            prisma.university.delete({
                where: { id },
            }),
            prisma.adminAction.create({
                data: {
                    adminId,
                    actionType: 'DELETE_UNIVERSITY',
                    description: `Deleted university: ${university.name}`,
                },
            }),
        ]);

        return true;
    }
}

module.exports = new UniversityService();
