const authService = require('../services/auth.service');
const Response = require('../utils/response');
const { getFileUrl } = require('../utils/upload');

class AuthController {
    /**
     * Register new user
     */
    async register(req, res, next) {
        try {
            const { fullName, email, password, role, bio, universityId } = req.body;

            // Handle avatar upload
            let avatar = null;
            if (req.file) {
                avatar = getFileUrl(req.file.path);
            }

            const result = await authService.register({
                fullName,
                email,
                password,
                role,
                bio,
                bio,
                avatar,
                universityId,
            });

            return Response.created(res, 'Registration successful', result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Login user
     */
    async login(req, res, next) {
        try {
            console.log('--- LOGIN REQUEST RECEIVED ---');
            console.log('Headers:', req.headers);
            console.log('Body:', JSON.stringify(req.body, null, 2));

            const { email, password } = req.body;

            const result = await authService.login(email, password);

            return Response.success(res, 'Login successful', result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get current user profile
     */
    async getProfile(req, res, next) {
        try {
            const user = await authService.getProfile(req.user.id);

            return Response.success(res, 'Profile retrieved', user);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Update user profile
     */
    async updateProfile(req, res, next) {
        try {
            const { fullName, bio } = req.body;

            // Handle avatar upload
            let avatar = undefined;
            if (req.file) {
                avatar = getFileUrl(req.file.path);
            }

            const user = await authService.updateProfile(req.user.id, {
                fullName,
                bio,
                avatar,
            });

            return Response.success(res, 'Profile updated successfully', user);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Change password
     */
    async changePassword(req, res, next) {
        try {
            const { currentPassword, newPassword } = req.body;

            await authService.changePassword(req.user.id, currentPassword, newPassword);

            return Response.success(res, 'Password changed successfully');
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get current user info (lightweight)
     */
    async me(req, res, next) {
        try {
            return Response.success(res, 'User info', req.user);
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new AuthController();
