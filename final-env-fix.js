const fs = require('fs');

const envPath = '.env';
const password = 'yEIyAjyYOEJZ8bmb';
const newUrl = `postgresql://postgres.mrswfnmpmhbufhorutew:${password}@aws-1-eu-north-1.pooler.supabase.com:5432/postgres?sslmode=require`;

try {
    const content = fs.readFileSync(envPath, 'utf8');
    const updatedContent = content.replace(/DATABASE_URL=['"].*['"]|DATABASE_URL=.*/, `DATABASE_URL="${newUrl}"`);
    fs.writeFileSync(envPath, updatedContent, 'utf8');
    console.log('✅ DATABASE_URL updated with sslmode=require');
} catch (e) {
    console.error('Error:', e.message);
}
