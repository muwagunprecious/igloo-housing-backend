const chatService = require('../services/chat.service');
const Response = require('../utils/response');

class ChatController {
    /**
     * Send message
     */
    async sendMessage(req, res, next) {
        try {
            const { receiverId, message } = req.body;

            const newMessage = await chatService.sendMessage(req.user.id, receiverId, message);
            return Response.created(res, 'Message sent', newMessage);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get conversation with another user
     */
    async getConversation(req, res, next) {
        try {
            const { userId } = req.params;
            const messages = await chatService.getConversation(req.user.id, userId);
            return Response.success(res, 'Conversation retrieved', messages);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get all user conversations
     */
    async getUserConversations(req, res, next) {
        try {
            const conversations = await chatService.getUserConversations(req.user.id);
            return Response.success(res, 'Conversations retrieved', conversations);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get unread message count
     */
    async getUnreadCount(req, res, next) {
        try {
            const count = await chatService.getUnreadCount(req.user.id);
            return Response.success(res, 'Unread count retrieved', { count });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Mark messages as read
     */
    async markAsRead(req, res, next) {
        try {
            const { senderId } = req.body;
            await chatService.markAsRead(req.user.id, senderId);
            return Response.success(res, 'Messages marked as read');
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new ChatController();
