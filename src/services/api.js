const API_BASE_URL = 'http://localhost:3000/api';

class ApiService {
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // Video Generation
  async generateVideo(videoData) {
    try {
      const response = await this.request('/generate', {
        method: 'POST',
        body: JSON.stringify(videoData),
      });
      
      // Ensure the response has the expected structure
      if (response && typeof response === 'object') {
        return response;
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (error) {
      console.error('Error in generateVideo:', error);
      throw error;
    }
  }

  async getVideoStatus(jobId) {
    return this.request(`/status/${jobId}`);
  }

  async cancelVideoGeneration(jobId) {
    return this.request(`/cancel/${jobId}`, {
      method: 'POST',
    });
  }

  // Video Management
  async getVideos() {
    try {
      const response = await this.request('/videos');
      // Ensure we return an array
      return Array.isArray(response) ? response : [];
    } catch (error) {
      console.error('Error fetching videos:', error);
      return [];
    }
  }

  async getVideo(id) {
    return this.request(`/videos/${id}`);
  }

  async deleteVideo(id) {
    return this.request(`/videos/${id}`, {
      method: 'DELETE',
    });
  }

  // Configuration
  async getConfig() {
    return this.request('/config');
  }

  async updateConfig(configData) {
    return this.request('/config', {
      method: 'PUT',
      body: JSON.stringify(configData),
    });
  }

  // Health Check
  async healthCheck() {
    return this.request('/health');
  }

  // System Status
  async getSystemStatus() {
    return this.request('/system/status');
  }

  // Reddit Integration
  async getRedditTopics(subreddit = 'all', limit = 10) {
    try {
      const response = await this.request(`/reddit/topics?subreddit=${subreddit}&limit=${limit}`);
      return response;
    } catch (error) {
      console.error('Error fetching Reddit topics:', error);
      return { success: false, topics: [], count: 0 };
    }
  }

  // AI Services
  async generateScript(topic, style = 'news', duration = 60) {
    return this.request('/ai/script', {
      method: 'POST',
      body: JSON.stringify({ topic, style, duration }),
    });
  }

  // Image Services
  async searchImages(query, count = 10) {
    return this.request(`/images/search?query=${encodeURIComponent(query)}&count=${count}`);
  }

  // TTS Services
  async generateAudio(text, voice = 'default') {
    return this.request('/tts/generate', {
      method: 'POST',
      body: JSON.stringify({ text, voice }),
    });
  }

  // Caption Services
  async generateCaptions(videoId, options = {}) {
    return this.request(`/captions/${videoId}`, {
      method: 'POST',
      body: JSON.stringify(options),
    });
  }

  // File Upload
  async uploadFile(file, type = 'image') {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    return this.request('/upload', {
      method: 'POST',
      headers: {}, // Let browser set Content-Type for FormData
      body: formData,
    });
  }

  // Batch Operations
  async generateBatchVideos(videoConfigs) {
    return this.request('/batch/generate', {
      method: 'POST',
      body: JSON.stringify({ videos: videoConfigs }),
    });
  }

  async getBatchStatus(batchId) {
    return this.request(`/batch/${batchId}/status`);
  }
}

// Create and export a singleton instance
const apiService = new ApiService();

// Export individual functions for convenience
export const generateVideo = (videoData) => apiService.generateVideo(videoData);
export const getVideoStatus = (jobId) => apiService.getVideoStatus(jobId);
export const cancelVideoGeneration = (jobId) => apiService.cancelVideoGeneration(jobId);
export const getVideos = () => apiService.getVideos();
export const getVideo = (id) => apiService.getVideo(id);
export const deleteVideo = (id) => apiService.deleteVideo(id);
export const getConfig = () => apiService.getConfig();
export const updateConfig = (configData) => apiService.updateConfig(configData);
export const healthCheck = () => apiService.healthCheck();
export const getSystemStatus = () => apiService.getSystemStatus();
export const getRedditTopics = (subreddit, limit) => apiService.getRedditTopics(subreddit, limit);
export const generateScript = (topic, style, duration) => apiService.generateScript(topic, style, duration);
export const searchImages = (query, count) => apiService.searchImages(query, count);
export const generateAudio = (text, voice) => apiService.generateAudio(text, voice);
export const generateCaptions = (videoId, options) => apiService.generateCaptions(videoId, options);
export const uploadFile = (file, type) => apiService.uploadFile(file, type);
export const generateBatchVideos = (videoConfigs) => apiService.generateBatchVideos(videoConfigs);
export const getBatchStatus = (batchId) => apiService.getBatchStatus(batchId);

export default apiService;
