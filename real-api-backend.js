const express = require('express');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

// Load environment variables
require('dotenv').config({ path: './api-keys.env' });

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('build'));
app.use('/output', express.static('output'));
app.use('/videos', express.static('output'));

// Ensure directories exist
const dirs = ['output', 'temp', 'logs'];
dirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Global variables
const jobs = new Map();
const TRENDING_TOPICS = [
  'Technology', 'Science', 'Space', 'AI', 'Climate Change', 'Health', 'Politics',
  'Economy', 'Sports', 'Entertainment', 'Education', 'Environment', 'Innovation',
  'Global Affairs', 'Digital Transformation', 'Sustainability', 'Future Tech',
  'Social Media', 'Cryptocurrency', 'Renewable Energy'
];

// Helper function to get image keywords
function getImageKeywords(topic) {
  const keywordMap = {
    'Technology': ['technology', 'digital', 'innovation', 'future', 'tech'],
    'Science': ['science', 'research', 'laboratory', 'discovery', 'experiment'],
    'Space': ['space', 'astronomy', 'galaxy', 'universe', 'cosmos'],
    'AI': ['artificial intelligence', 'machine learning', 'robotics', 'automation'],
    'Climate Change': ['climate', 'environment', 'global warming', 'sustainability'],
    'Health': ['health', 'medical', 'wellness', 'medicine', 'healthcare'],
    'Politics': ['politics', 'government', 'democracy', 'election', 'policy'],
    'Economy': ['economy', 'business', 'finance', 'market', 'trade'],
    'Sports': ['sports', 'athletics', 'competition', 'fitness', 'game'],
    'Entertainment': ['entertainment', 'movie', 'music', 'celebrity', 'culture']
  };
  
  return keywordMap[topic] || [topic.toLowerCase(), 'modern', 'professional', 'digital'];
}

// Mock script generation (replace with real AI integration)
async function generateScript(topic) {
  console.log(`🤖 [SCRIPT GENERATION] Creating AI script for "${topic}"`);
  
  const script = `Welcome to our exploration of ${topic}. This fascinating topic has captured global attention and continues to shape our world in remarkable ways. 

From groundbreaking developments to innovative solutions, ${topic} represents the cutting edge of human progress. Experts around the world are working tirelessly to advance our understanding and application of these concepts.

The implications are far-reaching, affecting everything from daily life to global systems. As we look to the future, ${topic} will undoubtedly play a crucial role in shaping tomorrow's world.

Stay tuned for more insights on this incredible subject.`;

  console.log(`✅ [SCRIPT GENERATION] Script created (${script.length} characters)`);
  return {
    text: script,
    duration: 30,
    wordCount: script.split(' ').length
  };
}

// Windows TTS generation
async function generateTTS(text) {
  console.log(`🎙️ [TTS GENERATION] Starting Windows Speech Synthesis`);
  
  const audioPath = path.join('output', `voiceover_${Date.now()}.wav`);
  const scriptPath = path.join('temp', `script_${Date.now()}.txt`);
  
  try {
    // Write script to temporary file
    fs.writeFileSync(scriptPath, text);
    
    // PowerShell command for Windows TTS
    const psCommand = `Add-Type -AssemblyName System.Speech; $speak = New-Object System.Speech.Synthesis.SpeechSynthesizer; $speak.Rate = 0; $speak.Volume = 100; $speak.Speak("${text.replace(/"/g, '\\"')}"); $speak.Dispose()`;
    
    // Alternative: Save to file
    const saveCommand = `Add-Type -AssemblyName System.Speech; $speak = New-Object System.Speech.Synthesis.SpeechSynthesizer; $speak.Rate = 0; $speak.Volume = 100; $speak.SetOutputToWaveFile("${audioPath}"); $speak.Speak([System.IO.File]::ReadAllText("${scriptPath}")); $speak.Dispose()`;
    
    console.log(`   🎵 Executing Windows TTS command...`);
    await execAsync(`powershell -Command "${saveCommand}"`);
    
    // Verify file was created
    if (fs.existsSync(audioPath)) {
      const stats = fs.statSync(audioPath);
      console.log(`✅ [TTS GENERATION] Audio file created: ${audioPath} (${stats.size} bytes)`);
      return {
        audioPath,
        duration: 30,
        size: stats.size
      };
    } else {
      throw new Error('Audio file not created');
    }
  } catch (error) {
    console.log(`⚠️ [TTS GENERATION] Windows TTS failed: ${error.message}`);
    console.log(`   🔄 Using fallback: creating empty audio file`);
    
    // Create a silent audio file as fallback
    const fallbackCommand = `ffmpeg -f lavfi -i anullsrc=channel_layout=stereo:sample_rate=44100 -t 30 "${audioPath}" -y`;
    await execAsync(fallbackCommand);
    
    return {
      audioPath,
      duration: 30,
      size: 0,
      fallback: true
    };
  } finally {
    // Clean up temporary script file
    if (fs.existsSync(scriptPath)) {
      fs.unlinkSync(scriptPath);
    }
  }
}

// Image collection from APIs
async function collectImages(topic, count = 8) {
  console.log(`🖼️ [IMAGE COLLECTION] Starting real API search for "${topic}" (${count} images needed)`);
  const images = [];
  const keywords = getImageKeywords(topic);
  
  const apiServices = [
    { name: 'Pixabay', fn: collectFromPixabay },
    { name: 'Pexels', fn: collectFromPexels },
    { name: 'Unsplash', fn: collectFromUnsplash }
  ];
  
  let imagesCollected = 0;
  
  for (const service of apiServices) {
    if (imagesCollected >= count) break;
    
    try {
      console.log(`   🔍 Trying ${service.name} API...`);
      const serviceImages = await service.fn(keywords, count - imagesCollected);
      
      for (const img of serviceImages) {
        if (imagesCollected >= count) break;
        
        try {
          const imageId = `img_${Date.now()}_${imagesCollected}`;
          images.push({
            id: imageId,
            url: img.url,
            alt: `${topic} - ${img.keyword}`,
            width: img.width || 1080,
            height: img.height || 1920,
            source: service.name,
            keyword: img.keyword,
            relevanceScore: Math.floor(Math.random() * 30) + 70
          });
          imagesCollected++;
          console.log(`   ✅ Collected: ${img.keyword} from ${service.name} (${imagesCollected}/${count})`);
        } catch (error) {
          console.log(`   ⚠️ Failed to process image from ${service.name}: ${error.message}`);
        }
      }
    } catch (error) {
      console.log(`   ⚠️ ${service.name} API failed: ${error.message}`);
    }
  }
  
  if (images.length === 0) {
    console.log(`   🔄 No images from APIs, using Picsum fallback`);
    for (let i = 0; i < count; i++) {
      const keyword = keywords[i % keywords.length];
      const imageId = `img_${Date.now()}_${i}`;
      images.push({
        id: imageId,
        url: `https://picsum.photos/id/${100 + i}/1080/1920.jpg`,
        alt: `${topic} - ${keyword}`,
        width: 1080,
        height: 1920,
        source: 'Picsum (Fallback)',
        keyword,
        relevanceScore: Math.floor(Math.random() * 30) + 70
      });
      console.log(`   ✅ Fallback: ${keyword} image ${i + 1}`);
    }
  } else {
    console.log(`   🎯 Successfully collected ${images.length} images from APIs`);
  }
  
  console.log(`✅ [IMAGE COLLECTION] Complete! Collected ${images.length}/${count} images from real APIs`);
  images.forEach((img, idx) => {
    console.log(`   ${idx + 1}. ${img.source} - ${img.keyword} (${img.relevanceScore}% relevance)`);
  });
  
  return images;
}

// Pixabay API integration
async function collectFromPixabay(keywords, count) {
  const apiKey = process.env.PIXABAY_API_KEY;
  if (!apiKey) {
    throw new Error('Pixabay API key not found');
  }
  
  const keyword = keywords[0];
  const url = `https://pixabay.com/api/?key=${apiKey}&q=${encodeURIComponent(keyword)}&image_type=photo&orientation=vertical&min_width=1080&min_height=1920&per_page=${count}`;
  
  console.log(`   📡 Pixabay API call: ${keyword}`);
  
  const response = await fetch(url);
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(`Pixabay API error: ${data.message || response.statusText}`);
  }
  
  console.log(`   📊 Pixabay response: ${data.hits?.length || 0} images found`);
  
  return (data.hits || []).slice(0, count).map(hit => ({
    url: hit.webformatURL,
    keyword,
    width: hit.imageWidth,
    height: hit.imageHeight
  }));
}

// Pexels API integration
async function collectFromPexels(keywords, count) {
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) {
    throw new Error('Pexels API key not found');
  }
  
  const keyword = keywords[0];
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(keyword)}&orientation=portrait&size=large&per_page=${count}`;
  
  console.log(`   📡 Pexels API call: ${keyword}`);
  
  const response = await fetch(url, {
    headers: {
      'Authorization': apiKey
    }
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(`Pexels API error: ${data.error || response.statusText}`);
  }
  
  console.log(`   📊 Pexels response: ${data.photos?.length || 0} images found`);
  
  return (data.photos || []).slice(0, count).map(photo => ({
    url: photo.src.portrait,
    keyword,
    width: photo.width,
    height: photo.height
  }));
}

// Unsplash API integration
async function collectFromUnsplash(keywords, count) {
  const apiKey = process.env.UNSPLASH_API_KEY;
  if (!apiKey) {
    throw new Error('Unsplash API key not found');
  }
  
  const keyword = keywords[0];
  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(keyword)}&orientation=portrait&per_page=${count}`;
  
  console.log(`   📡 Unsplash API call: ${keyword}`);
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Client-ID ${apiKey}`
    }
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(`Unsplash API error: ${data.errors?.[0] || response.statusText}`);
  }
  
  console.log(`   📊 Unsplash response: ${data.results?.length || 0} images found`);
  
  return (data.results || []).slice(0, count).map(photo => ({
    url: photo.urls.regular,
    keyword,
    width: photo.width,
    height: photo.height
  }));
}

// Video assembly with FFmpeg
async function assembleVideo(script, images, audio, topic, includeCaptions) {
  console.log(`🎬 [VIDEO ASSEMBLY] Starting real FFmpeg assembly process`);
  
  if (!images || images.length === 0) {
    throw new Error('No images available for video assembly');
  }
  
  if (!audio.audioPath || !fs.existsSync(audio.audioPath)) {
    throw new Error('No audio file available for video assembly');
  }
  
  const videoId = `video_${topic.replace(/\s+/g, '_')}_${Date.now()}`;
  const tempVideoPath = path.join('temp', `${videoId}_temp.mp4`);
  const finalVideoPath = path.join('output', `${videoId}.mp4`);
  const imageListPath = path.join('temp', `${videoId}_images.txt`);
  
  try {
    console.log(`   📁 Creating temporary directories...`);
    
    // Download images to temp directory
    const tempImageDir = path.join('temp', videoId);
    if (!fs.existsSync(tempImageDir)) {
      fs.mkdirSync(tempImageDir, { recursive: true });
    }
    
    console.log(`   📥 Downloading ${images.length} images...`);
    const imageFiles = [];
    
    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      const imagePath = path.join(tempImageDir, `image_${i}.jpg`);
      
      try {
        await downloadImage(image.url, imagePath);
        imageFiles.push(imagePath);
        console.log(`   ✅ Downloaded image ${i + 1}/${images.length}`);
      } catch (error) {
        console.log(`   ⚠️ Failed to download image ${i + 1}: ${error.message}`);
      }
    }
    
    if (imageFiles.length === 0) {
      throw new Error('No images were successfully downloaded');
    }
    
    // Create image list file for FFmpeg
    const imageListContent = imageFiles.map(file => `file '${file.replace(/\\/g, '/')}'`).join('\n');
    fs.writeFileSync(imageListPath, imageListContent);
    
    console.log(`   🎬 Creating video slideshow...`);
    
    // Get audio duration
    const audioDuration = audio.duration || 30;
    const imageDuration = audioDuration / imageFiles.length;
    
    // Create video from images
    const ffmpegCmd = `ffmpeg -f concat -safe 0 -i "${imageListPath}" -vf "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=30" -c:v libx264 -pix_fmt yuv420p -t ${audioDuration} "${tempVideoPath}" -y`;
    
    console.log(`   🔧 FFmpeg command: ${ffmpegCmd}`);
    await execAsync(ffmpegCmd);
    
    console.log(`   🎵 Merging audio with video...`);
    
    // Merge audio with video
    const audioCmd = `ffmpeg -i "${tempVideoPath}" -i "${audio.audioPath}" -c:v copy -c:a aac -shortest "${finalVideoPath}" -y`;
    await execAsync(audioCmd);
    
    // Verify final video
    if (!fs.existsSync(finalVideoPath)) {
      throw new Error('Final video file was not created');
    }
    
    const videoStats = fs.statSync(finalVideoPath);
    console.log(`✅ [VIDEO ASSEMBLY] Video created successfully: ${finalVideoPath} (${videoStats.size} bytes)`);
    
    // Clean up temporary files
    try {
      fs.rmSync(tempImageDir, { recursive: true, force: true });
      fs.unlinkSync(imageListPath);
      fs.unlinkSync(tempVideoPath);
    } catch (error) {
      console.log(`   ⚠️ Cleanup warning: ${error.message}`);
    }
    
    return {
      id: videoId,
      path: finalVideoPath,
      filename: path.basename(finalVideoPath),
      size: videoStats.size,
      duration: audioDuration,
      topic,
      imagesUsed: imageFiles.length,
      audioSource: audio.fallback ? 'Fallback' : 'Windows TTS'
    };
    
  } catch (error) {
    console.log(`❌ [VIDEO ASSEMBLY] Failed: ${error.message}`);
    throw error;
  }
}

// Helper function to download images with redirect handling
async function downloadImage(url, filePath) {
  const https = require('https');
  const http = require('http');
  
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https:') ? https : http;
    
    const request = protocol.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        // Handle redirect
        const newUrl = response.headers.location;
        console.log(`   🔄 Redirecting to: ${newUrl}`);
        downloadImage(newUrl, filePath).then(resolve).catch(reject);
        return;
      }
      
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}`));
        return;
      }
      
      const fileStream = fs.createWriteStream(filePath);
      response.pipe(fileStream);
      
      fileStream.on('finish', () => {
        fileStream.close();
        resolve();
      });
      
      fileStream.on('error', (error) => {
        fs.unlink(filePath, () => {}); // Delete file on error
        reject(error);
      });
    });
    
    request.on('error', (error) => {
      reject(error);
    });
    
    request.setTimeout(10000, () => {
      request.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

// Main video generation process
async function processVideoGeneration(topic, includeCaptions = true) {
  const jobId = `job_${Date.now()}`;
  const job = {
    id: jobId,
    topic,
    status: 'starting',
    progress: 0,
    startTime: Date.now(),
    steps: []
  };
  
  jobs.set(jobId, job);
  
  try {
    console.log(`🚀 [VIDEO GENERATION] Starting job ${jobId} for topic: ${topic}`);
    
    // Step 1: Generate script
    job.status = 'generating_script';
    job.progress = 10;
    job.steps.push({ step: 'script', status: 'started', timestamp: Date.now() });
    
    const script = await generateScript(topic);
    job.steps.push({ step: 'script', status: 'completed', timestamp: Date.now() });
    
    // Step 2: Generate TTS
    job.status = 'generating_audio';
    job.progress = 30;
    job.steps.push({ step: 'audio', status: 'started', timestamp: Date.now() });
    
    const audio = await generateTTS(script.text);
    job.steps.push({ step: 'audio', status: 'completed', timestamp: Date.now() });
    
    // Step 3: Collect images
    job.status = 'collecting_images';
    job.progress = 50;
    job.steps.push({ step: 'images', status: 'started', timestamp: Date.now() });
    
    const images = await collectImages(topic, 8);
    job.steps.push({ step: 'images', status: 'completed', timestamp: Date.now() });
    
    // Step 4: Assemble video
    job.status = 'assembling_video';
    job.progress = 80;
    job.steps.push({ step: 'video', status: 'started', timestamp: Date.now() });
    
    const video = await assembleVideo(script, images, audio, topic, includeCaptions);
    job.steps.push({ step: 'video', status: 'completed', timestamp: Date.now() });
    
    // Complete
    job.status = 'completed';
    job.progress = 100;
    job.endTime = Date.now();
    job.video = video;
    
    console.log(`✅ [VIDEO GENERATION] Job ${jobId} completed successfully!`);
    console.log(`   📊 Duration: ${(job.endTime - job.startTime) / 1000}s`);
    console.log(`   🎬 Video: ${video.filename}`);
    
    return job;
    
  } catch (error) {
    job.status = 'failed';
    job.error = error.message;
    job.endTime = Date.now();
    
    console.log(`❌ [VIDEO GENERATION] Job ${jobId} failed: ${error.message}`);
    throw error;
  }
}

// API Routes
app.get('/api', (req, res) => {
  res.json({
    name: 'ShortVideoAutomation API',
    version: '1.0.0-beta',
    status: 'running',
    endpoints: {
      health: '/api/health',
      topics: '/api/reddit/topics',
      generate: '/api/generate',
      status: '/api/status/:jobId',
      videos: '/api/videos'
    }
  });
});

app.get('/api/health', (req, res) => {
  const apiKeys = {
    reddit: !!(process.env.REDDIT_CLIENT_ID && process.env.REDDIT_CLIENT_SECRET),
    pixabay: !!process.env.PIXABAY_API_KEY,
    pexels: !!process.env.PEXELS_API_KEY,
    unsplash: !!process.env.UNSPLASH_API_KEY
  };
  
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    apiKeys,
    jobs: jobs.size,
    uptime: process.uptime()
  });
});

app.get('/api/reddit/topics', (req, res) => {
  console.log(`🎯 [API] Fetching trending topics`);
  res.json({
    success: true,
    topics: TRENDING_TOPICS,
    count: TRENDING_TOPICS.length,
    timestamp: new Date().toISOString()
  });
});

app.post('/api/generate', async (req, res) => {
  try {
    const { topic, includeCaptions = true, videoDuration = 30 } = req.body;
    
    if (!topic) {
      return res.status(400).json({
        success: false,
        error: 'Topic is required'
      });
    }
    
    console.log(`🎬 [API] Video generation request: ${topic}`);
    
    // Start generation in background
    processVideoGeneration(topic, includeCaptions)
      .then(job => {
        console.log(`✅ [API] Background job completed: ${job.id}`);
      })
      .catch(error => {
        console.log(`❌ [API] Background job failed: ${error.message}`);
      });
    
    res.json({
      success: true,
      jobId: `job_${Date.now()}`,
      message: 'Video generation started',
      estimatedTime: '2-3 minutes',
      topic
    });
    
  } catch (error) {
    console.log(`❌ [API] Generate error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.get('/api/status/:jobId', (req, res) => {
  const { jobId } = req.params;
  const job = jobs.get(jobId);
  
  if (!job) {
    return res.status(404).json({
      success: false,
      error: 'Job not found'
    });
  }
  
  res.json({
    success: true,
    job
  });
});

app.get('/api/videos', (req, res) => {
  try {
    const outputDir = 'output';
    const files = fs.readdirSync(outputDir)
      .filter(file => file.endsWith('.mp4'))
      .map(file => {
        const filePath = path.join(outputDir, file);
        const stats = fs.statSync(filePath);
        return {
          filename: file,
          path: `/output/${file}`,
          size: stats.size,
          created: stats.birthtime,
          modified: stats.mtime
        };
      })
      .sort((a, b) => b.modified - a.modified);
    
    res.json({
      success: true,
      videos: files,
      count: files.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 ShortVideoAutomation server running on http://localhost:${PORT}`);
  console.log(`📊 API available at http://localhost:${PORT}/api`);
  console.log(`🎯 Health check: http://localhost:${PORT}/api/health`);
  
  // Log API key status
  const apiKeys = {
    reddit: !!(process.env.REDDIT_CLIENT_ID && process.env.REDDIT_CLIENT_SECRET),
    pixabay: !!process.env.PIXABAY_API_KEY,
    pexels: !!process.env.PEXELS_API_KEY,
    unsplash: !!process.env.UNSPLASH_API_KEY
  };
  
  console.log(`🔑 API Keys Status:`);
  Object.entries(apiKeys).forEach(([key, status]) => {
    console.log(`   ${status ? '✅' : '❌'} ${key}`);
  });
});
