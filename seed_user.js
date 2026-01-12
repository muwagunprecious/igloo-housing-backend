const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

async function main() {
    try {
        const existingUser = await prisma.user.findUnique({
            where: { email: 'test@igloo.com' },
        });

        if (existingUser) {
            console.log('Test user already exists:', existingUser);
            return;
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('password123', salt);

        const user = await prisma.user.create({
            data: {
                fullName: 'Test Student',
                email: 'test@igloo.com',
                password: hashedPassword,
                role: 'student',
            },
        });

        console.log('User created:', user);
    } catch (error) {
        console.error('Error creating user:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
