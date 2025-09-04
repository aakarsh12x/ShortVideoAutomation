const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Hello World! Server is working!\n');
});

server.listen(3001, () => {
  console.log('Simple test server running on port 3001');
  console.log('Test with: curl http://localhost:3001');
});

