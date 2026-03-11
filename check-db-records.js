const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function checkLatestProperties() {
    try {
        console.log('🔍 Checking latest 5 properties in DB...');
        const properties = await prisma.property.findMany({
            orderBy: { createdAt: 'desc' },
            take: 5,
            select: {
                id: true,
                title: true,
                images: true,
                video: true,
                createdAt: true
            }
        });

        if (properties.length === 0) {
            console.log('ℹ️ No properties found in DB.');
            return;
        }

        properties.forEach((p, i) => {
            console.log(`\n--- Property ${i + 1} ---`);
            console.log(`ID: ${p.id}`);
            console.log(`Title: ${p.title}`);
            console.log(`Created At: ${p.createdAt}`);
            console.log(`Images Raw: ${p.images}`);
            console.log(`Video: ${p.video}`);

            try {
                const imgArray = JSON.parse(p.images);
                console.log(`Images Parsed:`, imgArray);
            } catch (e) {
                console.log(`Images (not JSON): ${p.images}`);
            }
        });

    } catch (err) {
        console.error('❌ Error:', err.message);
    } finally {
        await prisma.$disconnect();
    }
}

checkLatestProperties();
