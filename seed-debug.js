require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

console.log('🛠️ DATABASE_URL:', process.env.DATABASE_URL.replace(/:[^:]*@/, ':****@'));

const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
});

async function main() {
    try {
        console.log('🔄 Attempting count...');
        const count = await prisma.user.count();
        console.log('✅ Count successful:', count);
    } catch (err) {
        console.error('❌ Error during count:', err);
    } finally {
        await prisma.$disconnect();
    }
}

main();
