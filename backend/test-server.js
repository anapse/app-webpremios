console.log('Testing Node.js execution...');
console.log('Current directory:', process.cwd());
console.log('Node version:', process.version);
console.log('Platform:', process.platform);

// Test basic server
const http = require('http');
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Test server working!');
});

server.listen(3001, () => {
    console.log('Test server running on port 3001');
});

setTimeout(() => {
    console.log('Test completed');
    process.exit(0);
}, 5000);
