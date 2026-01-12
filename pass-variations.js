const { PrismaClient } = require('@prisma/client');

async function test(pass) {
    const url = `postgresql://postgres.mrswfnmpmhbufhorutew:${pass}@aws-1-eu-north-1.pooler.supabase.com:5432/postgres?sslmode=require`;
    const prisma = new PrismaClient({ datasources: { db: { url } } });
    try {
        await Promise.race([
            prisma.$queryRaw`SELECT 1`,
            new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), 3000))
        ]);
        return true;
    } catch (e) {
        return false;
    } finally {
        await prisma.$disconnect();
    }
}

async function run() {
    const base = 'yEIyAjyYOEJZ8bmb';
    // Try variations of I/l/1 and O/0
    const variations = [
        base,
        base.replace('I', 'l'),
        base.replace('I', '1'),
        base.replace('O', '0'),
        base.replace('I', 'l').replace('O', '0'),
    ];

    for (const p of variations) {
        console.log(`Testing: ${p}`);
        if (await test(p)) {
            console.log(`✅ SUCCESS WITH PASSWORD: ${p}`);
            return;
        }
    }
    console.log('All character variations failed.');
}

run();
