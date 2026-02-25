const net = require('net');

const host = '54.247.26.119';
const ports = [5432, 6543];

ports.forEach(port => {
    const socket = new net.Socket();
    socket.setTimeout(5000);

    console.log(`Checking ${host}:${port}...`);

    socket.on('connect', () => {
        console.log(`✅ ${host}:${port} is REACHABLE`);
        socket.destroy();
    });

    socket.on('error', (err) => {
        console.log(`❌ ${host}:${port} is NOT REACHABLE (${err.message})`);
    });

    socket.on('timeout', () => {
        console.log(`❌ ${host}:${port} TIMEOUT`);
        socket.destroy();
    });

    socket.connect(port, host);
});
