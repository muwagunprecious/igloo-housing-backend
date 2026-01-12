async function attemptLogin() {
    console.log('Attempting login via fetch...');
    try {
        const response = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: 'admin@igloo.com',
                password: 'Admin@123'
            })
        });

        console.log(`Response Status: ${response.status} ${response.statusText}`);
        const data = await response.text();
        try {
            const json = JSON.parse(data);
            console.log('Response Body:', JSON.stringify(json, null, 2));
        } catch (e) {
            console.log('Response Body (Text):', data);
        }
    } catch (error) {
        console.error('Fetch error:', error.message);
    }
}

attemptLogin();
