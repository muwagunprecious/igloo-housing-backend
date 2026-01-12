require('dotenv').config({ override: true });
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function check() {
    try {
        const user = await prisma.user.findUnique({
            where: { email: 'admin@igloo.com' }
        });

        if (!user) {
            console.log('❌ ADMIN USER NOT FOUND');
        } else {
            console.log('✅ ADMIN USER FOUND');
            console.log('Email:', user.email);
            console.log('Role:', user.role);
            const match = await bcrypt.compare('Admin@123', user.password);
            console.log('Password "Admin@123" match:', match);
        }
    } catch (e) {
        console.error('Error:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}

check();
