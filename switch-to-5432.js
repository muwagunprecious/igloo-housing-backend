const fs = require('fs');

const envPath = '.env';
const oldContent = fs.readFileSync(envPath, 'utf8');
const newUrl = 'postgresql://postgres.mrswfnmpmhbufhorutew:IglooEstate2026%21@aws-1-eu-north-1.pooler.supabase.com:5432/postgres?sslmode=require';

const newContent = oldContent.replace(/DATABASE_URL="[^"]*"/, `DATABASE_URL="${newUrl}"`);

fs.writeFileSync(envPath, newContent, 'utf8');
console.log('✅ Updated .env to port 5432');
