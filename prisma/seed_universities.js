const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const universities = [
    { name: "University of Lagos", state: "Lagos" },
    { name: "Obafemi Awolowo University", state: "Osun" },
    { name: "University of Ibadan", state: "Oyo" },
    { name: "University of Nigeria, Nsukka", state: "Enugu" },
    { name: "Ahmadu Bello University", state: "Kaduna" },
    { name: "University of Benin", state: "Edo" },
    { name: "University of Ilorin", state: "Kwara" },
    { name: "Lagos State University", state: "Lagos" },
    { name: "Covenant University", state: "Ogun" },
    { name: "Babcock University", state: "Ogun" },
    { name: "Federal University of Technology, Akure", state: "Ondo" },
    { name: "Federal University of Technology, Minna", state: "Niger" },
    { name: "Federal University of Technology, Owerri", state: "Imo" },
    { name: "University of Port Harcourt", state: "Rivers" },
    { name: "Bayero University Kano", state: "Kano" },
    { name: "Nnamdi Azikiwe University", state: "Anambra" },
    { name: "University of Jos", state: "Plateau" },
    { name: "University of Abuja", state: "FCT" },
    { name: "Ekiti State University", state: "Ekiti" },
    { name: "Olabisi Onabanjo University", state: "Ogun" },
    { name: "Ladoke Akintola University of Technology", state: "Oyo" },
    { name: "Afe Babalola University", state: "Ekiti" },
    { name: "Pan-Atlantic University", state: "Lagos" },
    { name: "Landmark University", state: "Kwara" },
    { name: "Redeemer's University", state: "Osun" },
    { name: "American University of Nigeria", state: "Adamawa" },
    { name: "Nile University of Nigeria", state: "FCT" },
    { name: "Baze University", state: "FCT" },
    { name: "Veritas University", state: "FCT" },
    { name: "Adekunle Ajasin University", state: "Ondo" }
];

async function main() {
    console.log('Start seeding universities...');

    for (const uni of universities) {
        const existing = await prisma.university.findUnique({
            where: { name: uni.name }
        });

        if (!existing) {
            await prisma.university.create({
                data: uni
            });
            console.log(`Created university: ${uni.name}`);
        } else {
            console.log(`University already exists: ${uni.name}`);
        }
    }

    console.log('Seeding finished.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
