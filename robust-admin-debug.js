require('dotenv').config({ override: true });
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function debugAdmin() {
    console.log('--- ADMIN DEBUG SESSION ---');
    console.log('DB URL:', process.env.DATABASE_URL.replace(/:([^:@]+)@/, ':****@'));

    const prisma = new PrismaClient();

    try {
        console.log('Connecting to database...');
        await prisma.$connect();
        console.log('Connected!');

        const user = await prisma.user.findFirst({
            where: { email: { equals: 'admin@igloo.com', mode: 'insensitive' } }
        });

        if (!user) {
            console.log('❌ UNABLE TO FIND admin@igloo.com');
            const userCount = await prisma.user.count();
            console.log(`Total users in DB: ${userCount}`);

            if (userCount > 0) {
                const sampleUsers = await prisma.user.findMany({
                    take: 5,
                    select: { email: true, role: true }
                });
                console.log('Sample users:', sampleUsers);
            }
        } else {
            console.log('✅ USER FOUND');
            console.log('ID:', user.id);
            console.log('Email:', user.email);
            console.log('Role:', user.role);
            console.log('isVerified:', user.isVerified);
            console.log('isBlocked:', user.isBlocked);

            const passToCheck = 'Admin@123';
            const isMatch = await bcrypt.compare(passToCheck, user.password);
            console.log(`Password "${passToCheck}" match:`, isMatch);

            if (!isMatch) {
                console.log('Current Hash:', user.password);
            }
        }
    } catch (error) {
        console.error('CRITICAL ERROR DURING DEBUG:', error);
    } finally {
        await prisma.$disconnect();
    }
}

debugAdmin();
