const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { authenticate } = require('../middleware/auth.middleware');

/**
 * @route   GET /api/user/:id
 * @desc    Get user by ID
 * @access  Authenticated users only (email/whatsapp only returned to the owner)
 */
router.get('/:id', authenticate, userController.getUserById);

module.exports = router;
