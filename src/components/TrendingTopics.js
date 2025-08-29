import React, { useEffect, useState } from 'react';
import { getRedditTopics } from '../services/api';

const TrendingTopics = ({ onTopicSelect }) => {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const res = await getRedditTopics('all', 10);
        if (!isMounted) return;
        if (res && res.success && Array.isArray(res.topics)) {
          setTopics(res.topics);
        } else {
          setError('Failed to load topics');
        }
      } catch (e) {
        setError('Failed to load topics');
      } finally {
        setLoading(false);
      }
    })();
    return () => { isMounted = false; };
  }, []);

  if (loading) return <div className="card"><div className="card-title">Trending Topics</div><div>Loading...</div></div>;
  if (error) return <div className="card"><div className="card-title">Trending Topics</div><div style={{color:'#991b1b'}}>{error}</div></div>;

  return (
    <div className="card">
      <div className="card-title">🔥 Trending Topics</div>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '8px' }}>
        {topics.map((t, idx) => (
          <li key={idx} 
              onClick={() => onTopicSelect && onTopicSelect(t)}
              style={{
                padding: '12px 16px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                background: '#fff',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                ':hover': {
                  background: '#f3f4f6',
                  borderColor: '#2563eb'
                }
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#f3f4f6';
                e.target.style.borderColor = '#2563eb';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = '#fff';
                e.target.style.borderColor = '#e5e7eb';
              }}>
            <span style={{ fontWeight: '500', color: '#1f2937' }}>{t}</span>
            <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
              Click to use this topic
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TrendingTopics;


