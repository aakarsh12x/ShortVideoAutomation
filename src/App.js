import React, { useState, useEffect } from 'react';
import './App.css';
import TrendingTopics from './components/TrendingTopics';
import VideoGenerator from './components/VideoGenerator';
import ProgressTracker from './components/ProgressTracker';
import VideoPlayer from './components/VideoPlayer';

function App() {
  const [selectedTopic, setSelectedTopic] = useState('');
  const [currentJob, setCurrentJob] = useState(null);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch videos on component mount
  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      const response = await fetch('/api/videos');
      const data = await response.json();
      if (data.success) {
        setVideos(data.videos);
      }
    } catch (error) {
      console.error('Failed to fetch videos:', error);
    }
  };

  const handleTopicSelect = (topic) => {
    setSelectedTopic(topic);
    setError(null);
  };

  const handleVideoGeneration = async (topic, includeCaptions) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic,
          includeCaptions,
          videoDuration: 30
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setCurrentJob({
          id: data.jobId,
          topic,
          status: 'starting',
          progress: 0
        });
        
        // Start polling for status
        pollJobStatus(data.jobId);
      } else {
        setError(data.error || 'Failed to start video generation');
      }
    } catch (error) {
      setError('Network error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const pollJobStatus = async (jobId) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/status/${jobId}`);
        const data = await response.json();
        
        if (data.success) {
          const job = data.job;
          setCurrentJob(job);
          
          if (job.status === 'completed') {
            clearInterval(pollInterval);
            fetchVideos(); // Refresh video list
            setSelectedTopic('');
          } else if (job.status === 'failed') {
            clearInterval(pollInterval);
            setError(job.error || 'Video generation failed');
          }
        } else {
          clearInterval(pollInterval);
          setError('Failed to get job status');
        }
      } catch (error) {
        clearInterval(pollInterval);
        setError('Network error while checking status');
      }
    }, 2000); // Poll every 2 seconds
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>🎬 ShortVideoAutomation</h1>
        <p>Generate engaging videos from trending Reddit topics</p>
      </header>

      <main className="App-main">
        <div className="container">
          <div className="left-panel">
            <TrendingTopics 
              onTopicSelect={handleTopicSelect}
              selectedTopic={selectedTopic}
            />
          </div>

          <div className="right-panel">
            <VideoGenerator
              selectedTopic={selectedTopic}
              onGenerate={handleVideoGeneration}
              loading={loading}
            />

            {currentJob && (
              <ProgressTracker 
                job={currentJob}
                onComplete={() => setCurrentJob(null)}
              />
            )}

            {error && (
              <div className="error-message">
                <h3>❌ Error</h3>
                <p>{error}</p>
              </div>
            )}

            {videos.length > 0 && (
              <div className="videos-section">
                <h3>📹 Generated Videos</h3>
                <div className="videos-grid">
                  {videos.map((video, index) => (
                    <VideoPlayer 
                      key={index}
                      video={video}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="App-footer">
        <p>&copy; 2024 ShortVideoAutomation - Beta Version</p>
      </footer>
    </div>
  );
}

export default App;
