const { prisma } = require('../config/db');

class ChatService {
    /**
     * Send a message
     */
    async sendMessage(senderId, receiverId, message) {
        if (!message || !message.trim()) {
            throw { message: 'Message cannot be empty', statusCode: 400 };
        }

        if (senderId === receiverId) {
            throw { message: 'Cannot send message to yourself', statusCode: 400 };
        }

        // Check if receiver exists
        const receiver = await prisma.user.findUnique({
            where: { id: receiverId },
        });

        if (!receiver) {
            throw { message: 'Receiver not found', statusCode: 404 };
        }

        if (receiver.isBlocked) {
            throw { message: 'Cannot send message to blocked user', statusCode: 403 };
        }

        // Create message
        const newMessage = await prisma.message.create({
            data: {
                senderId,
                receiverId,
                message: message.trim(),
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        fullName: true,
                        avatar: true,
                    },
                },
                receiver: {
                    select: {
                        id: true,
                        fullName: true,
                        avatar: true,
                    },
                },
            },
        });

        return newMessage;
    }

    /**
     * Get conversation between two users
     */
    async getConversation(userId, otherUserId) {
        const messages = await prisma.message.findMany({
            where: {
                OR: [
                    { senderId: userId, receiverId: otherUserId },
                    { senderId: otherUserId, receiverId: userId },
                ],
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        fullName: true,
                        avatar: true,
                    },
                },
                receiver: {
                    select: {
                        id: true,
                        fullName: true,
                        avatar: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'asc',
            },
        });

        // Mark messages as read where current user is receiver
        await prisma.message.updateMany({
            where: {
                senderId: otherUserId,
                receiverId: userId,
                isRead: false,
            },
            data: {
                isRead: true,
            },
        });

        return messages;
    }

    /**
     * Get all conversations for a user
     */
    async getUserConversations(userId) {
        // Get all unique users the current user has chatted with
        const sentMessages = await prisma.message.findMany({
            where: { senderId: userId },
            select: { receiverId: true },
            distinct: ['receiverId'],
        });

        const receivedMessages = await prisma.message.findMany({
            where: { receiverId: userId },
            select: { senderId: true },
            distinct: ['senderId'],
        });

        const userIds = [
            ...new Set([
                ...sentMessages.map((m) => m.receiverId),
                ...receivedMessages.map((m) => m.senderId),
            ]),
        ];

        // Get conversation details for each user
        const conversations = await Promise.all(
            userIds.map(async (otherUserId) => {
                // Get last message
                const lastMessage = await prisma.message.findFirst({
                    where: {
                        OR: [
                            { senderId: userId, receiverId: otherUserId },
                            { senderId: otherUserId, receiverId: userId },
                        ],
                    },
                    orderBy: {
                        createdAt: 'desc',
                    },
                });

                // Get unread count
                const unreadCount = await prisma.message.count({
                    where: {
                        senderId: otherUserId,
                        receiverId: userId,
                        isRead: false,
                    },
                });

                // Get other user info
                const otherUser = await prisma.user.findUnique({
                    where: { id: otherUserId },
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                        avatar: true,
                        role: true,
                    },
                });

                return {
                    user: otherUser,
                    lastMessage,
                    unreadCount,
                };
            })
        );

        // Sort by last message time
        conversations.sort((a, b) => {
            return new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt);
        });

        return conversations;
    }

    /**
     * Get unread message count
     */
    async getUnreadCount(userId) {
        const count = await prisma.message.count({
            where: {
                receiverId: userId,
                isRead: false,
            },
        });

        return count;
    }

    /**
     * Mark messages as read
     */
    async markAsRead(userId, senderId) {
        await prisma.message.updateMany({
            where: {
                senderId,
                receiverId: userId,
                isRead: false,
            },
            data: {
                isRead: true,
            },
        });

        return true;
    }
}

module.exports = new ChatService();
