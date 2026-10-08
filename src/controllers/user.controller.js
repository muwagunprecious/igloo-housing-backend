const userService = require('../services/auth.service');
const Response = require('../utils/response');

class UserController {
    /**
     * Get user by ID
     */
    async getUserById(req, res, next) {
        try {
            const { id } = req.params;
            const user = await userService.getProfile(id);
            return Response.success(res, 'User retrieved', user);
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new UserController();
