require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
    datasources: {
        db: {
            url: "postgresql://postgres.tsjphcyurlfxmxtvkucc:WjuULVcLBKYgFCot@54.247.26.119:6543/postgres?pgbouncer=true"
        }
    }
});

async function main() {
    try {
        console.log('🔄 Testing Prisma connection with IP...');
        const count = await prisma.user.count();
        console.log(`✅ Success! Total users: ${count}`);
    } catch (err) {
        console.error('❌ Prisma failed with IP:', err.message);
        console.error('Full Error:', err);
    } finally {
        await prisma.$disconnect();
    }
}

main();
