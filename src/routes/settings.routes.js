const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settings.controller');

/**
 * @route   GET /api/settings/agent-fee
 * @desc    Get agent verification fee
 * @access  Public
 */
router.get('/agent-fee', settingsController.getAgentFee);

module.exports = router;
