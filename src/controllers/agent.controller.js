const propertyService = require('../services/property.service');
const Response = require('../utils/response');

class AgentController {
    /**
     * Get dashboard stats
     */
    async getDashboardStats(req, res, next) {
        try {
            const agentId = req.user.id;
            const properties = await propertyService.getAgentProperties(agentId);

            const totalProperties = properties.length;
            const totalViews = properties.reduce((sum, prop) => sum + (prop.views || 0), 0);
            const totalRequests = properties.reduce((sum, prop) => sum + (prop._count?.roommateRequests || 0), 0);

            // Mock message count for now or fetch from chat service if available
            // const unreadMessages = await chatService.getUnreadCount(agentId);
            const unreadMessages = 0;

            const stats = {
                totalProperties,
                totalViews,
                totalRequests,
                unreadMessages,
                recentProperties: properties.slice(0, 5)
            };

            return Response.success(res, 'Dashboard stats retrieved', stats);
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new AgentController();
