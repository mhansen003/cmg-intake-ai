import { useState, useEffect } from 'react';
import FileUpload from './components/FileUpload';
import CMGForm from './components/CMGForm';
import ClarificationModal from './components/ClarificationModal';
import SupportRedirect from './components/SupportRedirect';
import TrainingRedirect from './components/TrainingRedirect';
import HelpGuide from './components/HelpGuide';
import EnhancementWizard from './components/EnhancementWizard';
import {
  getFormOptions,
  analyzeContent,
  submitForm,
  enhanceDescription,
  generateWizardQuestions,
  uploadAdditionalFiles,
} from './api';
import type { CMGFormData, FormOptions, AnalysisResult } from './types';
import { formatWizardAnswers } from './utils/wizardQuestions';
import type { WizardQuestion } from './api';
import './App.css';

type AppStep = 'upload' | 'processing' | 'clarification' | 'wizard' | 'redirect-support' | 'redirect-training' | 'form' | 'success';

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
  const [adoWorkItem, setAdoWorkItem] = useState<{ id: number; url: string } | null>(null);
  const [isHelpExpanded, setIsHelpExpanded] = useState(true);
  const [wizardQuestions, setWizardQuestions] = useState<WizardQuestion[]>([]);
  const [additionalFiles, setAdditionalFiles] = useState<File[]>([]); // Last-minute attachments

  useEffect(() => {
    // Toggle body class based on help panel state
    if (isHelpExpanded) {
      document.body.classList.remove('help-collapsed');
    } else {
      document.body.classList.add('help-collapsed');
    }
  }, [isHelpExpanded]);

  useEffect(() => {
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
      setFormData({ ...result.extractedData, sendConfirmation: true }); // Default to sending confirmation

      // Check request type and route appropriately
      if (result.requestType === 'support' && result.requestTypeConfidence > 0.7) {
        setStep('redirect-support');
      } else if (result.requestType === 'training' && result.requestTypeConfidence > 0.7) {
        setStep('redirect-training');
      } else {
        // For change management requests, generate AI-powered clarification questions
        setStep('processing'); // Show loading while generating questions
        try {
          const questions = await generateWizardQuestions(
            result.extractedData.title || '',
            result.extractedData.description || ''
          );
          console.log('Received questions:', questions);

          if (questions && questions.length > 0) {
            setWizardQuestions(questions);
            setStep('wizard');
          } else {
            console.warn('No questions returned, skipping wizard');
            setStep('form');
          }
        } catch (error) {
          console.error('Error generating wizard questions:', error);
          // Fallback: skip wizard and go to form
          setStep('form');
        }
      }
    } catch (error: any) {
      console.error('Error analyzing content:', error);
      setError(error.response?.data?.message || 'Failed to analyze content. Please check your OpenAI API key and try again.');
      setStep('upload');
    }
  };

  const handleContinueToForm = async () => {
    // User overrides AI classification and wants to proceed to CM form
    // Show wizard first for change management requests
    if (formData.title || formData.description) {
      setStep('processing'); // Show loading
      try {
        const questions = await generateWizardQuestions(
          formData.title || '',
          formData.description || ''
        );
        console.log('Received questions:', questions);

        if (questions && questions.length > 0) {
          setWizardQuestions(questions);
          setStep('wizard');
        } else {
          console.warn('No questions returned, skipping wizard');
          setStep('form');
        }
      } catch (error) {
        console.error('Error generating wizard questions:', error);
        // Fallback: go directly to form
        setStep('form');
      }
    } else {
      setStep('form');
    }
  };

  const handleWizardComplete = (answers: Record<string, string>) => {
    // Enhance description with wizard answers
    const enhancedDescription = formatWizardAnswers(
      formData.description || '',
      answers
    );

    // Update form data with enhanced description
    setFormData((prev) => ({
      ...prev,
      description: enhancedDescription,
    }));

    // Proceed to form
    setStep('form');
  };

  const handleWizardSkip = () => {
    // User skipped wizard, go directly to form
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
      // Upload additional files if any
      let additionalFilePaths: string[] = [];
      if (additionalFiles.length > 0) {
        console.log('Uploading additional files:', additionalFiles.length);
        additionalFilePaths = await uploadAdditionalFiles(additionalFiles);
        console.log('Additional files uploaded:', additionalFilePaths);
      }

      // Combine original file paths with additional file paths
      const allFilePaths = [
        ...(analysisResult?.filePaths || []),
        ...additionalFilePaths
      ];

      const result = await submitForm(
        formData as CMGFormData,
        allFilePaths
      );
      setSubmissionId(result.submissionId || null);
      setAdoWorkItem(result.adoWorkItem || null);
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
    setAdoWorkItem(null);
    setAdditionalFiles([]); // Clear additional files
  };

  const handleGoBackToUpload = () => {
    // Go back to upload step without clearing user data
    setStep('upload');
    setError(null);
  };

  return (
    <div className="app">
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
            <div className="header-phone-section">
              <svg className="phone-icon-header" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <span className="phone-label-header">Need help?</span>
              <a href="tel:+19495233372" className="phone-number-header">
                949-523-3372
              </a>
            </div>
            <div className="header-divider"></div>
            <button className="btn-header" onClick={handleReset}>
              <svg className="btn-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Request
            </button>
            <button className="btn-header-secondary" onClick={handleReset}>
              <svg className="btn-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Reset
            </button>
          </div>
        </div>
      </header>

      <div className="app-content-wrapper">
        {/* Help Guide Sidebar */}
        <HelpGuide
          onToggle={(expanded) => setIsHelpExpanded(expanded)}
        />

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
              <div className="input-header">
                <label htmlFor="textInput" className="input-label">
                  Describe Your Issue or Feature Request
                </label>
                <button
                  className={`enhance-btn enhance-btn-compact ${isEnhancing ? 'loading' : ''}`}
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
              <textarea
                id="textInput"
                className="text-input"
                placeholder="Paste or type your change request details here..."
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                rows={6}
              />
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
                Step 2: Analyze with AI
              </button>
            </div>
          </div>
        )}

        {step === 'processing' && (
          <div className="processing-section">
            <div className="spinner"></div>
            <h2>{analysisResult ? 'Preparing Clarification Questions...' : 'Analyzing Your Request...'}</h2>
            <p>{analysisResult ? 'Generating targeted questions to complete your request.' : 'Our AI is reading and extracting information from your content.'}</p>
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
            requestText={textInput}
            attachmentPaths={analysisResult.filePaths}
            onContinueToForm={handleContinueToForm}
            onGoBack={handleGoBackToUpload}
          />
        )}

        {step === 'redirect-training' && analysisResult && (
          <TrainingRedirect
            reason={analysisResult.requestTypeReason}
            userRequest={textInput}
            attachmentPaths={analysisResult.filePaths}
            onContinueToForm={handleContinueToForm}
            onGoBack={handleGoBackToUpload}
          />
        )}

        {step === 'wizard' && wizardQuestions.length > 0 && (
          <EnhancementWizard
            questions={wizardQuestions}
            onComplete={handleWizardComplete}
            onSkip={handleWizardSkip}
            requestTitle={formData.title || 'Change Management Request'}
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
              additionalFiles={additionalFiles}
              onAdditionalFilesChange={setAdditionalFiles}
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
            {adoWorkItem && (
              <div className="submission-info" style={{ marginTop: '1rem' }}>
                <strong>✅ Azure DevOps Ticket Created:</strong>
                <div style={{ marginTop: '0.5rem' }}>
                  <strong>Work Item #{adoWorkItem.id}</strong>
                  <br />
                  <a
                    href={`https://dev.azure.com/cmgfidev/EX%20Intake%20and%20Change%20Management/_workitems/edit/${adoWorkItem.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#4CAF50', textDecoration: 'underline' }}
                  >
                    View in Azure DevOps →
                  </a>
                </div>
              </div>
            )}
            <button className="btn-primary" onClick={handleReset}>
              Submit Another Request
            </button>
          </div>
        )}
      </main>
      </div>

      <footer className="app-footer">
        <div className="footer-content">
          <div className="footer-section">
            <div className="footer-logo">
              <span className="logo-cmg">CMG</span>
              <span className="logo-financial">FINANCIAL</span>
            </div>
            <p style={{ fontSize: '0.85rem', lineHeight: '1.6', marginTop: '0.5rem' }}>
              Change Management Intake
              <br />
              Powered by AI
            </p>
          </div>

          <div className="footer-section">
            <h4>Resources</h4>
            <ul>
              <li><a href="https://www.cmgfi.com" target="_blank" rel="noopener noreferrer">CMG Financial</a></li>
              <li><a href="https://www.cmgfi.com/about" target="_blank" rel="noopener noreferrer">About Us</a></li>
              <li><a href="https://www.cmgfi.com/careers" target="_blank" rel="noopener noreferrer">Careers</a></li>
            </ul>
          </div>

          <div className="footer-section">
            <h4>Support</h4>
            <ul>
              <li><a href="#" onClick={(e) => { e.preventDefault(); handleReset(); }}>Create New Request</a></li>
              <li><a href="https://www.cmgfi.com/contact" target="_blank" rel="noopener noreferrer">Contact Us</a></li>
            </ul>
          </div>

          <div className="footer-section">
            <h4>Technology</h4>
            <ul>
              <li><a href="https://openai.com" target="_blank" rel="noopener noreferrer">Powered by OpenAI GPT-4</a></li>
              <li><a href="https://azure.microsoft.com/en-us/products/devops" target="_blank" rel="noopener noreferrer">Azure DevOps Integration</a></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} CMG Financial. All rights reserved. | NMLS# 1820</p>
          <p style={{ marginTop: '0.5rem' }}>
            AI-powered Change Management Intake System
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
