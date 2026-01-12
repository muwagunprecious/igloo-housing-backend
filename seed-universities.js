
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const universities = [
    { name: 'University of Lagos', state: 'Lagos' },
    { name: 'University of Ibadan', state: 'Oyo' },
    { name: 'Obafemi Awolowo University', state: 'Osun' },
    { name: 'Ahmadu Bello University', state: 'Kaduna' },
    { name: 'University of Nigeria, Nsukka', state: 'Enugu' },
    { name: 'University of Ilorin', state: 'Kwara' },
    { name: 'University of Benin', state: 'Edo' },
    { name: 'University of Jos', state: 'Plateau' },
    { name: 'University of Port Harcourt', state: 'Rivers' },
    { name: 'University of Maiduguri', state: 'Borno' },
    { name: 'University of Calabar', state: 'Cross River' },
    { name: 'Lagos State University', state: 'Lagos' },
    { name: 'Covenant University', state: 'Ogun' },
    { name: 'Babcock University', state: 'Ogun' },
    { name: 'Afe Babalola University', state: 'Ekiti' },
    { name: 'American University of Nigeria', state: 'Adamawa' },
    { name: 'Pan-Atlantic University', state: 'Lagos' },
    { name: 'Landmark University', state: 'Kwara' },
    { name: 'Federal University of Technology, Akure', state: 'Ondo' },
    { name: 'Federal University of Technology, Minna', state: 'Niger' },
    { name: 'Federal University of Technology, Owerri', state: 'Imo' },
    { name: 'Bayero University Kano', state: 'Kano' },
    { name: 'Nnamdi Azikiwe University', state: 'Anambra' },
    { name: 'Usman Danfodio University', state: 'Sokoto' },
    { name: 'Benue State University', state: 'Benue' },
    { name: 'Delta State University', state: 'Delta' },
    { name: 'Rivers State University', state: 'Rivers' },
    { name: 'Ladoke Akintola University of Technology', state: 'Oyo' },
    { name: 'Olabisi Onabanjo University', state: 'Ogun' },
    { name: 'Ambrose Alli University', state: 'Edo' }
];

async function main() {
    console.log('🌱 Seeding universities...');

    for (const uni of universities) {
        const exists = await prisma.university.findUnique({
            where: { name: uni.name }
        });

        if (!exists) {
            // Since we don't have an admin ID readily available for the AdminAction log required by the service,
            // we will use prisma direct create, but we should probably try to be consistent.
            // However, looking at the schema via the service code, AdminAction is likely required if using service,
            // but direct prisma create is fine for seeding.
            // Wait, let's check schema. We don't have schema file view, but service uses prisma.university.create directly in transaction.
            // We can just use prisma.university.upsert or find/create.

            await prisma.university.create({
                data: {
                    name: uni.name,
                    state: uni.state
                }
            });
            console.log(`✅ Added: ${uni.name}`);
        } else {
            console.log(`ℹ️ Skipped (already exists): ${uni.name}`);
        }
    }

    console.log('✨ University seeding completed.');
}

main()
    .catch((e) => {
        console.error('❌ Error seeding universities:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
