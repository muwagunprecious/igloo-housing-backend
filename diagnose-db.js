require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

async function debugConnection() {
    console.log('--- Database Diagnostic Start ---');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Node Version:', process.version);

    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
        console.error('❌ Error: DATABASE_URL is missing from environment.');
        return;
    }

    // Parse URL parts (safely)
    try {
        const url = new URL(dbUrl.replace('postgresql://', 'http://')); // URL parser trick
        console.log('Host:', url.hostname);
        console.log('Port:', url.port || '5432 (default)');
        console.log('Protocol:', dbUrl.split(':')[0]);
        console.log('Has SSL Mode:', dbUrl.includes('sslmode'));
        console.log('Has PgBouncer:', dbUrl.includes('pgbouncer'));
    } catch (e) {
        console.log('Warning: Could not parse DATABASE_URL string for logging.');
    }

    const prisma = new PrismaClient({
        log: ['error', 'warn'],
        datasources: {
            db: {
                url: dbUrl
            }
        }
    });

    try {
        console.log('⏳ Attempting prismatic heartbeat...');
        // Use a 5s timeout for the connection attempt
        const result = await Promise.race([
            prisma.$queryRaw`SELECT 1 as connected`,
            new Promise((_, reject) => setTimeout(() => reject(new Error('Prisma connection timeout after 10s')), 10000))
        ]);

        console.log('✅ Connection Successful:', result);
    } catch (err) {
        console.error('❌ Connection Failed!');
        console.error('Error Name:', err.name);
        console.error('Error Code:', err.code);
        console.error('Error Message:', err.message);

        if (err.message.includes('6543')) {
            console.log('\n💡 Analysis: Port 6543 is the Supabase Transaction Pooler.');
            console.log('Common fixes:');
            console.log('1. Use port 5432 (Direct Connection) if not on a serverless/high-concurrency environment.');
            console.log('2. Append ?pgbouncer=true to your connection string if using port 6543.');
            console.log('3. Check if your current network (Internet Provider) is blocking port 6543.');
        }
    } finally {
        await prisma.$disconnect();
        console.log('--- Diagnostic End ---');
    }
}

debugConnection();
