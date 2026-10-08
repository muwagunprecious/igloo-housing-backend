const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
// const { optionalAuth } = require('../middleware/authMiddleware');

/**
 * @route   GET /api/user/:id
 * @desc    Get user by ID
 * @access  Public
 */
router.get('/:id', userController.getUserById);

module.exports = router;
