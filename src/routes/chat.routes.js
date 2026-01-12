const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chat.controller');
const { authenticate } = require('../middleware/auth.middleware');

// All chat routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/chat/send
 * @desc    Send a message
 * @access  Private
 */
router.post('/send', chatController.sendMessage);

/**
 * @route   GET /api/chat/conversation/:userId
 * @desc    Get conversation with another user
 * @access  Private
 */
router.get('/conversation/:userId', chatController.getConversation);

/**
 * @route   GET /api/chat/conversations
 * @desc    Get all user conversations
 * @access  Private
 */
router.get('/conversations', chatController.getUserConversations);

/**
 * @route   GET /api/chat/unread
 * @desc    Get unread message count
 * @access  Private
 */
router.get('/unread', chatController.getUnreadCount);

/**
 * @route   PUT /api/chat/read
 * @desc    Mark messages as read
 * @access  Private
 */
router.put('/read', chatController.markAsRead);

module.exports = router;
