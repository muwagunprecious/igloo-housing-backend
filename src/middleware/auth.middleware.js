const jwt = require('jsonwebtoken');
const { prisma } = require('../config/db');
const Response = require('../utils/response');

/**
 * Verify JWT token and authenticate user
 */
const authenticate = async (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return Response.unauthorized(res, 'No token provided');
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Get user from database
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true,
                fullName: true,
                email: true,
                role: true,
                avatar: true,
                bio: true,
                universityId: true,
                isVerified: true,
                isBlocked: true,
            },
        });

        if (!user) {
            return Response.unauthorized(res, 'User not found');
        }

        // Check if user is blocked
        if (user.isBlocked) {
            return Response.forbidden(res, 'Your account has been blocked. Please contact support.');
        }

        // Attach user to request
        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return Response.unauthorized(res, 'Invalid token');
        }
        if (error.name === 'TokenExpiredError') {
            return Response.unauthorized(res, 'Token expired');
        }
        return Response.serverError(res, 'Authentication failed');
    }
};

/**
 * Optional authentication - doesn't fail if no token
 */
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return next();
        }

        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true,
                fullName: true,
                email: true,
                role: true,
                avatar: true,
                universityId: true,
                isVerified: true,
                isBlocked: true,
            },
        });

        if (user && !user.isBlocked) {
            req.user = user;
        }

        next();
    } catch (error) {
        // If token is invalid, just continue without user
        next();
    }
};

module.exports = {
    authenticate,
    optionalAuth,
};
