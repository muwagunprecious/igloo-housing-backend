/**
 * Custom schema push script that creates all Prisma tables
 * using the working pg connection (pooler port 6543).
 * Run this when `npx prisma db push` fails due to SSL issues.
 */
require('dotenv').config();
const { execSync } = require('child_process');
const { Pool } = require('pg');

async function main() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    console.log('🔗 Connecting via pooler...');
    const client = await pool.connect();
    console.log('✅ Connected!');

    // Check what tables exist
    const res = await client.query(`
        SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename
    `);
    console.log('📋 Tables found:', res.rows.map(r => r.tablename).join(', ') || 'NONE');

    client.release();
    await pool.end();

    console.log('\n⚡ Running prisma generate...');
    try {
        execSync('npx prisma generate', { stdio: 'inherit', cwd: __dirname });
        console.log('✅ Prisma client generated!');
    } catch (e) {
        console.error('❌ Prisma generate failed:', e.message);
    }
}

main().catch(console.error);
