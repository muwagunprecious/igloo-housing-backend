require('dotenv').config({ override: true });
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const { connectDB, prisma } = require('./src/config/db');
const { errorHandler, notFoundHandler } = require('./src/middleware/error.middleware');
const chatService = require('./src/services/chat.service');

// Import routes
const authRoutes = require('./src/routes/auth.routes');
const userRoutes = require('./src/routes/user.routes');
const adminRoutes = require('./src/routes/admin.routes');
const propertyRoutes = require('./src/routes/property.routes');
const chatRoutes = require('./src/routes/chat.routes');
const roommateRoutes = require('./src/routes/roommate.routes');
const universityRoutes = require('./src/routes/university.routes');
const agentRoutes = require('./src/routes/agent.routes');
const notificationRoutes = require('./src/routes/notification.routes');

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
    cors: {
        origin: [
            "http://localhost:3000",
            "http://localhost:3001",
            process.env.CLIENT_URL
        ].filter(Boolean),
        methods: ['GET', 'POST'],
        credentials: true,
    },
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check
app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/roommate', roommateRoutes);
app.use('/api/university', universityRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/notifications', notificationRoutes);

// Socket.io for real-time chat
const userSockets = new Map(); // Map to store userId -> socketId

io.on('connection', (socket) => {
    console.log('✅ User connected:', socket.id);

    // User joins with their ID
    socket.on('user:join', (userId) => {
        userSockets.set(userId, socket.id);
        socket.userId = userId;
        console.log(`User ${userId} joined with socket ${socket.id}`);
    });

    // User sends message
    socket.on('message:send', async (data) => {
        try {
            const { receiverId, message, id } = data; // Receive enriched message if possible, or just the basics

            // Note: In current flow, useChatStore calls API first, then emits this.
            // If data contains the full message object from API, we just forward it.

            const receiverSocketId = userSockets.get(receiverId);
            if (receiverSocketId) {
                io.to(receiverSocketId).emit('message:receive', data);
                io.to(receiverSocketId).emit('notification:receive', {
                    title: 'New Message',
                    message: `You have a new message`,
                    type: 'MESSAGE'
                });
            }
        } catch (error) {
            console.error('Error in message:send socket:', error);
        }
    });

    // User is typing
    socket.on('user:typing', (data) => {
        const { receiverId } = data;
        const receiverSocketId = userSockets.get(receiverId);

        if (receiverSocketId) {
            io.to(receiverSocketId).emit('user:typing', {
                userId: socket.userId,
                isTyping: true
            });
        }
    });

    // User stopped typing
    socket.on('user:stop-typing', (data) => {
        const { receiverId } = data;
        const receiverSocketId = userSockets.get(receiverId);

        if (receiverSocketId) {
            io.to(receiverSocketId).emit('user:typing', {
                userId: socket.userId,
                isTyping: false
            });
        }
    });

    // User marks messages as read
    socket.on('message:read', async (data) => {
        try {
            const { senderId } = data; // The user whose messages are being read
            const userId = socket.userId; // The current user reading

            if (userId && senderId) {
                await chatService.markAsRead(userId, senderId);

                // Notify the sender
                const senderSocketId = userSockets.get(senderId);
                if (senderSocketId) {
                    io.to(senderSocketId).emit('message:read', { userId });
                }
            }
        } catch (error) {
            console.error('Error marking read:', error);
        }
    });

    // User disconnects
    socket.on('disconnect', () => {
        if (socket.userId) {
            userSockets.delete(socket.userId);
            console.log(`User ${socket.userId} disconnected`);
        }
        console.log('❌ User disconnected:', socket.id);
    });
});

// 404 handler
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        // Connect to database
        await connectDB();

        // Start server
        server.listen(PORT, () => {
            console.log('========================================');
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`📡 Socket.io enabled for real-time chat`);
            console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log('========================================');
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
    });
    await prisma.$disconnect();
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('SIGINT signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
    });
    await prisma.$disconnect();
    process.exit(0);
});

// Only listen if run directly (not imported)
if (require.main === module) {
    startServer();
} else {
    // For Vercel/Serverless: connect to DB immediately but don't listen
    connectDB().catch(err => console.error('DB Connection Failed', err));
}

module.exports = { app, server, io };
