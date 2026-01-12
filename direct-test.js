const { PrismaClient } = require('@prisma/client');
const password = 'yEIyAjyYOEJZ8bmb';
const url = `postgresql://postgres.mrswfnmpmhbufhorutew:${password}@db.mrswfnmpmhbufhorutew.supabase.co:5432/postgres?sslmode=require`;

async function test() {
    console.log('Testing DIRECT host:', url.replace(password, '****'));
    const prisma = new PrismaClient({ datasources: { db: { url } } });
    try {
        const result = await Promise.race([
            prisma.$queryRaw`SELECT 1 as result`,
            new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), 10000))
        ]);
        console.log('✅ DIRECT CONNECTION SUCCESS:', result);
    } catch (e) {
        console.log('❌ DIRECT CONNECTION FAILED');
        console.log('Message:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}

test();
