import React, { useState } from 'react';
import { sendSupportEmail } from '../api';

interface SupportRedirectProps {
  reason: string;
  requestText?: string;
  attachmentPaths?: string[];
  onContinueToForm: () => void;
  onGoBack: () => void;
}

const SupportRedirect: React.FC<SupportRedirectProps> = ({
  reason,
  requestText,
  attachmentPaths,
  onContinueToForm,
  onGoBack
}) => {
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [fromEmail, setFromEmail] = useState('');
  const [fromName, setFromName] = useState('');
  const [subject, setSubject] = useState('Application Support Request');
  const [body, setBody] = useState(requestText || '');
  const [isSending, setIsSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendEmail = async () => {
    if (!fromEmail || !subject || !body) {
      setError('Please fill in all required fields');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(fromEmail)) {
      setError('Please enter a valid email address');
      return;
    }

    setError(null);
    setIsSending(true);

    try {
      await sendSupportEmail({
        fromEmail,
        fromName,
        subject,
        body,
        filePaths: attachmentPaths
      });

      setEmailSent(true);
    } catch (error: any) {
      console.error('Error sending support email:', error);
      setError(error.response?.data?.message || 'Failed to send email. Please try again or contact support directly.');
    } finally {
      setIsSending(false);
    }
  };

  if (emailSent) {
    return (
      <div className="redirect-overlay">
        <div className="redirect-modal">
          <div className="redirect-header success-header">
            <div className="redirect-icon success-icon">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2>Email Sent Successfully!</h2>
            <p className="redirect-subtitle">Our support team will respond to your request shortly</p>
          </div>

          <div className="redirect-content">
            <div className="success-message">
              <p>Your support request has been sent to <strong>appsupport@cmgfi.com</strong></p>
              <p>You should receive a confirmation email at <strong>{fromEmail}</strong></p>
              <p className="response-time">Average response time: 2 hours during business hours</p>
            </div>

            <div className="redirect-footer">
              <button className="go-back-btn" onClick={onGoBack}>
                <svg className="btn-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Start New Request
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (showEmailForm) {
    return (
      <div className="redirect-overlay">
        <div className="redirect-modal email-modal">
          <div className="redirect-header support-header">
            <div className="redirect-icon support-icon">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2>Send Support Email</h2>
            <p className="redirect-subtitle">Fill in your details to send your request to our support team</p>
          </div>

          <div className="redirect-content">
            {error && (
              <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
                <strong>Error:</strong> {error}
              </div>
            )}

            <div className="email-form">
              <div className="form-group">
                <label htmlFor="fromEmail" className="form-label required">Your Email</label>
                <input
                  type="email"
                  id="fromEmail"
                  className="form-input"
                  placeholder="your.email@cmgfi.com"
                  value={fromEmail}
                  onChange={(e) => setFromEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="fromName" className="form-label">Your Name (Optional)</label>
                <input
                  type="text"
                  id="fromName"
                  className="form-input"
                  placeholder="John Doe"
                  value={fromName}
                  onChange={(e) => setFromName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="subject" className="form-label required">Subject</label>
                <input
                  type="text"
                  id="subject"
                  className="form-input"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="body" className="form-label required">Description of Issue</label>
                <textarea
                  id="body"
                  className="form-textarea"
                  rows={8}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  required
                />
              </div>

              {attachmentPaths && attachmentPaths.length > 0 && (
                <div className="form-group">
                  <label className="form-label">Attachments ({attachmentPaths.length})</label>
                  <div className="attachment-list">
                    {attachmentPaths.map((path, index) => (
                      <div key={index} className="attachment-item">
                        <svg className="attachment-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                        <span>{path.split(/[/\\]/).pop()}</span>
                      </div>
                    ))}
                  </div>
                  <p className="attachment-note">These files will be attached to your support email</p>
                </div>
              )}

              <div className="email-info">
                <p><strong>To:</strong> appsupport@cmgfi.com</p>
                <p className="email-note">Our support team typically responds within 2 hours during business hours</p>
              </div>
            </div>

            <div className="redirect-footer">
              <button
                className="go-back-btn"
                onClick={() => setShowEmailForm(false)}
                disabled={isSending}
              >
                <svg className="btn-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
              <button
                className="send-email-btn"
                onClick={handleSendEmail}
                disabled={isSending || !fromEmail || !subject || !body}
              >
                {isSending ? (
                  <>
                    <div className="spinner-small"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <svg className="btn-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    Send Email
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
                <p>Send your request directly to our support team with all your details and attachments</p>
                <button className="option-btn primary" onClick={() => setShowEmailForm(true)}>
                  <svg className="btn-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Send Support Email
                </button>
                <div className="contact-info">
                  <strong>Email:</strong> appsupport@cmgfi.com
                  <br />
                  <span className="response-time">Response time: ~2 hours</span>
                </div>
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
