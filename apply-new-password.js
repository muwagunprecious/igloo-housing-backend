const fs = require('fs');

const envPath = '.env';
const password = 'IglooEstate2026!';
const newUrl = `postgresql://postgres.mrswfnmpmhbufhorutew:${password}@aws-1-eu-north-1.pooler.supabase.com:5432/postgres?sslmode=require`;

try {
    const content = `DATABASE_URL="${newUrl}"
JWT_SECRET="your-secret-key-change-in-production"
PORT=5000
NODE_ENV="development"
CLIENT_URL="http://localhost:3000"`;

    fs.writeFileSync(envPath, content, 'utf8');
    console.log('✅ .env updated with the NEW password and port 5432.');
} catch (e) {
    console.error('Error updating .env:', e.message);
}
