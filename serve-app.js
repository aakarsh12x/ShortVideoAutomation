const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8000;

// MIME types
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml'
};

const server = http.createServer((req, res) => {
  console.log(`${req.method} ${req.url}`);
  
  // Handle API endpoints
  if (req.url.startsWith('/api/')) {
    // API index summary
    if (req.url === '/api' || req.url === '/api/') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        name: 'ReelAutomation API',
        port: PORT,
        endpoints: [
          'GET /api',
          'GET /api/health',
          'GET /api/reddit/topics?subreddit=all&limit=10',
          'GET /api/videos',
          'POST /api/generate'
        ]
      }));
      return;
    }
    if (req.url === '/api/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok', message: 'ReelAutomation server is running' }));
      return;
    }
    
    // Mock Reddit trending topics
    if (req.url.startsWith('/api/reddit/topics')) {
      const topics = [
        'AI Technology Revolution',
        'Climate Change Solutions',
        'Space Exploration Advances',
        'Global Economic Shifts',
        'Renewable Energy Breakthroughs',
        'Cybersecurity Challenges',
        'Healthcare Innovations',
        'Education Technology Trends',
        'Urban Development Projects',
        'International Relations'
      ];
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, subreddit: 'all', topics, count: topics.length }));
      return;
    }
    
    if (req.url === '/api/videos') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify([
        {
          id: '1',
          title: 'Sample Video 1',
          topic: 'AI Technology',
          style: 'news',
          duration: 60,
          filename: 'sample1.mp4',
          thumbnail: '/api/placeholder/300/200',
          fileSize: 1024000,
          resolution: '1920x1080',
          createdAt: new Date().toISOString(),
          script: 'This is a sample script for testing purposes.'
        }
      ]));
      return;
    }
    
    if (req.method === 'POST' && req.url === '/api/generate') {
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
      req.on('end', () => {
        try {
          const data = JSON.parse(body);
          const jobId = 'job_' + Date.now();
          
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: true,
            jobId,
            message: 'Video generation started',
            estimatedTime: '2-3 minutes'
          }));
        } catch (error) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid JSON' }));
        }
      });
      return;
    }
    
    // API not found
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'API endpoint not found' }));
    return;
  }
  
  // Serve static files from build directory
  let filePath = path.join(__dirname, 'build', req.url === '/' ? 'index.html' : req.url);
  
  // Check if file exists
  if (!fs.existsSync(filePath)) {
    // If file doesn't exist, serve index.html for SPA routing
    filePath = path.join(__dirname, 'build', 'index.html');
  }
  
  // Get file extension
  const ext = path.extname(filePath);
  const contentType = mimeTypes[ext] || 'application/octet-stream';
  
  // Read and serve file
  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        // File not found, serve index.html for SPA routing
        fs.readFile(path.join(__dirname, 'build', 'index.html'), (err, content) => {
          if (err) {
            res.writeHead(500);
            res.end('Error loading index.html');
          } else {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(content);
          }
        });
      } else {
        res.writeHead(500);
        res.end('Server error');
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
});

server.listen(PORT, () => {
  console.log(`🚀 ReelAutomation server running on port ${PORT}`);
  console.log(`📱 Frontend available at: http://localhost:${PORT}`);
  console.log(`🔌 API available at: http://localhost:${PORT}/api`);
  console.log(`📁 Serving files from: ${path.join(__dirname, 'build')}`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});
