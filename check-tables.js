require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function run() {
    const client = await pool.connect();
    try {
        const tables = await client.query(`SELECT tablename FROM pg_tables WHERE schemaname = 'public'`);
        console.log('Tables:', tables.rows.map(r => r.tablename));

        for (const table of tables.rows) {
            const columns = await client.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = $1`, [table.tablename]);
            console.log(`Table ${table.tablename}:`, columns.rows.map(c => `${c.column_name} (${c.data_type})`).join(', '));
        }
    } catch (err) {
        console.error(err);
    } finally {
        client.release();
        await pool.end();
    }
}

run();
