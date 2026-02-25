const { PrismaClient } = require('@prisma/client');

// Singleton pattern - prevents multiple PrismaClient instances during nodemon restarts
const globalForPrisma = global;

const prisma = globalForPrisma.prisma || new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
}

// Test database connection - does NOT crash the server on failure
const connectDB = async () => {
    try {
        await prisma.$connect();
        console.log('✅ Database connected successfully');
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        console.error('💡 Server will keep running - retrying on next request...');
        // Do NOT call process.exit(1) here - it causes nodemon crash loop
        // which exhausts the Supabase connection pool
    }
};

// Graceful shutdown
const disconnectDB = async () => {
    await prisma.$disconnect();
};

process.on('beforeExit', disconnectDB);
process.on('SIGINT', async () => {
    await disconnectDB();
    process.exit(0);
});
process.on('SIGTERM', async () => {
    await disconnectDB();
    process.exit(0);
});

module.exports = { prisma, connectDB };
