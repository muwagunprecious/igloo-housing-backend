const { Client } = require('pg');

async function testOne(pass) {
    const user = 'postgres.ialjamifosdmalaecqpa';
    const host = 'aws-1-eu-west-1.pooler.supabase.com';
    const url = `postgresql://${user}:${encodeURIComponent(pass)}@${host}:5432/postgres?sslmode=require`;

    const client = new Client({
        connectionString: url,
        connectionTimeoutMillis: 10000,
        ssl: { rejectUnauthorized: false }
    });

    try {
        console.log(`Testing with User: ${user} | Host: ${host} | Pass: ${pass}`);
        await client.connect();
        console.log('✅ SUCCESS!');
        await client.end();
        return true;
    } catch (err) {
        console.error(`❌ FAILED:`, err.message);
        return false;
    }
}

async function test() {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    // Trying both cases as requested/noted
    const passes = ['The23achievers@', 'the23achievers@'];
    for (const pass of passes) {
        if (await testOne(pass)) break;
    }
}

test();
