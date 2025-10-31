import { useState, useEffect } from 'react';
import FileUpload from './components/FileUpload';
import CMGForm from './components/CMGForm';
import ClarificationModal from './components/ClarificationModal';
import SupportRedirect from './components/SupportRedirect';
import TrainingRedirect from './components/TrainingRedirect';
import SplashScreen from './components/SplashScreen';
import HelpGuide from './components/HelpGuide';
import {
  getFormOptions,
  analyzeContent,
  submitForm,
  enhanceDescription,
} from './api';
import type { CMGFormData, FormOptions, AnalysisResult } from './types';
import './App.css';

type AppStep = 'upload' | 'processing' | 'clarification' | 'redirect-support' | 'redirect-training' | 'form' | 'success';

function App() {
  const [step, setStep] = useState<AppStep>('upload');
  const [files, setFiles] = useState<File[]>([]);
  const [textInput, setTextInput] = useState<string>('');
  const [formOptions, setFormOptions] = useState<FormOptions | null>(null);
  const [formData, setFormData] = useState<Partial<CMGFormData>>({});
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [clarificationQuestions, setClarificationQuestions] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [showSplash, setShowSplash] = useState(false);
  const [isHelpExpanded, setIsHelpExpanded] = useState(true);

  useEffect(() => {
    // Check if this is first visit
    const hasSeenSplash = localStorage.getItem('cmg-intake-hide-splash');
    if (!hasSeenSplash) {
      setShowSplash(true);
    }

    // Load form options on mount
    const loadFormOptions = async () => {
      try {
        const options = await getFormOptions();
        setFormOptions(options);
      } catch (error) {
        console.error('Error loading form options:', error);
        setError('Failed to load form options');
      }
    };
    loadFormOptions();
  }, []);

  const handleEnhanceDescription = async () => {
    if (!textInput || textInput.trim().length === 0) {
      setError('Please enter a description to enhance');
      return;
    }

    setError(null);
    setIsEnhancing(true);

    try {
      const enhanced = await enhanceDescription(textInput);
      setTextInput(enhanced);
    } catch (error: any) {
      console.error('Error enhancing description:', error);
      setError(error.response?.data?.message || 'Failed to enhance description. Please check your OpenAI API key and try again.');
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleAnalyze = async () => {
    if (!textInput && files.length === 0) {
      setError('Please provide text or upload files to analyze');
      return;
    }

    setError(null);
    setStep('processing');

    try {
      const result = await analyzeContent(textInput, files);
      setAnalysisResult(result);
      setFormData(result.extractedData);

      // Check request type and route appropriately
      if (result.requestType === 'support' && result.requestTypeConfidence > 0.7) {
        setStep('redirect-support');
      } else if (result.requestType === 'training' && result.requestTypeConfidence > 0.7) {
        setStep('redirect-training');
      } else {
        // Skip clarification step - go straight to form for review
        setStep('form');
      }
    } catch (error: any) {
      console.error('Error analyzing content:', error);
      setError(error.response?.data?.message || 'Failed to analyze content. Please check your OpenAI API key and try again.');
      setStep('upload');
    }
  };

  const handleContinueToForm = () => {
    // User overrides AI classification and wants to proceed to CM form
    // Skip clarification step - go straight to form for review
    setStep('form');
  };

  const handleClarificationAnswer = async (answers: Record<string, string>) => {
    setStep('processing');

    try {
      // Combine answers with form data
      const answersText = Object.entries(answers)
        .map(([q, a]) => `Q: ${q}\nA: ${a}`)
        .join('\n\n');

      // Re-analyze with the additional context
      const result = await analyzeContent(
        `${textInput}\n\nAdditional Clarifications:\n${answersText}`,
        []
      );

      setFormData((prev) => ({ ...prev, ...result.extractedData }));
      setStep('form');
    } catch (error: any) {
      console.error('Error processing clarification:', error);
      setError('Failed to process clarification. Moving to form...');
      setStep('form');
    }
  };

  const handleSkipClarification = () => {
    setStep('form');
  };

  const handleFormSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await submitForm(formData as CMGFormData);
      setSubmissionId(result.submissionId || null);
      setStep('success');
    } catch (error: any) {
      console.error('Error submitting form:', error);
      setError(error.response?.data?.message || 'Failed to submit form');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setStep('upload');
    setFiles([]);
    setTextInput('');
    setFormData({});
    setAnalysisResult(null);
    setClarificationQuestions([]);
    setError(null);
    setSubmissionId(null);
  };

  return (
    <div className={`app ${!isHelpExpanded ? 'help-collapsed' : ''}`}>
      <header className="app-header">
        <div className="header-container">
          <div className="header-left">
            <div className="logo">
              <span className="logo-cmg">CMG</span>
              <span className="logo-financial">FINANCIAL</span>
            </div>
            <div className="header-divider"></div>
            <h1 className="header-title">Change Management Intake</h1>
          </div>
          <div className="header-right">
            <button className="btn-header-video" onClick={() => setShowSplash(true)}>
              <svg className="btn-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Watch Intro
            </button>
            <button className="btn-header" onClick={handleReset}>
              <svg className="btn-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create New Ticket
            </button>
            <button className="btn-header-secondary" onClick={handleReset}>
              <svg className="btn-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Start Over
            </button>
          </div>
        </div>
      </header>

      <main className="app-main">
        {error && (
          <div className="alert alert-error">
            <strong>Error:</strong> {error}
          </div>
        )}

        {step === 'upload' && (
          <div className="upload-section">
            <div className="section-header">
              <h2>Step 1: Provide Your Request Details</h2>
              <p>
                Drop documents, type your issue, or both. Our AI will extract the
                necessary information automatically.
              </p>
            </div>

            <div className="input-container">
              <label htmlFor="textInput" className="input-label">
                Describe Your Issue or Feature Request
              </label>
              <textarea
                id="textInput"
                className="text-input"
                placeholder="Paste or type your change request details here..."
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                rows={6}
              />
              <button
                className="enhance-btn"
                onClick={handleEnhanceDescription}
                disabled={!textInput || textInput.trim().length === 0 || isEnhancing}
                title="Use AI to improve and expand your description"
              >
                <svg
                  className="btn-icon"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
                {isEnhancing ? 'Enhancing...' : 'Enhance with AI'}
              </button>
            </div>

            <div className="divider">
              <span>AND/OR</span>
            </div>

            <FileUpload files={files} onFilesSelected={setFiles} />

            <div className="action-container">
              <button
                className="analyze-btn"
                onClick={handleAnalyze}
                disabled={!textInput && files.length === 0}
              >
                <svg
                  className="btn-icon"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                Analyze with AI
              </button>
            </div>
          </div>
        )}

        {step === 'processing' && (
          <div className="processing-section">
            <div className="spinner"></div>
            <h2>Analyzing Your Request...</h2>
            <p>Our AI is reading and extracting information from your content.</p>
          </div>
        )}

        {step === 'clarification' && analysisResult && (
          <ClarificationModal
            questions={clarificationQuestions}
            missingFields={analysisResult.missingFields}
            onAnswer={handleClarificationAnswer}
            onSkip={handleSkipClarification}
          />
        )}

        {step === 'redirect-support' && analysisResult && (
          <SupportRedirect
            reason={analysisResult.requestTypeReason}
            onContinueToForm={handleContinueToForm}
            onGoBack={handleReset}
          />
        )}

        {step === 'redirect-training' && analysisResult && (
          <TrainingRedirect
            reason={analysisResult.requestTypeReason}
            onContinueToForm={handleContinueToForm}
            onGoBack={handleReset}
          />
        )}

        {step === 'form' && (
          <div className="form-section">
            {analysisResult && (
              <div className="alert alert-info">
                <strong>AI Confidence:</strong>{' '}
                {(analysisResult.confidence * 100).toFixed(0)}%
                <br />
                Review the extracted information and make any necessary corrections
                before submitting.
              </div>
            )}

            <CMGForm
              formData={formData}
              formOptions={formOptions}
              onChange={setFormData}
              onSubmit={handleFormSubmit}
              isSubmitting={isSubmitting}
            />

            <div className="form-footer">
              <button className="btn-secondary" onClick={handleReset}>
                Start Over
              </button>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="success-section">
            <div className="success-icon">✓</div>
            <h2>Request Submitted Successfully!</h2>
            <p>
              Your change management request has been submitted and is being
              processed.
            </p>
            {submissionId && (
              <div className="submission-info">
                <strong>Submission ID:</strong> {submissionId}
              </div>
            )}
            <button className="btn-primary" onClick={handleReset}>
              Submit Another Request
            </button>
          </div>
        )}
      </main>

      <footer className="app-footer">
        <p>
          Powered by OpenAI GPT-4 • Built for CMG Change Management
        </p>
      </footer>

      {/* Help Guide Sidebar */}
      <HelpGuide
        onWatchVideo={() => setShowSplash(true)}
        onToggle={(expanded) => setIsHelpExpanded(expanded)}
      />

      {/* Splash Screen */}
      {showSplash && <SplashScreen onClose={() => setShowSplash(false)} />}
    </div>
  );
}

export default App;
