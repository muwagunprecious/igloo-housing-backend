require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

async function test() {
    console.log('--- DB CONNECTION DIAGNOSTIC ---');
    console.log('DATABASE_URL starts with:', process.env.DATABASE_URL?.substring(0, 20), '...');

    // Test 1: Direct URL (5432)
    console.log('\n[TEST 1] Testing Direct Connection (Port 5432)...');
    const pDirect = new PrismaClient({
        datasources: { db: { url: process.env.DIRECT_URL } }
    });
    try {
        await pDirect.$connect();
        console.log('✅ Port 5432 (Direct) Success!');
    } catch (e) {
        console.log('❌ Port 5432 (Direct) Failed!');
        console.log('Error Code:', e.code);
        console.log('Error Message:', e.message);
    } finally {
        await pDirect.$disconnect();
    }

    // Test 2: Pooler URL (6543)
    console.log('\n[TEST 2] Testing Pooler Connection (Port 6543)...');
    const pPool = new PrismaClient({
        datasources: { db: { url: process.env.DATABASE_URL } }
    });
    try {
        await pPool.$connect();
        console.log('✅ Port 6543 (Pooler) Success!');
    } catch (e) {
        console.log('❌ Port 6543 (Pooler) Failed!');
        console.log('Error Code:', e.code);
        console.log('Error Message:', e.message);
    } finally {
        await pPool.$disconnect();
    }
}

test();
