const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables!');
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Uploads a file buffer to Supabase Storage
 * @param {Object} file - Multer file object
 * @param {string} bucket - Supabase bucket name
 * @returns {Promise<string>} - Public URL of the uploaded file
 */
const uploadToSupabase = async (file, bucket = 'igloo-media') => {
    const sanitized = file.originalname
        .replace(/\s+/g, '-')
        .replace(/[^a-zA-Z0-9._-]/g, '');
    const ext = sanitized.substring(sanitized.lastIndexOf('.'));
    const base = sanitized.substring(0, sanitized.lastIndexOf('.')).substring(0, 80);
    const fileName = `${Date.now()}-${base}${ext}`;
    const filePath = `uploads/${fileName}`;

    const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file.buffer, {
            contentType: file.mimetype,
            upsert: true
        });

    if (error) {
        console.error('Supabase upload error:', error);
        throw new Error(`Failed to upload file to Supabase: ${error.message}`);
    }

    const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

    return publicUrl;
};

module.exports = { supabase, uploadToSupabase };
