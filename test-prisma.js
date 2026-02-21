require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log('🔄 Testing Prisma connection...');
        const count = await prisma.property.count();
        console.log(`✅ Success! Total properties in database: ${count}`);
    } catch (err) {
        console.error('❌ Prisma connection failed:', err.message);
        console.error('Code:', err.code);
        console.error('Meta:', err.meta);
    } finally {
        await prisma.$disconnect();
    }
}

main();
