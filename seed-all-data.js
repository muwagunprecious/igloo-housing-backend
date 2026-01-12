// Seed all initial data for Igloo Estate
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function createAdminAccount() {
    try {
        console.log('👑 Creating Admin Account...\n');

        // Check if admin exists
        const existing = await prisma.user.findUnique({
            where: { email: 'admin@igloo.com' }
        });

        if (existing) {
            console.log('ℹ️  Admin account already exists!\n');
            console.log('='.repeat(60));
            console.log('📋 ADMIN LOGIN CREDENTIALS:');
            console.log('='.repeat(60));
            console.log('📧 Email:    admin@igloo.com');
            console.log('🔐 Password: Admin@123');
            console.log('='.repeat(60));
            console.log('\n👉 Login at: http://localhost:3000/login');
            console.log('👉 Admin Panel: http://localhost:5001 (separate admin backend)\n');
            return;
        }

        // Hash password
        const hashedPassword = await bcrypt.hash('Admin@123', 10);

        // Create admin
        const admin = await prisma.user.create({
            data: {
                fullName: 'System Administrator',
                email: 'admin@igloo.com',
                password: hashedPassword,
                role: 'ADMIN',
                isVerified: true
            }
        });

        console.log('✅ ADMIN ACCOUNT CREATED!\n');
        console.log('='.repeat(60));
        console.log('📋 ADMIN LOGIN CREDENTIALS:');
        console.log('='.repeat(60));
        console.log('📧 Email:    admin@igloo.com');
        console.log('🔐 Password: Admin@123');
        console.log('📛 Name:     System Administrator');
        console.log('👤 Role:     ADMIN');
        console.log('='.repeat(60));
        console.log('\n📍 Access Points:');
        console.log('  • Main App Login: http://localhost:3000/login');
        console.log('  • Admin Backend:  http://localhost:5001');
        console.log('\n💡 After logging in as admin on the main app:');
        console.log('  • You can manage users');
        console.log('  • Verify/block agents');
        console.log('  • Moderate content');
        console.log('  • View platform statistics\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

createAdminAccount();
