const axios = require('axios');

async function testLogin() {
    console.log('--- Direct API Login Test ---');
    try {
        const response = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'admin@igloo.com',
            password: 'Admin@123'
        });
        console.log('✅ LOGIN SUCCESS');
        console.log('Response status:', response.status);
        console.log('User role:', response.data.data.user.role);
    } catch (error) {
        console.log('❌ LOGIN FAILED');
        if (error.response) {
            console.log('Status:', error.response.status);
            console.log('Message:', error.response.data.message);
            console.log('Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.log('Error:', error.message);
        }
    }
}

testLogin();
