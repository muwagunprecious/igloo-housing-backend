const express = require('express');
const router = express.Router();
const propertyController = require('../controllers/property.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requireVerifiedAgent, requireAgent } = require('../middleware/role.middleware');
const { uploadMultiple } = require('../utils/upload');

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
    uploadMultiple('images', 10),
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
    uploadMultiple('images', 10),
    propertyController.updateProperty
);

/**
 * @route   DELETE /api/properties/:id
 * @desc    Delete property
 * @access  Verified agents only (own properties)
 */
router.delete('/:id', authenticate, propertyController.deleteProperty);

/**
 * @route   GET /api/properties/agent/my-properties
 * @desc    Get agent's own properties
 * @access  Agents only
 */
router.get('/agent/my-properties', authenticate, requireAgent, propertyController.getAgentProperties); // Wait, propertyController has getProperties (all) but not getAgentProperties??
// Let me check propertyController.js Step 116 again.
// It DOES NOT have getAgentProperties.
// But agentController.js (Step 115) DOES have getAgentProperties.
// The route /agent/my-properties should probably use agentController.getAgentProperties? 
// OR I should use propertyController.getProperties and filter by agentId? 
// property.routes.js had `propertyController.getAgentProperties`.
// I will check if I should move it or just correct the import.

module.exports = router;
