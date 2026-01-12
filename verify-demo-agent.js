// Quick script to verify demo agent via direct database update
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyAgent() {
    try {
        console.log('🔐 Verifying demo agent account...\n');

        const agent = await prisma.user.update({
            where: { email: 'demo.agent@igloo.com' },
            data: { isVerified: true },
            select: {
                id: true,
                email: true,
                fullName: true,
                role: true,
                isVerified: true
            }
        });

        console.log('✅ Agent verified successfully!\n');
        console.log('Agent Details:');
        console.log(`  Name: ${agent.fullName}`);
        console.log(`  Email: ${agent.email}`);
        console.log(`  Role: ${agent.role}`);
        console.log(`  Verified: ${agent.isVerified}`);
        console.log('\n✨ You can now upload properties!');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

verifyAgent();
