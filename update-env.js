const fs = require('fs');

const envPath = '.env';
const password = 'Precious2006%3F';
const newUrl = `postgresql://postgres.mrswfnmpmhbufhorutew:${password}@aws-1-eu-north-1.pooler.supabase.com:5432/postgres`;

try {
    let content = fs.readFileSync(envPath, 'utf8');

    // Replace the DATABASE_URL line
    const regex = /DATABASE_URL=['"].*['"]|DATABASE_URL=.*/;
    if (content.match(regex)) {
        content = content.replace(regex, `DATABASE_URL="${newUrl}"`);
        fs.writeFileSync(envPath, content, 'utf8');
        console.log('✅ DATABASE_URL updated successfully in .env');
    } else {
        console.log('❌ Could not find DATABASE_URL in .env');
    }
} catch (e) {
    console.error('Error:', e.message);
}
