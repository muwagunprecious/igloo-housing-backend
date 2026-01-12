const notificationService = require('../services/notification.service');
const Response = require('../utils/response');

class NotificationController {
    /**
     * Get all notifications for current user
     */
    async getMyNotifications(req, res, next) {
        try {
            const notifications = await notificationService.getUserNotifications(req.user.id);
            const unreadCount = await notificationService.getUnreadCount(req.user.id);

            return Response.success(res, 'Notifications retrieved', {
                notifications,
                unreadCount
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Mark notification as read
     */
    async markAsRead(req, res, next) {
        try {
            const { id } = req.params;
            await notificationService.markAsRead(id, req.user.id);

            return Response.success(res, 'Notification marked as read');
        } catch (error) {
            next(error);
        }
    }

    /**
     * Mark all notifications as read
     */
    async markAllAsRead(req, res, next) {
        try {
            await notificationService.markAllAsRead(req.user.id);

            return Response.success(res, 'All notifications marked as read');
        } catch (error) {
            next(error);
        }
    }

    /**
     * Delete notification
     */
    async deleteNotification(req, res, next) {
        try {
            const { id } = req.params;
            await notificationService.deleteNotification(id, req.user.id);

            return Response.success(res, 'Notification deleted');
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new NotificationController();
