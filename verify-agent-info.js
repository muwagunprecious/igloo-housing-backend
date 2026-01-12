// Script to verify the demo agent account
const API_BASE = 'http://localhost:5000/api';

async function verifyDemoAgent() {
    console.log('🔐 Verifying Demo Agent Account...\n');

    // First, we need to login as admin to get the token
    // For now, let's just update the agent directly via database query

    console.log('ℹ️  Agent Verification Status:');
    console.log('The demo agent (demo.agent@igloo.com) was created but NOT verified.');
    console.log('');
    console.log('To verify the agent, you need to:');
    console.log('1. Login as an admin');
    console.log('2. Go to admin dashboard');
    console.log('3. Find pending agents');
    console.log('4. Approve demo.agent@igloo.com');
    console.log('');
    console.log('OR run this SQL query directly:');
    console.log('');
    console.log('UPDATE users SET isVerified = 1 WHERE email = "demo.agent@igloo.com";');
    console.log('');
}

verifyDemoAgent();
