
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const count = await prisma.university.count();
    console.log(`Total universities in DB: ${count}`);

    const sample = await prisma.university.findFirst({
        where: { name: 'University of Lagos' }
    });
    console.log('Sample check (UNILAG):', sample ? 'Found' : 'Not Found');
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
