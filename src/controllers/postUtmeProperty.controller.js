const postUtmePropertyService = require('../services/postUtmeProperty.service');
const Response = require('../utils/response');
const { uploadToSupabase } = require('../utils/supabase');

class PostUtmePropertyController {
    // GET /api/post-utme/properties - public marketplace
    async getAllProperties(req, res, next) {
        try {
            const { area, minPrice, maxPrice, minGuests, maxGuests, minRooms, maxRooms, isVerified, minRating, sortBy, page } = req.query;
            const result = await postUtmePropertyService.getAllApproved({
                area, minPrice: minPrice ? parseFloat(minPrice) : undefined,
                maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
                minGuests: minGuests ? parseInt(minGuests) : undefined,
                maxGuests: maxGuests ? parseInt(maxGuests) : undefined,
                minRooms: minRooms ? parseInt(minRooms) : undefined,
                maxRooms: maxRooms ? parseInt(maxRooms) : undefined,
                isVerified: isVerified === 'true' ? true : undefined,
                minRating: minRating ? parseFloat(minRating) : undefined,
                sortBy, page: page ? parseInt(page) : 1
            });
            return Response.success(res, 'Properties retrieved', result);
        } catch (error) { next(error); }
    }

    // GET /api/post-utme/properties/:id
    async getPropertyById(req, res, next) {
        try {
            const property = await postUtmePropertyService.getPropertyById(req.params.id);
            return Response.success(res, 'Property retrieved', property);
        } catch (error) { next(error); }
    }

    // POST /api/post-utme/properties - renter creates listing
    async createProperty(req, res, next) {
        try {
            const ownerId = req.user.id;
            const data = req.body;
            if (typeof data.amenities === 'string') {
                try { data.amenities = JSON.parse(data.amenities); } catch(e) { data.amenities = []; }
            }
            let images = [];
            if (req.files && req.files.length > 0) {
                images = await Promise.all(
                    req.files.map((file, idx) => uploadToSupabase(file).then(url => ({ url, order: idx })))
                );
            }
            const property = await postUtmePropertyService.createProperty(ownerId, { ...data, images });
            return Response.created(res, 'Property submitted for review', property);
        } catch (error) { next(error); }
    }

    // PUT /api/post-utme/properties/:id
    async updateProperty(req, res, next) {
        try {
            const data = req.body;
            if (typeof data.amenities === 'string') {
                try { data.amenities = JSON.parse(data.amenities); } catch(e) {}
            }
            let newImages = undefined;
            if (req.files && req.files.length > 0) {
                newImages = await Promise.all(
                    req.files.map((file, idx) => uploadToSupabase(file).then(url => ({ url, order: idx })))
                );
            }
            const property = await postUtmePropertyService.updateProperty(req.params.id, req.user.id, { ...data, images: newImages });
            return Response.success(res, 'Property updated', property);
        } catch (error) { next(error); }
    }

    // DELETE /api/post-utme/properties/:id
    async deleteProperty(req, res, next) {
        try {
            await postUtmePropertyService.deleteProperty(req.params.id, req.user.id);
            return Response.success(res, 'Property deleted');
        } catch (error) { next(error); }
    }

    // GET /api/post-utme/properties/renter/mine
    async getMyProperties(req, res, next) {
        try {
            const properties = await postUtmePropertyService.getRenterProperties(req.user.id);
            return Response.success(res, 'Properties retrieved', properties);
        } catch (error) { next(error); }
    }

    // POST /api/post-utme/properties/:id/reviews
    async addReview(req, res, next) {
        try {
            const { rating, comment } = req.body;
            const review = await postUtmePropertyService.addReview(req.user.id, req.params.id, parseInt(rating), comment);
            return Response.created(res, 'Review submitted', review);
        } catch (error) { next(error); }
    }

    // GET /api/post-utme/properties/:id/reviews
    async getReviews(req, res, next) {
        try {
            const { page, limit } = req.query;
            const result = await postUtmePropertyService.getReviews(req.params.id, parseInt(page) || 1, parseInt(limit) || 10);
            return Response.success(res, 'Reviews retrieved', result);
        } catch (error) { next(error); }
    }

    // POST /api/post-utme/properties/:id/submit
    async submitForReview(req, res, next) {
        try {
            const property = await postUtmePropertyService.submitForReview(req.params.id, req.user.id);
            return Response.success(res, 'Property submitted for review', property);
        } catch (error) { next(error); }
    }
}

module.exports = new PostUtmePropertyController();
