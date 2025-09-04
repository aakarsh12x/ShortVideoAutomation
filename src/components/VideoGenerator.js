import React, { useState } from 'react';

const VideoGenerator = ({ selectedTopic, onGenerate, loading }) => {
  const [includeCaptions, setIncludeCaptions] = useState(true);
  const [customTopic, setCustomTopic] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const topic = selectedTopic || customTopic.trim();
    if (!topic) {
      alert('Please select a topic or enter a custom topic');
      return;
    }

    onGenerate(topic, includeCaptions);
  };

  const handleCustomTopicChange = (e) => {
    setCustomTopic(e.target.value);
  };

  return (
    <div className="video-generator">
      <h3>🎬 Generate Video</h3>
      
      <form onSubmit={handleSubmit} className="generator-form">
        <div className="form-group">
          <label htmlFor="topic">Topic:</label>
          {selectedTopic ? (
            <div className="selected-topic-display">
              <span>{selectedTopic}</span>
              <button 
                type="button" 
                onClick={() => window.location.reload()}
                className="change-topic-btn"
              >
                Change
              </button>
            </div>
          ) : (
            <input
              type="text"
              id="topic"
              value={customTopic}
              onChange={handleCustomTopicChange}
              placeholder="Enter a topic for video generation"
              required
            />
          )}
        </div>

        <div className="form-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={includeCaptions}
              onChange={(e) => setIncludeCaptions(e.target.checked)}
            />
            Include captions in video
          </label>
        </div>

        <div className="form-group">
          <button 
            type="submit" 
            disabled={loading || (!selectedTopic && !customTopic.trim())}
            className={`generate-btn ${loading ? 'loading' : ''}`}
          >
            {loading ? 'Generating...' : 'Generate Video'}
          </button>
        </div>
      </form>

      {loading && (
        <div className="generation-info">
          <p>⏳ Video generation in progress...</p>
          <p>This may take 2-3 minutes. Please wait.</p>
        </div>
      )}

      <div className="generator-info">
        <h4>What happens next?</h4>
        <ol>
          <li>AI generates an engaging script about your topic</li>
          <li>Text-to-speech converts the script to audio</li>
          <li>Images are collected from multiple sources</li>
          <li>FFmpeg assembles everything into a video</li>
          <li>Your video will be ready for download!</li>
        </ol>
      </div>
    </div>
  );
};

export default VideoGenerator;
