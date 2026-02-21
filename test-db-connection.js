const { Client } = require('pg');
const dotenv = require('dotenv');
dotenv.config();

const connectionString = process.env.DATABASE_URL;
console.log('Testing connection to:', connectionString.replace(/:[^:]*@/, ':****@'));

const client = new Client({
    connectionString: connectionString,
    ssl: {
        rejectUnauthorized: false
    }
});

async function testConnection() {
    try {
        await client.connect();
        console.log('✅ Successfully connected to the database!');
        const res = await client.query('SELECT NOW()');
        console.log('🕒 Current Time from DB:', res.rows[0].now);
    } catch (err) {
        console.error('❌ Connection failed:', err.message);
        console.error('Stack Trace:', err.stack);
    } finally {
        await client.end();
    }
}

testConnection();
