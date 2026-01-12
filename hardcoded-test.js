const { PrismaClient } = require('@prisma/client');

async function test() {
    const password = 'yEIyAjyYOEJZ8bmb';
    // Variation: port 6543, sslmode=require, pgbouncer=true
    const url = `postgresql://postgres.mrswfnmpmhbufhorutew:${password}@aws-1-eu-north-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true`;

    console.log(`Testing with URL: ${url.replace(/:([^:@]+)@/, ':****@')}`);
    const prisma = new PrismaClient({
        datasources: {
            db: {
                url: url
            }
        }
    });

    try {
        const result = await prisma.$queryRaw`SELECT 1 as result`;
        console.log('✅ Connection SUCCESS (Port 6543):', result);
    } catch (e) {
        console.log('❌ Connection FAILED (Port 6543)');
        console.log('Error Message:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}

test();
