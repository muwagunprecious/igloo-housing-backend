const fs = require('fs');
const path = 'server_log_debug.txt';

if (fs.existsSync(path)) {
    try {
        const buffer = fs.readFileSync(path);
        // explicit utf16le check or try/catch
        let content = buffer.toString('utf16le');
        if (!content.includes('igloo-estate-backend')) {
            // Fallback to utf8 if utf16 look weird or empty
            content = buffer.toString('utf8');
        }
        console.log(content);
    } catch (e) {
        console.error('Error reading log:', e.message);
    }
} else {
    console.log('Log file not found.');
}
