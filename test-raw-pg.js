const { Client } = require('pg');

const connectionString = 'postgresql://postgres.tsjphcyurlfxmxtvkucc:WjuULVcLBKYgFCot@54.247.26.119:5432/postgres';

const client = new Client({
    connectionString: connectionString,
    connectionTimeoutMillis: 10000,
    ssl: {
        rejectUnauthorized: false
    }
});

console.log('Attempting raw pg connection to 5432...');

client.connect()
    .then(() => {
        console.log('✅ RAW PG CONNECTION SUCCESSFUL');
        return client.query('SELECT NOW()');
    })
    .then(res => {
        console.log('Query result:', res.rows[0]);
        return client.end();
    })
    .catch(err => {
        console.error('❌ RAW PG CONNECTION FAILED:', err.message);
        process.exit(1);
    });
