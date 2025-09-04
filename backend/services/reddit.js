const snoowrap = require('snoowrap');
const logger = require('../logger');
const config = require('../config');

class RedditService {
  constructor() {
    this.client = null;
    this.initializeClient();
  }

  initializeClient() {
    try {
      if (config.get('reddit.clientId') && config.get('reddit.clientSecret')) {
        this.client = new snoowrap({
          userAgent: config.get('reddit.userAgent'),
          clientId: config.get('reddit.clientId'),
          clientSecret: config.get('reddit.clientSecret'),
          refreshToken: config.get('reddit.refreshToken') || null
        });
        logger.info('Reddit client initialized');
      } else {
        logger.warn('Reddit credentials not configured');
      }
    } catch (error) {
      logger.error('Failed to initialize Reddit client:', error);
    }
  }

  async getTrendingTopics(subreddit = 'all', limit = 10) {
    try {
      if (!this.client) {
        throw new Error('Reddit client not initialized');
      }

      const subredditObj = await this.client.getSubreddit(subreddit);
      const posts = await subredditObj.getHot({ limit });

      const topics = posts.map(post => ({
        id: post.id,
        title: post.title,
        score: post.score,
        numComments: post.num_comments,
        author: post.author.name,
        subreddit: post.subreddit.display_name,
        url: post.url,
        permalink: post.permalink,
        created: new Date(post.created_utc * 1000).toISOString(),
        selftext: post.selftext,
        isVideo: post.is_video,
        isImage: post.post_hint === 'image',
        thumbnail: post.thumbnail,
        flair: post.link_flair_text
      }));

      logger.info(`Retrieved ${topics.length} trending topics from r/${subreddit}`);
      return topics;
    } catch (error) {
      logger.error('Failed to get trending topics:', error);
      throw error;
    }
  }

  async getTopPosts(subreddit = 'all', timeFilter = 'day', limit = 10) {
    try {
      if (!this.client) {
        throw new Error('Reddit client not initialized');
      }

      const subredditObj = await this.client.getSubreddit(subreddit);
      const posts = await subredditObj.getTop({ time: timeFilter, limit });

      const topics = posts.map(post => ({
        id: post.id,
        title: post.title,
        score: post.score,
        numComments: post.num_comments,
        author: post.author.name,
        subreddit: post.subreddit.display_name,
        url: post.url,
        permalink: post.permalink,
        created: new Date(post.created_utc * 1000).toISOString(),
        selftext: post.selftext,
        isVideo: post.is_video,
        isImage: post.post_hint === 'image',
        thumbnail: post.thumbnail,
        flair: post.link_flair_text
      }));

      logger.info(`Retrieved ${topics.length} top posts from r/${subreddit}`);
      return topics;
    } catch (error) {
      logger.error('Failed to get top posts:', error);
      throw error;
    }
  }

  async searchPosts(query, subreddit = 'all', limit = 10) {
    try {
      if (!this.client) {
        throw new Error('Reddit client not initialized');
      }

      const subredditObj = await this.client.getSubreddit(subreddit);
      const posts = await subredditObj.search({ query, limit });

      const topics = posts.map(post => ({
        id: post.id,
        title: post.title,
        score: post.score,
        numComments: post.num_comments,
        author: post.author.name,
        subreddit: post.subreddit.display_name,
        url: post.url,
        permalink: post.permalink,
        created: new Date(post.created_utc * 1000).toISOString(),
        selftext: post.selftext,
        isVideo: post.is_video,
        isImage: post.post_hint === 'image',
        thumbnail: post.thumbnail,
        flair: post.link_flair_text
      }));

      logger.info(`Retrieved ${topics.length} search results for "${query}"`);
      return topics;
    } catch (error) {
      logger.error('Failed to search posts:', error);
      throw error;
    }
  }

  async getSubredditInfo(subreddit) {
    try {
      if (!this.client) {
        throw new Error('Reddit client not initialized');
      }

      const subredditObj = await this.client.getSubreddit(subreddit);
      const info = await subredditObj.fetch();

      return {
        name: info.display_name,
        title: info.title,
        description: info.public_description,
        subscribers: info.subscribers,
        activeUsers: info.accounts_active,
        created: new Date(info.created_utc * 1000).toISOString(),
        language: info.lang,
        over18: info.over18,
        type: info.subreddit_type
      };
    } catch (error) {
      logger.error('Failed to get subreddit info:', error);
      throw error;
    }
  }

  async getPopularSubreddits(limit = 20) {
    try {
      if (!this.client) {
        throw new Error('Reddit client not initialized');
      }

      const subreddits = await this.client.getPopularSubreddits({ limit });
      
      const popularSubs = subreddits.map(sub => ({
        name: sub.display_name,
        title: sub.title,
        description: sub.public_description,
        subscribers: sub.subscribers,
        activeUsers: sub.accounts_active,
        over18: sub.over18,
        type: sub.subreddit_type
      }));

      logger.info(`Retrieved ${popularSubs.length} popular subreddits`);
      return popularSubs;
    } catch (error) {
      logger.error('Failed to get popular subreddits:', error);
      throw error;
    }
  }

  async getComments(postId, limit = 10) {
    try {
      if (!this.client) {
        throw new Error('Reddit client not initialized');
      }

      const post = await this.client.getSubmission(postId);
      await post.expandReplies({ limit, depth: 2 });

      const comments = post.comments.map(comment => ({
        id: comment.id,
        author: comment.author.name,
        body: comment.body,
        score: comment.score,
        created: new Date(comment.created_utc * 1000).toISOString(),
        replies: comment.replies ? comment.replies.map(reply => ({
          id: reply.id,
          author: reply.author.name,
          body: reply.body,
          score: reply.score,
          created: new Date(reply.created_utc * 1000).toISOString()
        })) : []
      }));

      logger.info(`Retrieved ${comments.length} comments for post ${postId}`);
      return comments;
    } catch (error) {
      logger.error('Failed to get comments:', error);
      throw error;
    }
  }

  async checkHealth() {
    try {
      if (!this.client) {
        return { status: 'unavailable', service: 'reddit', error: 'Client not initialized' };
      }

      // Test connection by getting a simple subreddit
      await this.client.getSubreddit('all').fetch();
      return { status: 'healthy', service: 'reddit' };
    } catch (error) {
      logger.error('Reddit health check failed:', error);
      return { status: 'error', service: 'reddit', error: error.message };
    }
  }
}

module.exports = new RedditService();

