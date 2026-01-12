const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');
const util = require('util');

const LOG_FILE = 'verification_log.txt';
const logFile = fs.createWriteStream(LOG_FILE, { flags: 'w' });
const logStdout = process.stdout;

console.log = function (d) { //
    logFile.write(util.format(d) + '\n');
    logStdout.write(util.format(d) + '\n');
};

console.error = function (d) { //
    logFile.write(util.format(d) + '\n');
    logStdout.write(util.format(d) + '\n');
};

const BASE_URL = 'http://localhost:5000/api';

async function request(method, path, body = null, token = null, isMultipart = false) {
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    let options = {
        method,
        headers,
    };

    if (body) {
        if (isMultipart) {
            const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
            headers['Content-Type'] = `multipart/form-data; boundary=${boundary}`;
            options.body = body;
        } else {
            headers['Content-Type'] = 'application/json';
            options.body = JSON.stringify(body);
        }
    }

    const res = await fetch(`${BASE_URL}${path}`, options);
    const data = await res.json().catch(() => ({}));
    return { status: res.status, data };
}

function createMultipartBody(fields, boundary) {
    let body = '';
    for (const [key, value] of Object.entries(fields)) {
        body += `--${boundary}\r\n`;
        body += `Content-Disposition: form-data; name="${key}"\r\n\r\n`;
        body += `${value}\r\n`;
    }
    body += `--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="images"; filename="test.jpg"\r\n`;
    body += `Content-Type: image/jpeg\r\n\r\n`;
    body += `(binary data)\r\n`;
    body += `--${boundary}--\r\n`;
    return body;
}

async function run() {
    console.log('🚀 Starting Property Approval Verification...');

    // 1. Setup Data
    let admin = await prisma.user.findUnique({ where: { email: 'admin@igloo.com' } });
    if (!admin) {
        console.log('Admin not found in DB.');
    }

    // Login Admin
    const adminLogin = await request('POST', '/auth/login', {
        email: 'admin@igloo.com',
        password: 'Admin@123'
    });
    const adminToken = adminLogin.data.data.token;
    console.log('✅ Admin Logged In');

    // Setup Agent
    const agentEmail = 'approval_agent@test.com';
    let agent = await prisma.user.findUnique({ where: { email: agentEmail } });

    let uni = await prisma.university.findFirst();
    if (!uni) {
        uni = await prisma.university.create({ data: { name: 'Test Uni ' + Date.now(), state: 'Lagos' } });
    }

    if (!agent) {
        await request('POST', '/auth/register', {
            fullName: 'Approval Test Agent',
            email: agentEmail,
            password: 'password123',
            role: 'AGENT'
        });
        await prisma.user.update({
            where: { email: agentEmail },
            data: { isVerified: true, universityId: uni.id }
        });
    } else {
        await prisma.user.update({
            where: { email: agentEmail },
            data: { isVerified: true, universityId: uni.id }
        });
    }

    // Login Agent
    const agentLogin = await request('POST', '/auth/login', {
        email: agentEmail,
        password: 'password123'
    });
    const agentToken = agentLogin.data.data.token;
    console.log('✅ Agent Logged In');

    // 2. Create Property
    const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
    const propertyData = {
        title: 'Verifiable Property ' + Date.now(),
        description: 'This is a test property for approval workflow.',
        price: 500000,
        location: 'Test Location',
        category: 'LUXURY',
        bedrooms: 2,
        bathrooms: 2,
        rooms: 1,
        roommatesAllowed: false
    };

    const multipartBody = createMultipartBody(propertyData, boundary);
    const createRes = await request('POST', '/properties', multipartBody, agentToken, true);
    const propertyId = createRes.data.data.id;
    console.log(`✅ Property Created (ID: ${propertyId})`);

    // 3. Verify Visibility (Hidden)
    const publicRes = await request('GET', '/properties'); // Default status=APPROVED
    const foundPublic = publicRes.data.data.find(p => p.id === propertyId);
    if (!foundPublic) {
        console.log('✅ PASS: Property is HIDDEN.');
    } else {
        console.error('❌ FAIL: Property is VISIBLE (Should be PENDING).');
    }

    // 5. Approve Property
    const approveRes = await request('PUT', `/admin/property/approve/${propertyId}`, null, adminToken);
    if (approveRes.status === 200) {
        console.log('✅ Property Approved.');
    } else {
        console.error('❌ FAIL: Approval failed. Status: ' + approveRes.status + ' Data: ' + JSON.stringify(approveRes.data));
    }

    // 6. Verify Visibility (Visible)
    const publicRes2 = await request('GET', '/properties');
    const foundPublic2 = publicRes2.data.data.find(p => p.id === propertyId);

    if (foundPublic2) {
        console.log('✅ PASS: Property is VISIBLE to public!');
    } else {
        console.error('❌ FAIL: Property NOT visible.');
        const checkProp = await prisma.property.findUnique({ where: { id: propertyId } });
        console.log('   DB State:', JSON.stringify(checkProp, null, 2));
        console.log('   Public List IDs:', JSON.stringify(publicRes2.data.data.map(p => p.id), null, 2));
    }

    console.log('🏁 Done.');
}

run().catch(console.error);
