const fs = require('fs');
const content = `DATABASE_URL="postgresql://postgres.mrswfnmpmhbufhorutew:yEIyAjyYOEJZ8bmb@aws-1-eu-north-1.pooler.supabase.com:5432/postgres?sslmode=require"
JWT_SECRET="your-secret-key-change-in-production"
PORT=5000
NODE_ENV="development"
CLIENT_URL="http://localhost:3000"`;
fs.writeFileSync('.env', content, 'utf8');
console.log('File .env written successfully');
