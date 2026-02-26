const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const path = require('path');

const API_URL = 'http://localhost:5001/api';
let token = '';

async function testVideoUpload() {
    try {
        console.log('--- TEST: Agent Video Upload Flow ---');

        // 1. Login as agent
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: 'agent@test.com',
            password: 'Password123'
        });
        token = loginRes.data.data.token;
        console.log('✅ Logged in as agent');

        // 2. Test: Video without picture (Should FAIL)
        try {
            const form1 = new FormData();
            form1.append('title', 'Video Test House');
            form1.append('description', 'This should fail because no image is provided.');
            form1.append('price', '500000');
            form1.append('location', 'Lagos');
            form1.append('category', 'Apartment');
            form1.append('bedrooms', '2');
            form1.append('bathrooms', '2');
            form1.append('campus', 'UNILAG');
            // Assuming a small file exists for testing
            const testVideo = Buffer.from('test video content');
            form1.append('video', testVideo, { filename: 'test.mp4', contentType: 'video/mp4' });

            await axios.post(`${API_URL}/properties`, form1, {
                headers: { ...form1.getHeaders(), Authorization: `Bearer ${token}` }
            });
            console.log('❌ Error: Upload without picture should have failed');
        } catch (error) {
            console.log('✅ Validation Success: Correctly rejected video without picture:', error.response?.data?.message);
        }

        // 3. Test: Video WITH picture (Should SUCCEED)
        const form2 = new FormData();
        form2.append('title', 'Video Success House');
        form2.append('description', 'This is a test property with both and image and a video.');
        form2.append('price', '750000');
        form2.append('location', 'Abuja');
        form2.append('category', 'Luxury');
        form2.append('bedrooms', '3');
        form2.append('bathrooms', '3');
        form2.append('campus', 'UNILAG');

        const testImage = Buffer.from('test image content');
        form2.append('images', testImage, { filename: 'test.jpg', contentType: 'image/jpeg' });

        const testVideo2 = Buffer.from('test video content');
        form2.append('video', testVideo2, { filename: 'test_success.mp4', contentType: 'video/mp4' });

        const createRes = await axios.post(`${API_URL}/properties`, form2, {
            headers: { ...form2.getHeaders(), Authorization: `Bearer ${token}` }
        });
        console.log('✅ Success: Uploaded property with video and picture');
        console.log('Property ID:', createRes.data.data.id);
        console.log('Video URL:', createRes.data.data.video);

    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
    }
}

testVideoUpload();
