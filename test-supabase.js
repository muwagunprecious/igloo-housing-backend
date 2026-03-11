const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase environment variables!');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testUpload() {
    console.log('🧪 Testing Supabase Connection...');
    console.log('URL:', supabaseUrl);

    try {
        const testContent = 'Hello World - Test Upload ' + new Date().toISOString();
        const buffer = Buffer.from(testContent);
        const fileName = `test-${Date.now()}.txt`;
        const filePath = `tests/${fileName}`;
        const bucket = 'igloo-media';

        console.log(`📤 Uploading to bucket "${bucket}" at path "${filePath}"...`);

        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(filePath, buffer, {
                contentType: 'text/plain',
                upsert: true
            });

        if (error) {
            console.error('❌ Upload Failed:', error.message);
            console.error('Full Error:', JSON.stringify(error, null, 2));
            return;
        }

        console.log('✅ Upload Successful!', data);

        const { data: { publicUrl } } = supabase.storage
            .from(bucket)
            .getPublicUrl(filePath);

        console.log('🔗 Public URL:', publicUrl);

        console.log('\n🔍 Fetching bucket info to check if public...');
        const { data: bucketData, error: bucketError } = await supabase.storage.getBucket(bucket);

        if (bucketError) {
            console.error('❌ Failed to get bucket info:', bucketError.message);
        } else {
            console.log('📦 Bucket info:', bucketData);
            if (bucketData.public) {
                console.log('✅ Bucket is correctly set to PUBLIC.');
            } else {
                console.warn('⚠️ Bucket is PRIVATE. Images will not display without a token.');
            }
        }

    } catch (err) {
        console.error('💥 Execution error:', err.message);
    }
}

testUpload();
