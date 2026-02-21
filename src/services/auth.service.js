const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { prisma } = require('../config/db');
const Validators = require('../utils/validators');

class AuthService {
    /**
     * Register a new user
     */
    async register(data) {
        // Validate input
        const validation = Validators.validateRegistration(data);
        if (!validation.isValid) {
            throw { name: 'ValidationError', errors: validation.errors };
        }

        // Check if email already exists
        const existingUser = await prisma.user.findUnique({
            where: { email: data.email.toLowerCase() },
        });

        if (existingUser) {
            throw { message: 'Email already registered', statusCode: 400 };
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(data.password, 10);

        // Create user
        const user = await prisma.user.create({
            data: {
                fullName: Validators.sanitize(data.fullName),
                email: data.email.toLowerCase(),
                password: hashedPassword,
                role: (data.role || 'STUDENT').toUpperCase(),
                avatar: data.avatar || null,
                bio: data.bio || null,
                universityId: data.universityId || null,
            },
            select: {
                id: true,
                fullName: true,
                email: true,
                role: true,
                avatar: true,
                bio: true,
                universityId: true,
                isVerified: true,
                createdAt: true,
            },
        });

        // Generate JWT token
        const token = this.generateToken(user.id);

        return { user, token };
    }

    /**
     * Login user
     */
    async login(email, password) {
        // Validate input
        if (!email || !password) {
            throw { message: 'Email and password are required', statusCode: 400 };
        }

        if (!Validators.isValidEmail(email)) {
            throw { message: 'Invalid email format', statusCode: 400 };
        }

        // Find user
        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
        });

        if (!user) {
            throw { message: 'Invalid email or password', statusCode: 401 };
        }

        // Check if user is blocked
        if (user.isBlocked) {
            throw { message: 'Your account has been blocked. Please contact support.', statusCode: 403 };
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
            throw { message: 'Invalid email or password', statusCode: 401 };
        }

        // Generate token
        const token = this.generateToken(user.id);

        // Remove password from response
        const { password: _, ...userWithoutPassword } = user;

        return { user: userWithoutPassword, token };
    }

    /**
     * Generate JWT token
     */
    generateToken(userId) {
        return jwt.sign(
            { userId },
            process.env.JWT_SECRET,
            { expiresIn: '30d' }
        );
    }

    /**
     * Get user profile
     */
    async getProfile(userId) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
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
                createdAt: true,
                updatedAt: true,
            },
        });

        if (!user) {
            throw { message: 'User not found', statusCode: 404 };
        }

        return user;
    }

    /**
     * Update user profile
     */
    async updateProfile(userId, data) {
        const updateData = {};

        if (data.fullName) {
            updateData.fullName = Validators.sanitize(data.fullName);
        }

        if (data.bio !== undefined) {
            updateData.bio = Validators.sanitize(data.bio);
        }

        if (data.avatar !== undefined) {
            updateData.avatar = data.avatar;
        }

        if (data.universityId !== undefined) {
            updateData.universityId = data.universityId;
        }

        const user = await prisma.user.update({
            where: { id: userId },
            data: updateData,
            select: {
                id: true,
                fullName: true,
                email: true,
                role: true,
                avatar: true,
                bio: true,
                universityId: true,
                isVerified: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        return user;
    }

    /**
     * Change password
     */
    async changePassword(userId, currentPassword, newPassword) {
        // Get user with password
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw { message: 'User not found', statusCode: 404 };
        }

        // Verify current password
        const isValidPassword = await bcrypt.compare(currentPassword, user.password);

        if (!isValidPassword) {
            throw { message: 'Current password is incorrect', statusCode: 401 };
        }

        // Validate new password
        if (!Validators.isStrongPassword(newPassword)) {
            throw { message: 'New password must be at least 8 characters with letters and numbers', statusCode: 400 };
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password
        await prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword },
        });

        return true;
    }
}

module.exports = new AuthService();
