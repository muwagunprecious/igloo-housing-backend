const { Client } = require('pg');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

// Configuration
const PROJECT_REF = 'mrswfnmpmhbufhorutew';
const REGION = 'aws-1-eu-north-1';
const DB_PASSWORD = process.env.DATABASE_URL ? process.env.DATABASE_URL.match(/:([^:@]+)@/)?.[1] : 'IglooEstate2026!';

const connectionOptions = [
    {
        name: 'Pooler (Transaction) - extracted from ENV',
        connectionString: process.env.DATABASE_URL,
    },
    {
        name: 'Direct (Session) - extracted from ENV',
        connectionString: process.env.DIRECT_URL,
    },
    {
        name: 'Pooler (Transaction) - Explicit Construction',
        connectionString: `postgres://postgres.${PROJECT_REF}:${DB_PASSWORD}@${REGION}.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true`
    },
    {
        name: 'Direct (Session) - Explicit Construction',
        connectionString: `postgres://postgres.${PROJECT_REF}:${DB_PASSWORD}@${REGION}.pooler.supabase.com:5432/postgres?sslmode=require`
    },
    {
        name: 'Direct (Session) - DB DNS Construction',
        connectionString: `postgres://postgres.${PROJECT_REF}:${DB_PASSWORD}@db.${PROJECT_REF}.supabase.co:5432/postgres?sslmode=require`
    },
    {
        name: 'Direct (Session) - Standard Postgres User',
        connectionString: `postgres://postgres:${DB_PASSWORD}@db.${PROJECT_REF}.supabase.co:5432/postgres?sslmode=require`
    }
];

const fs = require('fs');
const path = require('path');
const LOG_FILE = path.join(__dirname, 'connection_log.txt');

function log(msg) {
    console.log(msg);
    fs.appendFileSync(LOG_FILE, msg + '\n');
}

// Clear log file
if (fs.existsSync(LOG_FILE)) fs.unlinkSync(LOG_FILE);

async function testPgConnection(option) {
    log(`\n🧪 Testing: ${option.name}`);
    const cleanUrl = option.connectionString.replace(/:[^:]*@/, ':****@');
    log(`   URL: ${cleanUrl}`);

    // Remove sslmode=require from parameters for pg client to allow object config to work
    // (Keep it for logging/reference, but strip for actual client if it conflicts)
    const urlForClient = option.connectionString.replace(/(\?|&)sslmode=require/g, '');

    const client = new Client({
        connectionString: urlForClient,
        ssl: { rejectUnauthorized: false }, // Supabase requires SSL, but we might need to be lenient for testing
        connectionTimeoutMillis: 10000
    });

    try {
        await client.connect();
        const res = await client.query('SELECT NOW() as now, current_user as user, current_database() as db');
        log(`   ✅ SUCCESS! Connected to ${res.rows[0].db} as ${res.rows[0].user}`);
        log(`   🕒 Server Time: ${res.rows[0].now}`);
        await client.end();
        return true;
    } catch (err) {
        log(`   ❌ FAILED: ${err.message}`);
        if (err.code) log(`      Code: ${err.code}`);
        // console.error(err);
        try { await client.end(); } catch (e) { }
        return false;
    }
}

async function testPrisma() {
    log('\n🧪 Testing: Prisma Client (using DATABASE_URL from env)');
    const prisma = new PrismaClient({
        log: ['error', 'warn'],
    });
    try {
        const count = await prisma.property.count();
        log(`   ✅ SUCCESS! Prisma connected. User count: ${count}`); // Using property count just as a test
        await prisma.$disconnect();
        return true;
    } catch (err) {
        log(`   ❌ FAILED: ${err.message.split('\n').pop()}`); // Log last line of error
        await prisma.$disconnect();
        return false;
    }
}

async function run() {
    log('================================================');
    log('   DIAGNOSTIC: DATABASE CONNECTION TEST');
    log('================================================');

    let successCount = 0;

    for (const option of connectionOptions) {
        if (!option.connectionString) {
            log(`\n⚠️ Skipping ${option.name} (No connection string found)`);
            continue;
        }
        const success = await testPgConnection(option);
        if (success) successCount++;
    }

    await testPrisma();

    log('\n================================================');
    log('   TEST COMPLETE');
    if (successCount === 0) {
        log('   ❌ ALL CONNECTIONS FAILED. Check credentials or project status.');
    } else {
        log(`   ✅ ${successCount} connections succeeded.`);
    }
    log('================================================');
}

run();
