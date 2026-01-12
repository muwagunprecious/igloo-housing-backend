/**
 * Uniform response formatter for all API endpoints
 */

class Response {
    /**
     * Send success response
     */
    static success(res, message = 'Success', data = null, statusCode = 200) {
        return res.status(statusCode).json({
            success: true,
            message,
            data,
        });
    }

    /**
     * Send error response
     */
    static error(res, message = 'Error occurred', errors = null, statusCode = 400) {
        return res.status(statusCode).json({
            success: false,
            message,
            errors,
        });
    }

    /**
     * Send created response
     */
    static created(res, message = 'Resource created', data = null) {
        return this.success(res, message, data, 201);
    }

    /**
     * Send unauthorized response
     */
    static unauthorized(res, message = 'Unauthorized access') {
        return this.error(res, message, null, 401);
    }

    /**
     * Send forbidden response
     */
    static forbidden(res, message = 'Access forbidden') {
        return this.error(res, message, null, 403);
    }

    /**
     * Send not found response
     */
    static notFound(res, message = 'Resource not found') {
        return this.error(res, message, null, 404);
    }

    /**
     * Send server error response
     */
    static serverError(res, message = 'Internal server error') {
        return this.error(res, message, null, 500);
    }

    /**
     * Validation error response
     */
    static validationError(res, errors) {
        // Create a user-friendly message from validation errors
        let message = 'Validation failed';

        if (errors && typeof errors === 'object') {
            const errorMessages = Object.entries(errors).map(([field, msg]) => {
                // Capitalize first letter of field name
                const fieldName = field.charAt(0).toUpperCase() + field.slice(1);
                return `${fieldName}: ${msg}`;
            });

            // If we have errors, use them as the main message
            if (errorMessages.length > 0) {
                message = errorMessages.join('. ');
            }
        }

        return res.status(400).json({
            success: false,
            message, // User-friendly combined message
            errors, // Detailed errors object for programmatic access
        });
    }
}

module.exports = Response;
