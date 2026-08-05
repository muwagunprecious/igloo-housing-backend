const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting Post-UTME Agent and Listings Seeding...\n');

    try {
        // 1. Create or Find Verified Agent
        console.log('👤 Seeding/Ensuring Post-UTME Agent...');
        const email = 'postutme.agent@igloo.com';
        const hashedPassword = await bcrypt.hash('Password123', 10);
        
        const agent = await prisma.user.upsert({
            where: { email },
            update: {
                role: 'AGENT',
                isVerified: true,
                fullName: 'Adeola Property Manager'
            },
            create: {
                email,
                fullName: 'Adeola Property Manager',
                password: hashedPassword,
                role: 'AGENT',
                isVerified: true,
                bio: 'Managing clean, safe short-term student accommodation in Ago-Iwoye for Post-UTME candidates and visitors.'
            }
        });

        console.log(`✅ Agent Account Verified: ${agent.email}`);

        // 2. Clean up any existing Post-UTME properties under this agent to avoid duplicate records on multiple runs
        console.log('🧹 Cleaning old Post-UTME properties for this agent...');
        const existingProperties = await prisma.postUtmeProperty.findMany({
            where: { ownerId: agent.id }
        });
        for (const p of existingProperties) {
            await prisma.postUtmeProperty.delete({ where: { id: p.id } });
        }

        // 3. Create Post-UTME Listings (Airbnb style short-term stays near OOU)
        console.log('🏠 Seeding Post-UTME Properties...');
        const propertiesData = [
            {
                title: 'OOU Premium Student Lodge - Main Campus Gate',
                description: 'Ideal short-term lodging for OOU Post-UTME candidates. Safe environment, 24/7 security patrol, constant power supply (solar backup), study desks, and comfortable orthopedic mattresses. Located just 5 minutes walk from OOU main campus gate.',
                address: 'Plot 12, Main Gate Avenue, Ago-Iwoye',
                area: 'Ago-Iwoye',
                distanceFromOOU: '5 mins walk',
                pricePerNight: 8500.0,
                fullBookingPrice: 25000.0,
                totalRooms: 6,
                availableRooms: 5,
                totalBeds: 2,
                maxGuests: 2,
                amenities: JSON.stringify(['Solar Power', 'WiFi', 'Study Desk', 'Fan', 'Security']),
                rules: 'Strict study hours after 8:00 PM. No loud noises. Visitors not allowed overnight.',
                checkInInfo: 'Check-in from 12:00 PM. Verification code required at gate house.',
                status: 'APPROVED',
                isVerified: true,
                images: [
                    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=600&q=80',
                    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=600&q=80'
                ]
            },
            {
                title: 'Ago-Iwoye Candidates Rest House (Private Suite)',
                description: 'A quiet, private room with attached bathroom specifically curated for students sitting for examinations at OOU. Features superfast internet, air conditioning, and complimentary study kits.',
                address: '15 Okesopin Street, Ago-Iwoye',
                area: 'Ago-Iwoye',
                distanceFromOOU: '10 mins drive',
                pricePerNight: 12000.0,
                fullBookingPrice: 35000.0,
                totalRooms: 3,
                availableRooms: 2,
                totalBeds: 1,
                maxGuests: 1,
                amenities: JSON.stringify(['Air Conditioning', 'WiFi', 'Reading Lamp', 'Water Heater', 'Complimentary Breakfast']),
                rules: 'No smoking. Quiet hours from 9:00 PM.',
                checkInInfo: 'Self check-in with smart lock. Lock code will be sent after booking verification.',
                status: 'APPROVED',
                isVerified: true,
                images: [
                    'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=600&q=80',
                    'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=600&q=80'
                ]
            },
            {
                title: 'Budget Study Dorm for Group Bookings',
                description: 'Comfortable shared dorm rooms perfect for group bookings or study partners sitting for Post-UTME together. Safe neighborhood, backup generator, shared clean kitchen, and common studying lounge.',
                address: 'Plot 4, Expressway Bypass, Ago-Iwoye',
                area: 'Ago-Iwoye',
                distanceFromOOU: '8 mins drive',
                pricePerNight: 5000.0,
                fullBookingPrice: 15000.0,
                totalRooms: 12,
                availableRooms: 10,
                totalBeds: 4,
                maxGuests: 4,
                amenities: JSON.stringify(['Generator Power', 'Shared Study Lounge', 'Shared Kitchen', 'Water Supply']),
                rules: 'Respect other candidates. Shared kitchen must be cleaned after use.',
                checkInInfo: 'Report to front desk upon arrival with confirmation receipt.',
                status: 'APPROVED',
                isVerified: true,
                images: [
                    'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=600&q=80',
                    'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=600&q=80'
                ]
            }
        ];

        for (const data of propertiesData) {
            const { images, ...propDetails } = data;
            const property = await prisma.postUtmeProperty.create({
                data: {
                    ...propDetails,
                    ownerId: agent.id
                }
            });

            console.log(`✅ Property Created: "${property.title}"`);

            // Seed images for this property
            for (let i = 0; i < images.length; i++) {
                await prisma.postUtmePropertyImage.create({
                    data: {
                        propertyId: property.id,
                        url: images[i],
                        order: i
                    }
                });
            }
            console.log(`   📸 Added ${images.length} photos for this property.`);
        }

        console.log('\n🎉 ALL POST-UTME AGENT AND LISTINGS DATA SEEDED SUCCESSFULLY!');
        console.log('============================================================');
        console.log('📧 Agent Email:    postutme.agent@igloo.com');
        console.log('🔐 Password:       Password123');
        console.log('============================================================');

    } catch (error) {
        console.error('❌ Seeding failed with error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
