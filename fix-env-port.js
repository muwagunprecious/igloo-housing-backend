
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');
let content = fs.readFileSync(envPath, 'utf8');

// Regex to find DATABASE_URL and update port and params
if (content.includes('pooler.supabase.com') && content.includes(':5432')) {
    console.log('Found pooler URL with port 5432. Updating to 6543 and adding pgbouncer support.');

    // Replace port
    content = content.replace(
        /(DATABASE_URL="?postgresql:\/\/[^:]+:[^@]+@[^:]+):5432(\/.*)"?/g,
        '$1:6543$2'
    );

    // Add pgbouncer=true if missing
    if (!content.includes('pgbouncer=true')) {
        const urlMatch = content.match(/DATABASE_URL="?([^"\n]+)"?/);
        if (urlMatch) {
            let url = urlMatch[1];
            const separator = url.includes('?') ? '&' : '?';
            const newUrl = `${url}${separator}pgbouncer=true`; // Removed connection_limit for now as it can be tricky
            content = content.replace(urlMatch[0], `DATABASE_URL="${newUrl}"`);
        }
    }

    fs.writeFileSync(envPath, content);
    console.log('✅ Updated .env file.');
} else {
    console.log('ℹ️ No matching incorrect configuration found or already fixed.');
}
