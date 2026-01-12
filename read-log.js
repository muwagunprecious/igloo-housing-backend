const fs = require('fs');
try {
    const raw = fs.readFileSync('diagnostic_full.txt');
    console.log(raw.toString('utf16le'));
} catch (e) {
    console.error(e.message);
}
