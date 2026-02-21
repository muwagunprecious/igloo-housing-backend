const roommateService = require('../services/roommate.service');
const Response = require('../utils/response');
const { getFileUrl } = require('../utils/upload');

class RoommateController {
    /**
     * Create roommate request
     */
    async createRequest(req, res, next) {
        try {
            // Handle uploaded files
            if (req.files && req.files.length > 0) {
                const mediaPaths = req.files.map(file => getFileUrl(file.path));
                req.body.media = JSON.stringify(mediaPaths);
            }

            const request = await roommateService.createRequest(req.user.id, req.body);
            return Response.created(res, 'Roommate request sent', request);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get all requests (Feed)
     */
    async getAllRequests(req, res, next) {
        try {
            // User must have a universityId to see requests
            if (!req.user.universityId) {
                return Response.error(res, 'You must be associated with a university to view the feed', 400);
            }

            const filters = {
                genderPref: req.query.genderPref
            };

            const requests = await roommateService.getAllRequests(req.user.universityId, filters);
            return Response.success(res, 'Roommate feed retrieved', requests);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get user's roommate requests
     */
    async getUserRequests(req, res, next) {
        try {
            const requests = await roommateService.getUserRequests(req.user.id);
            return Response.success(res, 'Your roommate requests retrieved', requests);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get agent's roommate requests
     */
    async getAgentRequests(req, res, next) {
        try {
            const requests = await roommateService.getAgentRequests(req.user.id);
            return Response.success(res, 'Roommate requests for your properties retrieved', requests);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Update request status
     */
    async updateRequestStatus(req, res, next) {
        try {
            const { id } = req.params;
            const { status } = req.body;
            const request = await roommateService.updateRequestStatus(id, req.user.id, status);
            return Response.success(res, 'Request status updated', request);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Delete request
     */
    async deleteRequest(req, res, next) {
        try {
            const { id } = req.params;
            await roommateService.deleteRequest(id, req.user.id);
            return Response.success(res, 'Request deleted successfully');
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new RoommateController();
