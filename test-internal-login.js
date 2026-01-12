require('dotenv').config({ override: true });
const authService = require('./src/services/auth.service');
const { prisma } = require('./src/config/db');

async function testInternalLogin() {
    console.log('--- Internal AuthService Login Test ---');
    try {
        const email = 'admin@igloo.com';
        const password = 'Admin@123';

        console.log(`Attempting login for: ${email}`);
        const result = await authService.login(email, password);

        console.log('✅ LOGIN SUCCESSFUL');
        console.log('User ID:', result.user.id);
        console.log('Token exists:', !!result.token);
    } catch (error) {
        console.log('❌ LOGIN FAILED INTERNALLY');
        console.log('Error Name:', error.name || 'N/A');
        console.log('Error Message:', error.message || error);
        if (error.stack) console.log('Stack Trace:', error.stack);
        console.log('Status Code:', error.statusCode || 'N/A');
    } finally {
        await prisma.$disconnect();
    }
}

testInternalLogin();
