import React, { useState } from 'react';

const VideoPlayer = ({ videos, currentVideo, onVideoSelect }) => {
  const [selectedVideo, setSelectedVideo] = useState(currentVideo);

  const handleVideoSelect = (video) => {
    setSelectedVideo(video);
    onVideoSelect(video);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (videos.length === 0) {
    return (
      <div className="video-player">
        <h2 className="card-title">🎥 Video Library</h2>
        <div className="card">
          <div className="text-center">
            <p>No videos generated yet</p>
            <p className="text-muted">Generate your first video to see it here</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="video-player">
      <h2 className="card-title">🎥 Video Library</h2>
      
      {selectedVideo && (
        <div className="main-video">
          <div className="card">
            <h3 className="card-title">Currently Playing</h3>
            <video 
              controls 
              className="video-element"
              poster={selectedVideo.thumbnail}
            >
              <source src={`http://localhost:3000/videos/${selectedVideo.filename}`} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
            
            <div className="video-info">
              <h4>{selectedVideo.title}</h4>
              <div className="video-metadata">
                <div className="metadata-item">
                  <strong>Duration:</strong> {formatDuration(selectedVideo.duration)}
                </div>
                <div className="metadata-item">
                  <strong>Size:</strong> {formatFileSize(selectedVideo.fileSize)}
                </div>
                <div className="metadata-item">
                  <strong>Resolution:</strong> {selectedVideo.resolution}
                </div>
                <div className="metadata-item">
                  <strong>Generated:</strong> {new Date(selectedVideo.createdAt).toLocaleString()}
                </div>
                <div className="metadata-item">
                  <strong>Topic:</strong> {selectedVideo.topic}
                </div>
                <div className="metadata-item">
                  <strong>Style:</strong> {selectedVideo.style}
                </div>
              </div>
              
              {selectedVideo.script && (
                <div className="video-script">
                  <h5>Script:</h5>
                  <p>{selectedVideo.script}</p>
                </div>
              )}
              
              <div className="video-actions">
                <button 
                  className="btn"
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = `http://localhost:3000/videos/${selectedVideo.filename}`;
                    link.download = selectedVideo.filename;
                    link.click();
                  }}
                >
                  📥 Download
                </button>
                <button 
                  className="btn btn-secondary"
                  onClick={() => {
                    navigator.clipboard.writeText(`http://localhost:3000/videos/${selectedVideo.filename}`);
                  }}
                >
                  🔗 Copy Link
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="video-list">
        <h3>All Videos ({videos.length})</h3>
        <div className="video-grid">
          {videos.map((video, index) => (
            <div 
              key={video.id || index}
              className={`video-item card ${selectedVideo?.id === video.id ? 'selected' : ''}`}
              onClick={() => handleVideoSelect(video)}
            >
              <div className="video-thumbnail-container">
                <img 
                  src={video.thumbnail || '/api/placeholder/300/200'} 
                  alt={video.title}
                  className="video-thumbnail"
                />
                <div className="video-duration">
                  {formatDuration(video.duration)}
                </div>
              </div>
              
              <div className="video-item-info">
                <h4 className="video-item-title">{video.title}</h4>
                <p className="video-item-topic">{video.topic}</p>
                <div className="video-item-meta">
                  <span className="video-item-style">{video.style}</span>
                  <span className="video-item-date">
                    {new Date(video.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
