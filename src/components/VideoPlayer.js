import React from 'react';

const VideoPlayer = ({ video }) => {
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="video-player">
      <div className="video-info">
        <h4 className="video-title">{video.filename}</h4>
        <div className="video-details">
          <p><strong>Size:</strong> {formatFileSize(video.size)}</p>
          <p><strong>Created:</strong> {formatDate(video.created)}</p>
          <p><strong>Modified:</strong> {formatDate(video.modified)}</p>
        </div>
      </div>

      <div className="video-controls">
        <video 
          controls 
          className="video-element"
          preload="metadata"
        >
          <source src={video.path} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>

      <div className="video-actions">
        <a 
          href={video.path} 
          download={video.filename}
          className="download-link"
        >
          📥 Download
        </a>
        <button 
          onClick={() => {
            const videoElement = document.querySelector('.video-element');
            if (videoElement) {
              videoElement.requestFullscreen();
            }
          }}
          className="fullscreen-btn"
        >
          🔍 Fullscreen
        </button>
      </div>
    </div>
  );
};

export default VideoPlayer;
