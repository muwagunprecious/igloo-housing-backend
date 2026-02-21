const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const directUrl = "postgresql://postgres:IglooEstate2026%21@db.mrswfnmpmhbufhorutew.supabase.co:5432/postgres?sslmode=require";
console.log('Testing connection to DIRECT_URL:', directUrl.replace(/:[^:]*@/, ':****@'));

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: directUrl,
        },
    },
});

async function main() {
    try {
        console.log('🔄 Connecting to database via DIRECT_URL...');
        const count = await prisma.property.count();
        console.log(`✅ Success! Total properties: ${count}`);
    } catch (err) {
        console.error('❌ Connection failed:', err.message);
        console.error('Code:', err.code);
    } finally {
        await prisma.$disconnect();
    }
}

main();
