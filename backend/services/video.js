const ffmpeg = require('fluent-ffmpeg');
const ffmpegStatic = require('ffmpeg-static');
const ffprobeStatic = require('ffprobe-static');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const logger = require('../logger');
const config = require('../config');

// Set FFmpeg paths
ffmpeg.setFfmpegPath(ffmpegStatic);
ffmpeg.setFfprobePath(ffprobeStatic);

class VideoService {
  constructor() {
    this.outputDir = path.join(__dirname, '../../output');
    this.tempDir = path.join(__dirname, '../../temp');
    this.ensureDirectories();
  }

  ensureDirectories() {
    [this.outputDir, this.tempDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  async createVideo(params) {
    try {
      const { script, images, audioFile, captions, duration, style } = params;
      const videoId = uuidv4();
      const outputPath = path.join(this.outputDir, `video_${videoId}.mp4`);
      
      logger.info(`Creating video: ${videoId}`);

      // Create video from images and audio
      const video = await this.assembleVideo({
        images,
        audioFile,
        captions,
        duration,
        style,
        outputPath
      });

      // Generate thumbnail
      const thumbnail = await this.generateThumbnail(outputPath);

      // Get video metadata
      const metadata = await this.getVideoMetadata(outputPath);

      const result = {
        id: videoId,
        filename: `video_${videoId}.mp4`,
        path: outputPath,
        url: `/videos/video_${videoId}.mp4`,
        thumbnail,
        script,
        duration: metadata.duration,
        fileSize: metadata.fileSize,
        resolution: `${metadata.width}x${metadata.height}`,
        createdAt: new Date().toISOString(),
        style,
        metadata
      };

      logger.info(`Video created successfully: ${videoId}`);
      return result;
    } catch (error) {
      logger.error('Video creation failed:', error);
      throw error;
    }
  }

  async assembleVideo({ images, audioFile, captions, duration, style, outputPath }) {
    return new Promise((resolve, reject) => {
      const command = ffmpeg();

      // Add images as input
      images.forEach((image, index) => {
        const imagePath = path.join(this.tempDir, `image_${index}.jpg`);
        command.input(imagePath);
      });

      // Add audio
      if (audioFile && fs.existsSync(audioFile.path)) {
        command.input(audioFile.path);
      }

      // Configure video settings
      const videoConfig = this.getVideoConfig(style);
      
      command
        .complexFilter([
          // Create slideshow from images
          this.createSlideshowFilter(images.length, duration),
          // Add captions if provided
          ...(captions ? this.createCaptionFilters(captions) : [])
        ])
        .outputOptions([
          '-c:v libx264',
          '-preset fast',
          '-crf 23',
          '-c:a aac',
          '-b:a 128k',
          '-shortest'
        ])
        .size(`${videoConfig.width}x${videoConfig.height}`)
        .fps(videoConfig.fps)
        .duration(duration)
        .output(outputPath)
        .on('start', (commandLine) => {
          logger.info('FFmpeg started:', commandLine);
        })
        .on('progress', (progress) => {
          logger.info(`Video progress: ${progress.percent}%`);
        })
        .on('end', () => {
          logger.info('Video assembly completed');
          resolve(outputPath);
        })
        .on('error', (err) => {
          logger.error('FFmpeg error:', err);
          reject(err);
        })
        .run();
    });
  }

  createSlideshowFilter(imageCount, duration) {
    const imageDuration = duration / imageCount;
    const filters = [];
    
    for (let i = 0; i < imageCount; i++) {
      filters.push(`[${i}:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=30,setpts=PTS-STARTPTS+${i * imageDuration}/TB[v${i}]`);
    }
    
    // Concatenate all video streams
    const concatInputs = Array.from({ length: imageCount }, (_, i) => `[v${i}]`).join('');
    filters.push(`${concatInputs}concat=n=${imageCount}:v=1:a=0[outv]`);
    
    return filters.join(';');
  }

  createCaptionFilters(captions) {
    // This is a simplified caption filter
    // In production, you'd create more sophisticated caption overlays
    return captions.map((caption, index) => 
      `[outv]drawtext=text='${caption.text}':x=(w-text_w)/2:y=h-th-50:fontsize=48:fontcolor=white:box=1:boxcolor=black@0.5:boxborderw=5[v${index}]`
    );
  }

  getVideoConfig(style) {
    const configs = {
      news: { width: 1920, height: 1080, fps: 30 },
      social: { width: 1080, height: 1920, fps: 30 },
      educational: { width: 1920, height: 1080, fps: 30 },
      entertainment: { width: 1920, height: 1080, fps: 30 },
      documentary: { width: 1920, height: 1080, fps: 24 }
    };
    
    return configs[style] || configs.news;
  }

  async generateThumbnail(videoPath) {
    try {
      const thumbnailPath = videoPath.replace('.mp4', '_thumb.jpg');
      
      return new Promise((resolve, reject) => {
        ffmpeg(videoPath)
          .screenshots({
            timestamps: ['10%'],
            filename: path.basename(thumbnailPath),
            folder: path.dirname(thumbnailPath),
            size: '320x180'
          })
          .on('end', () => {
            resolve(thumbnailPath);
          })
          .on('error', (err) => {
            logger.error('Thumbnail generation failed:', err);
            reject(err);
          });
      });
    } catch (error) {
      logger.error('Thumbnail generation failed:', error);
      return null;
    }
  }

  async getVideoMetadata(videoPath) {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(videoPath, (err, metadata) => {
        if (err) {
          reject(err);
          return;
        }

        const videoStream = metadata.streams.find(stream => stream.codec_type === 'video');
        const audioStream = metadata.streams.find(stream => stream.codec_type === 'audio');
        
        resolve({
          duration: parseFloat(metadata.format.duration),
          fileSize: parseInt(metadata.format.size),
          width: videoStream ? videoStream.width : 1920,
          height: videoStream ? videoStream.height : 1080,
          fps: videoStream ? eval(videoStream.r_frame_rate) : 30,
          bitrate: parseInt(metadata.format.bit_rate),
          audioCodec: audioStream ? audioStream.codec_name : null,
          videoCodec: videoStream ? videoStream.codec_name : null
        });
      });
    });
  }

  async getAllVideos() {
    try {
      const files = fs.readdirSync(this.outputDir);
      const videos = [];

      for (const file of files) {
        if (file.endsWith('.mp4')) {
          const videoPath = path.join(this.outputDir, file);
          const stats = fs.statSync(videoPath);
          
          videos.push({
            id: file.replace('.mp4', ''),
            filename: file,
            url: `/videos/${file}`,
            createdAt: stats.birthtime.toISOString(),
            fileSize: stats.size,
            path: videoPath
          });
        }
      }

      return videos.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } catch (error) {
      logger.error('Failed to get videos:', error);
      throw error;
    }
  }

  async getVideo(id) {
    try {
      const videoPath = path.join(this.outputDir, `${id}.mp4`);
      
      if (!fs.existsSync(videoPath)) {
        return null;
      }

      const stats = fs.statSync(videoPath);
      const metadata = await this.getVideoMetadata(videoPath);
      
      return {
        id,
        filename: `${id}.mp4`,
        url: `/videos/${id}.mp4`,
        createdAt: stats.birthtime.toISOString(),
        fileSize: stats.size,
        duration: metadata.duration,
        resolution: `${metadata.width}x${metadata.height}`,
        metadata
      };
    } catch (error) {
      logger.error('Failed to get video:', error);
      throw error;
    }
  }

  async deleteVideo(id) {
    try {
      const videoPath = path.join(this.outputDir, `${id}.mp4`);
      const thumbnailPath = videoPath.replace('.mp4', '_thumb.jpg');
      
      if (fs.existsSync(videoPath)) {
        fs.unlinkSync(videoPath);
      }
      
      if (fs.existsSync(thumbnailPath)) {
        fs.unlinkSync(thumbnailPath);
      }
      
      logger.info(`Video deleted: ${id}`);
      return true;
    } catch (error) {
      logger.error('Failed to delete video:', error);
      throw error;
    }
  }

  async checkHealth() {
    try {
      // Test FFmpeg availability
      const testCommand = ffmpeg();
      return { status: 'healthy', service: 'ffmpeg' };
    } catch (error) {
      logger.error('Video service health check failed:', error);
      return { status: 'error', service: 'ffmpeg', error: error.message };
    }
  }
}

module.exports = new VideoService();
