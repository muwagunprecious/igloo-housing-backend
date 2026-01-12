// Simple script to create demo agent account
const API_BASE = 'http://localhost:5000/api';

async function createDemoAgent() {
    console.log('🏠 Creating Demo Agent Account...\n');

    // Get first university
    const uniResponse = await fetch(`${API_BASE}/university`);
    const universities = await uniResponse.json();

    if (!universities.data || universities.data.length === 0) {
        console.log('❌ No universities  found. Please run seed script first.');
        return;
    }

    const firstUniversity = universities.data[0];
    console.log(`✅ Using university: ${firstUniversity.name}\n`);

    // Create agent account
    const agentData = {
        fullName: 'Demo Agent',
        email: 'demo.agent@igloo.com',
        password: 'Agent@123',
        role: 'AGENT',
        universityId: firstUniversity.id
    };

    try {
        const response = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(agentData)
        });

        const result = await response.json();

        if (response.ok) {
            console.log('✅ DEMO AGENT ACCOUNT CREATED!\n');
            console.log('='.repeat(60));
            console.log('📋 AGENT LOGIN CREDENTIALS:');
            console.log('='.repeat(60));
            console.log(`📧 Email:      ${agentData.email}`);
            console.log(`🔐 Password:   ${agentData.password}`);
            console.log(`🏫 University: ${firstUniversity.name}`);
            console.log(`📍 State:      ${firstUniversity.state}`);
            console.log('='.repeat(60));
            console.log('\n⚠️  IMPORTANT: Agent needs to be verified by admin first!');
            console.log('👉 Login at: http://localhost:3000/login\n');
        } else {
            if (result.message && result.message.includes('already registered')) {
                console.log('ℹ️  Agent account already exists!\n');
                console.log('='.repeat(60));
                console.log('📋 EXISTING AGENT LOGIN CREDENTIALS:');
                console.log('='.repeat(60));
                console.log(`📧 Email:      ${agentData.email}`);
                console.log(`🔐 Password:   ${agentData.password}`);
                console.log('='.repeat(60));
                console.log('\n👉 Login at: http://localhost:3000/login\n');
            } else {
                console.log('❌ Failed to create agent:', result.message);
            }
        }
    } catch (error) {
        console.log('❌ Error:', error.message);
    }
}

createDemoAgent();
