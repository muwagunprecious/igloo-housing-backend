require('dotenv').config({ override: true });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    console.log('Testing DB connection...');
    try {
        await prisma.$connect();
        console.log('Successfully connected to DB!');
        const count = await prisma.user.count();
        console.log(`User count: ${count}`);
    } catch (error) {
        console.error('DB Connection Failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
