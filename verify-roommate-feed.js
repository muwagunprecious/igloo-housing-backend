const { PrismaClient } = require('@prisma/client');

// Use default PrismaClient (uses DATABASE_URL)
const prisma = new PrismaClient();

async function verifyRoommateFeed() {
    console.log('--- Verifying Roommate Feed Data (Direct Connection) ---');

    try {
        const requests = await prisma.roommateRequest.findMany({
            include: {
                user: {
                    select: { fullName: true }
                },
                property: {
                    select: { title: true }
                }
            }
        });

        console.log(`Total Requests found: ${requests.length}`);

        requests.forEach((req, idx) => {
            console.log(`\n[Request ${idx + 1}]`);
            console.log(`User: ${req.user.fullName}`);
            console.log(`Type: ${req.property ? 'Property Specific' : 'General'}`);
            if (req.property) console.log(`Property: ${req.property.title}`);
            console.log(`Budget: ₦${req.budget?.toLocaleString()}`);
            console.log(`House Link: ${req.houseLink || 'None'}`);
            console.log(`Media Attached: ${req.media ? 'Yes' : 'No'}`);
        });
    } catch (error) {
        console.error('Verification failed:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

verifyRoommateFeed();
