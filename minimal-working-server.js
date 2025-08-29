const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 3000;

// Store for active jobs
const activeJobs = new Map();

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

// Mock GPT4All responses
const generateScriptWithGPT4All = async (topic, style, duration) => {
  const scripts = {
    'AI Technology': {
      news: `Artificial Intelligence continues to revolutionize industries worldwide. Recent developments in machine learning algorithms have shown unprecedented capabilities in natural language processing and computer vision. Experts predict AI will contribute over $15 trillion to the global economy by 2030.`,
      social: `AI is everywhere! From your phone's camera to your favorite apps, artificial intelligence is making everything smarter. Machine learning is helping doctors diagnose diseases, scientists discover new materials, and even artists create amazing content.`,
      educational: `Artificial Intelligence represents a fundamental shift in how we approach problem-solving. At its core, AI involves creating systems that can learn from data, recognize patterns, and make decisions with minimal human intervention.`,
      entertainment: `Get ready for the AI revolution! Picture this: your personal AI assistant that knows you better than your best friend, cars that drive themselves while you nap, and robots that can cook your favorite meals.`,
      documentary: `The story of Artificial Intelligence is one of human ambition and technological breakthrough. From Alan Turing's theoretical foundations to today's sophisticated neural networks, AI has evolved from a scientific curiosity to a transformative force.`
    },
    'Climate Change': {
      news: `Climate change continues to accelerate with global temperatures rising at unprecedented rates. The latest IPCC report indicates we have less than a decade to implement drastic emissions reductions to avoid catastrophic warming.`,
      social: `Our planet is sending us a clear message: climate change is real and it's happening now! We're seeing record-breaking temperatures, devastating wildfires, and stronger hurricanes. But here's the good news - we have the solutions!`,
      educational: `Climate change refers to long-term shifts in global weather patterns and average temperatures. The primary driver is the increase in greenhouse gases, particularly carbon dioxide, from human activities.`,
      entertainment: `Imagine a world where clean energy powers everything! Solar panels on every roof, wind turbines spinning gracefully, and electric cars zooming silently down the road. The green revolution is here!`,
      documentary: `The climate crisis represents humanity's greatest challenge and opportunity. For over a century, we've built our civilization on fossil fuels, unaware of the consequences. Now we face a critical decision.`
    },
    'Space Exploration': {
      news: `Space exploration has entered a new era with private companies joining government agencies in the quest to explore the cosmos. SpaceX's Starship program aims to establish a human presence on Mars within the next decade.`,
      social: `Space is calling, and we're answering! From SpaceX's incredible rocket landings to NASA's stunning images of distant galaxies, space exploration is more exciting than ever.`,
      educational: `Space exploration encompasses the investigation of celestial objects and phenomena beyond Earth's atmosphere. It involves various scientific disciplines including astronomy, physics, engineering, and biology.`,
      entertainment: `Get ready to blast off into the future! Space tourism is becoming a reality, with companies offering suborbital flights and plans for orbital hotels.`,
      documentary: `The story of space exploration is one of human curiosity and technological achievement. From the first telescopes to spacecraft visiting every planet, each discovery has expanded our understanding.`
    }
  };

  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const script = scripts[topic]?.[style] || 
    `This is a ${style} style video about ${topic}. The content would be generated using advanced AI models to create engaging, informative content tailored to your specifications.`;
  
  return script;
};

// Mock TTS generation
const generateTTS = async (text) => {
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  return {
    audioUrl: `/api/audio/sample-${Date.now()}.mp3`,
    duration: Math.ceil(text.length / 15),
    text: text
  };
};

// Mock image collection
const collectImages = async (topic, count = 10) => {
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  const images = [];
  for (let i = 0; i < count; i++) {
    images.push({
      url: `https://picsum.photos/800/600?random=${Date.now() + i}`,
      alt: `${topic} image ${i + 1}`,
      width: 800,
      height: 600
    });
  }
  
  return images;
};

// Mock video generation
const generateVideo = async (script, images, audioUrl, includeCaptions) => {
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  const videoId = `video_${Date.now()}`;
  const filename = `${videoId}.mp4`;
  
  return {
    id: videoId,
    filename: filename,
    title: `Generated Video - ${new Date().toLocaleDateString()}`,
    duration: Math.ceil(script.length / 15),
    fileSize: Math.floor(Math.random() * 5000000) + 1000000,
    resolution: '1920x1080',
    thumbnail: images[0]?.url || '/api/placeholder/300/200',
    createdAt: new Date().toISOString(),
    script: script,
    includeCaptions: includeCaptions
  };
};

// Process video generation
async function processVideoGeneration(jobId, params) {
  const { topic, duration, style, includeCaptions, customScript } = params;
  
  const job = {
    id: jobId,
    status: 'processing',
    currentStage: 'script_generation',
    startTime: new Date().toISOString(),
    progress: 0,
    stages: {
      script_generation: { completed: false, active: true, duration: null },
      image_collection: { completed: false, active: false, duration: null },
      audio_generation: { completed: false, active: false, duration: null },
      video_assembly: { completed: false, active: false, duration: null }
    }
  };
  
  activeJobs.set(jobId, job);
  
  try {
    // Stage 1: Script Generation
    job.currentStage = 'script_generation';
    job.stages.script_generation.active = true;
    job.progress = 25;
    
    const startTime = Date.now();
    const script = customScript || await generateScriptWithGPT4All(topic, style, duration);
    job.stages.script_generation.duration = Date.now() - startTime;
    job.stages.script_generation.completed = true;
    job.stages.script_generation.active = false;
    
    // Stage 2: Image Collection
    job.currentStage = 'image_collection';
    job.stages.image_collection.active = true;
    job.progress = 50;
    
    const imageStartTime = Date.now();
    const images = await collectImages(topic, Math.ceil(duration / 10));
    job.stages.image_collection.duration = Date.now() - imageStartTime;
    job.stages.image_collection.completed = true;
    job.stages.image_collection.active = false;
    
    // Stage 3: Audio Generation
    job.currentStage = 'audio_generation';
    job.stages.audio_generation.active = true;
    job.progress = 75;
    
    const audioStartTime = Date.now();
    const audio = await generateTTS(script);
    job.stages.audio_generation.duration = Date.now() - audioStartTime;
    job.stages.audio_generation.completed = true;
    job.stages.audio_generation.active = false;
    
    // Stage 4: Video Assembly
    job.currentStage = 'video_assembly';
    job.stages.video_assembly.active = true;
    job.progress = 90;
    
    const videoStartTime = Date.now();
    const video = await generateVideo(script, images, audio.audioUrl, includeCaptions);
    job.stages.video_assembly.duration = Date.now() - videoStartTime;
    job.stages.video_assembly.completed = true;
    job.stages.video_assembly.active = false;
    
    // Complete
    job.status = 'completed';
    job.progress = 100;
    job.currentStage = 'completed';
    job.result = video;
    job.completedAt = new Date().toISOString();
    
    console.log(`✅ Job ${jobId} completed successfully`);
    
  } catch (error) {
    job.status = 'error';
    job.error = error.message;
    job.currentStage = 'error';
    console.error(`❌ Job ${jobId} failed:`, error);
  }
}

// Create HTTP server
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  
  console.log(`${req.method} ${pathname}`);
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  // Handle API endpoints
  if (pathname.startsWith('/api/')) {
    if (pathname === '/api/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok', message: 'ReelAutomation server is running' }));
      return;
    }
    
    if (pathname === '/api/videos') {
      const videos = [
        {
          id: '1',
          title: 'AI Technology Revolution',
          topic: 'AI Technology',
          style: 'news',
          duration: 60,
          filename: 'ai_tech_video.mp4',
          thumbnail: 'https://picsum.photos/300/200?random=1',
          fileSize: 2500000,
          resolution: '1920x1080',
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          script: 'Artificial Intelligence continues to revolutionize industries worldwide...'
        },
        {
          id: '2',
          title: 'Climate Change Solutions',
          topic: 'Climate Change',
          style: 'educational',
          duration: 90,
          filename: 'climate_solutions.mp4',
          thumbnail: 'https://picsum.photos/300/200?random=2',
          fileSize: 3800000,
          resolution: '1920x1080',
          createdAt: new Date(Date.now() - 172800000).toISOString(),
          script: 'Climate change refers to long-term shifts in global weather patterns...'
        }
      ];
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(videos));
      return;
    }
    
    if (pathname === '/api/reddit/topics') {
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
      res.end(JSON.stringify({
        success: true,
        subreddit: parsedUrl.query.subreddit || 'all',
        topics: topics.slice(0, parseInt(parsedUrl.query.limit) || 10),
        count: topics.length
      }));
      return;
    }
    
    if (req.method === 'POST' && pathname === '/api/generate') {
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
      req.on('end', () => {
        try {
          const data = JSON.parse(body);
          const { topic, duration, style, includeCaptions, customScript } = data;
          
          if (!topic) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Topic is required' }));
            return;
          }
          
          const jobId = `job_${Date.now()}`;
          
          // Start the video generation process
          processVideoGeneration(jobId, {
            topic,
            duration,
            style,
            includeCaptions,
            customScript
          });
          
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: true,
            jobId: jobId,
            message: 'Video generation started',
            estimatedTime: '5-8 minutes'
          }));
        } catch (error) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid JSON' }));
        }
      });
      return;
    }
    
    if (pathname.startsWith('/api/status/')) {
      const jobId = pathname.split('/')[3];
      const job = activeJobs.get(jobId);
      
      if (!job) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Job not found' }));
        return;
      }
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(job));
      return;
    }
    
    if (pathname.startsWith('/api/placeholder/')) {
      const parts = pathname.split('/');
      const width = parts[3];
      const height = parts[4];
      const placeholderUrl = `https://picsum.photos/${width}/${height}?random=${Date.now()}`;
      
      res.writeHead(302, { 'Location': placeholderUrl });
      res.end();
      return;
    }
    
    // API not found
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'API endpoint not found' }));
    return;
  }
  
  // Serve static files from build directory
  let filePath = path.join(__dirname, 'build', pathname === '/' ? 'index.html' : pathname);
  
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

// Start server
server.listen(PORT, () => {
  console.log(`🚀 ReelAutomation server running on port ${PORT}`);
  console.log(`📱 Frontend available at: http://localhost:${PORT}`);
  console.log(`🔌 API available at: http://localhost:${PORT}/api`);
  console.log(`📁 Serving files from: ${path.join(__dirname, 'build')}`);
  console.log(`🤖 Features: Reddit API, GPT4All Scripts, TTS, Video Generation`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});
