const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
// Ensure uploads directory exists
// In Vercel (Production), we must use /tmp
const isProduction = process.env.NODE_ENV === 'production';
const uploadsDir = isProduction ? path.join('/tmp', 'uploads') : path.join(__dirname, '../../uploads');

if (!fs.existsSync(uploadsDir)) {
    try {
        fs.mkdirSync(uploadsDir, { recursive: true });
    } catch (error) {
        console.error('Failed to create uploads directory:', error);
    }
}

// Configure storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const folder = file.fieldname === 'avatar' ? 'avatars' : 'properties';
        const destPath = path.join(uploadsDir, folder);

        if (!fs.existsSync(destPath)) {
            fs.mkdirSync(destPath, { recursive: true });
        }

        cb(null, destPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    },
});

// File filter for images only
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
    }
};

// Configure multer
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB max file size
    },
    fileFilter: fileFilter,
});

/**
 * Middleware for single file upload
 */
const uploadSingle = (fieldName) => {
    return upload.single(fieldName);
};

/**
 * Middleware for multiple file upload
 */
const uploadMultiple = (fieldName, maxCount = 10) => {
    return upload.array(fieldName, maxCount);
};

/**
 * Delete file from server
 */
const deleteFile = (filePath) => {
    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error deleting file:', error);
        return false;
    }
};

/**
 * Get file URL from path
 */
const getFileUrl = (filePath) => {
    if (!filePath) return null;
    // Return relative path for URL
    return filePath.replace(/\\/g, '/').replace(/^.*\/uploads\//, '/uploads/');
};

module.exports = {
    upload,
    uploadSingle,
    uploadMultiple,
    deleteFile,
    getFileUrl,
};
