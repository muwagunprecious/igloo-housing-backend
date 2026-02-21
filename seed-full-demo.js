require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Starting Full Demo Seed...');

    try {
        // 1. Create Universities
        console.log('🏫 Seeding Universities...');
        const unis = [
            { name: 'University of Lagos', state: 'Lagos' },
            { name: 'Obafemi Awolowo University', state: 'Osun' },
            { name: 'University of Ibadan', state: 'Oyo' },
            { name: 'Covenant University', state: 'Ogun' }
        ];

        for (const uni of unis) {
            await prisma.university.upsert({
                where: { name: uni.name },
                update: {},
                create: uni
            });
        }
        const allUnis = await prisma.university.findMany();
        const unilagId = allUnis.find(u => u.name === 'University of Lagos').id;

        // 2. Create Agent
        console.log('💼 Seeding Demo Agent...');
        const hashedPassword = await bcrypt.hash('Password123', 10);
        const agent = await prisma.user.upsert({
            where: { email: 'agent@igloo.com' },
            update: { isVerified: true },
            create: {
                email: 'agent@igloo.com',
                fullName: 'John Agent',
                password: hashedPassword,
                role: 'AGENT',
                isVerified: true,
                bio: 'Professional real estate agent with 10 years experience in student housing.'
            }
        });

        // 3. Create Properties for Agent
        console.log('🏠 Seeding Roommate-Enabled Properties...');
        const propertyData = [
            {
                title: 'Clean Self-Contain near Unilag',
                description: 'A very clean and spacious self-contain just 5 minutes walk from the main gate. Features 24/7 water and prepaid meter.',
                price: 250000,
                location: 'Akoka, Lagos',
                campus: 'Main Campus',
                universityId: unilagId,
                category: 'Self-contain',
                images: JSON.stringify(['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267']),
                bedrooms: 1,
                bathrooms: 1,
                roommatesAllowed: true,
                rooms: 1,
                status: 'APPROVED'
            },
            {
                title: 'Shared 2-Bedroom Flat in Bariga',
                description: 'Modern 2-bedroom flat in a secure compound. Perfect for students looking for a quiet environment.',
                price: 450000,
                location: 'Bariga, Lagos',
                campus: 'Main Campus',
                universityId: unilagId,
                category: 'Flat',
                images: JSON.stringify(['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688']),
                bedrooms: 2,
                bathrooms: 2,
                roommatesAllowed: true,
                rooms: 2,
                status: 'APPROVED'
            }
        ];

        for (const p of propertyData) {
            await prisma.property.create({
                data: {
                    ...p,
                    agentId: agent.id
                }
            });
        }
        const props = await prisma.property.findMany({ where: { agentId: agent.id } });

        // 4. Create Students and Roommate Requests
        console.log('👥 Seeding Students and Requests...');
        const students = [
            { email: 'alex@test.com', fullName: 'Alex Rivera', bio: 'CS student, game dev enthusiast.' },
            { email: 'maya@test.com', fullName: 'Maya Smith', bio: 'Medical student, very quiet and studious.' }
        ];

        for (let i = 0; i < students.length; i++) {
            const student = await prisma.user.upsert({
                where: { email: students[i].email },
                update: { universityId: unilagId },
                create: {
                    ...students[i],
                    password: hashedPassword,
                    role: 'STUDENT',
                    universityId: unilagId,
                    isVerified: true
                }
            });

            // Create a general request for first student
            if (i === 0) {
                await prisma.roommateRequest.create({
                    data: {
                        userId: student.id,
                        budget: 150000,
                        roomType: 'Self-contain',
                        genderPref: 'MALE',
                        bio: 'I need a cool roommate who doesn\'t mind a bit of music.',
                        status: 'PENDING'
                    }
                });
            } else {
                // Create a property-specific request for second student
                await prisma.roommateRequest.create({
                    data: {
                        userId: student.id,
                        propertyId: props[0].id,
                        budget: 125000,
                        roomType: 'Shared',
                        genderPref: 'ANY',
                        bio: 'I love this place! Looking for someone to share it with.',
                        status: 'PENDING'
                    }
                });
            }
        }

        console.log('\n✅ SEEDING COMPLETE!');
        console.log('-------------------------');
        console.log('Agent: agent@igloo.com / Password123');
        console.log('Students: alex@test.com, maya@test.com / Password123');
        console.log('Roommate-enabled properties created: 2');
        console.log('Roommate requests created: 2 (1 general, 1 property-specific)');

    } catch (error) {
        console.error('❌ SEEDING FAILED:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
