const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

async function main() {
    const email = 'agent@test.com';
    const password = await bcrypt.hash('Password123', 10);

    const user = await prisma.user.upsert({
        where: { email },
        update: {
            role: 'AGENT',
            isVerified: true
        },
        create: {
            email,
            fullName: 'Test Agent',
            password,
            role: 'AGENT',
            isVerified: true
        }
    });

    console.log('✅ Agent ensured:', user.email);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
