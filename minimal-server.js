const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'build')));

// Basic API endpoints
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'ReelAutomation server is running' });
});

app.get('/api/videos', (req, res) => {
  // Mock video data for testing
  res.json([
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
  ]);
});

app.post('/api/generate', (req, res) => {
  const { topic, duration, style, includeCaptions, customScript } = req.body;
  
  // Mock response for testing
  const jobId = 'job_' + Date.now();
  
  res.json({
    success: true,
    jobId,
    message: 'Video generation started',
    estimatedTime: '2-3 minutes'
  });
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Minimal ReelAutomation server running on port ${PORT}`);
  console.log(`📱 Frontend available at: http://localhost:${PORT}`);
  console.log(`🔌 API available at: http://localhost:${PORT}/api`);
});

module.exports = app;
