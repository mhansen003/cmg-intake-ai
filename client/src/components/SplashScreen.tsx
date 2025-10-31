import React from 'react';

interface SplashScreenProps {
  onClose: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onClose }) => {
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="splash-overlay" onClick={handleOverlayClick}>
      <div className="splash-modal">
        <button className="splash-close" onClick={onClose} aria-label="Close">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="splash-header">
          <div className="splash-logo">
            <span className="logo-cmg">CMG</span>
            <span className="logo-financial">FINANCIAL</span>
          </div>
          <h1>Welcome to AI-Powered Change Management</h1>
          <p>Watch this quick intro to see how it works</p>
        </div>

        <div className="splash-video">
          <video
            controls
            playsInline
            className="demo-video"
          >
            <source src="/demo-video.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>

        <div className="splash-footer">
          <button className="btn-splash-primary" onClick={onClose}>
            Get Started
          </button>
          <label className="splash-checkbox">
            <input
              type="checkbox"
              onChange={(e) => {
                if (e.target.checked) {
                  localStorage.setItem('cmg-intake-hide-splash', 'true');
                }
              }}
            />
            <span>Don't show this again</span>
          </label>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
