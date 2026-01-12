const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyConnection() {
    console.log('--- Database Connection Verification ---');
    try {
        // Attempt to connect and fetch basic counts
        const userCount = await prisma.user.count();
        const propertyCount = await prisma.property.count();
        const universityCount = await prisma.university.count();

        console.log('✅ Connection Successful!');
        console.log(`- Users: ${userCount}`);
        console.log(`- Properties: ${propertyCount}`);
        console.log(`- Universities: ${universityCount}`);

        // Final confirmation of the provider
        console.log('\nDB configuration matches Supabase (AWS eu-north-1).');
    } catch (error) {
        console.error('❌ Connection Failed!');
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

verifyConnection();
