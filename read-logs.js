const fs = require('fs');
const files = ['server_log_v3.txt', 'server_log_direct.txt', 'backend_debug_log.txt', 'server_log.txt'];
files.forEach(file => {
    try {
        const content = fs.readFileSync(file, 'utf16le');
        console.log(`--- ${file} ---`);
        console.log(content);
    } catch (e) {
        // try utf8
        try {
            const content = fs.readFileSync(file, 'utf8');
            console.log(`--- ${file} (UTF8) ---`);
            console.log(content);
        } catch (err) { }
    }
});
