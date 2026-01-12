const universityService = require('../services/university.service');
const Response = require('../utils/response');

class UniversityController {
    /**
     * Get all universities
     */
    async getAllUniversities(req, res, next) {
        try {
            const universities = await universityService.getAllUniversities();
            return Response.success(res, 'Universities retrieved', universities);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get university by ID
     */
    async getUniversityById(req, res, next) {
        try {
            const { id } = req.params;
            const university = await universityService.getUniversityById(id);
            return Response.success(res, 'University retrieved', university);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Create university (Admin only)
     */
    async createUniversity(req, res, next) {
        try {
            const { name, state } = req.body;
            const university = await universityService.createUniversity(req.user.id, { name, state });
            return Response.created(res, 'University created successfully', university);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Update university (Admin only)
     */
    async updateUniversity(req, res, next) {
        try {
            const { id } = req.params;
            const { name, state } = req.body;
            const university = await universityService.updateUniversity(id, { name, state });
            return Response.success(res, 'University updated successfully', university);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Delete university (Admin only)
     */
    async deleteUniversity(req, res, next) {
        try {
            const { id } = req.params;
            await universityService.deleteUniversity(req.user.id, id);
            return Response.success(res, 'University deleted successfully');
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new UniversityController();
