const { Client } = require('pg');

async function testRaw(url) {
    console.log(`\nTesting URL: ${url.replace(/:([^:@]+)@/, ':****@')}`);
    const client = new Client({
        connectionString: url,
        connectionTimeoutMillis: 5000,
    });

    try {
        await client.connect();
        console.log('✅ RAW CONNECTION SUCCESSFUL');
        const res = await client.query('SELECT 1 as result');
        console.log('Result:', res.rows[0]);
        await client.end();
        return true;
    } catch (e) {
        console.log('❌ RAW CONNECTION FAILED');
        console.log('Error Code:', e.code);
        console.log('Error Message:', e.message);
        return false;
    }
}

async function run() {
    const pass = 'yEIyAjyYOEJZ8bmb';
    const base = 'postgres.mrswfnmpmhbufhorutew';
    const host = 'aws-1-eu-north-1.pooler.supabase.com';

    // Variation 1
    await testRaw(`postgresql://${base}:${pass}@${host}:5432/postgres?sslmode=require`);
    // Variation 2
    await testRaw(`postgresql://${base}:${pass}@${host}:6543/postgres?sslmode=require`);
}

run();
