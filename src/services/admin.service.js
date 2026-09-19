const { prisma } = require('../config/db');
const bcrypt = require('bcryptjs');
const Validators = require('../utils/validators');

class AdminService {
    /**
     * Get platform statistics
     */
    async getStats() {
        // Group queries to drastically reduce concurrent database connections and pool exhaustion
        const [
            userRoleCounts,
            verifiedAgents,
            pendingAgents,
            blockedUsers,
            propertyStatusCounts,
            totalUniversities,
            totalMessages,
            totalRoommateRequests,
            totalTransactions,
        ] = await Promise.all([
            prisma.user.groupBy({ by: ['role'], _count: { id: true } }).catch(() => []),
            prisma.user.count({ where: { role: 'AGENT', isVerified: true } }).catch(() => 0),
            prisma.user.count({ where: { role: 'AGENT', isVerified: false } }).catch(() => 0),
            prisma.user.count({ where: { isBlocked: true } }).catch(() => 0),
            prisma.property.groupBy({ by: ['status'], _count: { id: true } }).catch(() => []),
            prisma.university.count().catch(() => 0),
            prisma.message.count().catch(() => 0),
            prisma.roommateRequest.count().catch(() => 0),
            prisma.transaction.count().catch(() => 0),
        ]);

        // Aggregate user counts from groupBy
        let totalUsers = 0;
        let totalStudents = 0;
        let totalAgents = 0;
        let totalAdmins = 0;
        for (const item of userRoleCounts) {
            const count = item._count?.id || 0;
            totalUsers += count;
            const role = item.role?.toUpperCase();
            if (role === 'STUDENT') totalStudents += count;
            else if (role === 'AGENT') totalAgents += count;
            else if (role === 'ADMIN') totalAdmins += count;
        }

        // Aggregate property counts from groupBy
        let totalProperties = 0;
        let pendingProperties = 0;
        let approvedProperties = 0;
        for (const item of propertyStatusCounts) {
            const count = item._count?.id || 0;
            totalProperties += count;
            const status = item.status?.toUpperCase();
            if (status === 'PENDING') pendingProperties += count;
            else if (status === 'APPROVED') approvedProperties += count;
        }

        return {
            users: {
                total: totalUsers,
                students: totalStudents,
                agents: totalAgents,
                admins: totalAdmins,
                blocked: blockedUsers,
            },
            agents: {
                total: totalAgents,
                verified: verifiedAgents,
                pending: pendingAgents,
            },
            properties: totalProperties,
            pendingProperties: pendingProperties,
            approvedProperties: approvedProperties,
            propertyStats: {
                total: totalProperties,
                pending: pendingProperties,
                approved: approvedProperties,
            },
            universities: totalUniversities,
            messages: totalMessages,
            roommateRequests: totalRoommateRequests,
            transactions: totalTransactions,
        };
    }

    /**
     * Get pending agents waiting for verification
     */
    async getPendingAgents() {
        const agents = await prisma.user.findMany({
            where: {
                role: 'AGENT',
                isVerified: false,
                isBlocked: false,
            },
            select: {
                id: true,
                fullName: true,
                email: true,
                avatar: true,
                bio: true,
                createdAt: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        return agents;
    }

    /**
     * Verify an agent
     */
    async verifyAgent(adminId, agentId) {
        // Check if agent exists
        const agent = await prisma.user.findUnique({
            where: { id: agentId },
        });

        if (!agent) {
            throw { message: 'Agent not found', statusCode: 404 };
        }

        if (agent.role !== 'AGENT') {
            throw { message: 'User is not an agent', statusCode: 400 };
        }

        if (agent.isVerified) {
            throw { message: 'Agent is already verified', statusCode: 400 };
        }

        // Verify agent and log action
        const [updatedAgent] = await prisma.$transaction([
            prisma.user.update({
                where: { id: agentId },
                data: { isVerified: true, verificationStatus: 'APPROVED' },
                select: {
                    id: true,
                    fullName: true,
                    email: true,
                    isVerified: true,
                },
            }),
            prisma.adminAction.create({
                data: {
                    adminId,
                    actionType: 'VERIFY_AGENT',
                    targetUserId: agentId,
                    description: `Verified agent: ${agent.fullName}`,
                },
            }),
        ]);

        return updatedAgent;
    }

    /**
     * Reject an agent application (revert to STUDENT)
     */
    async rejectAgent(adminId, agentId, reason = '') {
        const agent = await prisma.user.findUnique({
            where: { id: agentId },
        });

        if (!agent) {
            throw { message: 'Agent not found', statusCode: 404 };
        }

        if (agent.role !== 'AGENT') {
            throw { message: 'User is not an agent', statusCode: 400 };
        }

        const [updatedUser] = await prisma.$transaction([
            prisma.user.update({
                where: { id: agentId },
                data: { role: 'STUDENT', isVerified: false, verificationStatus: 'REJECTED' },
                select: {
                    id: true,
                    fullName: true,
                    email: true,
                    role: true,
                },
            }),
            prisma.adminAction.create({
                data: {
                    adminId,
                    actionType: 'REJECT_AGENT',
                    targetUserId: agentId,
                    description: `Rejected agent application: ${agent.fullName}. Reason: ${reason || 'No reason provided'}`,
                },
            }),
        ]);

        return updatedUser;
    }

    /**
     * Block a user
     */
    async blockUser(adminId, userId, reason = '') {
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw { message: 'User not found', statusCode: 404 };
        }

        if (user.role === 'ADMIN') {
            throw { message: 'Cannot block an admin', statusCode: 403 };
        }

        if (user.isBlocked) {
            throw { message: 'User is already blocked', statusCode: 400 };
        }

        // Block user and log action
        const [blockedUser] = await prisma.$transaction([
            prisma.user.update({
                where: { id: userId },
                data: { isBlocked: true },
                select: {
                    id: true,
                    fullName: true,
                    email: true,
                    isBlocked: true,
                },
            }),
            prisma.adminAction.create({
                data: {
                    adminId,
                    actionType: 'BLOCK_USER',
                    targetUserId: userId,
                    description: `Blocked user: ${user.fullName}. Reason: ${reason || 'No reason provided'}`,
                },
            }),
        ]);

        return blockedUser;
    }

    /**
     * Unblock a user
     */
    async unblockUser(adminId, userId) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw { message: 'User not found', statusCode: 404 };
        }

        if (!user.isBlocked) {
            throw { message: 'User is not blocked', statusCode: 400 };
        }

        // Unblock user and log action
        const [unblockedUser] = await prisma.$transaction([
            prisma.user.update({
                where: { id: userId },
                data: { isBlocked: false },
                select: {
                    id: true,
                    fullName: true,
                    email: true,
                    isBlocked: true,
                },
            }),
            prisma.adminAction.create({
                data: {
                    adminId,
                    actionType: 'UNBLOCK_USER',
                    targetUserId: userId,
                    description: `Unblocked user: ${user.fullName}`,
                },
            }),
        ]);

        return unblockedUser;
    }

    /**
     * Remove a property
     */
    async removeProperty(adminId, propertyId, reason = '') {
        console.log(`🛡️ Admin ${adminId} attempting to remove property: ${propertyId}. Reason: ${reason}`);
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

        // Delete property and log action
        await prisma.$transaction([
            prisma.property.delete({
                where: { id: propertyId },
            }),
            prisma.adminAction.create({
                data: {
                    adminId,
                    actionType: 'REMOVE_PROPERTY',
                    targetUserId: property.agentId,
                    description: `Removed property: ${property.title} by ${property.agent.fullName}. Reason: ${reason || 'No reason provided'}`,
                },
            }),
        ]);

        console.log(`✅ Admin ${adminId} removed property ${propertyId} successfully`);
        return true;
    }

    /**
     * Approve a property
     */
    async approveProperty(adminId, propertyId) {
        const property = await prisma.property.findUnique({
            where: { id: propertyId },
            include: { agent: true }
        });

        if (!property) {
            throw { message: 'Property not found', statusCode: 404 };
        }

        if (property.status === 'APPROVED') {
            throw { message: 'Property is already approved', statusCode: 400 };
        }

        const [updatedProperty] = await prisma.$transaction([
            prisma.property.update({
                where: { id: propertyId },
                data: { status: 'APPROVED' }
            }),
            prisma.adminAction.create({
                data: {
                    adminId,
                    actionType: 'APPROVE_PROPERTY',
                    targetUserId: property.agentId,
                    description: `Approved property: ${property.title} by ${property.agent.fullName}`,
                },
            }),
        ]);

        return updatedProperty;
    }

    /**
     * Reject a property
     */
    async rejectProperty(adminId, propertyId, reason) {
        const property = await prisma.property.findUnique({
            where: { id: propertyId },
            include: { agent: true }
        });

        if (!property) {
            throw { message: 'Property not found', statusCode: 404 };
        }

        if (!reason) {
            throw { message: 'Rejection reason is required', statusCode: 400 };
        }

        const [updatedProperty] = await prisma.$transaction([
            prisma.property.update({
                where: { id: propertyId },
                data: { status: 'REJECTED' }
            }),
            prisma.adminAction.create({
                data: {
                    adminId,
                    actionType: 'REJECT_PROPERTY',
                    targetUserId: property.agentId,
                    description: `Rejected property: ${property.title} by ${property.agent.fullName}. Reason: ${reason}`,
                },
            }),
        ]);

        return updatedProperty;
    }

    /**
     * Get all messages (for monitoring)
     */
    async getAllMessages(filters = {}) {
        const where = {};

        if (filters.senderId) {
            where.senderId = filters.senderId;
        }

        if (filters.receiverId) {
            where.receiverId = filters.receiverId;
        }

        const messages = await prisma.message.findMany({
            where,
            include: {
                sender: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                        avatar: true,
                    },
                },
                receiver: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                        avatar: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
            take: filters.limit || 100,
        });

        return messages;
    }

    /**
     * Get all users with filters
     */
    async getAllUsers(filters = {}) {
        const where = {};

        if (filters.role) {
            where.role = filters.role.toUpperCase();
        }

        if (filters.isBlocked !== undefined && filters.isBlocked !== null) {
            where.isBlocked = filters.isBlocked === 'true' || filters.isBlocked === true;
        }

        if (filters.isVerified !== undefined && filters.isVerified !== null) {
            where.isVerified = filters.isVerified === 'true' || filters.isVerified === true;
        }

        const users = await prisma.user.findMany({
            where,
            select: {
                id: true,
                fullName: true,
                email: true,
                role: true,
                avatar: true,
                whatsapp: true,
                nin: true,
                verificationFeePaid: true,
                verificationStatus: true,
                universityId: true,
                university: {
                    select: {
                        id: true,
                        name: true,
                    }
                },
                isVerified: true,
                isBlocked: true,
                createdAt: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        return users;
    }

    /**
     * Get admin actions log
     */
    async getAdminActions(limit = 50) {
        const actions = await prisma.adminAction.findMany({
            include: {
                admin: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                    },
                },
                targetUser: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
            take: limit,
        });

        return actions;
    }

    /**
     * Get all transactions with filters
     */
    async getAllTransactions(filters = {}) {
        const where = {};
        if (filters.status) where.status = filters.status;
        if (filters.type) where.type = filters.type;

        const transactions = await prisma.transaction.findMany({
            where,
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
            orderBy: {
                createdAt: 'desc',
            },
        });
        return transactions;
    }

    /**
     * Create a new user (Admin only)
     */
    async createUser(adminId, data) {
        // Validate input
        const validation = Validators.validateRegistration(data);
        if (!validation.isValid) {
            throw { name: 'ValidationError', errors: validation.errors };
        }

        // Check if email already exists
        const existingUser = await prisma.user.findUnique({
            where: { email: data.email.toLowerCase() },
        });

        if (existingUser) {
            throw { message: 'Email already registered', statusCode: 400 };
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(data.password, 10);

        // Create user
        const user = await prisma.user.create({
            data: {
                fullName: Validators.sanitize(data.fullName),
                email: data.email.toLowerCase(),
                password: hashedPassword,
                role: (data.role || 'STUDENT').toUpperCase(),
                universityId: data.universityId || null,
                isVerified: data.role.toUpperCase() === 'ADMIN'
            }
        });

        // Log admin action
        await prisma.adminAction.create({
            data: {
                adminId,
                actionType: 'CREATE_USER',
                targetUserId: user.id,
                description: `Created new ${user.role} account: ${user.fullName}`,
            },
        });

        return user;
    }
}

module.exports = new AdminService();
