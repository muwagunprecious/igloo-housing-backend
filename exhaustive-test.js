const { PrismaClient } = require('@prisma/client');

async function testConnection(name, url) {
    const prisma = new PrismaClient({
        datasources: { db: { url } }
    });
    try {
        const result = await Promise.race([
            prisma.$queryRaw`SELECT 1 as result`,
            new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), 4000))
        ]);
        console.log(`✅ SUCCESS: ${name}`);
        return true;
    } catch (e) {
        console.log(`❌ FAILED: ${name} | Error: ${e.message.split('\n')[0]}`);
        return false;
    } finally {
        await prisma.$disconnect();
    }
}

async function run() {
    const pass = 'yEIyAjyYOEJZ8bmb';
    const projectRef = 'mrswfnmpmhbufhorutew';
    const host = 'aws-1-eu-north-1.pooler.supabase.com';

    const users = [`postgres.${projectRef}`, 'postgres'];
    const protocols = ['postgresql', 'postgres'];
    const ports = ['5432', '6543'];

    for (const user of users) {
        for (const proto of protocols) {
            for (const port of ports) {
                const url = `${proto}://${user}:${pass}@${host}:${port}/postgres?sslmode=require`;
                const name = `${user} @ ${port} (${proto})`;
                if (await testConnection(name, url)) {
                    console.log(`\n🚀 WORKING URL: ${url}`);
                    return;
                }
            }
        }
    }
    console.log('\nAll variations failed.');
}

run();
