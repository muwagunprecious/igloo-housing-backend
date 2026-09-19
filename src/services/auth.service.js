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
                whatsapp: data.whatsapp || null,
                universityId: data.universityId || null,
            },
            select: {
                id: true,
                fullName: true,
                email: true,
                role: true,
                avatar: true,
                bio: true,
                whatsapp: true,
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
        email = (email || '').trim();
        password = (password || '').trim();

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
                whatsapp: true,
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

        if (data.whatsapp !== undefined) {
            updateData.whatsapp = Validators.sanitize(data.whatsapp);
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
                whatsapp: true,
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

    /**
     * Sync Clerk User with Igloo database
     */
    async syncClerkUser({ clerkId, email, fullName, role, avatar, whatsapp, universityId }) {
        if (!email) {
            throw { message: 'Email is required for Clerk user sync', statusCode: 400 };
        }

        const normalizedEmail = email.toLowerCase().trim();

        // Check if user exists by clerkId or email
        let user = null;
        if (clerkId) {
            user = await prisma.user.findFirst({
                where: {
                    OR: [
                        { clerkId: clerkId },
                        { email: normalizedEmail }
                    ]
                }
            });
        } else {
            user = await prisma.user.findUnique({
                where: { email: normalizedEmail }
            });
        }

        const cleanName = (fullName && fullName.trim() && fullName.trim().toUpperCase() !== 'JOHN DOE') 
            ? fullName.trim() 
            : null;

        if (user) {
            // Update clerkId, avatar, fullName, whatsapp, universityId if provided
            const updateData = {};
            if (clerkId && user.clerkId !== clerkId) {
                updateData.clerkId = clerkId;
            }
            if (avatar && !user.avatar) {
                updateData.avatar = avatar;
            }
            if (cleanName && (!user.fullName || user.fullName.toUpperCase() === 'JOHN DOE' || cleanName !== user.fullName)) {
                updateData.fullName = cleanName;
            }
            if (whatsapp && whatsapp.trim()) {
                updateData.whatsapp = whatsapp.trim();
            }
            if (universityId && universityId.trim()) {
                updateData.universityId = universityId.trim();
            }
            if (role && user.role === 'STUDENT' && role.toUpperCase() === 'AGENT') {
                updateData.role = 'AGENT';
            }

            if (Object.keys(updateData).length > 0) {
                user = await prisma.user.update({
                    where: { id: user.id },
                    data: updateData
                });
            }
        } else {
            // Generate a random secure dummy password
            const dummyPassword = await bcrypt.hash(`clerk_${Date.now()}_${Math.random()}`, 10);
            const userRole = (role || 'STUDENT').toUpperCase();

            user = await prisma.user.create({
                data: {
                    clerkId: clerkId || null,
                    fullName: cleanName || normalizedEmail.split('@')[0],
                    email: normalizedEmail,
                    password: dummyPassword,
                    role: userRole,
                    avatar: avatar || null,
                    whatsapp: whatsapp ? whatsapp.trim() : null,
                    universityId: universityId ? universityId.trim() : null,
                    isVerified: false,
                    verificationFeePaid: false,
                    verificationStatus: 'PENDING'
                }
            });
        }

        const token = this.generateToken(user.id);
        const { password: _, ...userWithoutPassword } = user;
        return { user: userWithoutPassword, token };
    }

    /**
     * Verify agent NIN & payment
     */
    async verifyAgent({ userId, email, clerkId, fullName, whatsapp, nin, universityId, reference }) {
        let user = null;
        const normalizedEmail = email ? email.toLowerCase().trim() : null;

        if (userId) {
            user = await prisma.user.findUnique({ where: { id: userId } });
        }
        if (!user && clerkId) {
            user = await prisma.user.findFirst({ where: { clerkId: clerkId } });
        }
        if (!user && normalizedEmail) {
            user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
        }

        const cleanName = (fullName && fullName.trim() && fullName.trim().toUpperCase() !== 'JOHN DOE')
            ? fullName.trim()
            : null;

        let updatedUser = null;

        if (!user) {
            if (!normalizedEmail) {
                throw { message: 'Email is required to verify agent', statusCode: 400 };
            }

            const dummyPassword = await bcrypt.hash(`clerk_${Date.now()}_${Math.random()}`, 10);
            updatedUser = await prisma.user.create({
                data: {
                    clerkId: clerkId || null,
                    email: normalizedEmail,
                    fullName: cleanName || normalizedEmail.split('@')[0],
                    password: dummyPassword,
                    role: 'AGENT',
                    whatsapp: whatsapp ? whatsapp.trim() : null,
                    nin: nin ? nin.trim() : null,
                    universityId: universityId || null,
                    isVerified: false,
                    verificationFeePaid: true,
                    verificationStatus: 'PENDING'
                }
            });
        } else {
            const updateData = {
                role: 'AGENT',
                isVerified: false,
                verificationFeePaid: true,
                verificationStatus: 'PENDING'
            };

            if (clerkId && !user.clerkId) {
                updateData.clerkId = clerkId;
            }
            if (cleanName) {
                updateData.fullName = cleanName;
            } else if (!user.fullName || !user.fullName.trim() || user.fullName.trim().toUpperCase() === 'JOHN DOE') {
                updateData.fullName = normalizedEmail ? normalizedEmail.split('@')[0] : user.fullName;
            }
            if (whatsapp && whatsapp.trim()) {
                updateData.whatsapp = whatsapp.trim();
            }
            if (nin) updateData.nin = nin.trim();
            if (universityId) updateData.universityId = universityId;

            updatedUser = await prisma.user.update({
                where: { id: user.id },
                data: updateData
            });
        }

        const token = this.generateToken(updatedUser.id);
        const { password: _, ...userWithoutPassword } = updatedUser;
        return { user: userWithoutPassword, token };
    }

    /**
     * Check if email exists and return its role for sign-in differentiation
     */
    async checkEmailRole(email) {
        if (!email) return { exists: false };
        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase().trim() },
            select: {
                id: true,
                email: true,
                role: true,
                fullName: true,
                whatsapp: true,
                nin: true,
                universityId: true,
                isVerified: true,
                verificationStatus: true,
                verificationFeePaid: true
            }
        });

        if (!user) return { exists: false };
        return {
            exists: true,
            id: user.id,
            email: user.email,
            role: user.role,
            fullName: user.fullName,
            whatsapp: user.whatsapp,
            nin: user.nin,
            universityId: user.universityId,
            isVerified: user.isVerified,
            verificationStatus: user.verificationStatus,
            verificationFeePaid: user.verificationFeePaid
        };
    }
}

module.exports = new AuthService();
