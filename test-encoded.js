const { PrismaClient } = require('@prisma/client');

async function test() {
    // Encoded password: ! replaced with %21
    const pass = 'IglooEstate2026%21';
    const project = 'mrswfnmpmhbufhorutew';

    // Test variants
    const urls = [
        `postgresql://postgres.${project}:${pass}@aws-1-eu-north-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true`,
        `postgresql://postgres.${project}:${pass}@aws-1-eu-north-1.pooler.supabase.com:5432/postgres?sslmode=require`,
    ];

    for (const url of urls) {
        console.log(`\nTesting: ${url.replace(pass, '****')}`);
        const prisma = new PrismaClient({ datasources: { db: { url } } });
        try {
            const result = await Promise.race([
                prisma.$queryRaw`SELECT 1 as result`,
                new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), 5000))
            ]);
            console.log('✅ SUCCESS:', result);
            return;
        } catch (e) {
            console.log('❌ FAILED:', e.message.split('\n')[0]);
        } finally {
            await prisma.$disconnect();
        }
    }
}

test();
