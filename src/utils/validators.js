/**
 * Validation utilities for request data
 */

class Validators {
    /**
     * Validate email format
     */
    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Validate password strength
     * Must be at least 8 characters with at least one letter and one number
     */
    static isStrongPassword(password) {
        if (password.length < 8) return false;
        const hasLetter = /[a-zA-Z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        return hasLetter && hasNumber;
    }

    /**
     * Validate user registration data
     */
    static validateRegistration(data) {
        const errors = {};

        if (!data.fullName || data.fullName.trim().length < 2) {
            errors.fullName = 'Full name must be at least 2 characters';
        }

        if (!data.email || !this.isValidEmail(data.email)) {
            errors.email = 'Valid email is required';
        }

        if (!data.password || !this.isStrongPassword(data.password)) {
            errors.password = 'Password must be at least 8 characters with letters and numbers';
        }

        if (data.role && !['STUDENT', 'AGENT', 'ADMIN'].includes(data.role.toUpperCase())) {
            errors.role = 'Invalid role';
        }

        return {
            isValid: Object.keys(errors).length === 0,
            errors,
        };
    }

    /**
     * Validate property category
     */
    static isValidCategory(category) {
        const validCategories = [
            'Self-contained',
            'Hostel',
            'Near Campus',
            'Luxury',
            'Budget',
            'Apartment', // Keeping some legacy ones for compatibility if needed
            'Studio',
            'Flat'
        ];
        return validCategories.includes(category);
    }

    /**
     * Validate property data
     */
    static validateProperty(data) {
        const errors = {};

        if (!data.title || data.title.trim().length < 5) {
            errors.title = 'Title must be at least 5 characters';
        }

        if (!data.description || data.description.trim().length < 20) {
            errors.description = 'Description must be at least 20 characters';
        }

        if (!data.price || data.price <= 0) {
            errors.price = 'Valid price is required';
        }

        if (!data.location || data.location.trim().length < 3) {
            errors.location = 'Location is required';
        }

        // if (!data.campus) {
        //     errors.campus = 'University/Campus is required';
        // }

        if (!data.category || !this.isValidCategory(data.category)) {
            errors.category = 'Valid category is required';
        }

        if (!data.bedrooms || data.bedrooms < 0) {
            errors.bedrooms = 'Valid bedroom count is required';
        }

        if (!data.bathrooms || data.bathrooms < 0) {
            errors.bathrooms = 'Valid bathroom count is required';
        }

        return {
            isValid: Object.keys(errors).length === 0,
            errors,
        };
    }

    /**
     * Validate university data
     */
    static validateUniversity(data) {
        const errors = {};

        if (!data.name || data.name.trim().length < 3) {
            errors.name = 'University name must be at least 3 characters';
        }

        if (!data.state || data.state.trim().length < 2) {
            errors.state = 'State is required';
        }

        return {
            isValid: Object.keys(errors).length === 0,
            errors,
        };
    }

    /**
     * Sanitize string input
     */
    static sanitize(str) {
        if (typeof str !== 'string') return str;
        return str.trim();
    }
}

module.exports = Validators;
