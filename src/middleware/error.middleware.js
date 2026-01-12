const Response = require('../utils/response');

/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, next) => {
    // Log error for debugging
    console.error('=== ERROR OCCURRED ===');
    console.error('Path:', req.method, req.path);
    console.error('Error:', err);
    console.error('Stack:', err.stack);
    console.error('=====================');

    // Prisma errors
    if (err.code) {
        switch (err.code) {
            case 'P2002':
                // Unique constraint violation
                const field = err.meta?.target?.[0] || 'field';
                return Response.error(res, `${field} already exists`, null, 400);

            case 'P2025':
                // Record not found
                return Response.notFound(res, 'Resource not found');

            case 'P2003':
                // Foreign key constraint failed
                return Response.error(res, 'Related resource not found', null, 400);

            default:
                return Response.error(res, 'Database error occurred', null, 500);
        }
    }

    // Multer errors (file upload)
    if (err.name === 'MulterError') {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return Response.error(res, 'File too large. Maximum size is 5MB', null, 400);
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
            return Response.error(res, 'Too many files uploaded', null, 400);
        }
        return Response.error(res, 'File upload error', null, 400);
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        return Response.unauthorized(res, 'Invalid token');
    }

    if (err.name === 'TokenExpiredError') {
        return Response.unauthorized(res, 'Token expired');
    }

    // Validation errors
    if (err.name === 'ValidationError') {
        return Response.validationError(res, err.errors);
    }

    // Custom error messages
    if (err.message) {
        const statusCode = err.statusCode || 500;
        return Response.error(res, err.message, null, statusCode);
    }

    // Default error
    return Response.serverError(res, 'An unexpected error occurred');
};

/**
 * 404 Not Found handler
 */
const notFoundHandler = (req, res) => {
    return Response.notFound(res, `Route ${req.originalUrl} not found`);
};

module.exports = {
    errorHandler,
    notFoundHandler,
};
