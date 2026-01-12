const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');
const util = require('util');

const LOG_FILE = 'verification_my_properties.txt';
const logFile = fs.createWriteStream(LOG_FILE, { flags: 'w' });
const logStdout = process.stdout;

console.log = function (d) {
    logFile.write(util.format(d) + '\n');
    logStdout.write(util.format(d) + '\n');
};

console.error = function (d) {
    logFile.write(util.format(d) + '\n');
    logStdout.write(util.format(d) + '\n');
};

const BASE_URL = 'http://localhost:5000/api';

async function request(method, path, body = null, token = null) {
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (body) headers['Content-Type'] = 'application/json';

    let options = {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined
    };

    const res = await fetch(`${BASE_URL}${path}`, options);
    const data = await res.json().catch(() => ({}));
    return { status: res.status, data };
}

async function run() {
    console.log('🚀 Starting "My Properties" Endpoint Verification...');

    // 1. Login Agent
    const agentEmail = 'approval_agent@test.com'; // Reuse the agent from previous test
    const agentLogin = await request('POST', '/auth/login', {
        email: agentEmail,
        password: 'password123'
    });

    if (agentLogin.status !== 200) {
        console.error('❌ Agent Login Failed. Run verify_approval.js first to create agent.');
        process.exit(1);
    }
    const agentToken = agentLogin.data.data.token;
    console.log('✅ Agent Logged In');

    // 2. Fetch My Properties
    // The endpoint we fixed in frontend: /properties/agent/my-properties
    console.log('Fetching /properties/agent/my-properties...');
    const res = await request('GET', '/properties/agent/my-properties', null, agentToken);

    if (res.status === 200) {
        console.log(`✅ Success! Status: 200`);
        console.log(`   Found ${res.data.data.length} properties.`);

        // Log titles to verify
        res.data.data.forEach(p => console.log(`   - ${p.title} (${p.status})`));

        if (res.data.data.length > 0) {
            console.log('✅ Endpoint works and returns data.');
        } else {
            console.log('⚠️ Endpoint works but returned 0 properties. Did previous upload succeed?');
        }
    } else {
        console.error(`❌ Failed! Status: ${res.status}`);
        console.error('   Error:', res.data);
    }

    console.log('🏁 Done.');
}

run().catch(console.error);
