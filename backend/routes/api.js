const express = require('express');
const router = express.Router();
const logger = require('../logger');
const config = require('../config');

// Import services
const redditService = require('../services/reddit');
const aiService = require('../services/ai');
const imageService = require('../services/images');
const ttsService = require('../services/tts');
const videoService = require('../services/video');
const captionService = require('../services/captions');
const automationService = require('../services/automation');

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// System status endpoint
router.get('/system/status', async (req, res) => {
  try {
    const status = {
      server: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage()
      },
      services: {
        reddit: await redditService.checkHealth(),
        ai: await aiService.checkHealth(),
        images: await imageService.checkHealth(),
        tts: await ttsService.checkHealth(),
        video: await videoService.checkHealth()
      },
      config: {
        environment: process.env.NODE_ENV || 'development',
        features: {
          reddit: !!config.get('reddit.clientId'),
          openai: !!config.get('openai.apiKey'),
          anthropic: !!config.get('anthropic.apiKey'),
          pexels: !!config.get('images.pexelsApiKey'),
          unsplash: !!config.get('images.unsplashAccessKey'),
          pixabay: !!config.get('images.pixabayApiKey')
        }
      }
    };

    res.json(status);
  } catch (error) {
    logger.error('System status check failed:', error);
    res.status(500).json({
      error: 'System status check failed',
      message: error.message
    });
  }
});

// Video generation endpoint
router.post('/generate', async (req, res) => {
  try {
    const { topic, duration, style, includeCaptions, customScript } = req.body;
    
    // Validate input
    if (!topic) {
      return res.status(400).json({
        error: 'Topic is required'
      });
    }

    // Generate unique job ID
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Start video generation process
    const io = req.app.get('io');
    automationService.generateVideo({
      jobId,
      topic,
      duration: duration || 60,
      style: style || 'news',
      includeCaptions: includeCaptions !== false,
      customScript: customScript || null
    }, io);

    res.json({
      jobId,
      status: 'started',
      message: 'Video generation started'
    });

  } catch (error) {
    logger.error('Video generation failed:', error);
    res.status(500).json({
      error: 'Video generation failed',
      message: error.message
    });
  }
});

// Get video generation status
router.get('/status/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    const status = await automationService.getJobStatus(jobId);
    
    if (!status) {
      return res.status(404).json({
        error: 'Job not found'
      });
    }

    res.json(status);
  } catch (error) {
    logger.error('Status check failed:', error);
    res.status(500).json({
      error: 'Status check failed',
      message: error.message
    });
  }
});

// Cancel video generation
router.post('/cancel/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    const cancelled = await automationService.cancelJob(jobId);
    
    if (!cancelled) {
      return res.status(404).json({
        error: 'Job not found or already completed'
      });
    }

    res.json({
      jobId,
      status: 'cancelled',
      message: 'Video generation cancelled'
    });
  } catch (error) {
    logger.error('Job cancellation failed:', error);
    res.status(500).json({
      error: 'Job cancellation failed',
      message: error.message
    });
  }
});

// Get all videos
router.get('/videos', async (req, res) => {
  try {
    const videos = await videoService.getAllVideos();
    res.json(videos);
  } catch (error) {
    logger.error('Failed to get videos:', error);
    res.status(500).json({
      error: 'Failed to get videos',
      message: error.message
    });
  }
});

// Get specific video
router.get('/videos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const video = await videoService.getVideo(id);
    
    if (!video) {
      return res.status(404).json({
        error: 'Video not found'
      });
    }

    res.json(video);
  } catch (error) {
    logger.error('Failed to get video:', error);
    res.status(500).json({
      error: 'Failed to get video',
      message: error.message
    });
  }
});

// Delete video
router.delete('/videos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await videoService.deleteVideo(id);
    
    if (!deleted) {
      return res.status(404).json({
        error: 'Video not found'
      });
    }

    res.json({
      message: 'Video deleted successfully'
    });
  } catch (error) {
    logger.error('Failed to delete video:', error);
    res.status(500).json({
      error: 'Failed to delete video',
      message: error.message
    });
  }
});

// Reddit topics endpoint
router.get('/reddit/topics', async (req, res) => {
  try {
    const { subreddit = 'all', limit = 10 } = req.query;
    const topics = await redditService.getTrendingTopics(subreddit, parseInt(limit));
    res.json(topics);
  } catch (error) {
    logger.error('Failed to get Reddit topics:', error);
    res.status(500).json({
      error: 'Failed to get Reddit topics',
      message: error.message
    });
  }
});

// AI script generation endpoint
router.post('/ai/script', async (req, res) => {
  try {
    const { topic, style, duration } = req.body;
    
    if (!topic) {
      return res.status(400).json({
        error: 'Topic is required'
      });
    }

    const script = await aiService.generateScript(topic, style, duration);
    res.json({ script });
  } catch (error) {
    logger.error('Script generation failed:', error);
    res.status(500).json({
      error: 'Script generation failed',
      message: error.message
    });
  }
});

// Image search endpoint
router.get('/images/search', async (req, res) => {
  try {
    const { query, count = 10 } = req.query;
    
    if (!query) {
      return res.status(400).json({
        error: 'Query is required'
      });
    }

    const images = await imageService.searchImages(query, parseInt(count));
    res.json(images);
  } catch (error) {
    logger.error('Image search failed:', error);
    res.status(500).json({
      error: 'Image search failed',
      message: error.message
    });
  }
});

// TTS generation endpoint
router.post('/tts/generate', async (req, res) => {
  try {
    const { text, voice = 'default' } = req.body;
    
    if (!text) {
      return res.status(400).json({
        error: 'Text is required'
      });
    }

    const audioFile = await ttsService.generateAudio(text, voice);
    res.json({
      audioFile,
      message: 'Audio generated successfully'
    });
  } catch (error) {
    logger.error('TTS generation failed:', error);
    res.status(500).json({
      error: 'TTS generation failed',
      message: error.message
    });
  }
});

// Caption generation endpoint
router.post('/captions/:videoId', async (req, res) => {
  try {
    const { videoId } = req.params;
    const { options = {} } = req.body;
    
    const captions = await captionService.generateCaptions(videoId, options);
    res.json({
      captions,
      message: 'Captions generated successfully'
    });
  } catch (error) {
    logger.error('Caption generation failed:', error);
    res.status(500).json({
      error: 'Caption generation failed',
      message: error.message
    });
  }
});

// Configuration endpoints
router.get('/config', (req, res) => {
  try {
    const publicConfig = {
      video: config.get('video'),
      captions: config.get('captions'),
      features: {
        reddit: !!config.get('reddit.clientId'),
        openai: !!config.get('openai.apiKey'),
        anthropic: !!config.get('anthropic.apiKey'),
        pexels: !!config.get('images.pexelsApiKey'),
        unsplash: !!config.get('images.unsplashAccessKey'),
        pixabay: !!config.get('images.pixabayApiKey')
      }
    };
    
    res.json(publicConfig);
  } catch (error) {
    logger.error('Failed to get config:', error);
    res.status(500).json({
      error: 'Failed to get config',
      message: error.message
    });
  }
});

router.put('/config', (req, res) => {
  try {
    const { video, captions } = req.body;
    
    if (video) {
      config.set('video', { ...config.get('video'), ...video });
    }
    
    if (captions) {
      config.set('captions', { ...config.get('captions'), ...captions });
    }
    
    res.json({
      message: 'Configuration updated successfully'
    });
  } catch (error) {
    logger.error('Failed to update config:', error);
    res.status(500).json({
      error: 'Failed to update config',
      message: error.message
    });
  }
});

module.exports = router;

