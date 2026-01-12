// Create demo agent account
const API_BASE = 'http://localhost:5000/api';

console.log('🧪 Igloo Estate - Feature Testing Script\n');

// Helper function to make API calls
async function apiCall(method, endpoint, data = null) {
    const url = `${API_BASE}${endpoint}`;
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
        },
    };

    if (data) {
        options.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(url);
        const result = await response.json();
        return { success: response.ok, data: result, status: response.status };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function main() {
    console.log('📍 Step 1: Checking available universities...\n');

    const universities = await apiCall('GET', '/university');
    if (universities.success) {
        console.log('✅ Universities found:');
        universities.data.data?.forEach((uni, idx) => {
            console.log(`   ${idx + 1}. ${uni.name} - ${uni.state} (ID: ${uni.id})`);
        });

        if (universities.data.data && universities.data.data.length > 0) {
            const firstUniversity = universities.data.data[0];

            console.log(`\n📍 Step 2: Creating test student account...\n`);

            const studentData = {
                fullName: 'Test Student',
                email: 'student@test.com',
                password: 'password123',
                role: 'STUDENT',
                universityId: firstUniversity.id
            };

            const studentResult = await apiCall('POST', '/auth/register', studentData);

            if (studentResult.success) {
                console.log('✅ Student account created successfully!');
                console.log(`   Email: ${studentData.email}`);
                console.log(`   Password: ${studentData.password}`);
                console.log(`   University: ${firstUniversity.name}`);
            } else {
                console.log('❌ Student account creation failed:', studentResult.data?.message || studentResult.error);
            }

            console.log(`\n📍 Step 3: Creating test agent account...\n`);

            const agentData = {
                fullName: 'Test Agent',
                email: 'agent@test.com',
                password: 'password123',
                role: 'AGENT',
                universityId: firstUniversity.id
            };

            const agentResult = await apiCall('POST', '/auth/register', agentData);

            if (agentResult.success) {
                console.log('✅ Agent account created successfully!');
                console.log(`   Email: ${agentData.email}`);
                console.log(`   Password: ${agentData.password}`);
                console.log(`   University: ${firstUniversity.name}`);
                console.log('\n⚠️  Note: Agent needs to be verified by admin before uploading properties');
            } else {
                console.log('❌ Agent account creation failed:', agentResult.data?.message || agentResult.error);
            }

            console.log('\n' + '='.repeat(60));
            console.log('🎉 Test Accounts Created!');
            console.log('='.repeat(60));
            console.log('\n📋 Next Steps:');
            console.log('1. Login to frontend with student@test.com / password123');
            console.log('2. Test roommate posting at /roommates');
            console.log('3. Login as agent@test.com / password123');
            console.log('4. Admin needs to verify agent account first');
            console.log('5. Then test property upload at /agents/properties/new');
            console.log('6. Test messaging between student and agent\n');

        } else {
            console.log('❌ No universities found. Please create a university first.');
        }
    } else {
        console.log('❌ Failed to fetch universities:', universities.error);
    }
}

main().catch(console.error);
