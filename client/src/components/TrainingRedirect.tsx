import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface TrainingRedirectProps {
  reason: string;
  userRequest: string; // The original user's issue description
  onContinueToForm: () => void;
  onGoBack: () => void;
}

interface TrainingRecommendation {
  title: string;
  url: string;
  description: string;
  duration: string;
  reason: string;
}

interface TrainingRecommendations {
  primaryRecommendation: TrainingRecommendation;
  additionalRecommendations: TrainingRecommendation[];
  quickAccessLinks: Array<{
    title: string;
    url: string;
    description: string;
  }>;
  summary: string;
}

const TrainingRedirect: React.FC<TrainingRedirectProps> = ({
  reason,
  userRequest,
  onContinueToForm,
  onGoBack
}) => {
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState<TrainingRecommendations | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setLoading(true);
        // Use relative URL to work in both dev and production
        const response = await axios.post('/api/recommend-training', {
          userIssue: userRequest
        });

        if (response.data.success) {
          setRecommendations(response.data.recommendations);
        }
      } catch (err) {
        console.error('Error fetching training recommendations:', err);
        setError('Failed to load personalized recommendations');
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [userRequest]);

  const handleOpenCourse = (url: string) => {
    window.open(url, '_blank');
  };

  return (
    <div className="redirect-overlay">
      <div className="redirect-modal training-redirect-modal">
        <div className="redirect-header training-header">
          <div className="redirect-icon training-icon">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h2>🎓 Training Resources Recommended</h2>
          <p className="redirect-subtitle">AI-Powered Personalized Learning Path</p>
        </div>

        <div className="redirect-content">
          <div className="reason-box">
            <strong>Why we're recommending training:</strong>
            <p>{reason}</p>
          </div>

          {loading && (
            <div className="loading-recommendations">
              <div className="spinner"></div>
              <p>Analyzing your request and finding the best training resources...</p>
            </div>
          )}

          {error && (
            <div className="error-box">
              <p>{error}</p>
              <p>You can still browse our training portal manually.</p>
              <button
                className="option-btn primary"
                onClick={() => window.open('https://www.thinkithub.com', '_blank')}
              >
                Open Training Portal
              </button>
            </div>
          )}

          {!loading && !error && recommendations && (
            <>
              <div className="ai-summary">
                <div className="ai-badge">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 4.5a.75.75 0 01.721.544l.813 2.846a3.75 3.75 0 002.576 2.576l2.846.813a.75.75 0 010 1.442l-2.846.813a3.75 3.75 0 00-2.576 2.576l-.813 2.846a.75.75 0 01-1.442 0l-.813-2.846a3.75 3.75 0 00-2.576-2.576l-2.846-.813a.75.75 0 010-1.442l2.846-.813A3.75 3.75 0 007.466 7.89l.813-2.846A.75.75 0 019 4.5zM18 1.5a.75.75 0 01.728.568l.258 1.036c.236.94.97 1.674 1.91 1.91l1.036.258a.75.75 0 010 1.456l-1.036.258c-.94.236-1.674.97-1.91 1.91l-.258 1.036a.75.75 0 01-1.456 0l-.258-1.036a2.625 2.625 0 00-1.91-1.91l-1.036-.258a.75.75 0 010-1.456l1.036-.258a2.625 2.625 0 001.91-1.91l.258-1.036A.75.75 0 0118 1.5zM16.5 15a.75.75 0 01.712.513l.394 1.183c.15.447.5.799.948.948l1.183.395a.75.75 0 010 1.422l-1.183.395c-.447.15-.799.5-.948.948l-.395 1.183a.75.75 0 01-1.422 0l-.395-1.183a1.5 1.5 0 00-.948-.948l-1.183-.395a.75.75 0 010-1.422l1.183-.395c.447-.15.799-.5.948-.948l.395-1.183A.75.75 0 0116.5 15z" />
                  </svg>
                  AI Recommended
                </div>
                <p>{recommendations.summary}</p>
              </div>

              {/* Primary Recommendation */}
              {recommendations.primaryRecommendation && (
                <div className="primary-training-card">
                  <div className="card-badge">Top Pick For You</div>
                  <h3>{recommendations.primaryRecommendation.title}</h3>
                  <div className="course-meta">
                    <span className="duration">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {recommendations.primaryRecommendation.duration}
                    </span>
                  </div>
                  <p className="course-description">{recommendations.primaryRecommendation.description}</p>
                  <div className="why-this-course">
                    <strong>Why this course?</strong>
                    <p>{recommendations.primaryRecommendation.reason}</p>
                  </div>
                  <button
                    className="start-course-btn"
                    onClick={() => handleOpenCourse(recommendations.primaryRecommendation.url)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                      <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
                    </svg>
                    Start This Course
                  </button>
                </div>
              )}

              {/* Additional Recommendations */}
              {recommendations.additionalRecommendations && recommendations.additionalRecommendations.length > 0 && (
                <div className="additional-recommendations">
                  <h4>More Recommended Training</h4>
                  <div className="training-cards-grid">
                    {recommendations.additionalRecommendations.map((course, index) => (
                      <div key={index} className="training-card">
                        <h5>{course.title}</h5>
                        <div className="course-meta">
                          <span className="duration">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {course.duration}
                          </span>
                        </div>
                        <p className="course-description">{course.description}</p>
                        <button
                          className="view-course-btn"
                          onClick={() => handleOpenCourse(course.url)}
                        >
                          View Course
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Access Links */}
              {recommendations.quickAccessLinks && recommendations.quickAccessLinks.length > 0 && (
                <div className="quick-access-section">
                  <h4>Quick Access Resources</h4>
                  <div className="quick-access-links">
                    {recommendations.quickAccessLinks.map((link, index) => (
                      <button
                        key={index}
                        className="quick-access-link"
                        onClick={() => handleOpenCourse(link.url)}
                      >
                        <div>
                          <strong>{link.title}</strong>
                          <p>{link.description}</p>
                        </div>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

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
