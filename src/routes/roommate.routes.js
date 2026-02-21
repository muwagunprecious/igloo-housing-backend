const express = require('express');
const router = express.Router();
const roommateController = require('../controllers/roommate.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requireStudent, requireAgent, requireVerifiedAgent } = require('../middleware/role.middleware');
const { uploadMultiple } = require('../utils/upload');

/**
 * @route   POST /api/roommate/request
 * @desc    Create roommate request
 * @access  Students only
 */
router.post('/request', authenticate, requireStudent, uploadMultiple('media', 5), roommateController.createRequest);

/**
 * @route   GET /api/roommate/my-requests
 * @desc    Get user's roommate requests
 * @access  Students only
 */
router.get('/my-requests', authenticate, requireStudent, roommateController.getUserRequests);

/**
 * @route   GET /api/roommate/feed
 * @desc    Get roommate feed (University filtered)
 * @access  Students only
 */
router.get('/feed', authenticate, requireStudent, roommateController.getAllRequests);

/**
 * @route   GET /api/roommate/agent/requests
 * @desc    Get roommate requests for agent's properties
 * @access  Verified agents only
 */
router.get('/agent/requests', authenticate, requireVerifiedAgent, roommateController.getAgentRequests);

/**
 * @route   PUT /api/roommate/request/:id
 * @desc    Update roommate request status
 * @access  Verified agents only
 */
router.put('/request/:id', authenticate, requireVerifiedAgent, roommateController.updateRequestStatus);

/**
 * @route   DELETE /api/roommate/request/:id
 * @desc    Delete roommate request
 * @access  Students only
 */
router.delete('/request/:id', authenticate, requireStudent, roommateController.deleteRequest);

module.exports = router;
