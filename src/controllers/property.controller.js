const propertyService = require('../services/property.service');
const Response = require('../utils/response');
const { getFileUrl } = require('../utils/upload');

class PropertyController {
    /**
     * Get all properties
     */
    async getAllProperties(req, res, next) {
        try {
            const filters = {
                category: req.query.category,
                campus: req.query.campus,
                universityId: req.query.universityId,
                minPrice: req.query.minPrice,
                maxPrice: req.query.maxPrice,
                bedrooms: req.query.bedrooms,
                roommatesAllowed: req.query.roommatesAllowed,
                status: req.query.status,
            };

            const properties = await propertyService.getAllProperties(filters);
            return Response.success(res, 'Properties retrieved', properties);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get property by ID
     */
    async getPropertyById(req, res, next) {
        try {
            const { id } = req.params;
            const property = await propertyService.getPropertyById(id);
            return Response.success(res, 'Property retrieved', property);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Create property (Agent only)
     */
    async createProperty(req, res, next) {
        try {
            const propertyData = req.body;

            // Handle multiple image uploads
            const images = req.files ? req.files.map(file => getFileUrl(file.path)) : [];

            const property = await propertyService.createProperty(req.user.id, propertyData, images);
            return Response.created(res, 'Property created successfully', property);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Update property (Agent only)
     */
    async updateProperty(req, res, next) {
        try {
            const { id } = req.params;
            const propertyData = req.body;

            // Handle new image uploads
            const newImages = req.files ? req.files.map(file => getFileUrl(file.path)) : [];

            const property = await propertyService.updateProperty(id, req.user.id, propertyData, newImages);
            return Response.success(res, 'Property updated successfully', property);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Delete property (Agent only)
     */
    async deleteProperty(req, res, next) {
        try {
            const { id } = req.params;
            await propertyService.deleteProperty(id, req.user.id);
            return Response.success(res, 'Property deleted successfully');
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get agent's properties
     */
    async getAgentProperties(req, res, next) {
        try {
            const properties = await propertyService.getAgentProperties(req.user.id);
            return Response.success(res, 'Agent properties retrieved', properties);
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new PropertyController();
