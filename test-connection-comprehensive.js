const { PrismaClient } = require('@prisma/client');

async function test_variant(pass, project, host, port, pgbouncer = false) {
    const encodedPass = encodeURIComponent(pass);
    const user = host.includes('pooler') ? `postgres.${project}` : 'postgres';
    const baseUrl = `postgresql://${user}:${encodedPass}@${host}:${port}/postgres`;
    const url = pgbouncer ? `${baseUrl}?sslmode=require&pgbouncer=true` : `${baseUrl}?sslmode=require`;

    console.log(`\nTesting ${pgbouncer ? '[Pooler]' : '[Direct]'} - Host: ${host}, Port: ${port}`);
    console.log(`User: ${user}, Password: ${pass}`);

    const prisma = new PrismaClient({ datasources: { db: { url } } });
    try {
        const result = await Promise.race([
            prisma.$queryRaw`SELECT 1 as result`,
            new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), 8000))
        ]);
        console.log('✅ SUCCESS!');
        return true;
    } catch (e) {
        console.log('❌ FAILED:', e.message.split('\n')[0]);
        return false;
    } finally {
        await prisma.$disconnect();
    }
}

async function run() {
    const passes = ['IglooEstate2026!', 'Precious2006?'];
    const project = 'mrswfnmpmhbufhorutew';

    // Variance 1: Pooler Host
    const poolerHost = 'aws-1-eu-north-1.pooler.supabase.com';
    // Variance 2: Direct Host
    const directHost = `db.${project}.supabase.co`;

    for (const pass of passes) {
        // Try Pooler
        if (await test_variant(pass, project, poolerHost, 6543, true)) return;
        // Try Direct via Pooler Domain (sometimes works)
        if (await test_variant(pass, project, poolerHost, 5432, false)) return;
        // Try Real Direct
        if (await test_variant(pass, project, directHost, 5432, false)) return;
    }

    console.log('\nAll variants failed!');
}

run();
