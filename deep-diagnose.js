require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

async function runDiagnostic() {
    console.log('--- Prisma Diagnostic ---');
    const url = process.env.DATABASE_URL;
    if (!url) {
        console.log('❌ No DATABASE_URL found in environment');
        return;
    }

    const redacted = url.replace(/:([^:@]+)@/, ':****@');
    console.log('Active URL:', redacted);

    const prisma = new PrismaClient();
    try {
        console.log('⏳ Attempting Prisma connection...');
        const result = await prisma.$queryRaw`SELECT 1 as result`;
        console.log('✅ Prisma query successful:', result);
    } catch (e) {
        console.log('❌ Prisma connection failed');
        console.log('Message:', e.message);
        console.log('Code:', e.code);
    } finally {
        await prisma.$disconnect();
    }
}

runDiagnostic();
