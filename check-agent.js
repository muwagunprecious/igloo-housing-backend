// Check demo agent's university association
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAgent() {
    try {
        const agent = await prisma.user.findUnique({
            where: { email: 'demo.agent@igloo.com' },
            include: {
                university: true
            }
        });

        if (!agent) {
            console.log('❌ Agent not found!');
            return;
        }

        console.log('📊 Agent Details:\n');
        console.log(`Name:         ${agent.fullName}`);
        console.log(`Email:        ${agent.email}`);
        console.log(`Role:         ${agent.role}`);
        console.log(`Verified:     ${agent.isVerified}`);
        console.log(`University ID: ${agent.universityId || 'NOT SET ❌'}`);

        if (agent.university) {
            console.log(`\nUniversity Details:`);
            console.log(`  Name:  ${agent.university.name}`);
            console.log(`  State: ${agent.university.state}`);
        } else {
            console.log('\n❌ PROBLEM: Agent is not associated with any university!');
            console.log('This is why property upload is failing.');
            console.log('\nFixing this now...\n');

            // Get first university
            const uni = await prisma.university.findFirst();
            if (uni) {
                await prisma.user.update({
                    where: { email: 'demo.agent@igloo.com' },
                    data: { universityId: uni.id }
                });
                console.log(`✅ Fixed! Agent now associated with ${uni.name}`);
                console.log('Try uploading property again!');
            }
        }

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

checkAgent();
