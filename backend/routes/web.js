const express = require('express');
const router = express.Router();
const path = require('path');
const logger = require('../logger');

// Serve static files
router.use(express.static(path.join(__dirname, '../../public')));

// API documentation endpoint
router.get('/api-docs', (req, res) => {
  res.json({
    title: 'ReelAutomation API',
    version: '1.0.0',
    description: 'AI-Powered Video Generation Platform API',
    endpoints: {
      health: {
        method: 'GET',
        path: '/api/health',
        description: 'Health check endpoint'
      },
      systemStatus: {
        method: 'GET',
        path: '/api/system/status',
        description: 'Get system status and health of all services'
      },
      generateVideo: {
        method: 'POST',
        path: '/api/generate',
        description: 'Start video generation process',
        body: {
          topic: 'string (required)',
          duration: 'number (optional, default: 60)',
          style: 'string (optional, default: "news")',
          includeCaptions: 'boolean (optional, default: true)',
          customScript: 'string (optional)'
        }
      },
      getStatus: {
        method: 'GET',
        path: '/api/status/:jobId',
        description: 'Get video generation status'
      },
      cancelJob: {
        method: 'POST',
        path: '/api/cancel/:jobId',
        description: 'Cancel video generation job'
      },
      getVideos: {
        method: 'GET',
        path: '/api/videos',
        description: 'Get all generated videos'
      },
      getVideo: {
        method: 'GET',
        path: '/api/videos/:id',
        description: 'Get specific video details'
      },
      deleteVideo: {
        method: 'DELETE',
        path: '/api/videos/:id',
        description: 'Delete a video'
      },
      redditTopics: {
        method: 'GET',
        path: '/api/reddit/topics',
        description: 'Get trending Reddit topics',
        query: {
          subreddit: 'string (optional, default: "all")',
          limit: 'number (optional, default: 10)'
        }
      },
      generateScript: {
        method: 'POST',
        path: '/api/ai/script',
        description: 'Generate AI script for a topic',
        body: {
          topic: 'string (required)',
          style: 'string (optional)',
          duration: 'number (optional)'
        }
      },
      searchImages: {
        method: 'GET',
        path: '/api/images/search',
        description: 'Search for images',
        query: {
          query: 'string (required)',
          count: 'number (optional, default: 10)'
        }
      },
      generateAudio: {
        method: 'POST',
        path: '/api/tts/generate',
        description: 'Generate text-to-speech audio',
        body: {
          text: 'string (required)',
          voice: 'string (optional, default: "default")'
        }
      },
      generateCaptions: {
        method: 'POST',
        path: '/api/captions/:videoId',
        description: 'Generate captions for a video',
        body: {
          options: 'object (optional)'
        }
      },
      getConfig: {
        method: 'GET',
        path: '/api/config',
        description: 'Get public configuration'
      },
      updateConfig: {
        method: 'PUT',
        path: '/api/config',
        description: 'Update configuration',
        body: {
          video: 'object (optional)',
          captions: 'object (optional)'
        }
      }
    },
    websocket: {
      connection: 'ws://localhost:3000',
      events: {
        progress: 'Video generation progress updates',
        video_complete: 'Video generation completed',
        job_cancelled: 'Job cancellation confirmed'
      }
    }
  });
});

// Placeholder endpoint for video thumbnails
router.get('/api/placeholder/:width/:height', (req, res) => {
  const { width, height } = req.params;
  
  // Generate a simple placeholder image
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f0f0f0"/>
      <text x="50%" y="50%" text-anchor="middle" dy=".3em" font-family="Arial, sans-serif" font-size="24" fill="#666">
        ${width} × ${height}
      </text>
    </svg>
  `;
  
  res.setHeader('Content-Type', 'image/svg+xml');
  res.send(svg);
});

// Error handling middleware
router.use((err, req, res, next) => {
  logger.error('Web route error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: 'Something went wrong'
  });
});

module.exports = router;

