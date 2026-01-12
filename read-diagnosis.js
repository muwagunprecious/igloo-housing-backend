const fs = require('fs');
try {
    const raw = fs.readFileSync('diagnosis_result.txt');
    // Try both UTF-8 and UTF-16LE as PowerShell redirects can be tricky
    let content = raw.toString('utf8');
    if (content.includes('\u0000')) {
        content = raw.toString('utf16le');
    }
    console.log(content);
} catch (e) {
    console.error(e.message);
}
