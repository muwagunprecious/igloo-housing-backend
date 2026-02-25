const { Client } = require('pg');
const bcrypt = require('bcryptjs');

async function createUsers() {
    const user = 'postgres.ialjamifosdmalaecqpa';
    const host = 'aws-1-eu-west-1.pooler.supabase.com';
    const pass = 'The23achievers@';
    const url = `postgresql://${user}:${encodeURIComponent(pass)}@${host}:5432/postgres?sslmode=require`;

    const client = new Client({
        connectionString: url,
        connectionTimeoutMillis: 10000,
        ssl: { rejectUnauthorized: false }
    });

    try {
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
        await client.connect();
        console.log('✅ Connected to database');

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('password123', salt);

        // Create Student
        await client.query(`
            INSERT INTO "users" (id, "fullName", "email", "password", "role", "isVerified", "isBlocked", "createdAt", "updatedAt")
            VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
            ON CONFLICT ("email") DO NOTHING
        `, [crypto.randomUUID(), 'Test Student', 'test@igloo.com', hashedPassword, 'STUDENT', false, false]);
        console.log('✅ Student created/already exists');

        // Create Admin
        await client.query(`
            INSERT INTO "users" (id, "fullName", "email", "password", "role", "isVerified", "isBlocked", "createdAt", "updatedAt")
            VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
            ON CONFLICT ("email") DO NOTHING
        `, [crypto.randomUUID(), 'Super Admin', 'admin@igloo.com', hashedPassword, 'ADMIN', true, false]);
        console.log('✅ Admin created/already exists');

        await client.end();
    } catch (err) {
        console.error('❌ FAILED:', err.message);
        process.exit(1);
    }
}

createUsers();
