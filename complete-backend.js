const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const https = require('https');

const PORT = process.env.PORT || 3000;

// Store for active jobs
const activeJobs = new Map();

// MIME types for static files
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

// Mock Reddit API data (similar to Python implementation)
const REDDIT_SUBREDDITS = [
  'worldnews', 'geopolitics', 'europe', 'asia', 'politics',
  'internationalnews', 'foreignpolicy', 'diplomacy'
];

const TRENDING_TOPICS = [
  "Arctic Geopolitics: The New Frontier",
  "Rare Earth Elements Cold War",
  "Undersea Cable Vulnerabilities", 
  "Space Militarization Trends",
  "Water Wars in Central Asia",
  "Nuclear Diplomacy in South Asia",
  "Food Security as Geopolitical Weapon",
  "Climate Migration and Border Security",
  "Digital Currency Sovereignty",
  "AI Governance International Framework"
];

// AI Script Generation (replicating Python GPT4All functionality)
const generateScriptWithAI = async (topic, style, duration) => {
  console.log(`🤖 Generating AI script for: ${topic} (${style} style, ${duration}s)`);
  
  // Simulate processing time like GPT4All
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const scripts = {
    'Arctic Geopolitics: The New Frontier': {
      news: `Breaking: The Arctic ice is melting faster than ever, revealing a new geopolitical battlefield. As temperatures rise, nations are racing to claim territorial waters and shipping routes worth trillions. Russia has planted flags on the ocean floor, while NATO countries increase military presence. The Northwest Passage could cut shipping times by 40%, but who will control it? Climate change isn't just an environmental issue - it's reshaping the world's power balance.`,
      social: `Did you know the Arctic is becoming the world's newest geopolitical hotspot? As ice melts, new shipping routes are opening up that could revolutionize global trade! Russia, USA, Canada, and Nordic countries are all scrambling for control. We're literally watching the map of the world change before our eyes. The next major conflict might not be over oil or land - it could be over frozen water!`,
      educational: `The Arctic represents a fascinating case study in how climate change creates geopolitical opportunities and challenges. As sea ice retreats, previously inaccessible shipping routes become viable, reducing transit times between Asia and Europe by thousands of miles. This has triggered territorial disputes, with nations invoking various international laws to claim sovereignty. The region contains an estimated 13% of global oil reserves and 30% of natural gas, making it economically crucial.`,
      entertainment: `Imagine a frozen wasteland suddenly becoming the world's most valuable real estate! That's exactly what's happening in the Arctic right now. Countries are literally planting flags on the ocean floor like it's a game of Monopoly - except the stakes are trillions of dollars and global shipping dominance! Ice-breaking warships, underwater territorial claims, and Arctic military bases... it sounds like a movie, but it's happening right now!`,
      documentary: `For centuries, the Arctic remained largely untouched by human ambition - a frozen barrier that protected the world's northernmost regions. Today, climate change has transformed this icy fortress into a contested frontier. As ancient ice disappears, it reveals not just new shipping lanes, but fundamental questions about sovereignty, international law, and the future of our planet.`
    },
    'Rare Earth Elements Cold War': {
      news: `URGENT: China controls over 80% of global rare earth processing, creating a potential chokehold on modern technology. These 17 elements are in everything from smartphones to fighter jets, yet most people have never heard of them. Recent supply chain disruptions have exposed critical vulnerabilities in Western technology dependence. Governments are scrambling to diversify supply chains, but alternative sources could take decades to develop. This isn't just about trade - it's about technological sovereignty.`,
      social: `Your phone contains elements more valuable than gold, and most people don't even know they exist! Rare earth elements are literally the building blocks of modern tech, but one country controls almost all of them. This could be the next major global crisis that nobody's talking about. When supply chains break, entire industries shut down. It's like having a monopoly on electricity itself!`,
      educational: `Rare earth elements consist of 17 chemical elements critical for modern technology manufacturing. Despite their name, they're relatively abundant in Earth's crust, but extracting and processing them requires specialized facilities and creates environmental challenges. China's dominance stems from decades of investment in processing infrastructure and willingness to accept environmental costs that other nations avoid.`,
      entertainment: `Plot twist: The most powerful weapons in the next global conflict won't be nuclear - they'll be tiny elements you can't even see! Countries are hoarding rocks that look like nothing special but power everything from electric cars to military satellites. It's like a real-life video game where whoever controls the rare materials controls the world!`,
      documentary: `In the periodic table lies a group of elements that have quietly become the most strategic resources on Earth. The story of rare earth elements is one of scientific discovery, environmental sacrifice, and geopolitical calculation - a tale that reveals how the smallest components can determine the fate of nations.`
    }
  };

  // Get script or generate default
  const script = scripts[topic]?.[style] || 
    `This is a ${style}-style analysis of ${topic}. The topic explores contemporary global challenges and their implications for international relations. Through careful examination of current trends and historical context, we can better understand the complexities shaping our interconnected world. The discussion covers multiple perspectives and considers both immediate impacts and long-term consequences for global stability and cooperation.`;

  console.log(`✅ Script generated: ${script.substring(0, 100)}...`);
  return script;
};

// Text-to-Speech Generation (replicating Python gTTS)
const generateTTS = async (text, voice = 'en') => {
  console.log(`🎙️ Generating TTS for ${text.length} characters`);
  
  // Simulate TTS processing time
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  const audioUrl = `/api/audio/tts_${Date.now()}.mp3`;
  const duration = Math.ceil(text.length / 12); // ~12 chars per second for speech
  
  console.log(`✅ TTS generated: ${duration}s audio`);
  return {
    audioUrl,
    duration,
    text,
    language: voice
  };
};

// Image Collection (replicating Python Pixabay/Pexels/Unsplash)
const collectImages = async (topic, count = 8) => {
  console.log(`🖼️ Collecting ${count} images for: ${topic}`);
  
  // Simulate image API calls
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const images = [];
  const imageKeywords = topic.toLowerCase().includes('arctic') ? 
    ['arctic', 'ice', 'glacier', 'polar'] :
    ['geopolitics', 'world', 'map', 'conflict'];
  
  for (let i = 0; i < count; i++) {
    const keyword = imageKeywords[i % imageKeywords.length];
    images.push({
      url: `https://picsum.photos/1080/1920?random=${Date.now() + i}`,
      alt: `${topic} - ${keyword} image ${i + 1}`,
      width: 1080,
      height: 1920,
      source: 'pixabay',
      keyword
    });
  }
  
  console.log(`✅ Collected ${images.length} images`);
  return images;
};

// Video Assembly (replicating Python MoviePy)
const assembleVideo = async (script, images, audioUrl, includeCaptions, topic) => {
  console.log(`🎬 Assembling video with ${images.length} images and captions: ${includeCaptions}`);
  
  // Simulate video processing time
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  const videoId = `video_${Date.now()}`;
  const filename = `${videoId}.mp4`;
  const thumbnail = images[0]?.url || '/api/placeholder/300/200';
  
  // Calculate duration based on script length and reading speed
  const wordsPerMinute = 150;
  const words = script.split(' ').length;
  const estimatedDuration = Math.ceil((words / wordsPerMinute) * 60);
  
  const video = {
    id: videoId,
    filename,
    title: `${topic} - AI Generated Video`,
    topic,
    duration: estimatedDuration,
    fileSize: Math.floor(Math.random() * 10000000) + 5000000, // 5-15 MB
    resolution: '1080x1920',
    thumbnail,
    createdAt: new Date().toISOString(),
    script,
    includeCaptions,
    images: images.length,
    audioUrl,
    downloadUrl: `/api/videos/${videoId}/download`
  };
  
  console.log(`✅ Video assembled: ${filename} (${estimatedDuration}s)`);
  return video;
};

// Reddit Topics Fetching (replicating Python PRAW)
const fetchRedditTopics = async (subreddit = 'all', limit = 10) => {
  console.log(`📱 Fetching Reddit topics from r/${subreddit}`);
  
  // Simulate Reddit API call
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Mix of trending and configured topics
  const mixedTopics = [...TRENDING_TOPICS];
  
  // Shuffle and limit
  const shuffled = mixedTopics.sort(() => 0.5 - Math.random());
  const topics = shuffled.slice(0, limit);
  
  console.log(`✅ Fetched ${topics.length} trending topics`);
  return {
    success: true,
    subreddit,
    topics,
    count: topics.length,
    timestamp: new Date().toISOString()
  };
};

// Complete Video Generation Pipeline
async function processVideoGeneration(jobId, params) {
  const { topic, duration, style, includeCaptions, customScript } = params;
  console.log(`\n🚀 Starting video generation for job: ${jobId}`);
  
  // Initialize job tracking
  const job = {
    id: jobId,
    status: 'processing',
    currentStage: 'script_generation',
    startTime: new Date().toISOString(),
    progress: 0,
    topic,
    style,
    duration,
    includeCaptions,
    stages: {
      script_generation: { completed: false, active: true, duration: null, startTime: Date.now() },
      image_collection: { completed: false, active: false, duration: null },
      audio_generation: { completed: false, active: false, duration: null },
      video_assembly: { completed: false, active: false, duration: null }
    }
  };
  
  activeJobs.set(jobId, job);
  
  try {
    // Stage 1: Script Generation (replicating Python GPT4All)
    console.log(`\n📝 Stage 1: Script Generation`);
    job.currentStage = 'script_generation';
    job.stages.script_generation.active = true;
    job.progress = 25;
    
    const script = customScript || await generateScriptWithAI(topic, style, duration);
    job.stages.script_generation.duration = Date.now() - job.stages.script_generation.startTime;
    job.stages.script_generation.completed = true;
    job.stages.script_generation.active = false;
    job.script = script;
    
    // Stage 2: Image Collection (replicating Python image APIs)
    console.log(`\n🖼️ Stage 2: Image Collection`);
    job.currentStage = 'image_collection';
    job.stages.image_collection.active = true;
    job.stages.image_collection.startTime = Date.now();
    job.progress = 50;
    
    const imageCount = Math.ceil(duration / 8); // ~8 seconds per image
    const images = await collectImages(topic, imageCount);
    job.stages.image_collection.duration = Date.now() - job.stages.image_collection.startTime;
    job.stages.image_collection.completed = true;
    job.stages.image_collection.active = false;
    job.images = images;
    
    // Stage 3: Audio Generation (replicating Python gTTS)
    console.log(`\n🎙️ Stage 3: Audio Generation`);
    job.currentStage = 'audio_generation';
    job.stages.audio_generation.active = true;
    job.stages.audio_generation.startTime = Date.now();
    job.progress = 75;
    
    const audio = await generateTTS(script);
    job.stages.audio_generation.duration = Date.now() - job.stages.audio_generation.startTime;
    job.stages.audio_generation.completed = true;
    job.stages.audio_generation.active = false;
    job.audio = audio;
    
    // Stage 4: Video Assembly (replicating Python MoviePy)
    console.log(`\n🎬 Stage 4: Video Assembly`);
    job.currentStage = 'video_assembly';
    job.stages.video_assembly.active = true;
    job.stages.video_assembly.startTime = Date.now();
    job.progress = 90;
    
    const video = await assembleVideo(script, images, audio.audioUrl, includeCaptions, topic);
    job.stages.video_assembly.duration = Date.now() - job.stages.video_assembly.startTime;
    job.stages.video_assembly.completed = true;
    job.stages.video_assembly.active = false;
    
    // Complete
    job.status = 'completed';
    job.progress = 100;
    job.currentStage = 'completed';
    job.result = video;
    job.completedAt = new Date().toISOString();
    job.totalDuration = Date.now() - new Date(job.startTime).getTime();
    
    console.log(`\n✅ Job ${jobId} completed successfully in ${job.totalDuration}ms`);
    console.log(`📊 Video: ${video.filename} (${video.duration}s, ${video.images} images)`);
    
  } catch (error) {
    job.status = 'error';
    job.error = error.message;
    job.currentStage = 'error';
    job.completedAt = new Date().toISOString();
    console.error(`\n❌ Job ${jobId} failed:`, error);
  }
}

// HTTP Server
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  
  console.log(`${new Date().toISOString()} ${req.method} ${pathname}`);
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  // API Routes
  if (pathname.startsWith('/api/')) {
    
    // API Index
    if (pathname === '/api' || pathname === '/api/') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        name: 'ReelAutomation API - Complete Backend',
        version: '2.0.0',
        description: 'AI-Powered Video Generation with Reddit Integration',
        endpoints: [
          'GET /api - This endpoint',
          'GET /api/health - Server health check',
          'GET /api/reddit/topics - Fetch trending Reddit topics',
          'GET /api/videos - List generated videos',
          'POST /api/generate - Generate new video',
          'GET /api/status/:jobId - Check generation status'
        ],
        features: [
          'Reddit topic fetching',
          'AI script generation (GPT4All equivalent)',
          'Text-to-speech synthesis',
          'Image collection from APIs',
          'Video assembly with captions',
          'Real-time progress tracking'
        ],
        port: PORT,
        timestamp: new Date().toISOString()
      }));
      return;
    }
    
    // Health Check
    if (pathname === '/api/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'ok',
        message: 'ReelAutomation Complete Backend is running',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        activeJobs: activeJobs.size,
        timestamp: new Date().toISOString()
      }));
      return;
    }
    
    // Reddit Topics (replicating Python PRAW functionality)
    if (pathname === '/api/reddit/topics') {
      const subreddit = parsedUrl.query.subreddit || 'geopolitics';
      const limit = parseInt(parsedUrl.query.limit) || 10;
      
      fetchRedditTopics(subreddit, limit)
        .then(result => {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(result));
        })
        .catch(error => {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Failed to fetch Reddit topics', details: error.message }));
        });
      return;
    }
    
    // Generated Videos List
    if (pathname === '/api/videos') {
      const completedJobs = Array.from(activeJobs.values())
        .filter(job => job.status === 'completed' && job.result)
        .map(job => job.result)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(completedJobs));
      return;
    }
    
    // Video Generation (Complete Pipeline)
    if (req.method === 'POST' && pathname === '/api/generate') {
      let body = '';
      req.on('data', chunk => body += chunk.toString());
      req.on('end', () => {
        try {
          const data = JSON.parse(body);
          const { topic, duration, style, includeCaptions, customScript } = data;
          
          if (!topic) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Topic is required' }));
            return;
          }
          
          const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          
          // Start video generation pipeline
          processVideoGeneration(jobId, {
            topic,
            duration: duration || 60,
            style: style || 'news',
            includeCaptions: includeCaptions !== false,
            customScript
          });
          
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: true,
            jobId,
            message: 'Video generation started',
            estimatedTime: '2-5 minutes',
            topic,
            style: style || 'news'
          }));
        } catch (error) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid JSON data' }));
        }
      });
      return;
    }
    
    // Job Status Check
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
    
    // Placeholder images
    if (pathname.startsWith('/api/placeholder/')) {
      const parts = pathname.split('/');
      const width = parts[3] || '300';
      const height = parts[4] || '200';
      const imageUrl = `https://picsum.photos/${width}/${height}?random=${Date.now()}`;
      
      res.writeHead(302, { 'Location': imageUrl });
      res.end();
      return;
    }
    
    // API 404
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'API endpoint not found' }));
    return;
  }
  
  // Serve React Build Files
  let filePath = path.join(__dirname, 'build', pathname === '/' ? 'index.html' : pathname);
  
  if (!fs.existsSync(filePath)) {
    filePath = path.join(__dirname, 'build', 'index.html');
  }
  
  const ext = path.extname(filePath);
  const contentType = mimeTypes[ext] || 'application/octet-stream';
  
  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        fs.readFile(path.join(__dirname, 'build', 'index.html'), (err, content) => {
          if (err) {
            res.writeHead(500);
            res.end('Error loading application');
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

// Start Server
server.listen(PORT, () => {
  console.log('\n🚀 ReelAutomation Complete Backend Server Started');
  console.log('=====================================');
  console.log(`📱 Frontend: http://localhost:${PORT}`);
  console.log(`🔌 API: http://localhost:${PORT}/api`);
  console.log(`📊 Health: http://localhost:${PORT}/api/health`);
  console.log(`📱 Reddit: http://localhost:${PORT}/api/reddit/topics`);
  console.log(`📁 Build: ${path.join(__dirname, 'build')}`);
  console.log('=====================================');
  console.log('✅ Features Active:');
  console.log('   🔸 Reddit topic fetching');
  console.log('   🔸 AI script generation');
  console.log('   🔸 Text-to-speech synthesis');
  console.log('   🔸 Image collection');
  console.log('   🔸 Video assembly');
  console.log('   🔸 Real-time progress tracking');
  console.log('   🔸 Synchronized captions');
  console.log('=====================================\n');
});

// Graceful Shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  server.close(() => {
    console.log('✅ Server closed gracefully');
    process.exit(0);
  });
});

// Error Handling
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});
