import React, { useState } from 'react';

interface HelpGuideProps {
  onToggle: (expanded: boolean) => void;
}

const HelpGuide: React.FC<HelpGuideProps> = ({ onToggle }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);

  const handleToggle = () => {
    const newState = !isExpanded;
    setIsExpanded(newState);
    onToggle(newState);
  };

  const handlePlayVideo = () => {
    if (videoRef.current) {
      videoRef.current.play();
      setIsVideoPlaying(true);
    }
  };

  const handleVideoPause = () => {
    setIsVideoPlaying(false);
  };

  return (
    <div className={`help-guide ${!isExpanded ? 'collapsed' : ''}`}>
      <button
        className="help-toggle"
        onClick={handleToggle}
        aria-label={isExpanded ? 'Hide help' : 'Show help'}
      >
        {isExpanded ? (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: '20px', height: '20px' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Hide Guide</span>
          </>
        ) : (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: '20px', height: '20px' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Help</span>
          </>
        )}
      </button>

      <div className="help-content">
        <h3>Quick Start Guide</h3>

        <div className="help-section">
          <h4>📝 Step 1: Describe Your Request</h4>
          <p>Type your issue or paste details in the text area. You can also upload documents like PDFs or images.</p>
        </div>

        <div className="help-section">
          <h4>⚡ Step 2: AI Analysis</h4>
          <p>Our AI automatically reads your request and determines if it's a change management, support, or training issue.</p>
        </div>

        <div className="help-section">
          <h4>🎯 Step 3: Smart Routing</h4>
          <ul>
            <li><strong>Support Issues:</strong> Redirects to help desk</li>
            <li><strong>Training:</strong> Links to learning resources</li>
            <li><strong>Changes:</strong> Pre-fills CM form for you</li>
          </ul>
        </div>

        <div className="help-section">
          <h4>✅ Step 4: Review & Submit</h4>
          <p>Check the pre-filled information, make any edits, and submit your request.</p>
        </div>

        <div className="help-video-container">
          <video
            ref={videoRef}
            className="help-embedded-video"
            onPause={handleVideoPause}
            onPlay={() => setIsVideoPlaying(true)}
            controls
          >
            <source src="/demo-video.mp4" type="video/mp4" />
          </video>
          {!isVideoPlaying && (
            <button className="video-play-overlay" onClick={handlePlayVideo}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            </button>
          )}
        </div>

        <div className="help-tips">
          <h4>💡 Pro Tips</h4>
          <ul>
            <li>Be specific about your issue</li>
            <li>Mention system names when possible</li>
            <li>Upload screenshots for clarity</li>
            <li>Use the "Enhance with AI" button for better descriptions</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default HelpGuide;
