const fs = require('fs');

async function restoreEnv() {
    console.log('--- .env Restoration ---');

    let tempContent = '';
    try {
        // Try reading as UTF-16LE first (common for Windows-generated files)
        const rawTemp = fs.readFileSync('.env.temp');
        tempContent = rawTemp.toString('utf16le');
        if (!tempContent.includes('DATABASE_URL')) {
            // Try UTF-8 if UTF-16LE failed
            tempContent = rawTemp.toString('utf8');
        }
    } catch (e) {
        console.error('Failed to read .env.temp:', e.message);
        return;
    }

    console.log('Read .env.temp successfully. Length:', tempContent.length);

    const password = 'Precious2006%3F';
    const newUrl = `postgresql://postgres.mrswfnmpmhbufhorutew:${password}@aws-1-eu-north-1.pooler.supabase.com:5432/postgres`;

    // Construct a clean .env content based on what we know should be there
    // We'll preserve other variables from the current .env if they are valid
    let currentEnv = '';
    try {
        currentEnv = fs.readFileSync('.env', 'utf8');
    } catch (e) { }

    const envLines = [];
    envLines.push(`DATABASE_URL="${newUrl}"`);

    // Default values if missing
    let jwtSecret = 'your-secret-key-change-in-production';
    let port = '5000';
    let nodeEnv = 'development';
    let clientUrl = 'http://localhost:3000';

    // Parse current env to preserve secrets if they exist and aren't corrupted
    const lines = currentEnv.split(/\r?\n/);
    lines.forEach(line => {
        if (line.startsWith('JWT_SECRET=')) jwtSecret = line.split('=')[1].replace(/['"]/g, '');
        if (line.startsWith('PORT=')) port = line.split('=')[1].replace(/['"]/g, '');
        if (line.startsWith('NODE_ENV=')) nodeEnv = line.split('=')[1].replace(/['"]/g, '');
        if (line.startsWith('CLIENT_URL=')) clientUrl = line.split('=')[1].replace(/['"]/g, '');
    });

    envLines.push(`JWT_SECRET="${jwtSecret}"`);
    envLines.push(`PORT="${port}"`);
    envLines.push(`NODE_ENV="${nodeEnv}"`);
    envLines.push(`CLIENT_URL="${clientUrl}"`);

    const finalContent = envLines.join('\n');
    fs.writeFileSync('.env', finalContent, 'utf8');
    console.log('✅ .env restored and cleaned (UTF-8)');
}

restoreEnv();
