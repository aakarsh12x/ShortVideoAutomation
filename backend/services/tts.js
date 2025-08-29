const gTTS = require('gtts');
const fs = require('fs');
const path = require('path');
const logger = require('../logger');
const config = require('../config');

class TTSService {
  constructor() {
    this.outputDir = path.join(__dirname, '../../temp/audio');
    this.ensureOutputDir();
  }

  ensureOutputDir() {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  async generateAudio(text, voice = 'default', language = 'en') {
    try {
      const filename = `audio_${Date.now()}.mp3`;
      const outputPath = path.join(this.outputDir, filename);

      // Create gTTS instance
      const gtts = new gTTS(text, language);
      
      // Generate audio file
      await new Promise((resolve, reject) => {
        gtts.save(outputPath, (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });

      logger.info(`Audio generated: ${filename}`);
      return {
        filename,
        path: outputPath,
        url: `/temp/audio/${filename}`,
        duration: await this.getAudioDuration(outputPath)
      };
    } catch (error) {
      logger.error('TTS generation failed:', error);
      throw error;
    }
  }

  async getAudioDuration(audioPath) {
    try {
      // This is a simplified duration calculation
      // In a real implementation, you'd use ffprobe or similar
      const stats = fs.statSync(audioPath);
      const fileSizeKB = stats.size / 1024;
      
      // Rough estimation: ~1KB per second for MP3 at 128kbps
      return Math.round(fileSizeKB);
    } catch (error) {
      logger.warn('Could not calculate audio duration:', error);
      return 60; // Default duration
    }
  }

  async generateAudioWithTiming(text, language = 'en') {
    try {
      // Split text into sentences for better timing
      const sentences = this.splitIntoSentences(text);
      const audioSegments = [];
      
      for (let i = 0; i < sentences.length; i++) {
        const sentence = sentences[i].trim();
        if (sentence.length > 0) {
          const audio = await this.generateAudio(sentence, 'default', language);
          audioSegments.push({
            ...audio,
            text: sentence,
            startTime: audioSegments.reduce((total, seg) => total + seg.duration, 0),
            endTime: audioSegments.reduce((total, seg) => total + seg.duration, 0) + audio.duration
          });
        }
      }

      return audioSegments;
    } catch (error) {
      logger.error('Timed audio generation failed:', error);
      throw error;
    }
  }

  splitIntoSentences(text) {
    // Simple sentence splitting - in production, use a proper NLP library
    return text.split(/[.!?]+/).filter(sentence => sentence.trim().length > 0);
  }

  async generateMultipleVoices(text, voices = ['en', 'es', 'fr']) {
    try {
      const audioFiles = [];
      
      for (const voice of voices) {
        try {
          const audio = await this.generateAudio(text, 'default', voice);
          audioFiles.push({
            ...audio,
            language: voice
          });
        } catch (error) {
          logger.warn(`Failed to generate audio for language ${voice}:`, error);
        }
      }

      return audioFiles;
    } catch (error) {
      logger.error('Multiple voice generation failed:', error);
      throw error;
    }
  }

  async cleanupOldAudio(maxAge = 24 * 60 * 60 * 1000) { // 24 hours
    try {
      const files = fs.readdirSync(this.outputDir);
      const now = Date.now();
      
      for (const file of files) {
        const filePath = path.join(this.outputDir, file);
        const stats = fs.statSync(filePath);
        
        if (now - stats.mtime.getTime() > maxAge) {
          fs.unlinkSync(filePath);
          logger.info(`Cleaned up old audio file: ${file}`);
        }
      }
    } catch (error) {
      logger.error('Audio cleanup failed:', error);
    }
  }

  async getAvailableLanguages() {
    // gTTS supported languages
    return [
      { code: 'en', name: 'English' },
      { code: 'es', name: 'Spanish' },
      { code: 'fr', name: 'French' },
      { code: 'de', name: 'German' },
      { code: 'it', name: 'Italian' },
      { code: 'pt', name: 'Portuguese' },
      { code: 'ru', name: 'Russian' },
      { code: 'ja', name: 'Japanese' },
      { code: 'ko', name: 'Korean' },
      { code: 'zh', name: 'Chinese' },
      { code: 'ar', name: 'Arabic' },
      { code: 'hi', name: 'Hindi' }
    ];
  }

  async checkHealth() {
    try {
      // Test TTS generation with a short text
      const testAudio = await this.generateAudio('Test', 'default', 'en');
      
      // Clean up test file
      if (fs.existsSync(testAudio.path)) {
        fs.unlinkSync(testAudio.path);
      }
      
      return { status: 'healthy', service: 'gtts' };
    } catch (error) {
      logger.error('TTS health check failed:', error);
      return { status: 'error', service: 'gtts', error: error.message };
    }
  }
}

module.exports = new TTSService();
