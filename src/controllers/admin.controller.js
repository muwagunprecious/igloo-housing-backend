const adminService = require('../services/admin.service');
const Response = require('../utils/response');

class AdminController {
    /**
     * Get platform statistics
     */
    async getStats(req, res, next) {
        try {
            const stats = await adminService.getStats();
            return Response.success(res, 'Platform statistics retrieved', stats);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get pending agents
     */
    async getPendingAgents(req, res, next) {
        try {
            const agents = await adminService.getPendingAgents();
            return Response.success(res, 'Pending agents retrieved', agents);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Verify agent
     */
    async verifyAgent(req, res, next) {
        try {
            const { id } = req.params;
            const agent = await adminService.verifyAgent(req.user.id, id);
            return Response.success(res, 'Agent verified successfully', agent);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Reject agent (revert to student role)
     */
    async rejectAgent(req, res, next) {
        try {
            const { id } = req.params;
            const { reason } = req.body;
            const agent = await adminService.rejectAgent(req.user.id, id, reason);
            return Response.success(res, 'Agent application rejected', agent);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Block user
     */
    async blockUser(req, res, next) {
        try {
            const { id } = req.params;
            const { reason } = req.body;
            const user = await adminService.blockUser(req.user.id, id, reason);
            return Response.success(res, 'User blocked successfully', user);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Unblock user
     */
    async unblockUser(req, res, next) {
        try {
            const { id } = req.params;
            const user = await adminService.unblockUser(req.user.id, id);
            return Response.success(res, 'User unblocked successfully', user);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Approve property
     */
    async approveProperty(req, res, next) {
        try {
            const { id } = req.params;
            const property = await adminService.approveProperty(req.user.id, id);
            return Response.success(res, 'Property approved successfully', property);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Reject property
     */
    async rejectProperty(req, res, next) {
        try {
            const { id } = req.params;
            const { reason } = req.body;
            const property = await adminService.rejectProperty(req.user.id, id, reason);
            return Response.success(res, 'Property rejected successfully', property);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Remove property
     */
    async removeProperty(req, res, next) {
        try {
            const { id } = req.params;
            const { reason } = req.body;
            await adminService.removeProperty(req.user.id, id, reason);
            return Response.success(res, 'Property removed successfully');
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get all messages
     */
    async getAllMessages(req, res, next) {
        try {
            const { senderId, receiverId, limit } = req.query;
            const messages = await adminService.getAllMessages({ senderId, receiverId, limit });
            return Response.success(res, 'Messages retrieved', messages);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get all users
     */
    async getAllUsers(req, res, next) {
        try {
            const { role, isBlocked, isVerified } = req.query;
            const users = await adminService.getAllUsers({ role, isBlocked, isVerified });
            return Response.success(res, 'Users retrieved', users);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get admin actions log
     */
    async getAdminActions(req, res, next) {
        try {
            const { limit } = req.query;
            const actions = await adminService.getAdminActions(limit);
            return Response.success(res, 'Admin actions retrieved', actions);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get all transactions
     */
    async getAllTransactions(req, res, next) {
        try {
            const { status, type } = req.query;
            const transactions = await adminService.getAllTransactions({ status, type });
            return Response.success(res, 'Transactions retrieved', transactions);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Create user (Admin only)
     */
    async createUser(req, res, next) {
        try {
            const user = await adminService.createUser(req.user.id, req.body);
            return Response.success(res, 'User created successfully', user, 201);
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new AdminController();
