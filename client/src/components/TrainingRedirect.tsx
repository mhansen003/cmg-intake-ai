import React from 'react';

interface TrainingRedirectProps {
  reason: string;
  onContinueToForm: () => void;
  onGoBack: () => void;
}

const TrainingRedirect: React.FC<TrainingRedirectProps> = ({ reason, onContinueToForm, onGoBack }) => {
  const handleOpenTraining = () => {
    // Open training portal in new tab
    window.open('https://training.cmgfi.com', '_blank');
  };

  const handleOpenGuides = () => {
    // Open user guides in new tab
    window.open('https://training.cmgfi.com/guides', '_blank');
  };

  const handleOpenVideos = () => {
    // Open video library in new tab
    window.open('https://training.cmgfi.com/videos', '_blank');
  };

  return (
    <div className="redirect-overlay">
      <div className="redirect-modal">
        <div className="redirect-header training-header">
          <div className="redirect-icon training-icon">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h2>Training Resources Available</h2>
          <p className="redirect-subtitle">This looks like a training or how-to question</p>
        </div>

        <div className="redirect-content">
          <div className="reason-box">
            <strong>Why we're recommending training:</strong>
            <p>{reason}</p>
          </div>

          <div className="redirect-options">
            <h3>Learn At Your Own Pace</h3>
            <p className="options-description">
              We have comprehensive training resources to help you master our systems:
            </p>

            <div className="option-cards training-cards">
              <div className="option-card primary-option">
                <div className="option-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h4>Training Portal</h4>
                <p>Access courses, certifications, and live training sessions</p>
                <button className="option-btn primary" onClick={handleOpenTraining}>
                  <svg className="btn-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Open Training Portal
                </button>
              </div>

              <div className="option-card">
                <div className="option-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h4>User Guides</h4>
                <p>Step-by-step guides and documentation for all systems</p>
                <button className="option-btn secondary" onClick={handleOpenGuides}>
                  <svg className="btn-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  Browse Guides
                </button>
              </div>

              <div className="option-card">
                <div className="option-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <h4>Video Tutorials</h4>
                <p>Watch instructional videos and recorded training sessions</p>
                <button className="option-btn secondary" onClick={handleOpenVideos}>
                  <svg className="btn-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Watch Videos
                </button>
              </div>
            </div>

            <div className="quick-links">
              <h4>Popular Topics:</h4>
              <div className="topic-tags">
                <span className="topic-tag">Byte Training</span>
                <span className="topic-tag">LOS Basics</span>
                <span className="topic-tag">Underwriting Process</span>
                <span className="topic-tag">Disclosure Requirements</span>
                <span className="topic-tag">Closing Procedures</span>
              </div>
            </div>
          </div>

          <div className="redirect-footer">
            <p className="footer-note">
              <strong>Still need to submit a change request?</strong> You can continue to the Change Management form if needed.
            </p>
            <div className="footer-buttons">
              <button className="go-back-btn" onClick={onGoBack}>
                <svg className="btn-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Go Back & Edit Request
              </button>
              <button className="continue-btn" onClick={onContinueToForm}>
                <svg className="btn-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                Continue to CM Form Anyway
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrainingRedirect;
