const settingsService = require('../services/settings.service');
const Response = require('../utils/response');

class SettingsController {
    /**
     * Get agent verification fee (Public endpoint for frontend)
     */
    async getAgentFee(req, res, next) {
        try {
            const fee = await settingsService.getAgentFee();
            return Response.success(res, 'Agent verification fee retrieved', { fee });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Update agent verification fee (Admin only)
     */
    async updateAgentFee(req, res, next) {
        try {
            const { fee } = req.body;
            const result = await settingsService.setAgentFee(fee);
            return Response.success(res, 'Agent verification fee updated successfully', result);
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new SettingsController();
