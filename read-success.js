const fs = require('fs');
try {
    const raw = fs.readFileSync('exhaustive-test.js', 'utf8');
    const content = fs.readFileSync('diagnostic_full.txt', 'utf16le');

    // Look for success messages
    const lines = content.split('\n');
    lines.forEach((line, i) => {
        if (line.includes('✅ SUCCESS:')) {
            console.log('WORKING_VARIANT: ' + line.trim());
        }
    });

} catch (e) {
    console.error(e.message);
}
