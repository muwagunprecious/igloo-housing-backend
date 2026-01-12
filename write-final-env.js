const fs = require('fs');

const envPath = '.env';
const connectionString = 'postgresql://postgres.mrswfnmpmhbufhorutew:IglooEstate2026%21@aws-1-eu-north-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true';

const content = `DATABASE_URL="${connectionString}"
JWT_SECRET="your-secret-key-change-in-production"
PORT=5000
NODE_ENV="development"
CLIENT_URL="http://localhost:3000"`;

fs.writeFileSync(envPath, content, 'utf8');
console.log('✅ Final .env file written with URL-encoded password and Transaction Pooler port.');
