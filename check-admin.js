require('dotenv').config({ override: true });
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function check() {
    console.log('--- Admin User Check ---');
    console.log('Using DB URL:', process.env.DATABASE_URL.replace(/:([^:@]+)@/, ':****@'));

    try {
        const user = await prisma.user.findFirst({
            where: {
                role: 'ADMIN'
            }
        });

        if (!user) {
            console.log('❌ NO ADMIN USER FOUND IN DATABASE');
            // List all users to see what we have
            const allUsers = await prisma.user.findMany({
                select: { email: true, role: true }
            });
            console.log('All Users:', allUsers);
        } else {
            console.log('✅ ADMIN USER FOUND');
            console.log('Email:', user.email);
            console.log('Role:', user.role);

            const passToCheck = 'Admin@123';
            const match = await bcrypt.compare(passToCheck, user.password);
            console.log(`Password "${passToCheck}" match:`, match);
        }
    } catch (e) {
        console.error('Error during check:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}

check();
