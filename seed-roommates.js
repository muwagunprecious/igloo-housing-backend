const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Seeding Roommate Requests...');

    try {
        // 1. Ensure we have some universities
        let universities = await prisma.university.findMany();
        if (universities.length === 0) {
            console.log('Creating demo universities...');
            await prisma.university.createMany({
                data: [
                    { name: 'University of Lagos', state: 'Lagos' },
                    { name: 'Obafemi Awolowo University', state: 'Osun' },
                    { name: 'University of Ibadan', state: 'Oyo' }
                ]
            });
            universities = await prisma.university.findMany();
        }

        const uniId = universities[0].id;

        // 2. Create demo students
        const hashedPassword = await bcrypt.hash('password123', 10);

        const demoStudents = [
            { email: 'sarah@test.com', fullName: 'Sarah Johnson', bio: 'Computer Science student, loves coding and quiet spaces.' },
            { email: 'mike@test.com', fullName: 'Mike Ade', bio: 'Architecture student, night owl, loves music.' },
            { email: 'chidi@test.com', fullName: 'Chidi Okoro', bio: 'Medicine student, very clean and organized.' },
            { email: 'tunde@test.com', fullName: 'Tunde Bakare', bio: 'Economics student, loves football and gaming.' }
        ];

        for (const student of demoStudents) {
            await prisma.user.upsert({
                where: { email: student.email },
                update: { universityId: uniId },
                create: {
                    ...student,
                    password: hashedPassword,
                    role: 'STUDENT',
                    universityId: uniId,
                    isVerified: true
                }
            });
        }

        const users = await prisma.user.findMany({
            where: { email: { in: demoStudents.map(s => s.email) } }
        });

        // 3. Create roommate requests
        const requests = [
            {
                userId: users[0].id,
                budget: 150000,
                roomType: 'Self-contain',
                genderPref: 'Female',
                bio: 'Hey! I am looking for a roommate to share a clean self-contain around Akoka. I am mostly out during the day for classes.',
                status: 'PENDING'
            },
            {
                userId: users[1].id,
                budget: 120000,
                roomType: 'Shared',
                genderPref: 'Male',
                bio: 'Looking for a flatmate. I have already seen a nice 2-bedroom flat. Just need someone to split the bill with.',
                status: 'PENDING'
            },
            {
                userId: users[2].id,
                budget: 200000,
                roomType: 'Flat',
                genderPref: 'Any',
                bio: 'Quiet student looking for a peaceful environment. I prefer someone who is also serious with their studies.',
                status: 'PENDING'
            },
            {
                userId: users[3].id,
                budget: 100000,
                roomType: 'Shared',
                genderPref: 'Male',
                bio: 'Budget-friendly roommate needed. I am very Easy-going and love football!',
                status: 'PENDING'
            }
        ];

        // Clean existing pending requests for these users to avoid duplicates
        await prisma.roommateRequest.deleteMany({
            where: {
                userId: { in: users.map(u => u.id) },
                status: 'PENDING'
            }
        });

        for (const req of requests) {
            await prisma.roommateRequest.create({ data: req });
        }

        console.log('✅ Seeding completed! Added 4 demo roommate requests.');
    } catch (error) {
        console.error('❌ Seeding failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
