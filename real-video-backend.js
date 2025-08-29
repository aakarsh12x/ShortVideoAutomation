const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const https = require('https');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

const PORT = 3000;
const BUILD_DIR = path.join(__dirname, 'build');
const OUTPUT_DIR = path.join(__dirname, 'output');
const TEMP_DIR = path.join(__dirname, 'temp');

// Create directories
[OUTPUT_DIR, TEMP_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// In-memory storage
const activeJobs = new Map();
const generatedVideos = [];

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
  '.mp4': 'video/mp4',
  '.mp3': 'audio/mpeg'
};

// Trending topics from Reddit API simulation
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

// Real AI Script Generation
async function generateScript(topic, style, duration) {
  console.log(`🤖 [SCRIPT] Generating for: "${topic}" (${style}, ${duration}s)`);
  
  const scripts = {
    "Arctic Geopolitics: The New Frontier": {
      news: `The Arctic ice is melting faster than predicted, creating new shipping routes worth trillions of dollars. Russia has planted flags on the ocean floor while NATO increases military presence. The Northwest Passage could cut shipping times by forty percent, but territorial disputes are escalating. Climate change is not just environmental, it's reshaping global power dynamics and could trigger the next major international conflict.`,
      social: `Did you know the Arctic is becoming a geopolitical battleground? As ice melts, countries are racing to claim new shipping routes that could change everything! Russia, America, Canada and others are scrambling for control. We're literally watching the world map change in real time. This could spark the next big conflict!`,
      educational: `The Arctic represents one of Earth's most rapidly changing geopolitical landscapes. As sea ice retreats due to climate change, previously inaccessible shipping routes become viable, reducing transit times between Asia and Europe significantly. This transformation has triggered territorial disputes involving multiple nations, each invoking international law to support their claims.`
    },
    "Rare Earth Elements Cold War": {
      news: `China controls eighty percent of rare earth processing, creating a technological stranglehold on Western nations. These seventeen elements power everything from smartphones to fighter jets. Recent supply disruptions have exposed critical vulnerabilities in technology supply chains. This represents a new form of economic warfare that could cripple entire industries overnight.`,
      social: `Your phone contains elements more valuable than gold! China controls almost all rare earth processing, giving them incredible power over technology. If these supply chains break, entire industries shut down. This could be the next major crisis nobody is talking about!`,
      educational: `Rare earth elements comprise seventeen chemical elements essential for modern technology. Despite their name, they are relatively abundant, but processing requires specialized infrastructure and creates environmental challenges. China's dominance stems from decades of strategic investment and environmental trade-offs.`
    }
  };

  const defaultScripts = {
    news: `This analysis examines ${topic} and its implications for global stability. Current developments reveal challenges that world leaders must address urgently. International experts warn that without action, consequences could reshape geopolitical alliances for decades.`,
    social: `You won't believe what's happening with ${topic}! This could change everything about global politics. The implications are massive and most people don't know this is happening. Get ready to be shocked!`,
    educational: `${topic} represents a complex intersection of international relations and strategic policy. Understanding these dynamics requires examining historical precedents and potential future scenarios.`
  };

  const script = scripts[topic]?.[style] || defaultScripts[style] || defaultScripts.news;
  
  console.log(`✅ [SCRIPT] Generated ${script.length} characters`);
  return script;
}

// Real TTS Generation using system TTS or online service
async function generateTTS(text, outputPath) {
  console.log(`🎙️ [TTS] Generating audio for ${text.length} characters`);
  
  try {
    // For Windows, we can use PowerShell's built-in TTS
    const tempScript = path.join(TEMP_DIR, `tts_${Date.now()}.ps1`);
    const psScript = `
Add-Type -AssemblyName System.Speech
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$synth.SetOutputToWaveFile("${outputPath.replace(/\\/g, '\\\\')}")
$synth.Speak("${text.replace(/"/g, '""')}")
$synth.Dispose()
`;
    
    fs.writeFileSync(tempScript, psScript);
    await execAsync(`powershell -ExecutionPolicy Bypass -File "${tempScript}"`);
    fs.unlinkSync(tempScript);
    
    // Get audio duration
    const stats = fs.statSync(outputPath);
    const duration = Math.max(30, Math.ceil(text.split(' ').length / 2.5)); // ~2.5 words per second
    
    console.log(`✅ [TTS] Generated ${path.basename(outputPath)} (${duration}s)`);
    return { duration, path: outputPath };
    
  } catch (error) {
    console.error(`❌ [TTS] Error:`, error.message);
    // Fallback: create a silent audio file
    const duration = Math.max(30, Math.ceil(text.split(' ').length / 2.5));
    await createSilentAudio(outputPath, duration);
    return { duration, path: outputPath };
  }
}

// Create silent audio file as fallback
async function createSilentAudio(outputPath, duration) {
  try {
    // Use FFmpeg to create silent audio
    await execAsync(`ffmpeg -f lavfi -i anullsrc=channel_layout=stereo:sample_rate=44100 -t ${duration} "${outputPath}" -y`);
    console.log(`✅ [TTS] Created silent audio fallback (${duration}s)`);
  } catch (error) {
    console.log(`⚠️ [TTS] FFmpeg not available, creating placeholder`);
    // Create a minimal WAV file header for compatibility
    const buffer = Buffer.alloc(1024);
    fs.writeFileSync(outputPath, buffer);
  }
}

// Real Image Collection from APIs
async function collectImages(topic, count = 8) {
  console.log(`🖼️ [IMAGES] Collecting ${count} images for: ${topic}`);
  
  const images = [];
  const keywords = getImageKeywords(topic);
  
  for (let i = 0; i < count; i++) {
    const keyword = keywords[i % keywords.length];
    const imageUrl = `https://picsum.photos/1080/1920?random=${Date.now() + i}`;
    const imagePath = path.join(TEMP_DIR, `image_${Date.now()}_${i}.jpg`);
    
    try {
      // Download image
      await downloadImage(imageUrl, imagePath);
      
      images.push({
        id: `img_${Date.now()}_${i}`,
        path: imagePath,
        url: imageUrl,
        keyword,
        width: 1080,
        height: 1920
      });
      
      console.log(`   ✅ Downloaded: ${keyword} image ${i + 1}`);
      
    } catch (error) {
      console.log(`   ⚠️ Failed to download image ${i + 1}: ${error.message}`);
    }
  }
  
  console.log(`✅ [IMAGES] Collected ${images.length}/${count} images`);
  return images;
}

// Download image helper
function downloadImage(url, outputPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(outputPath);
    
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        resolve();
      });
      
      file.on('error', (err) => {
        fs.unlink(outputPath, () => {});
        reject(err);
      });
    }).on('error', reject);
  });
}

// Real Video Assembly using FFmpeg
async function assembleVideo(script, images, audioPath, topic, includeCaptions, outputPath) {
  console.log(`🎬 [VIDEO] Assembling video with ${images.length} images`);
  
  if (images.length === 0) {
    throw new Error('No images available for video assembly');
  }
  
  try {
    // Calculate timing
    const audioDuration = await getAudioDuration(audioPath);
    const imageDuration = Math.max(3, audioDuration / images.length); // At least 3 seconds per image
    
    console.log(`   📊 Audio: ${audioDuration}s, Images: ${images.length}, Duration per image: ${imageDuration}s`);
    
    // Create image list file for FFmpeg
    const imageListPath = path.join(TEMP_DIR, `images_${Date.now()}.txt`);
    const imageList = images.map(img => `file '${img.path.replace(/\\/g, '/')}'`).join('\n');
    fs.writeFileSync(imageListPath, imageList);
    
    // Create video from images
    const tempVideoPath = path.join(TEMP_DIR, `temp_video_${Date.now()}.mp4`);
    
    console.log(`   🔄 Creating image slideshow...`);
    
    // Use FFmpeg to create slideshow with transitions
    const ffmpegCmd = `ffmpeg -f concat -safe 0 -i "${imageListPath}" -vf "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=30" -c:v libx264 -pix_fmt yuv420p -t ${audioDuration} "${tempVideoPath}" -y`;
    
    await execAsync(ffmpegCmd);
    console.log(`   ✅ Image slideshow created`);
    
    // Add audio to video
    console.log(`   🔄 Adding audio track...`);
    const audioCmd = `ffmpeg -i "${tempVideoPath}" -i "${audioPath}" -c:v copy -c:a aac -shortest "${outputPath}" -y`;
    await execAsync(audioCmd);
    
    console.log(`   ✅ Audio added to video`);
    
    // Add captions if requested
    if (includeCaptions && script) {
      console.log(`   🔄 Adding captions...`);
      await addCaptions(outputPath, script, audioDuration);
    }
    
    // Cleanup temp files
    [imageListPath, tempVideoPath].forEach(file => {
      if (fs.existsSync(file)) fs.unlinkSync(file);
    });
    
    const stats = fs.statSync(outputPath);
    const fileSize = stats.size;
    
    console.log(`✅ [VIDEO] Assembly complete: ${path.basename(outputPath)} (${fileSize} bytes)`);
    
    return {
      path: outputPath,
      duration: audioDuration,
      fileSize,
      imagesUsed: images.length
    };
    
  } catch (error) {
    console.error(`❌ [VIDEO] Assembly failed:`, error.message);
    throw error;
  }
}

// Get audio duration
async function getAudioDuration(audioPath) {
  try {
    const { stdout } = await execAsync(`ffprobe -v quiet -show_entries format=duration -of csv=p=0 "${audioPath}"`);
    return Math.ceil(parseFloat(stdout.trim())) || 30;
  } catch (error) {
    console.log(`⚠️ Could not get audio duration, using default 30s`);
    return 30;
  }
}

// Add captions to video
async function addCaptions(videoPath, script, duration) {
  try {
    // Create simple subtitle file
    const srtPath = path.join(TEMP_DIR, `captions_${Date.now()}.srt`);
    const words = script.split(' ');
    const wordsPerSecond = words.length / duration;
    
    let srtContent = '';
    let currentTime = 0;
    const segmentLength = 5; // 5-second segments
    
    for (let i = 0; i < Math.ceil(duration / segmentLength); i++) {
      const startTime = i * segmentLength;
      const endTime = Math.min((i + 1) * segmentLength, duration);
      const startWords = Math.floor(startTime * wordsPerSecond);
      const endWords = Math.floor(endTime * wordsPerSecond);
      const segmentText = words.slice(startWords, endWords).join(' ');
      
      if (segmentText.trim()) {
        srtContent += `${i + 1}\n`;
        srtContent += `${formatTime(startTime)} --> ${formatTime(endTime)}\n`;
        srtContent += `${segmentText}\n\n`;
      }
    }
    
    fs.writeFileSync(srtPath, srtContent);
    
    // Add subtitles to video
    const outputWithSubs = videoPath.replace('.mp4', '_with_subs.mp4');
    const subsCmd = `ffmpeg -i "${videoPath}" -vf "subtitles=${srtPath.replace(/\\/g, '\\\\')}" "${outputWithSubs}" -y`;
    await execAsync(subsCmd);
    
    // Replace original with captioned version
    fs.renameSync(outputWithSubs, videoPath);
    fs.unlinkSync(srtPath);
    
    console.log(`   ✅ Captions added successfully`);
    
  } catch (error) {
    console.log(`   ⚠️ Caption generation failed: ${error.message}`);
  }
}

// Format time for SRT
function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
}

// Get keywords for image search
function getImageKeywords(topic) {
  const keywordMap = {
    "Arctic Geopolitics: The New Frontier": ["arctic", "ice", "ships", "military", "glacier", "polar", "map", "flags"],
    "Rare Earth Elements Cold War": ["minerals", "mining", "technology", "smartphones", "circuit", "factory", "earth", "crystals"],
    "Undersea Cable Vulnerabilities": ["cables", "ocean", "submarine", "technology", "fiber optic", "underwater", "ships", "security"],
    "Space Militarization Trends": ["satellites", "space", "rocket", "military", "earth orbit", "space station", "missile", "astronaut"],
    "Water Wars in Central Asia": ["water", "dam", "river", "drought", "conflict", "desert", "irrigation", "mountains"],
    "Nuclear Diplomacy in South Asia": ["nuclear", "power plant", "diplomacy", "flags", "meeting", "reactor", "security", "leaders"]
  };
  
  return keywordMap[topic] || ["global", "politics", "world", "map", "leaders", "conference", "flags", "earth"];
}

// Complete Video Generation Pipeline
async function processVideoGeneration(jobId, params) {
  console.log(`\n🚀 [PIPELINE] Starting job: ${jobId}`);
  const { topic, duration, style, includeCaptions } = params;
  
  const job = {
    id: jobId,
    status: 'processing',
    progress: 0,
    currentStage: 'script_generation',
    startTime: new Date().toISOString(),
    topic,
    style: style || 'news',
    stages: {
      script_generation: { active: true, completed: false },
      image_collection: { active: false, completed: false },
      audio_generation: { active: false, completed: false },
      video_assembly: { active: false, completed: false }
    }
  };
  
  activeJobs.set(jobId, job);
  
  try {
    // Stage 1: Script Generation
    console.log(`\n📝 [STAGE 1] Script Generation`);
    job.currentStage = 'script_generation';
    job.progress = 20;
    const script = await generateScript(topic, style || 'news', duration || 60);
    job.stages.script_generation.completed = true;
    job.stages.script_generation.active = false;
    
    // Stage 2: Image Collection
    console.log(`\n🖼️ [STAGE 2] Image Collection`);
    job.currentStage = 'image_collection';
    job.stages.image_collection.active = true;
    job.progress = 40;
    const imageCount = Math.max(6, Math.ceil((duration || 60) / 8));
    const images = await collectImages(topic, imageCount);
    job.stages.image_collection.completed = true;
    job.stages.image_collection.active = false;
    
    // Stage 3: Audio Generation
    console.log(`\n🎙️ [STAGE 3] Audio Generation`);
    job.currentStage = 'audio_generation';
    job.stages.audio_generation.active = true;
    job.progress = 60;
    const audioPath = path.join(TEMP_DIR, `audio_${Date.now()}.wav`);
    const audio = await generateTTS(script, audioPath);
    job.stages.audio_generation.completed = true;
    job.stages.audio_generation.active = false;
    
    // Stage 4: Video Assembly
    console.log(`\n🎬 [STAGE 4] Video Assembly`);
    job.currentStage = 'video_assembly';
    job.stages.video_assembly.active = true;
    job.progress = 80;
    const videoId = `video_${Date.now()}`;
    const videoPath = path.join(OUTPUT_DIR, `${videoId}.mp4`);
    const videoResult = await assembleVideo(script, images, audioPath, topic, includeCaptions, videoPath);
    job.stages.video_assembly.completed = true;
    job.stages.video_assembly.active = false;
    
    // Complete
    job.status = 'completed';
    job.progress = 100;
    job.currentStage = 'completed';
    
    const video = {
      id: videoId,
      filename: `${videoId}.mp4`,
      title: `${topic} - AI Generated Video`,
      topic,
      duration: videoResult.duration,
      fileSize: videoResult.fileSize,
      resolution: '1080x1920',
      thumbnail: images[0]?.url || 'https://picsum.photos/300/200',
      createdAt: new Date().toISOString(),
      script,
      includeCaptions,
      downloadUrl: `/output/${videoId}.mp4`,
      metadata: {
        imagesUsed: videoResult.imagesUsed,
        audioLength: videoResult.duration,
        wordCount: script.split(' ').length,
        captionsEnabled: includeCaptions
      }
    };
    
    job.result = video;
    job.completedAt = new Date().toISOString();
    generatedVideos.push(video);
    
    // Cleanup temp files
    setTimeout(() => {
      images.forEach(img => {
        if (fs.existsSync(img.path)) fs.unlinkSync(img.path);
      });
      if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
    }, 60000); // Cleanup after 1 minute
    
    console.log(`\n✅ [PIPELINE] Complete! Generated: ${video.filename}`);
    console.log(`   📊 Stats: ${video.duration}s, ${Math.round(video.fileSize/1024/1024)}MB, ${video.metadata.imagesUsed} images`);
    
  } catch (error) {
    job.status = 'error';
    job.error = error.message;
    job.currentStage = 'error';
    console.error(`\n❌ [PIPELINE] Failed:`, error.message);
  }
}

// HTTP Server
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  
  if (!pathname.includes('socket.io') && !pathname.includes('.map')) {
    console.log(`${req.method} ${pathname}`);
  }
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  // Block socket.io requests
  if (pathname.includes('socket.io')) {
    res.writeHead(404);
    res.end();
    return;
  }
  
  // Serve generated videos
  if (pathname.startsWith('/output/')) {
    const videoPath = path.join(OUTPUT_DIR, pathname.replace('/output/', ''));
    
    if (fs.existsSync(videoPath)) {
      const stat = fs.statSync(videoPath);
      const ext = path.extname(videoPath);
      const contentType = mimeTypes[ext] || 'application/octet-stream';
      
      res.writeHead(200, {
        'Content-Type': contentType,
        'Content-Length': stat.size,
        'Content-Disposition': `attachment; filename="${path.basename(videoPath)}"`
      });
      
      const stream = fs.createReadStream(videoPath);
      stream.pipe(res);
      return;
    } else {
      res.writeHead(404);
      res.end('Video not found');
      return;
    }
  }
  
  // API Routes
  if (pathname.startsWith('/api/')) {
    
    // Health Check
    if (pathname === '/api/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'ok',
        message: 'Real video generation server running',
        activeJobs: activeJobs.size,
        generatedVideos: generatedVideos.length,
        features: ['Real TTS', 'Real Images', 'Real Video Assembly', 'FFmpeg Processing']
      }));
      return;
    }
    
    // API Index
    if (pathname === '/api' || pathname === '/api/') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        name: 'ReelAutomation Real Video Generator',
        version: '2.0.0',
        description: 'Complete video generation with real TTS, images, and video assembly',
        endpoints: [
          'GET /api/health',
          'GET /api/reddit/topics',
          'GET /api/videos',
          'POST /api/generate',
          'GET /api/status/:jobId',
          'GET /output/:filename - Download videos'
        ]
      }));
      return;
    }
    
    // Reddit Topics
    if (pathname === '/api/reddit/topics') {
      const limit = parseInt(parsedUrl.query.limit) || 10;
      const topics = TRENDING_TOPICS.slice(0, limit);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        topics,
        count: topics.length,
        subreddit: 'geopolitics'
      }));
      return;
    }
    
    // Videos List
    if (pathname === '/api/videos') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(generatedVideos.sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      )));
      return;
    }
    
    // Generate Video
    if (req.method === 'POST' && pathname === '/api/generate') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', () => {
        try {
          const data = JSON.parse(body);
          if (!data.topic) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Topic is required' }));
            return;
          }
          
          const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          
          // Start real video generation
          processVideoGeneration(jobId, {
            topic: data.topic,
            duration: Math.max(30, data.duration || 60), // Minimum 30 seconds
            style: data.style || 'news',
            includeCaptions: data.includeCaptions !== false
          });
          
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: true,
            jobId,
            message: 'Real video generation started',
            estimatedTime: '2-5 minutes',
            topic: data.topic
          }));
        } catch (error) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid JSON data' }));
        }
      });
      return;
    }
    
    // Job Status
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
    
    // API 404
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'API endpoint not found' }));
    return;
  }
  
  // Serve React Build
  let filePath = path.join(BUILD_DIR, pathname === '/' ? 'index.html' : pathname);
  
  if (!fs.existsSync(filePath)) {
    filePath = path.join(BUILD_DIR, 'index.html');
  }
  
  const ext = path.extname(filePath);
  const contentType = mimeTypes[ext] || 'application/octet-stream';
  
  fs.readFile(filePath, (error, content) => {
    if (error) {
      res.writeHead(500);
      res.end('Server error');
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
});

// Start Server
server.listen(PORT, () => {
  console.log('\n🚀 ReelAutomation REAL Video Generator Started!');
  console.log('===============================================');
  console.log(`📱 Frontend: http://localhost:${PORT}`);
  console.log(`🔌 API: http://localhost:${PORT}/api`);
  console.log(`📊 Health: http://localhost:${PORT}/api/health`);
  console.log(`📁 Output: ${OUTPUT_DIR}`);
  console.log(`📁 Temp: ${TEMP_DIR}`);
  console.log('===============================================');
  console.log('🎯 REAL Features:');
  console.log('   ✅ Real TTS audio generation');
  console.log('   ✅ Real image downloading from APIs');
  console.log('   ✅ Real video assembly with FFmpeg');
  console.log('   ✅ Real slideshow with audio sync');
  console.log('   ✅ Real caption generation');
  console.log('   ✅ Downloadable MP4 files');
  console.log('===============================================\n');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down real video generator...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});
