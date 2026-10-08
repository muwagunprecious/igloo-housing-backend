const express = require('express');
const router = express.Router();
const propertyController = require('../controllers/property.controller');
const { authenticate, optionalAuth } = require('../middleware/auth.middleware');
const { requireVerifiedAgent, requireAgent } = require('../middleware/role.middleware');
const { uploadMultiple, upload } = require('../utils/upload');

/**
 * @route   GET /api/properties/agent/my-properties
 * @desc    Get agent's own properties
 * @access  Agents only
 * NOTE: This MUST be defined BEFORE /:id to avoid Express treating 'agent' as an ID param
 */
router.get('/agent/my-properties', authenticate, requireAgent, propertyController.getAgentProperties);

/**
 * @route   GET /api/properties
 * @desc    Get all properties with filters
 * @access  Public (agent contact info only returned to authenticated users)
 */
router.get('/', optionalAuth, propertyController.getAllProperties);

/**
 * @route   POST /api/properties/upload-url
 * @desc    Get signed upload URLs for direct client-to-Supabase upload
 * @access  Verified agents only
 */
router.post('/upload-url', authenticate, requireVerifiedAgent, propertyController.getSignedUploadUrl);

/**
 * @route   GET /api/properties/:id/contact
 * @desc    Get agent's contact info for a property (WhatsApp etc.)
 * @access  Authenticated users only
 */
router.get('/:id/contact', authenticate, propertyController.getAgentContact);

/**
 * @route   GET /api/properties/:id
 * @desc    Get property by ID
 * @access  Public (agent contact info only returned to authenticated users)
 */
router.get('/:id', optionalAuth, propertyController.getPropertyById);

/**
 * @route   POST /api/properties
 * @desc    Create new property
 * @access  Verified agents only
 */
router.post(
    '/',
    authenticate,
    requireVerifiedAgent,
    upload.fields([{ name: 'images', maxCount: 50 }, { name: 'video', maxCount: 1 }]),
    propertyController.createProperty
);

/**
 * @route   PUT /api/properties/:id
 * @desc    Update property
 * @access  Verified agents only (own properties)
 */
router.put(
    '/:id',
    authenticate,
    requireVerifiedAgent,
    upload.fields([{ name: 'images', maxCount: 50 }, { name: 'video', maxCount: 1 }]),
    propertyController.updateProperty
);

/**
 * @route   DELETE /api/properties/:id
 * @desc    Delete property
 * @access  Verified agents only (own properties)
 */
router.delete('/:id', authenticate, propertyController.deleteProperty);

module.exports = router;
