const path = require('path');
const dotenv = require('dotenv');

console.log('Current CWD:', process.cwd());
const envPath = path.resolve(process.cwd(), '.env');
console.log('Looking for .env at:', envPath);

const result = dotenv.config({ path: envPath, override: true });

if (result.error) {
    console.log('Error loading .env:', result.error.message);
} else {
    console.log('.env loaded successfully');
    console.log('DATABASE_URL starts with:', process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 20) : 'UNDEFINED');
}
