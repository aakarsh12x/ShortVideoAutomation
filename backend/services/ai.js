const OpenAI = require('openai');
const Anthropic = require('@anthropic-ai/sdk');
const logger = require('../logger');
const config = require('../config');

class AIService {
  constructor() {
    this.openai = null;
    this.anthropic = null;
    this.initializeClients();
  }

  initializeClients() {
    // Initialize OpenAI client
    if (config.get('openai.apiKey')) {
      this.openai = new OpenAI({
        apiKey: config.get('openai.apiKey')
      });
    }

    // Initialize Anthropic client
    if (config.get('anthropic.apiKey')) {
      this.anthropic = new Anthropic({
        apiKey: config.get('anthropic.apiKey')
      });
    }
  }

  async generateScript(topic, style = 'news', duration = 60) {
    try {
      const prompt = this.buildScriptPrompt(topic, style, duration);
      
      // Try Claude first (better reasoning), fallback to GPT-4
      if (this.anthropic) {
        return await this.generateWithClaude(prompt);
      } else if (this.openai) {
        return await this.generateWithOpenAI(prompt);
      } else {
        throw new Error('No AI service configured');
      }
    } catch (error) {
      logger.error('Script generation failed:', error);
      throw error;
    }
  }

  buildScriptPrompt(topic, style, duration) {
    const wordCount = Math.floor(duration * 2.5); // ~150 words per minute
    
    const styleInstructions = {
      news: "Write in a professional, informative news style with clear, concise language. Use present tense and include relevant facts and statistics.",
      social: "Write in an engaging, conversational style perfect for social media. Use short sentences, emojis sparingly, and include calls to action.",
      educational: "Write in an educational, explanatory style that breaks down complex topics into understandable concepts. Use analogies and examples.",
      entertainment: "Write in an entertaining, engaging style with humor and personality. Use storytelling techniques and keep the audience engaged.",
      documentary: "Write in a documentary style with authoritative voice, detailed explanations, and historical context where relevant."
    };

    return `You are an expert content creator specializing in ${style} video scripts. Create a compelling script about "${topic}" that is exactly ${wordCount} words long.

Style: ${styleInstructions[style] || styleInstructions.news}

Requirements:
- Exactly ${wordCount} words
- Engaging opening hook
- Clear structure with beginning, middle, and end
- Natural speaking rhythm
- Include specific examples or statistics where relevant
- End with a strong conclusion or call to action
- Use language that works well for voiceover narration

Topic: ${topic}
Duration: ${duration} seconds
Style: ${style}

Script:`;
  }

  async generateWithClaude(prompt) {
    try {
      const response = await this.anthropic.messages.create({
        model: config.get('anthropic.model'),
        max_tokens: 2000,
        temperature: 0.7,
        messages: [{
          role: 'user',
          content: prompt
        }]
      });

      const script = response.content[0].text.trim();
      logger.info('Script generated with Claude');
      return script;
    } catch (error) {
      logger.error('Claude script generation failed:', error);
      throw error;
    }
  }

  async generateWithOpenAI(prompt) {
    try {
      const response = await this.openai.chat.completions.create({
        model: config.get('openai.model'),
        messages: [{
          role: 'user',
          content: prompt
        }],
        max_tokens: 2000,
        temperature: 0.7
      });

      const script = response.choices[0].message.content.trim();
      logger.info('Script generated with OpenAI');
      return script;
    } catch (error) {
      logger.error('OpenAI script generation failed:', error);
      throw error;
    }
  }

  async enhanceScript(script, improvements) {
    try {
      const prompt = `Please enhance the following script with these improvements: ${improvements}

Original script:
${script}

Enhanced script:`;

      if (this.anthropic) {
        return await this.generateWithClaude(prompt);
      } else if (this.openai) {
        return await this.generateWithOpenAI(prompt);
      } else {
        throw new Error('No AI service configured');
      }
    } catch (error) {
      logger.error('Script enhancement failed:', error);
      throw error;
    }
  }

  async generateTitle(script) {
    try {
      const prompt = `Generate a compelling, SEO-friendly title for this video script:

${script}

Title (max 60 characters):`;

      if (this.anthropic) {
        return await this.generateWithClaude(prompt);
      } else if (this.openai) {
        return await this.generateWithOpenAI(prompt);
      } else {
        throw new Error('No AI service configured');
      }
    } catch (error) {
      logger.error('Title generation failed:', error);
      throw error;
    }
  }

  async generateDescription(script, topic) {
    try {
      const prompt = `Generate a compelling video description for this script about "${topic}":

${script}

Description (2-3 sentences, max 160 characters):`;

      if (this.anthropic) {
        return await this.generateWithClaude(prompt);
      } else if (this.openai) {
        return await this.generateWithOpenAI(prompt);
      } else {
        throw new Error('No AI service configured');
      }
    } catch (error) {
      logger.error('Description generation failed:', error);
      throw error;
    }
  }

  async generateTags(script, topic) {
    try {
      const prompt = `Generate relevant hashtags and tags for this video script about "${topic}":

${script}

Tags (comma-separated, max 10):`;

      if (this.anthropic) {
        return await this.generateWithClaude(prompt);
      } else if (this.openai) {
        return await this.generateWithOpenAI(prompt);
      } else {
        throw new Error('No AI service configured');
      }
    } catch (error) {
      logger.error('Tag generation failed:', error);
      throw error;
    }
  }

  async checkHealth() {
    try {
      if (this.anthropic) {
        // Test Claude connection
        await this.anthropic.messages.create({
          model: config.get('anthropic.model'),
          max_tokens: 10,
          messages: [{ role: 'user', content: 'Hello' }]
        });
        return { status: 'healthy', service: 'claude' };
      } else if (this.openai) {
        // Test OpenAI connection
        await this.openai.models.list();
        return { status: 'healthy', service: 'openai' };
      } else {
        return { status: 'unavailable', service: 'none' };
      }
    } catch (error) {
      logger.error('AI service health check failed:', error);
      return { status: 'error', service: 'unknown', error: error.message };
    }
  }
}

module.exports = new AIService();
