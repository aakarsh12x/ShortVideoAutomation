const fs = require('fs');
const path = require('path');
const logger = require('../logger');
const config = require('../config');

class CaptionService {
  constructor() {
    this.outputDir = path.join(__dirname, '../../temp/captions');
    this.ensureOutputDir();
  }

  ensureOutputDir() {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  async generateCaptions(script, audioFile) {
    try {
      logger.info('Generating captions for script');
      
      // Split script into sentences
      const sentences = this.splitIntoSentences(script);
      
      // Estimate timing for each sentence
      const captions = await this.estimateTiming(sentences, audioFile);
      
      // Generate SRT file
      const srtContent = this.generateSRT(captions);
      const srtPath = path.join(this.outputDir, `captions_${Date.now()}.srt`);
      fs.writeFileSync(srtPath, srtContent);
      
      logger.info(`Captions generated: ${srtPath}`);
      return {
        srtPath,
        captions,
        srtContent
      };
    } catch (error) {
      logger.error('Caption generation failed:', error);
      throw error;
    }
  }

  splitIntoSentences(text) {
    // Simple sentence splitting - in production, use a proper NLP library
    return text
      .split(/[.!?]+/)
      .map(sentence => sentence.trim())
      .filter(sentence => sentence.length > 0);
  }

  async estimateTiming(sentences, audioFile) {
    try {
      const totalDuration = audioFile.duration || 60; // Default 60 seconds
      const wordsPerMinute = 150; // Average speaking rate
      
      const captions = [];
      let currentTime = 0;
      
      for (const sentence of sentences) {
        const wordCount = sentence.split(' ').length;
        const duration = (wordCount / wordsPerMinute) * 60; // Duration in seconds
        
        captions.push({
          text: sentence,
          startTime: currentTime,
          endTime: currentTime + duration,
          duration: duration
        });
        
        currentTime += duration;
      }
      
      // Adjust timing to fit total duration
      const totalEstimatedTime = captions.reduce((sum, cap) => sum + cap.duration, 0);
      const adjustmentFactor = totalDuration / totalEstimatedTime;
      
      captions.forEach(caption => {
        caption.startTime *= adjustmentFactor;
        caption.endTime *= adjustmentFactor;
        caption.duration *= adjustmentFactor;
      });
      
      return captions;
    } catch (error) {
      logger.error('Timing estimation failed:', error);
      throw error;
    }
  }

  generateSRT(captions) {
    let srtContent = '';
    
    captions.forEach((caption, index) => {
      const startTime = this.formatSRTTime(caption.startTime);
      const endTime = this.formatSRTTime(caption.endTime);
      
      srtContent += `${index + 1}\n`;
      srtContent += `${startTime} --> ${endTime}\n`;
      srtContent += `${caption.text}\n\n`;
    });
    
    return srtContent;
  }

  formatSRTTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const milliseconds = Math.floor((seconds % 1) * 1000);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${milliseconds.toString().padStart(3, '0')}`;
  }

  async generateAdvancedCaptions(script, audioFile, options = {}) {
    try {
      const {
        style = 'modern',
        fontSize = 48,
        fontColor = '#FFFFFF',
        strokeColor = '#000000',
        strokeWidth = 2,
        position = 'bottom',
        margin = 50
      } = options;

      // Generate basic captions
      const basicCaptions = await this.generateCaptions(script, audioFile);
      
      // Apply styling
      const styledCaptions = basicCaptions.captions.map(caption => ({
        ...caption,
        style: {
          fontSize,
          fontColor,
          strokeColor,
          strokeWidth,
          position,
          margin
        }
      }));

      // Generate styled SRT
      const styledSRT = this.generateStyledSRT(styledCaptions);
      const styledSRTPath = path.join(this.outputDir, `styled_captions_${Date.now()}.srt`);
      fs.writeFileSync(styledSRTPath, styledSRT);

      return {
        srtPath: styledSRTPath,
        captions: styledCaptions,
        srtContent: styledSRT
      };
    } catch (error) {
      logger.error('Advanced caption generation failed:', error);
      throw error;
    }
  }

  generateStyledSRT(captions) {
    let srtContent = '';
    
    captions.forEach((caption, index) => {
      const startTime = this.formatSRTTime(caption.startTime);
      const endTime = this.formatSRTTime(caption.endTime);
      
      srtContent += `${index + 1}\n`;
      srtContent += `${startTime} --> ${endTime}\n`;
      
      // Add styling tags
      const styledText = this.applyStyling(caption.text, caption.style);
      srtContent += `${styledText}\n\n`;
    });
    
    return srtContent;
  }

  applyStyling(text, style) {
    // Apply SRT styling tags
    let styledText = text;
    
    if (style.fontSize) {
      styledText = `<font size="${style.fontSize}">${styledText}</font>`;
    }
    
    if (style.fontColor) {
      styledText = `<font color="${style.fontColor}">${styledText}</font>`;
    }
    
    if (style.strokeColor && style.strokeWidth) {
      styledText = `<font stroke="${style.strokeColor}" stroke-width="${style.strokeWidth}">${styledText}</font>`;
    }
    
    return styledText;
  }

  async generateWordLevelCaptions(script, audioFile) {
    try {
      // Split script into words
      const words = script.split(/\s+/).filter(word => word.length > 0);
      
      // Estimate timing for each word
      const totalDuration = audioFile.duration || 60;
      const wordsPerMinute = 150;
      const wordDuration = (60 / wordsPerMinute) / words.length * totalDuration;
      
      const wordCaptions = words.map((word, index) => ({
        text: word,
        startTime: index * wordDuration,
        endTime: (index + 1) * wordDuration,
        duration: wordDuration
      }));
      
      // Generate word-level SRT
      const srtContent = this.generateSRT(wordCaptions);
      const srtPath = path.join(this.outputDir, `word_captions_${Date.now()}.srt`);
      fs.writeFileSync(srtPath, srtContent);
      
      return {
        srtPath,
        captions: wordCaptions,
        srtContent
      };
    } catch (error) {
      logger.error('Word-level caption generation failed:', error);
      throw error;
    }
  }

  async generateCaptionsWithEmotions(script, audioFile) {
    try {
      // This is a simplified emotion detection
      // In production, you'd use AI/ML models for emotion detection
      const sentences = this.splitIntoSentences(script);
      const captions = await this.estimateTiming(sentences, audioFile);
      
      // Add emotion tags
      const emotionalCaptions = captions.map(caption => ({
        ...caption,
        emotion: this.detectEmotion(caption.text)
      }));
      
      // Generate emotional SRT
      const srtContent = this.generateEmotionalSRT(emotionalCaptions);
      const srtPath = path.join(this.outputDir, `emotional_captions_${Date.now()}.srt`);
      fs.writeFileSync(srtPath, srtContent);
      
      return {
        srtPath,
        captions: emotionalCaptions,
        srtContent
      };
    } catch (error) {
      logger.error('Emotional caption generation failed:', error);
      throw error;
    }
  }

  detectEmotion(text) {
    // Simple emotion detection based on keywords
    const emotions = {
      happy: ['happy', 'joy', 'excited', 'amazing', 'wonderful', 'great', 'fantastic'],
      sad: ['sad', 'depressed', 'unhappy', 'terrible', 'awful', 'horrible', 'tragic'],
      angry: ['angry', 'mad', 'furious', 'outraged', 'annoyed', 'frustrated'],
      surprised: ['surprised', 'shocked', 'amazed', 'astonished', 'unexpected'],
      neutral: []
    };
    
    const lowerText = text.toLowerCase();
    
    for (const [emotion, keywords] of Object.entries(emotions)) {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        return emotion;
      }
    }
    
    return 'neutral';
  }

  generateEmotionalSRT(captions) {
    let srtContent = '';
    
    captions.forEach((caption, index) => {
      const startTime = this.formatSRTTime(caption.startTime);
      const endTime = this.formatSRTTime(caption.endTime);
      
      srtContent += `${index + 1}\n`;
      srtContent += `${startTime} --> ${endTime}\n`;
      
      // Add emotion styling
      const emotionalText = this.applyEmotionStyling(caption.text, caption.emotion);
      srtContent += `${emotionalText}\n\n`;
    });
    
    return srtContent;
  }

  applyEmotionStyling(text, emotion) {
    const emotionStyles = {
      happy: `<font color="#FFD700">${text}</font>`,
      sad: `<font color="#87CEEB">${text}</font>`,
      angry: `<font color="#FF4500">${text}</font>`,
      surprised: `<font color="#FF69B4">${text}</font>`,
      neutral: text
    };
    
    return emotionStyles[emotion] || text;
  }

  async checkHealth() {
    try {
      // Test caption generation with a simple script
      const testScript = "This is a test caption.";
      const testAudio = { duration: 5 };
      
      const captions = await this.generateCaptions(testScript, testAudio);
      
      // Clean up test file
      if (fs.existsSync(captions.srtPath)) {
        fs.unlinkSync(captions.srtPath);
      }
      
      return { status: 'healthy', service: 'captions' };
    } catch (error) {
      logger.error('Caption service health check failed:', error);
      return { status: 'error', service: 'captions', error: error.message };
    }
  }
}

module.exports = new CaptionService();
