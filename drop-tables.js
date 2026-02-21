require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function run() {
    const client = await pool.connect();
    try {
        console.log('🗑️ Dropping existing tables...');
        const tables = await client.query(`SELECT tablename FROM pg_tables WHERE schemaname = 'public'`);
        for (const table of tables.rows) {
            console.log(`Drop ${table.tablename}...`);
            await client.query(`DROP TABLE IF EXISTS "${table.tablename}" CASCADE`);
        }
        console.log('✅ All tables dropped.');
    } catch (err) {
        console.error(err);
    } finally {
        client.release();
        await pool.end();
    }
}

run();
