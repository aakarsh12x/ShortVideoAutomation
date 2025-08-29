import React, { useState } from 'react';
import { generateVideo } from '../services/api';

const VideoGenerator = ({ onVideoGenerated, socket, selectedTopic, onTopicChange }) => {
  const [formData, setFormData] = useState({
    topic: selectedTopic || '',
    duration: 60,
    style: 'news',
    includeCaptions: true,
    customScript: ''
  });

  // Update form when selectedTopic changes
  React.useEffect(() => {
    if (selectedTopic) {
      setFormData(prev => ({ ...prev, topic: selectedTopic }));
    }
  }, [selectedTopic]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentJobId, setCurrentJobId] = useState(null);
  const [error, setError] = useState(null);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));
    
    // Update parent component if topic changes
    if (name === 'topic' && onTopicChange) {
      onTopicChange(newValue);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsGenerating(true);
    setError(null);

    try {
      const response = await generateVideo(formData);
      
      // Check if response has the expected structure
      if (response && response.jobId) {
        setCurrentJobId(response.jobId);
        
        // Poll for job completion instead of WebSocket
        const pollInterval = setInterval(async () => {
          try {
            const statusResponse = await fetch(`http://localhost:3000/api/status/${response.jobId}`);
            if (statusResponse.ok) {
              const jobStatus = await statusResponse.json();
              if (jobStatus.status === 'completed') {
                clearInterval(pollInterval);
                setIsGenerating(false);
                setCurrentJobId(null);
                if (onVideoGenerated && typeof onVideoGenerated === 'function') {
                  onVideoGenerated(jobStatus.result);
                }
              } else if (jobStatus.status === 'error') {
                clearInterval(pollInterval);
                setError(jobStatus.error || 'Video generation failed');
                setIsGenerating(false);
                setCurrentJobId(null);
              }
            }
          } catch (err) {
            console.error('Error polling job status:', err);
          }
        }, 2000); // Poll every 2 seconds
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (error) {
      console.error('Error generating video:', error);
      setError(error.message || 'Failed to start video generation');
      setIsGenerating(false);
      setCurrentJobId(null);
    }
  };

  const handleCancel = () => {
    if (currentJobId && socket) {
      socket.emit('cancel_job', { jobId: currentJobId });
      setIsGenerating(false);
      setCurrentJobId(null);
    }
  };

  return (
    <div className="video-generator">
      <h2 className="card-title">🎬 Generate New Video</h2>
      
      {error && (
        <div className="error-message" style={{
          backgroundColor: '#fee2e2',
          color: '#991b1b',
          padding: '12px',
          borderRadius: '8px',
          marginBottom: '16px',
          border: '1px solid #fca5a5'
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="generator-form">
        <div className="form-group">
          <label htmlFor="topic" className="form-label">
            Topic or Keyword
          </label>
          <input
            type="text"
            id="topic"
            name="topic"
            value={formData.topic}
            onChange={handleInputChange}
            className="form-input"
            placeholder="e.g., AI technology, climate change, space exploration"
            required
            disabled={isGenerating}
          />
        </div>

        <div className="form-group">
          <label htmlFor="duration" className="form-label">
            Video Duration (seconds)
          </label>
          <select
            id="duration"
            name="duration"
            value={formData.duration}
            onChange={handleInputChange}
            className="form-select"
            disabled={isGenerating}
          >
            <option value={30}>30 seconds</option>
            <option value={60}>1 minute</option>
            <option value={90}>1.5 minutes</option>
            <option value={120}>2 minutes</option>
            <option value={180}>3 minutes</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="style" className="form-label">
            Video Style
          </label>
          <select
            id="style"
            name="style"
            value={formData.style}
            onChange={handleInputChange}
            className="form-select"
            disabled={isGenerating}
          >
            <option value="news">News Style</option>
            <option value="social">Social Media</option>
            <option value="educational">Educational</option>
            <option value="entertainment">Entertainment</option>
            <option value="documentary">Documentary</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">
            <input
              type="checkbox"
              name="includeCaptions"
              checked={formData.includeCaptions}
              onChange={handleInputChange}
              disabled={isGenerating}
              style={{ marginRight: '8px' }}
            />
            Include Synchronized Captions
          </label>
        </div>

        <div className="form-group">
          <label htmlFor="customScript" className="form-label">
            Custom Script (Optional)
          </label>
          <textarea
            id="customScript"
            name="customScript"
            value={formData.customScript}
            onChange={handleInputChange}
            className="form-textarea"
            placeholder="Enter your custom script here, or leave blank to auto-generate..."
            disabled={isGenerating}
          />
        </div>

        <div className="form-actions">
          {!isGenerating ? (
            <button type="submit" className="btn">
              🚀 Generate Video
            </button>
          ) : (
            <div className="flex gap-2">
              <button type="button" className="btn" disabled>
                <span className="loading">⏳</span> Generating...
              </button>
              <button type="button" className="btn btn-secondary" onClick={handleCancel}>
                Cancel
              </button>
            </div>
          )}
        </div>
      </form>

      {isGenerating && (
        <div className="generation-info">
          <p className="text-center">
            <strong>Job ID:</strong> {currentJobId}
          </p>
          <p className="text-center">
            Your video is being generated. This may take a few minutes...
          </p>
        </div>
      )}
    </div>
  );
};

export default VideoGenerator;
