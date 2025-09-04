const express = require('express');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const https = require('https');
const http = require('http');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'build')));

// Store for active jobs
const activeJobs = new Map();

// Mock Reddit API (replace with real Reddit API credentials)
const REDDIT_SUBREDDITS = [
  'worldnews', 'politics', 'technology', 'science', 'business',
  'environment', 'geopolitics', 'europe', 'asia', 'africa'
];

// Mock GPT4All responses (replace with actual GPT4All integration)
const generateScriptWithGPT4All = async (topic, style, duration) => {
  const scripts = {
    'AI Technology': {
      news: `Artificial Intelligence continues to revolutionize industries worldwide. Recent developments in machine learning algorithms have shown unprecedented capabilities in natural language processing and computer vision. Experts predict AI will contribute over $15 trillion to the global economy by 2030. The technology is already transforming healthcare, finance, and transportation sectors. However, concerns about job displacement and ethical implications remain significant challenges that policymakers must address.`,
      social: `AI is everywhere! From your phone's camera to your favorite apps, artificial intelligence is making everything smarter. But here's what's really exciting - we're just scratching the surface! Machine learning is helping doctors diagnose diseases, scientists discover new materials, and even artists create amazing content. The future is here, and it's powered by AI!`,
      educational: `Artificial Intelligence represents a fundamental shift in how we approach problem-solving. At its core, AI involves creating systems that can learn from data, recognize patterns, and make decisions with minimal human intervention. Machine learning, a subset of AI, uses algorithms to identify relationships in data. Deep learning, which uses neural networks inspired by the human brain, has achieved remarkable breakthroughs in image recognition, language processing, and game playing.`,
      entertainment: `Get ready for the AI revolution! Picture this: your personal AI assistant that knows you better than your best friend, cars that drive themselves while you nap, and robots that can cook your favorite meals. It's not science fiction anymore - it's happening right now! Companies are racing to build the most intelligent AI systems, and the results are mind-blowing.`,
      documentary: `The story of Artificial Intelligence is one of human ambition and technological breakthrough. From Alan Turing's theoretical foundations in the 1950s to today's sophisticated neural networks, AI has evolved from a scientific curiosity to a transformative force. The journey has been marked by periods of optimism and disillusionment, known as AI winters. Today, we stand at the threshold of artificial general intelligence, where machines might one day match human cognitive abilities.`
    },
    'Climate Change': {
      news: `Climate change continues to accelerate with global temperatures rising at unprecedented rates. The latest IPCC report indicates we have less than a decade to implement drastic emissions reductions to avoid catastrophic warming. Extreme weather events are becoming more frequent and intense, affecting millions worldwide. Scientists warn that current policies put us on track for 2.7°C warming by 2100, far exceeding the 1.5°C target set in the Paris Agreement.`,
      social: `Our planet is sending us a clear message: climate change is real and it's happening now! We're seeing record-breaking temperatures, devastating wildfires, and stronger hurricanes. But here's the good news - we have the solutions! Renewable energy is cheaper than ever, electric vehicles are going mainstream, and people everywhere are taking action. It's time to be part of the solution!`,
      educational: `Climate change refers to long-term shifts in global weather patterns and average temperatures. The primary driver is the increase in greenhouse gases, particularly carbon dioxide, from human activities like burning fossil fuels and deforestation. These gases trap heat in Earth's atmosphere, leading to global warming. The consequences include rising sea levels, more extreme weather events, and disruptions to ecosystems. Understanding climate change requires examining both natural climate variability and human-induced changes.`,
      entertainment: `Imagine a world where clean energy powers everything! Solar panels on every roof, wind turbines spinning gracefully, and electric cars zooming silently down the road. This isn't just a dream - it's the future we're building! Climate action is creating millions of new jobs, saving money on energy bills, and making our cities healthier places to live. The green revolution is here, and it's exciting!`,
      documentary: `The climate crisis represents humanity's greatest challenge and opportunity. For over a century, we've built our civilization on fossil fuels, unaware of the consequences. Now, as we witness the impacts of our choices, we face a critical decision: continue down the current path or transform our energy systems. The transition to renewable energy is not just about avoiding disaster - it's about creating a more just, sustainable, and prosperous world for future generations.`
    },
    'Space Exploration': {
      news: `Space exploration has entered a new era with private companies joining government agencies in the quest to explore the cosmos. SpaceX's Starship program aims to establish a human presence on Mars within the next decade. NASA's Artemis program plans to return humans to the Moon by 2025, while international collaboration on the International Space Station continues to advance scientific research. The discovery of potentially habitable exoplanets has renewed interest in the search for extraterrestrial life.`,
      social: `Space is calling, and we're answering! From SpaceX's incredible rocket landings to NASA's stunning images of distant galaxies, space exploration is more exciting than ever. We're not just watching from the sidelines anymore - private companies are making space travel accessible to more people. Imagine booking a trip to space like you would book a flight! The final frontier is becoming our next destination.`,
      educational: `Space exploration encompasses the investigation of celestial objects and phenomena beyond Earth's atmosphere. It involves various scientific disciplines including astronomy, physics, engineering, and biology. Modern space exploration began with the launch of Sputnik in 1957, marking the start of the Space Age. Today, we use sophisticated telescopes, robotic probes, and human spaceflight to study planets, stars, galaxies, and the universe itself. Space exploration has led to numerous technological innovations and deepened our understanding of our place in the cosmos.`,
      entertainment: `Get ready to blast off into the future! Space tourism is becoming a reality, with companies offering suborbital flights and plans for orbital hotels. Imagine floating in zero gravity, seeing Earth from space, or even walking on the Moon! The technology that once seemed like science fiction is now being built in real factories. Space is no longer just for astronauts - it's for everyone who dreams of exploring the stars!`,
      documentary: `The story of space exploration is one of human curiosity and technological achievement. From the first telescopes that revealed the moons of Jupiter to the spacecraft that have visited every planet in our solar system, each discovery has expanded our understanding of the universe. The International Space Station represents the longest continuous human presence in space, while robotic missions have explored the surface of Mars and the outer reaches of our solar system. As we look toward Mars and beyond, we continue humanity's ancient quest to explore the unknown.`
    }
  };

  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const script = scripts[topic]?.[style] || 
    `This is a ${style} style video about ${topic}. The content would be generated using advanced AI models to create engaging, informative content tailored to your specifications. The script would include relevant facts, engaging storytelling, and appropriate tone for the ${style} format.`;
  
  return script;
};

// Mock TTS generation (replace with actual TTS service)
const generateTTS = async (text, voice = 'default') => {
  // Simulate TTS processing
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  return {
    audioUrl: `/api/audio/sample-${Date.now()}.mp3`,
    duration: Math.ceil(text.length / 15), // Rough estimate: 15 characters per second
    text: text
  };
};

// Mock image collection (replace with actual image API integration)
const collectImages = async (topic, count = 10) => {
  // Simulate image collection
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

// Mock video generation (replace with actual video processing)
const generateVideo = async (script, images, audioUrl, includeCaptions) => {
  // Simulate video processing
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  const videoId = `video_${Date.now()}`;
  const filename = `${videoId}.mp4`;
  
  return {
    id: videoId,
    filename: filename,
    title: `Generated Video - ${new Date().toLocaleDateString()}`,
    duration: Math.ceil(script.length / 15),
    fileSize: Math.floor(Math.random() * 5000000) + 1000000, // 1-6 MB
    resolution: '1920x1080',
    thumbnail: images[0]?.url || '/api/placeholder/300/200',
    createdAt: new Date().toISOString(),
    script: script,
    includeCaptions: includeCaptions
  };
};

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'ReelAutomation server is running' });
});

// Get Reddit topics
app.get('/api/reddit/topics', async (req, res) => {
  try {
    const subreddit = req.query.subreddit || 'all';
    const limit = parseInt(req.query.limit) || 10;
    
    // Mock Reddit API response
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
    ].slice(0, limit);
    
    res.json({
      success: true,
      subreddit: subreddit,
      topics: topics,
      count: topics.length
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch Reddit topics' });
  }
});

// Generate video
app.post('/api/generate', async (req, res) => {
  try {
    const { topic, duration, style, includeCaptions, customScript } = req.body;
    
    if (!topic) {
      return res.status(400).json({ error: 'Topic is required' });
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
    
    res.json({
      success: true,
      jobId: jobId,
      message: 'Video generation started',
      estimatedTime: '5-8 minutes'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to start video generation' });
  }
});

// Get video status
app.get('/api/status/:jobId', (req, res) => {
  const { jobId } = req.params;
  const job = activeJobs.get(jobId);
  
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }
  
  res.json(job);
});

// Get videos
app.get('/api/videos', (req, res) => {
  try {
    // Return mock videos for now
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
        createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
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
        createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
        script: 'Climate change refers to long-term shifts in global weather patterns...'
      }
    ];
    
    res.json(videos);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch videos' });
  }
});

// Placeholder image endpoint
app.get('/api/placeholder/:width/:height', (req, res) => {
  const { width, height } = req.params;
  const url = `https://picsum.photos/${width}/${height}?random=${Date.now()}`;
  res.redirect(url);
});

// Process video generation
async function processVideoGeneration(jobId, params) {
  const { topic, duration, style, includeCaptions, customScript } = params;
  
  // Initialize job
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
    const images = await collectImages(topic, Math.ceil(duration / 10)); // 1 image per 10 seconds
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

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 ReelAutomation server running on port ${PORT}`);
  console.log(`📱 Frontend available at: http://localhost:${PORT}`);
  console.log(`🔌 API available at: http://localhost:${PORT}/api`);
  console.log(`📁 Serving files from: ${path.join(__dirname, 'build')}`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  process.exit(0);
});

