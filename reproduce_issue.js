const http = require('http');

function request(method, path, body) {
    return new Promise((resolve, reject) => {
        const req = http.request({
            hostname: '127.0.0.1',
            port: 5000,
            path: '/api' + path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                ...(body && { 'Content-Length': Buffer.byteLength(body) })
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve({ status: res.statusCode, body: data }));
        });
        req.on('error', reject);
        if (body) req.write(body);
        req.end();
    });
}

async function run() {
    try {
        console.log("Fetching universities...");
        const uniRes = await request('GET', '/university');
        console.log("Uni Status:", uniRes.status);

        let uniId = null;
        try {
            const uniData = JSON.parse(uniRes.body);
            if (uniData.data && uniData.data.length > 0) {
                uniId = uniData.data[0].id;
                console.log("Using Uni ID:", uniId);
            }
        } catch (e) {
            console.log("Failed to parse uni response");
        }

        const payload = JSON.stringify({
            fullName: "Repro User",
            email: "repro" + Date.now() + "@test.com",
            password: "TopSecretPassword123!",
            role: "STUDENT",
            universityId: uniId
        });

        console.log("Registering...");
        const regRes = await request('POST', '/auth/register', payload);
        console.log("Register Status:", regRes.status);
        console.log("Register Body:", regRes.body);

    } catch (e) {
        console.error("Error:", e);
    }
}
run();
