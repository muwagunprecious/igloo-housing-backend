const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
require('dotenv').config();

async function test() {
    try {
        console.log('JWT:', !!process.env.JWT_SECRET);
        await prisma.user.findFirst();
        console.log('DB Connection: OK');
    } catch (e) {
        console.log('DB Error:', e.message);
        console.log('DB Code:', e.code);
    }
}

test();
