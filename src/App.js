import React, { useState, useEffect } from 'react';
import './App.css';
import VideoGenerator from './components/VideoGenerator';
import ProgressTracker from './components/ProgressTracker';
import VideoPlayer from './components/VideoPlayer';
import TrendingTopics from './components/TrendingTopics';
// Removed socket.io to fix connection flooding

function App() {
  const [socket, setSocket] = useState(null);
  const [progress, setProgress] = useState({});
  const [generatedVideos, setGeneratedVideos] = useState([]);
  const [currentVideo, setCurrentVideo] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState('');

  useEffect(() => {
    // Load existing videos on startup
    fetchVideos();
    
    // Set up polling for progress updates instead of WebSockets
    const interval = setInterval(() => {
      fetchVideos();
    }, 5000); // Poll every 5 seconds
    
    return () => clearInterval(interval);
  }, []);

  const fetchVideos = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/videos');
      if (response.ok) {
        const videos = await response.json();
        setGeneratedVideos(videos);
      }
    } catch (error) {
      console.error('Error fetching videos:', error);
    }
  };

  const handleVideoGenerated = (videoData) => {
    setGeneratedVideos(prev => [...prev, videoData]);
    setCurrentVideo(videoData);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>🎬 ReelAutomation</h1>
        <p>AI-Powered Video Generation Platform</p>
      </header>

      <main className="App-main">
        <div className="main-content">
          <div className="topics-section">
            <TrendingTopics onTopicSelect={setSelectedTopic} />
          </div>
          <div className="generator-section">
            <VideoGenerator 
              onVideoGenerated={handleVideoGenerated}
              socket={socket}
              selectedTopic={selectedTopic}
              onTopicChange={setSelectedTopic}
            />
          </div>

          <div className="progress-section">
            <ProgressTracker progress={progress} />
          </div>

          <div className="player-section">
            <VideoPlayer 
              videos={generatedVideos}
              currentVideo={currentVideo}
              onVideoSelect={setCurrentVideo}
            />
          </div>
        </div>
      </main>

      <footer className="App-footer">
        <p>&copy; 2024 ReelAutomation - AI Video Generation</p>
      </footer>
    </div>
  );
}

export default App;
