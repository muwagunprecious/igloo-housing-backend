const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
    try {
        console.log('🔄 Checking University count...');
        const uCount = await prisma.university.count();
        console.log('✅ Universities:', uCount);

        console.log('🔄 Checking User count...');
        const userCount = await prisma.user.count();
        console.log('✅ Users:', userCount);
    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        await prisma.$disconnect();
    }
}

run();
