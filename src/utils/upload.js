const multer = require('multer');
const path = require('path');

// Configure memory storage
const storage = multer.memoryStorage();

// File filter for images and videos
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp|mp4|webm|ogg/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Only image and video files are allowed (jpeg, jpg, png, gif, webp, mp4, webm, ogg)'));
    }
};

// Configure multer
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB max file size (increased for videos on Vercel)
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
 * Delete file from server (Not applicable for Supabase, but kept for compatibility)
 */
const deleteFile = (filePath) => {
    return true;
};

/**
 * Get file URL from path (Legacy fallback)
 */
const getFileUrl = (filePath) => {
    if (!filePath) return null;
    return filePath;
};

module.exports = {
    upload,
    uploadSingle,
    uploadMultiple,
    deleteFile,
    getFileUrl,
};
