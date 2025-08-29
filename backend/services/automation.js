const { v4: uuidv4 } = require('uuid');
const logger = require('../logger');
const config = require('../config');

// Import individual services
const redditService = require('./reddit');
const aiService = require('./ai');
const imageService = require('./images');
const ttsService = require('./tts');
const videoService = require('./video');
const captionService = require('./captions');

class AutomationService {
  constructor() {
    this.activeJobs = new Map();
    this.completedJobs = new Map();
  }

  async generateVideo(params, io) {
    const { jobId, topic, duration, style, includeCaptions, customScript } = params;
    
    try {
      // Initialize job
      const job = {
        id: jobId,
        topic,
        duration,
        style,
        includeCaptions,
        customScript,
        status: 'pending',
        currentStage: 'initializing',
        startTime: Date.now(),
        stages: {},
        progress: 0,
        message: 'Starting video generation...'
      };

      this.activeJobs.set(jobId, job);
      this.emitProgress(job, io);

      // Stage 1: Topic Discovery (if no custom script)
      if (!customScript) {
        await this.updateJobStage(job, 'topic_discovery', 'Discovering trending topics...', io);
        const topics = await redditService.getTrendingTopics('all', 5);
        job.trendingTopics = topics;
        await this.completeJobStage(job, 'topic_discovery', io);
      }

      // Stage 2: Script Generation
      await this.updateJobStage(job, 'script_generation', 'Generating AI script...', io);
      const script = customScript || await aiService.generateScript(topic, style, duration);
      job.script = script;
      await this.completeJobStage(job, 'script_generation', io);

      // Stage 3: Image Collection
      await this.updateJobStage(job, 'image_collection', 'Collecting images...', io);
      const images = await imageService.searchImages(topic, Math.ceil(duration / 10));
      job.images = images;
      await this.completeJobStage(job, 'image_collection', io);

      // Stage 4: Audio Generation
      await this.updateJobStage(job, 'audio_generation', 'Generating voiceover...', io);
      const audioFile = await ttsService.generateAudio(script);
      job.audioFile = audioFile;
      await this.completeJobStage(job, 'audio_generation', io);

      // Stage 5: Caption Synchronization (if enabled)
      if (includeCaptions) {
        await this.updateJobStage(job, 'caption_sync', 'Synchronizing captions...', io);
        const captions = await captionService.generateCaptions(script, audioFile);
        job.captions = captions;
        await this.completeJobStage(job, 'caption_sync', io);
      }

      // Stage 6: Video Assembly
      await this.updateJobStage(job, 'video_assembly', 'Assembling final video...', io);
      const videoFile = await videoService.createVideo({
        script,
        images,
        audioFile,
        captions: includeCaptions ? job.captions : null,
        duration,
        style
      });
      job.videoFile = videoFile;
      await this.completeJobStage(job, 'video_assembly', io);

      // Complete job
      job.status = 'completed';
      job.endTime = Date.now();
      job.totalDuration = job.endTime - job.startTime;
      job.progress = 100;
      job.message = 'Video generation completed successfully!';

      this.activeJobs.delete(jobId);
      this.completedJobs.set(jobId, job);

      // Emit completion event
      io.emit('video_complete', {
        jobId,
        videoFile,
        script,
        topic,
        style,
        duration: job.totalDuration,
        createdAt: new Date().toISOString()
      });

      logger.info(`Video generation completed for job ${jobId}`);

    } catch (error) {
      logger.error(`Video generation failed for job ${jobId}:`, error);
      
      const job = this.activeJobs.get(jobId);
      if (job) {
        job.status = 'error';
        job.error = error.message;
        job.message = 'Video generation failed';
        job.endTime = Date.now();
        
        this.activeJobs.delete(jobId);
        this.completedJobs.set(jobId, job);
        
        this.emitProgress(job, io);
      }
    }
  }

  async updateJobStage(job, stage, message, io) {
    job.currentStage = stage;
    job.message = message;
    job.stages[stage] = {
      startTime: Date.now(),
      status: 'active'
    };
    
    this.emitProgress(job, io);
    await this.delay(100); // Small delay for UI updates
  }

  async completeJobStage(job, stage, io) {
    const stageData = job.stages[stage];
    if (stageData) {
      stageData.endTime = Date.now();
      stageData.duration = stageData.endTime - stageData.startTime;
      stageData.status = 'completed';
    }
    
    // Update progress
    const totalStages = job.includeCaptions ? 6 : 5;
    const completedStages = Object.values(job.stages).filter(s => s.status === 'completed').length;
    job.progress = Math.round((completedStages / totalStages) * 100);
    
    this.emitProgress(job, io);
    await this.delay(100);
  }

  emitProgress(job, io) {
    io.emit('progress', {
      jobId: job.id,
      status: job.status,
      currentStage: job.currentStage,
      progress: job.progress,
      message: job.message,
      startTime: job.startTime,
      stages: job.stages,
      error: job.error
    });
  }

  async getJobStatus(jobId) {
    const activeJob = this.activeJobs.get(jobId);
    if (activeJob) {
      return activeJob;
    }
    
    const completedJob = this.completedJobs.get(jobId);
    if (completedJob) {
      return completedJob;
    }
    
    return null;
  }

  async cancelJob(jobId) {
    const job = this.activeJobs.get(jobId);
    if (!job || job.status === 'completed' || job.status === 'error') {
      return false;
    }
    
    job.status = 'cancelled';
    job.message = 'Job cancelled by user';
    job.endTime = Date.now();
    
    this.activeJobs.delete(jobId);
    this.completedJobs.set(jobId, job);
    
    return true;
  }

  async getAllJobs() {
    const activeJobs = Array.from(this.activeJobs.values());
    const completedJobs = Array.from(this.completedJobs.values());
    
    return {
      active: activeJobs,
      completed: completedJobs
    };
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = new AutomationService();
