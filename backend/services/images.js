const axios = require('axios');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const logger = require('../logger');
const config = require('../config');

class ImageService {
  constructor() {
    this.pexelsApiKey = config.get('images.pexelsApiKey');
    this.unsplashAccessKey = config.get('images.unsplashAccessKey');
    this.pixabayApiKey = config.get('images.pixabayApiKey');
  }

  async searchImages(query, count = 10) {
    try {
      const images = [];
      const perService = Math.ceil(count / 3);

      // Try Pexels first
      if (this.pexelsApiKey) {
        try {
          const pexelsImages = await this.searchPexels(query, perService);
          images.push(...pexelsImages);
        } catch (error) {
          logger.warn('Pexels search failed:', error.message);
        }
      }

      // Try Unsplash
      if (this.unsplashAccessKey && images.length < count) {
        try {
          const unsplashImages = await this.searchUnsplash(query, perService);
          images.push(...unsplashImages);
        } catch (error) {
          logger.warn('Unsplash search failed:', error.message);
        }
      }

      // Try Pixabay
      if (this.pixabayApiKey && images.length < count) {
        try {
          const pixabayImages = await this.searchPixabay(query, perService);
          images.push(...pixabayImages);
        } catch (error) {
          logger.warn('Pixabay search failed:', error.message);
        }
      }

      // If we don't have enough images, generate fallback images
      if (images.length < count) {
        const fallbackImages = await this.generateFallbackImages(query, count - images.length);
        images.push(...fallbackImages);
      }

      // Limit to requested count
      const result = images.slice(0, count);
      logger.info(`Retrieved ${result.length} images for query: ${query}`);
      return result;
    } catch (error) {
      logger.error('Image search failed:', error);
      throw error;
    }
  }

  async searchPexels(query, count) {
    try {
      const response = await axios.get('https://api.pexels.com/v1/search', {
        headers: {
          'Authorization': this.pexelsApiKey
        },
        params: {
          query,
          per_page: count,
          orientation: 'landscape'
        }
      });

      return response.data.photos.map(photo => ({
        id: `pexels_${photo.id}`,
        url: photo.src.large,
        thumbnail: photo.src.medium,
        photographer: photo.photographer,
        photographerUrl: photo.photographer_url,
        source: 'pexels',
        width: photo.width,
        height: photo.height,
        alt: photo.alt || query
      }));
    } catch (error) {
      logger.error('Pexels API error:', error.response?.data || error.message);
      throw error;
    }
  }

  async searchUnsplash(query, count) {
    try {
      const response = await axios.get('https://api.unsplash.com/search/photos', {
        headers: {
          'Authorization': `Client-ID ${this.unsplashAccessKey}`
        },
        params: {
          query,
          per_page: count,
          orientation: 'landscape'
        }
      });

      return response.data.results.map(photo => ({
        id: `unsplash_${photo.id}`,
        url: photo.urls.regular,
        thumbnail: photo.urls.thumb,
        photographer: photo.user.name,
        photographerUrl: photo.user.links.html,
        source: 'unsplash',
        width: photo.width,
        height: photo.height,
        alt: photo.alt_description || query
      }));
    } catch (error) {
      logger.error('Unsplash API error:', error.response?.data || error.message);
      throw error;
    }
  }

  async searchPixabay(query, count) {
    try {
      const response = await axios.get('https://pixabay.com/api/', {
        params: {
          key: this.pixabayApiKey,
          q: query,
          per_page: count,
          orientation: 'horizontal',
          image_type: 'photo',
          category: 'backgrounds'
        }
      });

      return response.data.hits.map(photo => ({
        id: `pixabay_${photo.id}`,
        url: photo.largeImageURL,
        thumbnail: photo.previewURL,
        photographer: photo.user,
        photographerUrl: `https://pixabay.com/users/${photo.user}-${photo.user_id}/`,
        source: 'pixabay',
        width: photo.imageWidth,
        height: photo.imageHeight,
        alt: photo.tags || query
      }));
    } catch (error) {
      logger.error('Pixabay API error:', error.response?.data || error.message);
      throw error;
    }
  }

  async generateFallbackImages(query, count) {
    try {
      const images = [];
      const outputDir = path.join(__dirname, '../../temp/fallback_images');
      
      // Ensure output directory exists
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      for (let i = 0; i < count; i++) {
        const imageId = `fallback_${Date.now()}_${i}`;
        const imagePath = path.join(outputDir, `${imageId}.jpg`);
        
        // Generate a simple gradient image
        await sharp({
          create: {
            width: 1920,
            height: 1080,
            channels: 3,
            background: this.getRandomGradient()
          }
        })
        .jpeg({ quality: 80 })
        .toFile(imagePath);

        images.push({
          id: imageId,
          url: `/temp/fallback_images/${imageId}.jpg`,
          thumbnail: `/temp/fallback_images/${imageId}.jpg`,
          photographer: 'AI Generated',
          photographerUrl: '',
          source: 'fallback',
          width: 1920,
          height: 1080,
          alt: `${query} - AI Generated`
        });
      }

      logger.info(`Generated ${count} fallback images for query: ${query}`);
      return images;
    } catch (error) {
      logger.error('Fallback image generation failed:', error);
      throw error;
    }
  }

  getRandomGradient() {
    const gradients = [
      { r: 102, g: 126, b: 234 }, // Blue
      { r: 118, g: 75, b: 162 }, // Purple
      { r: 255, g: 107, b: 107 }, // Red
      { r: 78, g: 205, b: 196 }, // Teal
      { r: 255, g: 195, b: 113 }, // Orange
      { r: 199, g: 125, b: 255 }, // Light Purple
      { r: 116, g: 185, b: 255 }, // Light Blue
      { r: 255, g: 159, b: 243 }  // Pink
    ];
    
    return gradients[Math.floor(Math.random() * gradients.length)];
  }

  async downloadImage(imageUrl, filename) {
    try {
      const response = await axios.get(imageUrl, { responseType: 'stream' });
      const outputPath = path.join(__dirname, '../../temp', filename);
      
      const writer = fs.createWriteStream(outputPath);
      response.data.pipe(writer);
      
      return new Promise((resolve, reject) => {
        writer.on('finish', () => resolve(outputPath));
        writer.on('error', reject);
      });
    } catch (error) {
      logger.error('Image download failed:', error);
      throw error;
    }
  }

  async resizeImage(imagePath, width, height) {
    try {
      const outputPath = imagePath.replace(/\.[^/.]+$/, '_resized.jpg');
      
      await sharp(imagePath)
        .resize(width, height, { fit: 'cover' })
        .jpeg({ quality: 90 })
        .toFile(outputPath);
      
      return outputPath;
    } catch (error) {
      logger.error('Image resize failed:', error);
      throw error;
    }
  }

  async checkHealth() {
    try {
      const services = [];
      
      if (this.pexelsApiKey) {
        try {
          await axios.get('https://api.pexels.com/v1/search', {
            headers: { 'Authorization': this.pexelsApiKey },
            params: { query: 'test', per_page: 1 }
          });
          services.push({ name: 'pexels', status: 'healthy' });
        } catch (error) {
          services.push({ name: 'pexels', status: 'error', error: error.message });
        }
      } else {
        services.push({ name: 'pexels', status: 'unavailable' });
      }

      if (this.unsplashAccessKey) {
        try {
          await axios.get('https://api.unsplash.com/search/photos', {
            headers: { 'Authorization': `Client-ID ${this.unsplashAccessKey}` },
            params: { query: 'test', per_page: 1 }
          });
          services.push({ name: 'unsplash', status: 'healthy' });
        } catch (error) {
          services.push({ name: 'unsplash', status: 'error', error: error.message });
        }
      } else {
        services.push({ name: 'unsplash', status: 'unavailable' });
      }

      if (this.pixabayApiKey) {
        try {
          await axios.get('https://pixabay.com/api/', {
            params: { key: this.pixabayApiKey, q: 'test', per_page: 1 }
          });
          services.push({ name: 'pixabay', status: 'healthy' });
        } catch (error) {
          services.push({ name: 'pixabay', status: 'error', error: error.message });
        }
      } else {
        services.push({ name: 'pixabay', status: 'unavailable' });
      }

      return { status: 'healthy', services };
    } catch (error) {
      logger.error('Image service health check failed:', error);
      return { status: 'error', error: error.message };
    }
  }
}

module.exports = new ImageService();

