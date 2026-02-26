const express = require('express');
const router = express.Router();
const propertyController = require('../controllers/property.controller');
const { authenticate } = require('../middleware/auth.middleware');
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
 * @access  Public
 */
router.get('/', propertyController.getAllProperties);

/**
 * @route   GET /api/properties/:id
 * @desc    Get property by ID
 * @access  Public
 */
router.get('/:id', propertyController.getPropertyById);

/**
 * @route   POST /api/properties
 * @desc    Create new property
 * @access  Verified agents only
 */
router.post(
    '/',
    authenticate,
    requireVerifiedAgent,
    upload.fields([{ name: 'images', maxCount: 10 }, { name: 'video', maxCount: 1 }]),
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
    upload.fields([{ name: 'images', maxCount: 10 }, { name: 'video', maxCount: 1 }]),
    propertyController.updateProperty
);

/**
 * @route   DELETE /api/properties/:id
 * @desc    Delete property
 * @access  Verified agents only (own properties)
 */
router.delete('/:id', authenticate, propertyController.deleteProperty);

module.exports = router;
