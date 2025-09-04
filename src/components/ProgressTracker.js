import React from 'react';

const ProgressTracker = ({ job, onComplete }) => {
  const getStepStatus = (stepName) => {
    const step = job.steps?.find(s => s.step === stepName);
    if (!step) return 'pending';
    return step.status;
  };

  const getStepIcon = (status) => {
    switch (status) {
      case 'completed': return '✅';
      case 'started': return '⏳';
      case 'failed': return '❌';
      default: return '⏸️';
    }
  };

  const getStepColor = (status) => {
    switch (status) {
      case 'completed': return '#10b981';
      case 'started': return '#f59e0b';
      case 'failed': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const steps = [
    { name: 'script', label: 'Generating Script', description: 'AI creating engaging content' },
    { name: 'audio', label: 'Creating Audio', description: 'Converting text to speech' },
    { name: 'images', label: 'Collecting Images', description: 'Gathering relevant visuals' },
    { name: 'video', label: 'Assembling Video', description: 'FFmpeg processing and merging' }
  ];

  return (
    <div className="progress-tracker">
      <h3>📊 Generation Progress</h3>
      
      <div className="job-info">
        <p><strong>Job ID:</strong> {job.id}</p>
        <p><strong>Topic:</strong> {job.topic}</p>
        <p><strong>Status:</strong> {job.status}</p>
        <p><strong>Progress:</strong> {job.progress}%</p>
      </div>

      <div className="progress-bar">
        <div 
          className="progress-fill" 
          style={{ width: `${job.progress}%` }}
        ></div>
      </div>

      <div className="steps-list">
        {steps.map((step, index) => {
          const status = getStepStatus(step.name);
          const icon = getStepIcon(status);
          const color = getStepColor(status);
          
          return (
            <div key={index} className={`step-item ${status}`}>
              <div className="step-icon" style={{ color }}>
                {icon}
              </div>
              <div className="step-content">
                <div className="step-label">{step.label}</div>
                <div className="step-description">{step.description}</div>
                <div className="step-status">{status}</div>
              </div>
            </div>
          );
        })}
      </div>

      {job.status === 'completed' && job.video && (
        <div className="completion-info">
          <h4>✅ Video Generated Successfully!</h4>
          <div className="video-details">
            <p><strong>Filename:</strong> {job.video.filename}</p>
            <p><strong>Size:</strong> {(job.video.size / 1024 / 1024).toFixed(2)} MB</p>
            <p><strong>Duration:</strong> {job.video.duration} seconds</p>
            <p><strong>Images Used:</strong> {job.video.imagesUsed}</p>
            <p><strong>Audio Source:</strong> {job.video.audioSource}</p>
          </div>
          <a 
            href={`/output/${job.video.filename}`} 
            download 
            className="download-btn"
          >
            📥 Download Video
          </a>
        </div>
      )}

      {job.status === 'failed' && (
        <div className="error-info">
          <h4>❌ Generation Failed</h4>
          <p className="error-message">{job.error}</p>
          <button onClick={onComplete} className="dismiss-btn">
            Dismiss
          </button>
        </div>
      )}

      {job.status === 'completed' && (
        <button onClick={onComplete} className="dismiss-btn">
          Dismiss
        </button>
      )}
    </div>
  );
};

export default ProgressTracker;
