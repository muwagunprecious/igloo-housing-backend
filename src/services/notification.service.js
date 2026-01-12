const { prisma } = require('../config/db');

class NotificationService {
    /**
     * Create a new notification
     */
    async createNotification(userId, title, message, type = 'SYSTEM') {
        return await prisma.notification.create({
            data: {
                userId,
                title,
                message,
                type: type.toUpperCase(),
            },
        });
    }

    /**
     * Get all notifications for a user
     */
    async getUserNotifications(userId) {
        return await prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
    }

    /**
     * Mark a notification as read
     */
    async markAsRead(id, userId) {
        return await prisma.notification.updateMany({
            where: { id, userId },
            data: { isRead: true },
        });
    }

    /**
     * Mark all notifications as read for a user
     */
    async markAllAsRead(userId) {
        return await prisma.notification.updateMany({
            where: { userId },
            data: { isRead: true },
        });
    }

    /**
     * Delete a notification
     */
    async deleteNotification(id, userId) {
        return await prisma.notification.deleteMany({
            where: { id, userId },
        });
    }

    /**
     * Get unread notification count
     */
    async getUnreadCount(userId) {
        return await prisma.notification.count({
            where: { userId, isRead: false },
        });
    }
}

module.exports = new NotificationService();
