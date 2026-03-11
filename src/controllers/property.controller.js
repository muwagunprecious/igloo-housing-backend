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
            const { uploadToSupabase } = require('../utils/supabase');

            // Handle multi-field file uploads to Supabase
            let images = [];
            if (req.files?.images) {
                console.log('📸 Uploading', req.files.images.length, 'images to Supabase...');
                images = await Promise.all(
                    req.files.images.map(file => uploadToSupabase(file))
                );
                console.log('✅ Images uploaded:', images);
            }

            let video = null;
            if (req.files?.video) {
                console.log('🎥 Uploading video to Supabase...');
                video = await uploadToSupabase(req.files.video[0]);
                console.log('✅ Video uploaded:', video);
            }

            // Validation: Picture first before video
            if (video && images.length === 0) {
                return Response.error(res, 'You must upload at least one picture before adding a video', 400);
            }

            const property = await propertyService.createProperty(req.user.id, propertyData, images, video);
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
            const { uploadToSupabase } = require('../utils/supabase');

            // Handle multi-field file uploads to Supabase
            let newImages = [];
            if (req.files?.images) {
                newImages = await Promise.all(
                    req.files.images.map(file => uploadToSupabase(file))
                );
            }

            let newVideo = null;
            if (req.files?.video) {
                newVideo = await uploadToSupabase(req.files.video[0]);
            }

            const property = await propertyService.updateProperty(id, req.user.id, propertyData, newImages, newVideo);
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
