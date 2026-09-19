const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { uploadSingle } = require('../utils/upload');

/**
 * @route   POST /api/auth/register
 * @desc    Register new user
 * @access  Public
 */
router.post('/register', uploadSingle('avatar'), authController.register);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', authController.login);

/**
 * @route   POST /api/auth/clerk-sync
 * @desc    Sync Clerk user with database
 * @access  Public
 */
router.post('/clerk-sync', authController.syncClerk);

/**
 * @route   POST /api/auth/agent-verify
 * @desc    Submit Agent NIN and Paystack verification
 * @access  Public
 */
router.post('/agent-verify', authController.verifyAgent);
router.post('/confirm-verification-fee', authController.verifyAgent);

/**
 * @route   GET /api/auth/check-role
 * @desc    Check email role for sign-in differentiation
 * @access  Public
 */
router.get('/check-role', authController.checkRole);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user info
 * @access  Private
 */
router.get('/me', authenticate, authController.me);

/**
 * @route   GET /api/auth/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/profile', authenticate, authController.getProfile);

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', authenticate, uploadSingle('avatar'), authController.updateProfile);

/**
 * @route   PUT /api/auth/password
 * @desc    Change password
 * @access  Private
 */
router.put('/password', authenticate, authController.changePassword);

module.exports = router;
