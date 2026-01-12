const fs = require('fs');
const password = 'yEIyAjyYOEJZ8bmb';
const connectionString = `postgresql://postgres.mrswfnmpmhbufhorutew:${password}@aws-1-eu-north-1.pooler.supabase.com:5432/postgres?sslmode=require`;

const content = `DATABASE_URL="${connectionString}"
JWT_SECRET="your-secret-key-change-in-production"
PORT=5000
NODE_ENV="development"
CLIENT_URL="http://localhost:3000"`;

fs.writeFileSync('.env', content, 'utf8');
console.log('✅ .env updated with SSL requirement.');
