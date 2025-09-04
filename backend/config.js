const fs = require('fs');
const path = require('path');

class Config {
  constructor() {
    this.configPath = path.join(__dirname, '../config.json');
    this.config = this.loadConfig();
  }

  loadConfig() {
    try {
      if (fs.existsSync(this.configPath)) {
        const configData = fs.readFileSync(this.configPath, 'utf8');
        return JSON.parse(configData);
      }
    } catch (error) {
      console.error('Error loading config:', error);
    }

    // Default configuration
    return {
      server: {
        port: process.env.PORT || 3000,
        host: process.env.HOST || 'localhost'
      },
      cors: {
        origin: process.env.CORS_ORIGIN || '*'
      },
      reddit: {
        clientId: process.env.REDDIT_CLIENT_ID || '',
        clientSecret: process.env.REDDIT_CLIENT_SECRET || '',
        userAgent: process.env.REDDIT_USER_AGENT || 'ReelAutomation/1.0.0'
      },
      openai: {
        apiKey: process.env.OPENAI_API_KEY || '',
        model: process.env.OPENAI_MODEL || 'gpt-4'
      },
      anthropic: {
        apiKey: process.env.ANTHROPIC_API_KEY || '',
        model: process.env.ANTHROPIC_MODEL || 'claude-3-sonnet-20240229'
      },
      images: {
        pexelsApiKey: process.env.PEXELS_API_KEY || '',
        unsplashAccessKey: process.env.UNSPLASH_ACCESS_KEY || '',
        pixabayApiKey: process.env.PIXABAY_API_KEY || ''
      },
      video: {
        width: 1920,
        height: 1080,
        fps: 30,
        bitrate: '5000k'
      },
      audio: {
        sampleRate: 44100,
        bitrate: '128k'
      },
      captions: {
        enabled: true,
        style: 'modern',
        fontSize: 48,
        fontColor: '#FFFFFF',
        strokeColor: '#000000',
        strokeWidth: 2,
        position: 'bottom',
        margin: 50
      },
      output: {
        directory: path.join(__dirname, '../output'),
        tempDirectory: path.join(__dirname, '../temp'),
        maxFileSize: '100MB'
      },
      logging: {
        level: process.env.LOG_LEVEL || 'info',
        file: path.join(__dirname, '../logs/app.log')
      }
    };
  }

  get(key) {
    return key ? this.config[key] : this.config;
  }

  set(key, value) {
    if (typeof key === 'object') {
      this.config = { ...this.config, ...key };
    } else {
      this.config[key] = value;
    }
    this.saveConfig();
  }

  saveConfig() {
    try {
      fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
    } catch (error) {
      console.error('Error saving config:', error);
    }
  }

  // Environment-specific configurations
  isDevelopment() {
    return process.env.NODE_ENV === 'development';
  }

  isProduction() {
    return process.env.NODE_ENV === 'production';
  }

  isTest() {
    return process.env.NODE_ENV === 'test';
  }
}

module.exports = new Config();

