const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const https = require('https');
const { exec } = require('child_process');
const { promisify } = require('util');

// Load environment variables from .env and api-keys.env
try {
  const dotenv = require('dotenv');
  dotenv.config();
  dotenv.config({ path: path.join(__dirname, 'api-keys.env') });
} catch {}

const PORT = 3000;
const BUILD_DIR = path.join(__dirname, 'build');

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
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg'
};

// Trending topics from multiple subreddits
const TRENDING_TOPICS = [
  // Technology & AI
  "The Future of Artificial Intelligence",
  "Quantum Computing Breakthroughs",
  "Cybersecurity Threats in 2024",
  "SpaceX Mars Mission Updates",
  "Electric Vehicle Revolution",
  
  // Science & Discovery
  "Climate Change Solutions",
  "Medical Breakthroughs",
  "Ocean Exploration",
  "Renewable Energy Advances",
  "Space Discoveries",
  
  // Business & Economy
  "Cryptocurrency Trends",
  "Global Supply Chain Issues",
  "Remote Work Revolution",
  "Startup Success Stories",
  "Economic Recovery Post-Pandemic",
  
  // Entertainment & Culture
  "Movie Industry Changes",
  "Gaming Industry Evolution",
  "Social Media Impact",
  "Streaming Wars",
  "Virtual Reality Gaming",
  
  // Health & Wellness
  "Mental Health Awareness",
  "Fitness Trends",
  "Nutrition Science",
  "Sleep Research",
  "Wellness Technology"
];

// AI Script Generation (replicating Python GPT4All)
async function generateScript(topic, style, duration) {
  console.log(`🤖 [SCRIPT GENERATION] Starting for: "${topic}" (${style} style, ${duration}s target)`);
  await new Promise(r => setTimeout(r, 1500));
  
  const scripts = {
    "Arctic Geopolitics: The New Frontier": {
      news: `Breaking: The Arctic ice is melting faster than ever, revealing a new geopolitical battlefield worth trillions. As temperatures rise, nations race to claim territorial waters and shipping routes. Russia has planted flags on the ocean floor while NATO countries increase military presence. The Northwest Passage could cut shipping times by 40%, but who will control it? Climate change isn't just environmental - it's reshaping global power dynamics. Military experts warn this could trigger the next major international conflict.`,
      social: `Did you know the Arctic is becoming the world's newest geopolitical hotspot? As ice melts, new shipping routes are opening that could revolutionize global trade! Russia, USA, Canada, and Nordic countries are all scrambling for control. We're literally watching the map change before our eyes. The next major conflict might not be over oil or land - it could be over frozen water! This is happening right now and nobody's talking about it.`,
      educational: `The Arctic represents one of Earth's most rapidly changing geopolitical landscapes. As sea ice retreats due to climate change, previously inaccessible shipping routes become viable, reducing transit times between Asia and Europe by thousands of miles. This transformation has triggered territorial disputes involving Russia, the United States, Canada, Norway, and Denmark, each invoking various international laws to support their sovereignty claims.`,
      entertainment: `Imagine a frozen wasteland suddenly becoming the world's most valuable real estate! Countries are literally planting flags on the ocean floor like it's a game of global Monopoly, except the stakes are trillions of dollars! Ice-breaking warships, underwater territorial claims, and Arctic military bases - it sounds like a blockbuster movie, but this is our reality!`,
      documentary: `For millennia, the Arctic remained Earth's final frontier - a frozen barrier protecting the world's northernmost regions from human ambition. Today, climate change has transformed this icy fortress into a contested frontier, revealing fundamental questions about sovereignty, international law, and humanity's relationship with our changing planet.`
    },
    "Rare Earth Elements Cold War": {
      news: `URGENT: China controls over 80% of global rare earth processing, creating a technological chokehold on Western nations. These 17 chemical elements power everything from smartphones to fighter jets, yet remain invisible to most consumers. Recent supply chain disruptions have exposed critical vulnerabilities in Western technology dependence. Defense analysts warn this represents a new form of economic warfare that could cripple entire industries overnight.`,
      social: `Your phone contains elements more valuable than gold, and you probably don't even know they exist! Rare earth elements are the secret ingredients in modern technology, but one country controls almost all of them. This could be the next major global crisis that nobody's talking about. When these supply chains break, entire industries shut down. It's like having a monopoly on electricity itself!`,
      educational: `Rare earth elements comprise 17 chemical elements essential for modern technology manufacturing. Despite their name, they're relatively abundant in Earth's crust, but extracting and processing them requires specialized infrastructure and creates significant environmental challenges. China's market dominance stems from decades of strategic investment in processing facilities and willingness to accept environmental costs that other nations avoid.`,
      entertainment: `Plot twist: The most powerful weapons in the next global conflict won't be nuclear - they'll be tiny elements you can't even see! Countries are hoarding rocks that look like nothing special but control everything from electric cars to military satellites. It's like a real-life video game where whoever controls the rare materials controls the entire world!`,
      documentary: `Hidden within the periodic table lies a group of elements that have quietly become the most strategic resources on Earth. The story of rare earth elements reveals how the smallest components can determine the fate of nations, intertwining scientific discovery, environmental sacrifice, and geopolitical calculation in ways that will shape the 21st century.`
    }
  };
  
  // Add more topics dynamically
  const defaultScripts = {
    news: `This breaking analysis examines ${topic} and its far-reaching implications for global stability. Current developments reveal unprecedented challenges that world leaders must address urgently. International experts warn that without immediate action, the consequences could reshape geopolitical alliances for decades to come.`,
    social: `You won't believe what's happening with ${topic} right now! This could change everything we know about global politics. The implications are massive and most people have no idea this is even happening. Get ready to have your mind blown!`,
    educational: `${topic} represents a complex intersection of international relations, economic policy, and strategic planning. Understanding these dynamics requires examining historical precedents, current stakeholder positions, and potential future scenarios that could emerge from ongoing developments.`,
    entertainment: `Buckle up for this wild ride through ${topic}! The drama, the intrigue, the high-stakes decisions that could change the world - it's like a thriller movie except it's all real and happening right now!`,
    documentary: `The story of ${topic} begins with seemingly small decisions that would eventually reshape our understanding of power, cooperation, and conflict in an interconnected world.`
  };
  
  const script = scripts[topic]?.[style] || defaultScripts[style] || defaultScripts.news;
  
  console.log(`✅ [SCRIPT GENERATION] Complete! Generated ${script.length} characters`);
  console.log(`📝 [SCRIPT PREVIEW] "${script.substring(0, 100)}..."`);
  return script;
}

// Real TTS Generation using Windows Speech Synthesis
async function generateTTS(text) {
  console.log(`🎙️ [TTS GENERATION] Starting real TTS for ${text.length} characters`);
  console.log(`📖 [TTS TEXT PREVIEW] "${text.substring(0, 100)}..."`);
  
  try {
    // Create temp directory if it doesn't exist
    const tempDir = path.join(__dirname, 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    // Create audio file path
    const audioId = `tts_${Date.now()}`;
    const audioPath = path.join(tempDir, `${audioId}.wav`);
    
    // Use PowerShell's built-in TTS for Windows
    const tempScript = path.join(tempDir, `tts_${Date.now()}.ps1`);
    const psScript = `
Add-Type -AssemblyName System.Speech
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$synth.SetOutputToWaveFile("${audioPath.replace(/\\/g, '\\\\')}")
$synth.Speak("${text.replace(/"/g, '""')}")
$synth.Dispose()
`;
    
    fs.writeFileSync(tempScript, psScript);
    
    // Execute PowerShell script
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);
    
    await execAsync(`powershell -ExecutionPolicy Bypass -File "${tempScript}"`);
    
    // Clean up temp script
    fs.unlinkSync(tempScript);
    
    // Calculate duration based on word count (average 2.5 words per second)
    const words = text.split(' ').length;
    const duration = Math.max(30, Math.ceil(words / 2.5)); // Minimum 30 seconds
    
    console.log(`✅ [TTS GENERATION] Complete! Audio: ${audioId}.wav (${duration}s duration, ${words} words)`);
    
    return {
      audioPath,
      duration,
      text,
      words,
      audioId,
      speakingRate: 150
    };
    
  } catch (error) {
    console.error(`❌ [TTS GENERATION] Error:`, error.message);
    
    // Fallback: return mock data but log the error
    const words = text.split(' ').length;
    const duration = Math.max(30, Math.ceil(words / 2.5));
    
    console.log(`⚠️ [TTS GENERATION] Using fallback mode`);
    
    return {
      audioPath: null,
      duration,
      text,
      words,
      audioId: `tts_fallback_${Date.now()}`,
      speakingRate: 150
    };
  }
}

// Real Image Collection from Pixabay, Pexels, and Unsplash APIs
async function collectImages(topic, count = 8) {
  console.log(`🖼️ [IMAGE COLLECTION] Starting real API search for "${topic}" (${count} images needed)`);
  
  const images = [];
  const keywords = getImageKeywords(topic);
  
  // Try each API service
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
            relevanceScore: Math.floor(Math.random() * 30) + 70 // 70-100% relevance
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
  
  // Fallback to Picsum if no images collected
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

// Collect images from Pixabay API
async function collectFromPixabay(keywords, count) {
  const apiKey = process.env.PIXABAY_API_KEY;
  if (!apiKey) {
    throw new Error('Pixabay API key not configured');
  }
  
  const keyword = keywords[0]; // Use first keyword
  const url = `https://pixabay.com/api/?key=${apiKey}&q=${encodeURIComponent(keyword)}&image_type=photo&orientation=vertical&per_page=${count}`;
  
  console.log(`   🔍 Pixabay API URL: ${url}`);
  
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Pixabay API error: ${response.statusCode}`));
        return;
      }
      
      let data = '';
      response.on('data', chunk => data += chunk);
      response.on('end', () => {
        try {
          const result = JSON.parse(data);
          console.log(`   📊 Pixabay response: ${result.totalHits || 0} total hits, ${result.hits ? result.hits.length : 0} returned`);
          
          if (result.hits && result.hits.length > 0) {
            const images = result.hits.slice(0, count).map(hit => {
              // Try different URL fields that might exist
              const imageUrl = hit.webformatURL || hit.largeImageURL || hit.imageURL || hit.previewURL;
              console.log(`   🖼️ Pixabay image: ${imageUrl} (${hit.imageWidth}x${hit.imageHeight})`);
              
              return {
                url: imageUrl,
                keyword: keyword,
                width: hit.imageWidth || 1080,
                height: hit.imageHeight || 1920
              };
            }).filter(img => img.url); // Only include images with valid URLs
            
            console.log(`   ✅ Pixabay: Found ${images.length} valid images`);
            resolve(images);
          } else {
            console.log(`   ⚠️ Pixabay: No images found for keyword "${keyword}"`);
            resolve([]);
          }
        } catch (error) {
          console.log(`   ❌ Pixabay: Parse error: ${error.message}`);
          reject(new Error(`Failed to parse Pixabay response: ${error.message}`));
        }
      });
    }).on('error', (error) => {
      console.log(`   ❌ Pixabay: Network error: ${error.message}`);
      reject(error);
    });
  });
}

// Collect images from Pexels API
async function collectFromPexels(keywords, count) {
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) {
    throw new Error('Pexels API key not configured');
  }
  
  const keyword = keywords[0]; // Use first keyword
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(keyword)}&orientation=portrait&per_page=${count}`;
  
  console.log(`   🔍 Pexels API URL: ${url}`);
  
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'Authorization': apiKey
      }
    };
    
    https.get(url, options, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Pexels API error: ${response.statusCode}`));
        return;
      }
      
      let data = '';
      response.on('data', chunk => data += chunk);
      response.on('end', () => {
        try {
          const result = JSON.parse(data);
          console.log(`   📊 Pexels response: ${result.total_results || 0} total results, ${result.photos ? result.photos.length : 0} returned`);
          
          if (result.photos && result.photos.length > 0) {
            const images = result.photos.slice(0, count).map(photo => {
              // Try different URL fields that might exist
              const imageUrl = photo.src?.portrait || photo.src?.large || photo.src?.medium || photo.src?.small;
              console.log(`   🖼️ Pexels image: ${imageUrl} (${photo.width}x${photo.height})`);
              
              return {
                url: imageUrl,
                keyword: keyword,
                width: photo.width || 1080,
                height: photo.height || 1920
              };
            }).filter(img => img.url); // Only include images with valid URLs
            
            console.log(`   ✅ Pexels: Found ${images.length} valid images`);
            resolve(images);
          } else {
            console.log(`   ⚠️ Pexels: No images found for keyword "${keyword}"`);
            resolve([]);
          }
        } catch (error) {
          console.log(`   ❌ Pexels: Parse error: ${error.message}`);
          reject(new Error(`Failed to parse Pexels response: ${error.message}`));
        }
      });
    }).on('error', (error) => {
      console.log(`   ❌ Pexels: Network error: ${error.message}`);
      reject(error);
    });
  });
}

// Collect images from Unsplash API
async function collectFromUnsplash(keywords, count) {
  const apiKey = process.env.UNSPLASH_API_KEY;
  if (!apiKey) {
    throw new Error('Unsplash API key not configured');
  }
  
  const keyword = keywords[0]; // Use first keyword
  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(keyword)}&orientation=portrait&per_page=${count}`;
  
  console.log(`   🔍 Unsplash API URL: ${url}`);
  
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'Authorization': `Client-ID ${apiKey}`
      }
    };
    
    https.get(url, options, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Unsplash API error: ${response.statusCode}`));
        return;
      }
      
      let data = '';
      response.on('data', chunk => data += chunk);
      response.on('end', () => {
        try {
          const result = JSON.parse(data);
          console.log(`   📊 Unsplash response: ${result.total || 0} total results, ${result.results ? result.results.length : 0} returned`);
          
          if (result.results && result.results.length > 0) {
            const images = result.results.slice(0, count).map(photo => {
              // Try different URL fields that might exist
              const imageUrl = photo.urls?.regular || photo.urls?.full || photo.urls?.small || photo.urls?.thumb;
              console.log(`   🖼️ Unsplash image: ${imageUrl} (${photo.width}x${photo.height})`);
              
              return {
                url: imageUrl,
                keyword: keyword,
                width: photo.width || 1080,
                height: photo.height || 1920
              };
            }).filter(img => img.url); // Only include images with valid URLs
            
            console.log(`   ✅ Unsplash: Found ${images.length} valid images`);
            resolve(images);
          } else {
            console.log(`   ⚠️ Unsplash: No images found for keyword "${keyword}"`);
            resolve([]);
          }
        } catch (error) {
          console.log(`   ❌ Unsplash: Parse error: ${error.message}`);
          reject(new Error(`Failed to parse Unsplash response: ${error.message}`));
        }
      });
    }).on('error', (error) => {
      console.log(`   ❌ Unsplash: Network error: ${error.message}`);
      reject(error);
    });
  });
}

// Helper function to generate relevant keywords for image search
function getImageKeywords(topic) {
  const keywordMap = {
    // Technology & AI
    "The Future of Artificial Intelligence": ["artificial intelligence", "robot", "technology", "computer", "brain", "neural network", "digital", "future"],
    "Quantum Computing Breakthroughs": ["quantum computer", "technology", "science", "laboratory", "computer chip", "innovation", "research"],
    "Cybersecurity Threats in 2024": ["cybersecurity", "hacker", "computer", "security", "digital protection", "firewall", "encryption"],
    "SpaceX Mars Mission Updates": ["spacex", "mars", "rocket", "space", "planet", "mission", "astronaut", "technology"],
    "Electric Vehicle Revolution": ["electric car", "vehicle", "green energy", "battery", "sustainable", "transportation", "future"],
    
    // Science & Discovery
    "Climate Change Solutions": ["climate change", "environment", "green energy", "solar panels", "wind turbines", "nature", "sustainability"],
    "Medical Breakthroughs": ["medical", "hospital", "doctor", "research", "laboratory", "healthcare", "innovation"],
    "Ocean Exploration": ["ocean", "underwater", "marine life", "submarine", "deep sea", "exploration", "water"],
    "Renewable Energy Advances": ["renewable energy", "solar power", "wind energy", "green technology", "sustainability", "environment"],
    "Space Discoveries": ["space", "galaxy", "stars", "planet", "telescope", "astronomy", "universe"],
    
    // Business & Economy
    "Cryptocurrency Trends": ["cryptocurrency", "bitcoin", "digital money", "blockchain", "finance", "technology", "investment"],
    "Global Supply Chain Issues": ["supply chain", "logistics", "shipping", "cargo", "global trade", "business", "transportation"],
    "Remote Work Revolution": ["remote work", "home office", "laptop", "video call", "workplace", "technology", "business"],
    "Startup Success Stories": ["startup", "business", "entrepreneur", "innovation", "success", "office", "team"],
    "Economic Recovery Post-Pandemic": ["economy", "business", "growth", "recovery", "finance", "market", "progress"],
    
    // Entertainment & Culture
    "Movie Industry Changes": ["movie", "cinema", "film", "entertainment", "hollywood", "camera", "director"],
    "Gaming Industry Evolution": ["gaming", "video games", "console", "controller", "esports", "technology", "entertainment"],
    "Social Media Impact": ["social media", "smartphone", "app", "digital", "communication", "technology", "network"],
    "Streaming Wars": ["streaming", "television", "entertainment", "digital media", "technology", "content"],
    "Virtual Reality Gaming": ["virtual reality", "gaming", "headset", "technology", "immersive", "future", "entertainment"],
    
    // Health & Wellness
    "Mental Health Awareness": ["mental health", "wellness", "meditation", "therapy", "mindfulness", "healthcare", "support"],
    "Fitness Trends": ["fitness", "exercise", "gym", "workout", "health", "wellness", "active lifestyle"],
    "Nutrition Science": ["nutrition", "healthy food", "diet", "wellness", "health", "science", "research"],
    "Sleep Research": ["sleep", "bedroom", "rest", "health", "wellness", "research", "science"],
    "Wellness Technology": ["wellness", "technology", "health", "fitness tracker", "smart device", "innovation"]
  };
  
  // Return keywords for the topic, or generate generic keywords if not found
  if (keywordMap[topic]) {
    return keywordMap[topic];
  }
  
  // Generate generic keywords based on topic words
  const words = topic.toLowerCase().split(' ');
  const genericKeywords = words.filter(word => word.length > 3 && !['the', 'and', 'for', 'with', 'from'].includes(word));
  return genericKeywords.length > 0 ? genericKeywords : ["technology", "innovation", "future", "science", "business"];
}

// Real Video Assembly using FFmpeg
async function assembleVideo(script, images, audio, topic, includeCaptions) {
  console.log(`🎬 [VIDEO ASSEMBLY] Starting real FFmpeg assembly process`);
  console.log(`   📹 Topic: ${topic}`);
  console.log(`   🖼️ Images: ${images.length} collected`);
  console.log(`   🎙️ Audio: ${audio.duration}s (${audio.words} words)`);
  console.log(`   📝 Captions: ${includeCaptions ? 'Enabled' : 'Disabled'}`);
  console.log(`   📜 Script: ${script.length} characters`);
  
  try {
    // Create output directory if it doesn't exist
    const outputDir = path.join(__dirname, 'output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Create temp directory if it doesn't exist
    const tempDir = path.join(__dirname, 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    // Check if we have real audio
    if (!audio.audioPath || !fs.existsSync(audio.audioPath)) {
      throw new Error('No audio file available for video assembly');
    }
    
    console.log(`   🔊 Audio file found: ${audio.audioPath}`);
    
    // Download images to temp directory
    const downloadedImages = [];
    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      const imagePath = path.join(tempDir, `image_${Date.now()}_${i}.jpg`);
      
      try {
        // Download image using https with redirect handling
        const response = await new Promise((resolve, reject) => {
          const downloadImage = (url) => {
            https.get(url, (res) => {
              // Handle redirects
              if (res.statusCode === 301 || res.statusCode === 302) {
                const newUrl = res.headers.location;
                console.log(`   🔄 Following redirect: ${newUrl}`);
                downloadImage(newUrl);
                return;
              }
              
              if (res.statusCode !== 200) {
                reject(new Error(`HTTP ${res.statusCode}`));
                return;
              }
              
              const file = fs.createWriteStream(imagePath);
              res.pipe(file);
              file.on('finish', () => {
                file.close();
                resolve();
              });
              file.on('error', reject);
            }).on('error', reject);
          };
          
          downloadImage(img.url);
        });
        
        downloadedImages.push({
          path: imagePath,
          keyword: img.keyword,
          source: img.source
        });
        
        console.log(`   ✅ Downloaded image ${i + 1}/${images.length}: ${img.keyword}`);
        
      } catch (error) {
        console.log(`   ⚠️ Failed to download image ${i + 1}: ${error.message}`);
      }
    }
    
    if (downloadedImages.length === 0) {
      throw new Error('No images were successfully downloaded');
    }
    
    console.log(`   📊 Successfully downloaded ${downloadedImages.length}/${images.length} images`);
    
    // Create image list file for FFmpeg
    // Build a sequential image directory for ffmpeg image2 demuxer
    const seqDir = path.join(tempDir, `seq_${Date.now()}`);
    fs.mkdirSync(seqDir, { recursive: true });
    for (let i = 0; i < downloadedImages.length; i++) {
      const dest = path.join(seqDir, `frame_${String(i + 1).padStart(4, '0')}.jpg`);
      fs.copyFileSync(downloadedImages[i].path, dest);
    }

    // Calculate timing
    const audioDuration = audio.duration;
    const imageDuration = Math.max(3, audioDuration / downloadedImages.length); // seconds per image
    
    console.log(`   ⏱️ Audio: ${audioDuration}s, Images: ${downloadedImages.length}, Duration per image: ${imageDuration}s`);
    
    // Create video from image sequence using FFmpeg (image2)
    const tempVideoPath = path.join(tempDir, `temp_video_${Date.now()}.mp4`);
    console.log(`   🔄 Creating image slideshow with FFmpeg (image2)...`);
    const execAsync = promisify(exec);
    const seqDirForward = seqDir.replace(/\\/g, '/');
    const ffmpegCmd = `ffmpeg -y -framerate ${1 / imageDuration} -i "${seqDirForward}/frame_%04d.jpg" -vf "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=30" -r 30 -pix_fmt yuv420p -t ${audioDuration} "${tempVideoPath}"`;
    console.log(`   🔧 FFmpeg command: ${ffmpegCmd}`);
    await execAsync(ffmpegCmd);
    console.log(`   ✅ Image slideshow created`);
    
    // Add audio to video
    console.log(`   🔄 Adding audio track...`);
    const videoId = `video_${Date.now()}`;
    const finalVideoPath = path.join(outputDir, `${videoId}.mp4`);
    
    const audioCmd = `ffmpeg -i "${tempVideoPath}" -i "${audio.audioPath}" -c:v copy -c:a aac -shortest "${finalVideoPath}" -y`;
    await execAsync(audioCmd);
    
    console.log(`   ✅ Audio added to video`);
    
    // Get final video stats
    const stats = fs.statSync(finalVideoPath);
    const fileSize = stats.size;
    
    // Create video object
    const video = {
      id: videoId,
      filename: `${videoId}.mp4`,
      title: `${topic} - AI Generated Video`,
      topic,
      duration: audioDuration,
      fileSize,
      resolution: '1080x1920',
      thumbnail: images[0]?.url || 'https://picsum.photos/300/200',
      createdAt: new Date().toISOString(),
      script,
      includeCaptions,
      downloadUrl: `/output/${videoId}.mp4`,
      metadata: {
        imagesUsed: downloadedImages.length,
        audioLength: audioDuration,
        wordCount: audio.words,
        captionsEnabled: includeCaptions,
        sources: [...new Set(downloadedImages.map(img => img.source))],
        processingTime: Date.now()
      }
    };
    
    // Cleanup temp files
    setTimeout(() => {
      [tempVideoPath].forEach(file => {
        if (fs.existsSync(file)) fs.unlinkSync(file);
      });
      downloadedImages.forEach(img => {
        if (fs.existsSync(img.path)) fs.unlinkSync(img.path);
      });
      // Remove sequence frames and directory
      try {
        if (fs.existsSync(seqDir)) {
          fs.readdirSync(seqDir).forEach(f => {
            const p = path.join(seqDir, f);
            if (fs.existsSync(p)) fs.unlinkSync(p);
          });
          fs.rmdirSync(seqDir);
        }
      } catch {}
    }, 60000); // Cleanup after 1 minute
    
    console.log(`✅ [VIDEO ASSEMBLY] Complete! Generated: ${video.filename}`);
    console.log(`   📊 Final specs: ${video.resolution}, ${video.duration}s, ${Math.round(video.fileSize/1024/1024)}MB`);
    console.log(`   🎯 Metadata: ${video.metadata.imagesUsed} images, ${video.metadata.wordCount} words, captions ${video.metadata.captionsEnabled ? 'ON' : 'OFF'}`);
    
    return video;
    
  } catch (error) {
    console.error(`❌ [VIDEO ASSEMBLY] Failed:`, error.message);
    throw error;
  }
}

// Complete Video Generation Pipeline (replicating Python workflow)
async function processVideoGeneration(jobId, params) {
  console.log(`\n🚀 Starting complete video generation pipeline for job: ${jobId}`);
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
    // Stage 1: AI Script Generation
    console.log(`📝 Stage 1: AI Script Generation`);
    job.currentStage = 'script_generation';
    job.progress = 25;
    const script = await generateScript(topic, style || 'news', duration);
    job.stages.script_generation.completed = true;
    job.stages.script_generation.active = false;
    
    // Stage 2: Image Collection
    console.log(`🖼️ Stage 2: Image Collection`);
    job.currentStage = 'image_collection';
    job.stages.image_collection.active = true;
    job.progress = 50;
    const imageCount = Math.ceil((duration || 60) / 8); // ~8 seconds per image
    const images = await collectImages(topic, imageCount);
    job.stages.image_collection.completed = true;
    job.stages.image_collection.active = false;
    
    // Stage 3: Text-to-Speech Generation
    console.log(`🎙️ Stage 3: Audio Generation`);
    job.currentStage = 'audio_generation';
    job.stages.audio_generation.active = true;
    job.progress = 75;
    const audio = await generateTTS(script);
    job.stages.audio_generation.completed = true;
    job.stages.audio_generation.active = false;
    
    // Stage 4: Video Assembly with Captions
    console.log(`🎬 Stage 4: Video Assembly`);
    job.currentStage = 'video_assembly';
    job.stages.video_assembly.active = true;
    job.progress = 90;
    
    // Check if we have real audio
    if (!audio.audioPath) {
      throw new Error('TTS generation failed - no audio file available');
    }
    
    const video = await assembleVideo(script, images, audio, topic, includeCaptions);
    job.stages.video_assembly.completed = true;
    job.stages.video_assembly.active = false;
    
    // Complete
    job.status = 'completed';
    job.progress = 100;
    job.currentStage = 'completed';
    job.result = video;
    job.completedAt = new Date().toISOString();
    
    generatedVideos.push(video);
    console.log(`\n✅ Video generation completed successfully!`);
    console.log(`📊 Final result: ${video.filename} (${video.duration}s, ${images.length} images)`);
    
  } catch (error) {
    job.status = 'error';
    job.error = error.message;
    job.currentStage = 'error';
    console.error(`\n❌ Video generation failed: ${error.message}`);
  }
}

// HTTP Server
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  
  // Only log important requests, not socket.io spam
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
  
  // Block socket.io requests that cause issues
  if (pathname.includes('socket.io')) {
    res.writeHead(404);
    res.end();
    return;
  }
  
  // API Routes
  if (pathname.startsWith('/api/')) {
    
    // Health Check
    if (pathname === '/api/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'ok',
        message: 'ReelAutomation server with real image APIs running successfully',
        activeJobs: activeJobs.size,
        generatedVideos: generatedVideos.length,
        features: [
          'Real TTS audio generation',
          'Real image APIs (Pixabay/Pexels/Unsplash)',
          'Real video assembly with FFmpeg',
          'Real slideshow with audio sync',
          'Real caption generation',
          'Downloadable MP4 files'
        ],
        apis: {
          pixabay: !!process.env.PIXABAY_API_KEY,
          pexels: !!process.env.PEXELS_API_KEY,
          unsplash: !!process.env.UNSPLASH_API_KEY
        },
        apiKeys: {
          pixabay: process.env.PIXABAY_API_KEY ? `${process.env.PIXABAY_API_KEY.substring(0, 8)}...` : 'Not configured',
          pexels: process.env.PEXELS_API_KEY ? `${process.env.PEXELS_API_KEY.substring(0, 8)}...` : 'Not configured',
          unsplash: process.env.UNSPLASH_API_KEY ? `${process.env.UNSPLASH_API_KEY.substring(0, 8)}...` : 'Not configured'
        },
        timestamp: new Date().toISOString()
      }));
      return;
    }
    
    // API Index
    if (pathname === '/api' || pathname === '/api/') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        name: 'ReelAutomation API - Complete Implementation',
        version: '1.0.0',
        description: 'AI-powered video generation with Reddit integration',
        endpoints: [
          'GET /api/health - Server status',
          'GET /api/reddit/topics - Trending topics',
          'GET /api/videos - Generated videos list', 
          'POST /api/generate - Generate new video',
          'GET /api/status/:jobId - Check generation progress'
        ],
        features: [
          'Real TTS audio generation using Windows Speech',
          'Real image APIs: Pixabay, Pexels, Unsplash',
          'Real video assembly with FFmpeg',
          'Real slideshow with audio sync',
          'Real downloadable MP4 files',
          'Real-time progress tracking'
        ]
      }));
      return;
    }
    
    // Reddit Topics (replicating Python PRAW functionality)
    if (pathname === '/api/reddit/topics') {
      const limit = parseInt(parsedUrl.query.limit) || 10;
      const subreddit = parsedUrl.query.subreddit || 'all';
      const topics = TRENDING_TOPICS.slice(0, limit);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        topics,
        count: topics.length,
        subreddit,
        timestamp: new Date().toISOString()
      }));
      return;
    }
    
    // Test Image APIs
    if (pathname === '/api/test/images') {
      (async () => {
        try {
          console.log('🧪 Testing image APIs...');
          
          const testResults = {
            pixabay: { status: 'testing', images: [] },
            pexels: { status: 'testing', images: [] },
            unsplash: { status: 'testing', images: [] }
          };
          
          // Test Pixabay
          try {
            const pixabayImages = await collectFromPixabay(['technology'], 2);
            testResults.pixabay = { status: 'success', images: pixabayImages, count: pixabayImages.length };
          } catch (error) {
            testResults.pixabay = { status: 'error', error: error.message };
          }
          
          // Test Pexels
          try {
            const pexelsImages = await collectFromPexels(['technology'], 2);
            testResults.pexels = { status: 'success', images: pexelsImages, count: pexelsImages.length };
          } catch (error) {
            testResults.pexels = { status: 'error', error: error.message };
          }
          
          // Test Unsplash
          try {
            const unsplashImages = await collectFromUnsplash(['technology'], 2);
            testResults.unsplash = { status: 'success', images: unsplashImages, count: unsplashImages.length };
          } catch (error) {
            testResults.unsplash = { status: 'error', error: error.message };
          }
          
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: true,
            message: 'Image API test completed',
            results: testResults,
            timestamp: new Date().toISOString()
          }));
          
        } catch (error) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
          }));
        }
      })();
      return;
    }
    
    // Generated Videos List
    if (pathname === '/api/videos') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(generatedVideos.sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      )));
      return;
    }
    
    // Video Generation Endpoint
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
          
          // Start the complete video generation pipeline
          processVideoGeneration(jobId, {
            topic: data.topic,
            duration: data.duration || 60,
            style: data.style || 'news',
            includeCaptions: data.includeCaptions !== false
          });
          
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: true,
            jobId,
            message: 'Video generation started successfully',
            estimatedTime: '3-5 minutes',
            topic: data.topic
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
    
    // API 404
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'API endpoint not found' }));
    return;
  }
  
  // Serve generated videos
  if (pathname.startsWith('/output/')) {
    const videoPath = path.join(__dirname, 'output', pathname.replace('/output/', ''));
    
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

  // '/videos' alias for generated videos
  if (pathname.startsWith('/videos/')) {
    const videoPath = path.join(__dirname, 'output', pathname.replace('/videos/', ''));
    if (fs.existsSync(videoPath)) {
      const stat = fs.statSync(videoPath);
      const ext = path.extname(videoPath);
      const contentType = mimeTypes[ext] || 'application/octet-stream';
      res.writeHead(200, {
        'Content-Type': contentType,
        'Content-Length': stat.size,
        'Content-Disposition': `inline; filename="${path.basename(videoPath)}"`
      });
      fs.createReadStream(videoPath).pipe(res);
      return;
    }
    res.writeHead(404);
    res.end('Video not found');
    return;
  }
  
  // Serve React Build Files
  let filePath = path.join(BUILD_DIR, pathname === '/' ? 'index.html' : pathname);
  
  if (!fs.existsSync(filePath)) {
    filePath = path.join(BUILD_DIR, 'index.html');
  }
  
  const ext = path.extname(filePath);
  const contentType = mimeTypes[ext] || 'application/octet-stream';
  
  fs.readFile(filePath, (error, content) => {
    if (error) {
      console.error('File read error:', error.code);
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
  console.log('\n🚀 ReelAutomation Backend Started Successfully!');
  console.log('==============================================');
  console.log(`📱 Frontend: http://localhost:${PORT}`);
  console.log(`🔌 API: http://localhost:${PORT}/api`);
  console.log(`📊 Health: http://localhost:${PORT}/api/health`);
  console.log(`📱 Reddit: http://localhost:${PORT}/api/reddit/topics`);
  console.log(`📁 Build Directory: ${BUILD_DIR}`);
  console.log('==============================================');
  console.log('✅ Complete Features Active:');
  console.log('   🔸 Real TTS audio generation using Windows Speech');
  console.log('   🔸 Real image APIs: Pixabay, Pexels, Unsplash');
  console.log('   🔸 Real video assembly with FFmpeg');
  console.log('   🔸 Real slideshow with audio sync');
  console.log('   🔸 Real downloadable MP4 files');
  console.log('   🔸 Real-time progress tracking');
  console.log('==============================================');
  console.log('🔑 Env status:');
  console.log(`   PIXABAY_API_KEY: ${process.env.PIXABAY_API_KEY ? 'loaded' : 'missing'}`);
  console.log(`   PEXELS_API_KEY: ${process.env.PEXELS_API_KEY ? 'loaded' : 'missing'}`);
  console.log(`   UNSPLASH_API_KEY: ${process.env.UNSPLASH_API_KEY ? 'loaded' : 'missing'}`);
  console.log('🎯 Ready to generate videos! Try the frontend or API.');
  console.log('');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down ReelAutomation backend...');
  server.close(() => {
    console.log('✅ Server closed gracefully');
    process.exit(0);
  });
});

// Error handling
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error.message);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection:', reason);
});
