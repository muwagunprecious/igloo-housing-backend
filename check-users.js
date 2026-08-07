const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
    const hashedPassword = await bcrypt.hash('Password123', 10);

    // Ensure Student Account
    const student = await prisma.user.upsert({
        where: { email: 'postutme.student@igloo.com' },
        update: { password: hashedPassword, role: 'STUDENT', isVerified: true },
        create: {
            email: 'postutme.student@igloo.com',
            fullName: 'Precious Candidate',
            password: hashedPassword,
            role: 'STUDENT',
            isVerified: true,
        }
    });

    // Ensure Renter (Landlord) Account
    const renter = await prisma.user.upsert({
        where: { email: 'postutme.agent@igloo.com' },
        update: { password: hashedPassword, role: 'RENTER', isVerified: true },
        create: {
            email: 'postutme.agent@igloo.com',
            fullName: 'Adeola Property Manager',
            password: hashedPassword,
            role: 'RENTER',
            isVerified: true,
        }
    });

    console.log('✅ Accounts ready:');
    console.log('Student:', student.email);
    console.log('Renter:', renter.email);
}

main().catch(console.error).finally(() => prisma.$disconnect());
