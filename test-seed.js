const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Testing connection...');
    try {
        const count = await prisma.user.count();
        console.log('User count:', count);

        const universities = await prisma.university.findMany();
        console.log('Universities:', universities.length);

        if (universities.length === 0) {
            console.log('Creating university...');
            await prisma.university.create({
                data: { name: 'Test Uni', state: 'Test' }
            });
            console.log('University created');
        }
    } catch (e) {
        console.error('Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
