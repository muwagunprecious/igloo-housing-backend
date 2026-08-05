const express = require('express');
const router = express.Router();
const controller = require('../controllers/postUtmeProperty.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { uploadMultiple } = require('../utils/upload');

// Public
router.get('/', controller.getAllProperties);
router.get('/renter/mine', authenticate, controller.getMyProperties);
router.get('/:id', controller.getPropertyById);
router.get('/:id/reviews', controller.getReviews);

// Renter (authenticated)
router.post('/', authenticate, uploadMultiple('images', 15), controller.createProperty);
router.put('/:id', authenticate, uploadMultiple('images', 15), controller.updateProperty);
router.delete('/:id', authenticate, controller.deleteProperty);
router.post('/:id/submit', authenticate, controller.submitForReview);

// Student reviews
router.post('/:id/reviews', authenticate, controller.addReview);

module.exports = router;
