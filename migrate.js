require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function migrate() {
    const client = await pool.connect();
    console.log('✅ Connected to database!');
    try {
        console.log('🔨 Creating tables...');

        // Create tables one by one to get clear error messages
        await client.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);

        await client.query(`
            CREATE TABLE IF NOT EXISTS universities (
                id TEXT PRIMARY KEY,
                name TEXT UNIQUE NOT NULL,
                state TEXT NOT NULL,
                "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
        `);
        console.log('  ✅ universities');

        await client.query(`
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                "fullName" TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                role TEXT NOT NULL DEFAULT 'STUDENT',
                avatar TEXT,
                bio TEXT,
                "isVerified" BOOLEAN NOT NULL DEFAULT false,
                "isBlocked" BOOLEAN NOT NULL DEFAULT false,
                "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                "universityId" TEXT REFERENCES universities(id) ON DELETE SET NULL
            );
        `);
        await client.query(`CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);`);
        await client.query(`CREATE INDEX IF NOT EXISTS users_role_idx ON users(role);`);
        await client.query(`CREATE INDEX IF NOT EXISTS users_univ_idx ON users("universityId");`);
        console.log('  ✅ users');

        await client.query(`
            CREATE TABLE IF NOT EXISTS properties (
                id TEXT PRIMARY KEY,
                "agentId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                title TEXT NOT NULL,
                description TEXT NOT NULL,
                price DOUBLE PRECISION NOT NULL,
                location TEXT NOT NULL,
                campus TEXT NOT NULL,
                "universityId" TEXT REFERENCES universities(id) ON DELETE SET NULL,
                category TEXT NOT NULL,
                images TEXT NOT NULL,
                bedrooms INTEGER NOT NULL,
                bathrooms INTEGER NOT NULL,
                "roommatesAllowed" BOOLEAN NOT NULL DEFAULT false,
                "isAvailable" BOOLEAN NOT NULL DEFAULT true,
                rooms INTEGER NOT NULL DEFAULT 1,
                status TEXT NOT NULL DEFAULT 'PENDING',
                views INTEGER NOT NULL DEFAULT 0,
                "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
        `);
        await client.query(`CREATE INDEX IF NOT EXISTS props_agent_idx ON properties("agentId");`);
        await client.query(`CREATE INDEX IF NOT EXISTS props_univ_idx ON properties("universityId");`);
        await client.query(`CREATE INDEX IF NOT EXISTS props_cat_idx ON properties(category);`);
        await client.query(`CREATE INDEX IF NOT EXISTS props_avail_idx ON properties("isAvailable");`);
        console.log('  ✅ properties');

        await client.query(`
            CREATE TABLE IF NOT EXISTS roommate_requests (
                id TEXT PRIMARY KEY,
                "userId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                "propertyId" TEXT REFERENCES properties(id) ON DELETE SET NULL,
                budget DOUBLE PRECISION,
                "roomType" TEXT,
                "genderPref" TEXT,
                bio TEXT,
                status TEXT NOT NULL DEFAULT 'PENDING',
                "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
        `);
        await client.query(`CREATE INDEX IF NOT EXISTS rm_user_idx ON roommate_requests("userId");`);
        await client.query(`CREATE INDEX IF NOT EXISTS rm_prop_idx ON roommate_requests("propertyId");`);
        await client.query(`CREATE INDEX IF NOT EXISTS rm_status_idx ON roommate_requests(status);`);
        console.log('  ✅ roommate_requests');

        await client.query(`
            CREATE TABLE IF NOT EXISTS messages (
                id TEXT PRIMARY KEY,
                "senderId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                "receiverId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                message TEXT NOT NULL,
                "isRead" BOOLEAN NOT NULL DEFAULT false,
                "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
        `);
        await client.query(`CREATE INDEX IF NOT EXISTS msg_sender_idx ON messages("senderId");`);
        await client.query(`CREATE INDEX IF NOT EXISTS msg_recv_idx ON messages("receiverId");`);
        console.log('  ✅ messages');

        await client.query(`
            CREATE TABLE IF NOT EXISTS admin_actions (
                id TEXT PRIMARY KEY,
                "adminId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                "actionType" TEXT NOT NULL,
                "targetUserId" TEXT REFERENCES users(id) ON DELETE SET NULL,
                description TEXT NOT NULL,
                "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
        `);
        await client.query(`CREATE INDEX IF NOT EXISTS aa_admin_idx ON admin_actions("adminId");`);
        await client.query(`CREATE INDEX IF NOT EXISTS aa_type_idx ON admin_actions("actionType");`);
        console.log('  ✅ admin_actions');

        await client.query(`
            CREATE TABLE IF NOT EXISTS notifications (
                id TEXT PRIMARY KEY,
                "userId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                title TEXT NOT NULL,
                message TEXT NOT NULL,
                type TEXT NOT NULL DEFAULT 'SYSTEM',
                "isRead" BOOLEAN NOT NULL DEFAULT false,
                "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
        `);
        await client.query(`CREATE INDEX IF NOT EXISTS notif_user_idx ON notifications("userId");`);
        console.log('  ✅ notifications');

        await client.query(`
            CREATE TABLE IF NOT EXISTS transactions (
                id TEXT PRIMARY KEY,
                "userId" TEXT NOT NULL REFERENCES users(id),
                "propertyId" TEXT REFERENCES properties(id),
                amount DOUBLE PRECISION NOT NULL,
                currency TEXT NOT NULL DEFAULT 'NGN',
                status TEXT NOT NULL DEFAULT 'PENDING',
                reference TEXT UNIQUE NOT NULL,
                provider TEXT NOT NULL DEFAULT 'PAYSTACK',
                type TEXT NOT NULL DEFAULT 'RENT',
                "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
        `);
        await client.query(`CREATE INDEX IF NOT EXISTS tx_user_idx ON transactions("userId");`);
        await client.query(`CREATE INDEX IF NOT EXISTS tx_ref_idx ON transactions(reference);`);
        console.log('  ✅ transactions');

        console.log('\n✅ All tables created!');

        // Verify
        const res = await client.query(
            `SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`
        );
        console.log('\n📋 Tables in database:');
        res.rows.forEach(r => console.log(`   - ${r.tablename}`));

    } catch (err) {
        console.error('❌ Migration failed:', err.message);
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
