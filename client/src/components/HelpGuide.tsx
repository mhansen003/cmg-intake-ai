import React, { useState } from 'react';

interface HelpGuideProps {
  onWatchVideo: () => void;
}

const HelpGuide: React.FC<HelpGuideProps> = ({ onWatchVideo }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <>
      <div className={`help-guide ${isExpanded ? 'expanded' : ''}`}>
        <button
          className="help-toggle"
          onClick={() => setIsExpanded(!isExpanded)}
          aria-label={isExpanded ? 'Hide help' : 'Show help'}
        >
          {isExpanded ? (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Help</span>
            </>
          )}
        </button>
      </div>

      <div className={`help-guide ${isExpanded ? 'expanded' : ''}`}>
        <div className="help-content">
          <button
            className="help-close"
            onClick={() => setIsExpanded(false)}
            aria-label="Close help"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
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

          <button className="help-video-btn" onClick={onWatchVideo}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Watch Intro Video
          </button>

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
    </>
  );
};

export default HelpGuide;
