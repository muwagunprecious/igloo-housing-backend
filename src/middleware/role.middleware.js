const Response = require('../utils/response');

/**
 * Check if user has required role
 */
const requireRole = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return Response.unauthorized(res, 'Authentication required');
        }

        if (!allowedRoles.includes(req.user.role)) {
            return Response.forbidden(res, `Access denied. Required role: ${allowedRoles.join(' or ')}`);
        }

        next();
    };
};

/**
 * Require admin role
 */
const requireAdmin = requireRole('ADMIN');

/**
 * Require agent role (and must be verified)
 */
const requireVerifiedAgent = (req, res, next) => {
    if (!req.user) {
        return Response.unauthorized(res, 'Authentication required');
    }

    if (req.user.role !== 'AGENT') {
        return Response.forbidden(res, 'Access denied. Agents only.');
    }

    if (!req.user.isVerified) {
        return Response.forbidden(res, 'Your agent account is not yet verified. Please wait for admin approval.');
    }

    next();
};

/**
 * Require agent role (verified or not)
 */
const requireAgent = requireRole('AGENT');

/**
 * Require student role
 */
const requireStudent = requireRole('STUDENT');

/**
 * Allow multiple roles
 */
const requireAnyRole = (...roles) => {
    return requireRole(...roles);
};

const requirePostUtmeStudent = (req, res, next) => {
    if (!req.user || (req.user.role !== 'POST_UTME_STUDENT' && req.user.role !== 'STUDENT')) {
        return Response.forbidden(res, 'Post-UTME student access required');
    }
    next();
};

const requireRenter = (req, res, next) => {
    if (!req.user || (req.user.role !== 'RENTER' && req.user.role !== 'STUDENT' && req.user.role !== 'ADMIN')) {
        return Response.forbidden(res, 'Renter access required');
    }
    next();
};

module.exports = {
    requireRole,
    requireAdmin,
    requireAgent,
    requireVerifiedAgent,
    requireStudent,
    requireAnyRole,
    requirePostUtmeStudent,
    requireRenter,
};
