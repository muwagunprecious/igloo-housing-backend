const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkImages() {
    try {
        const properties = await prisma.property.findMany({
            select: { id: true, title: true, images: true }
        });

        console.log('--- Property Images in DB ---');
        properties.forEach(p => {
            console.log(`ID: ${p.id}`);
            console.log(`Title: ${p.title}`);
            console.log(`Images String: ${p.images}`);
            try {
                const parsed = JSON.parse(p.images);
                console.log(`Parsed Array: ${JSON.stringify(parsed)}`);
            } catch (e) {
                console.log(`Failed to parse: ${e.message}`);
            }
            console.log('---');
        });
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

checkImages();
