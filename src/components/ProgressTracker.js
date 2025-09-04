import React from 'react';

const ProgressTracker = ({ progress }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'status-pending';
      case 'processing': return 'status-processing';
      case 'completed': return 'status-completed';
      case 'error': return 'status-error';
      default: return 'status-pending';
    }
  };

  const getProgressPercentage = (stage, totalStages = 6) => {
    const stageProgress = {
      'topic_discovery': 16.67,
      'script_generation': 33.33,
      'image_collection': 50,
      'audio_generation': 66.67,
      'caption_sync': 83.33,
      'video_assembly': 100
    };
    return stageProgress[stage] || 0;
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const progressEntries = Object.entries(progress);

  if (progressEntries.length === 0) {
    return (
      <div className="progress-tracker">
        <h2 className="card-title">📊 Progress Tracker</h2>
        <div className="card">
          <div className="text-center">
            <p>No active video generation jobs</p>
            <p className="text-muted">Start generating a video to see progress here</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="progress-tracker">
      <h2 className="card-title">📊 Progress Tracker</h2>
      
      {progressEntries.map(([jobId, jobProgress]) => (
        <div key={jobId} className="card">
          <div className="card-header">
            <h3 className="card-title">Job: {jobId.slice(0, 8)}...</h3>
            <span className={`status ${getStatusColor(jobProgress.status)}`}>
              {jobProgress.status}
            </span>
          </div>
          
          <div className="card-content">
            <div className="progress-info">
              <div className="progress-stage">
                <strong>Current Stage:</strong> {jobProgress.currentStage || 'Initializing'}
              </div>
              
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ 
                    width: `${getProgressPercentage(jobProgress.currentStage)}%` 
                  }}
                ></div>
              </div>
              
              <div className="progress-details">
                <div className="progress-item">
                  <span className="progress-label">Started:</span>
                  <span className="progress-value">{formatTime(jobProgress.startTime)}</span>
                </div>
                
                {jobProgress.currentStage && (
                  <div className="progress-item">
                    <span className="progress-label">Current Stage:</span>
                    <span className="progress-value">{jobProgress.currentStage.replace('_', ' ')}</span>
                  </div>
                )}
                
                {jobProgress.estimatedTimeRemaining && (
                  <div className="progress-item">
                    <span className="progress-label">ETA:</span>
                    <span className="progress-value">{jobProgress.estimatedTimeRemaining}</span>
                  </div>
                )}
              </div>
            </div>
            
            {jobProgress.message && (
              <div className="progress-message">
                <strong>Status:</strong> {jobProgress.message}
              </div>
            )}
            
            {jobProgress.error && (
              <div className="progress-error">
                <strong>Error:</strong> {jobProgress.error}
              </div>
            )}
            
            {jobProgress.stages && (
              <div className="stages-list">
                <h4>Generation Stages:</h4>
                <ul>
                  {Object.entries(jobProgress.stages).map(([stage, stageData]) => (
                    <li key={stage} className={`stage-item ${stageData.completed ? 'completed' : stageData.active ? 'active' : 'pending'}`}>
                      <span className="stage-icon">
                        {stageData.completed ? '✅' : stageData.active ? '⏳' : '⏸️'}
                      </span>
                      <span className="stage-name">{stage.replace('_', ' ')}</span>
                      {stageData.duration && (
                        <span className="stage-duration">({stageData.duration}ms)</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProgressTracker;

