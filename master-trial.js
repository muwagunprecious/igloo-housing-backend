const { PrismaClient } = require('@prisma/client');

async function testConnection(name, url) {
    const prisma = new PrismaClient({
        datasources: { db: { url } },
        log: ['error']
    });
    try {
        // 3 second timeout
        const result = await Promise.race([
            prisma.$queryRaw`SELECT 1 as result`,
            new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), 3000))
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
    const base = 'postgres.mrswfnmpmhbufhorutew';
    const poolerHost = 'aws-1-eu-north-1.pooler.supabase.com';
    const directHost = 'db.mrswfnmpmhbufhorutew.supabase.co';

    const protocols = ['postgresql', 'postgres'];
    const ports = ['5432', '6543'];
    const options = [
        '?sslmode=require',
        '?sslmode=require&pgbouncer=true',
        '?sslmode=disable',
        ''
    ];

    const hosts = [poolerHost, directHost];

    for (const host of hosts) {
        for (const proto of protocols) {
            for (const port of ports) {
                for (const opt of options) {
                    const name = `${host}:${port} (${proto}${opt})`;
                    const url = `${proto}://${base}:${pass}@${host}:${port}/postgres${opt}`;
                    if (await testConnection(name, url)) {
                        console.log('\n🌟 WORKING URL FOUND:');
                        console.log(url);
                        return;
                    }
                }
            }
        }
    }
    console.log('\n💀 ALL COMBINATIONS FAILED');
}

run();
