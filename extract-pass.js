const fs = require('fs');
try {
    const raw = fs.readFileSync('.env.temp');
    const content = raw.toString('utf16le');
    // Try both postgresql and other possible variations
    const match = content.match(/DATABASE_URL=(postgresql|postgres):\/\/.*:(.*)@/);
    if (match) {
        console.log('PASSWORD_EXTRACTED=' + match[2]);
    } else {
        console.log('No password match found in UTF-16LE');
        // Log a bit of the file to see what it looks like
        console.log('File start:', content.substring(0, 50));
    }
} catch (e) {
    console.error('Error:', e.message);
}
