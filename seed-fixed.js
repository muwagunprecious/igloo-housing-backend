require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function seed() {
    const client = await pool.connect();
    try {
        console.log('👑 Seeding Admin Account...');

        const email = 'admin@igloo.com';
        const res = await client.query('SELECT * FROM users WHERE email = $1', [email]);

        if (res.rows.length > 0) {
            console.log('ℹ️ Admin account already exists.');
            return;
        }

        const hashedPassword = await bcrypt.hash('Admin@123', 10);
        const userId = 'admin-uuid-123'; // Fixed ID for seeding or use crypto.randomUUID()

        await client.query(
            'INSERT INTO users (id, "fullName", email, password, role, "isVerified") VALUES ($1, $2, $3, $4, $5, $6)',
            [userId, 'System Administrator', email, hashedPassword, 'ADMIN', true]
        );

        console.log('✅ Admin account seeded successfully!');

    } catch (err) {
        console.error('❌ Seeding failed:', err.message);
    } finally {
        client.release();
        await pool.end();
    }
}

seed();
