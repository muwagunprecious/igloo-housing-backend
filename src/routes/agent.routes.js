const express = require('express');
const router = express.Router();
const agentController = require('../controllers/agent.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requireAgent } = require('../middleware/role.middleware');

/**
 * @route   GET /api/agents/dashboard/stats
 * @desc    Get agent dashboard statistics
 * @access  Private (Agent only)
 */
router.get('/dashboard/stats', authenticate, requireAgent, agentController.getDashboardStats);

/**
 * @route   GET /api/agents/properties
 * @desc    Get agent's properties
 * @access  Private (Agent only)
 */
// router.get('/properties', authenticate, requireAgent, agentController.getAgentProperties);

/**
 * @route   GET /api/agents/messages
 * @desc    Get agent's messages
 * @access  Private (Agent only)
 */
// router.get('/messages', authenticate, requireAgent, agentController.getAgentMessages);

/**
 * @route   GET /api/agents/roommate-requests
 * @desc    Get agent's roommate requests
 * @access  Private (Agent only)
 */
// router.get('/roommate-requests', authenticate, requireAgent, agentController.getAgentRoommateRequests);

module.exports = router;
