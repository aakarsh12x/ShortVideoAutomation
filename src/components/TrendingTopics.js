import React, { useState, useEffect } from 'react';

const TrendingTopics = ({ onTopicSelect, selectedTopic }) => {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTopics();
  }, []);

  const fetchTopics = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/reddit/topics');
      const data = await response.json();
      
      if (data.success) {
        setTopics(data.topics);
      } else {
        setError('Failed to fetch topics');
      }
    } catch (error) {
      setError('Network error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTopicClick = (topic) => {
    onTopicSelect(topic);
  };

  if (loading) {
    return (
      <div className="trending-topics">
        <h3>🎯 Trending Topics</h3>
        <div className="loading">Loading topics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="trending-topics">
        <h3>🎯 Trending Topics</h3>
        <div className="error">Error: {error}</div>
        <button onClick={fetchTopics} className="retry-btn">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="trending-topics">
      <h3>🎯 Trending Topics</h3>
      <p>Click on a topic to select it for video generation</p>
      
      <div className="topics-list">
        {topics.map((topic, index) => (
          <div
            key={index}
            className={`topic-item ${selectedTopic === topic ? 'selected' : ''}`}
            onClick={() => handleTopicClick(topic)}
          >
            <span className="topic-number">#{index + 1}</span>
            <span className="topic-name">{topic}</span>
            {selectedTopic === topic && <span className="selected-indicator">✓</span>}
          </div>
        ))}
      </div>
      
      {selectedTopic && (
        <div className="selected-topic-info">
          <h4>Selected Topic:</h4>
          <p className="selected-topic">{selectedTopic}</p>
        </div>
      )}
    </div>
  );
};

export default TrendingTopics;
