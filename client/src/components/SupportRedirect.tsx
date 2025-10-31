import React from 'react';

interface SupportRedirectProps {
  reason: string;
  onContinueToForm: () => void;
  onGoBack: () => void;
}

const SupportRedirect: React.FC<SupportRedirectProps> = ({ reason, onContinueToForm, onGoBack }) => {
  const handleContactSupport = () => {
    // Open email client or support portal
    window.location.href = 'mailto:appsupport@cmgfi.com?subject=Application Support Request';
  };

  const handleOpenSupportPortal = () => {
    // Open support portal in new tab
    window.open('https://support.cmgfi.com', '_blank');
  };

  return (
    <div className="redirect-overlay">
      <div className="redirect-modal">
        <div className="redirect-header support-header">
          <div className="redirect-icon support-icon">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <h2>Application Support Needed</h2>
          <p className="redirect-subtitle">This looks like an application support issue rather than a change request</p>
        </div>

        <div className="redirect-content">
          <div className="reason-box">
            <strong>Why we're recommending support:</strong>
            <p>{reason}</p>
          </div>

          <div className="redirect-options">
            <h3>Get Help Faster</h3>
            <p className="options-description">
              For application support issues, our dedicated support team can help you immediately:
            </p>

            <div className="option-cards">
              <div className="option-card primary-option">
                <div className="option-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h4>Email App Support</h4>
                <p>Send an email to our support team and get a response within 2 hours</p>
                <button className="option-btn primary" onClick={handleContactSupport}>
                  <svg className="btn-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Contact Support
                </button>
                <div className="contact-info">
                  <strong>Email:</strong> appsupport@cmgfi.com
                </div>
              </div>

              <div className="option-card">
                <div className="option-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                </div>
                <h4>Support Portal</h4>
                <p>Access our help center with FAQs, troubleshooting guides, and ticket tracking</p>
                <button className="option-btn secondary" onClick={handleOpenSupportPortal}>
                  <svg className="btn-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Open Portal
                </button>
              </div>
            </div>
          </div>

          <div className="redirect-footer">
            <p className="footer-note">
              <strong>Still think this is a change request?</strong> You can continue to the Change Management form if needed.
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

export default SupportRedirect;
