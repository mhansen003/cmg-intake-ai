import React, { useState } from 'react';
import './EnhancementWizard.css';

interface WizardQuestion {
  question: string;
  placeholder: string;
  key: string;
}

interface EnhancementWizardProps {
  questions: WizardQuestion[];
  onComplete: (answers: Record<string, string>) => void;
  onSkip: () => void;
  requestTitle: string;
}

const EnhancementWizard: React.FC<EnhancementWizardProps> = ({
  questions,
  onComplete,
  onSkip,
  requestTitle,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentAnswer, setCurrentAnswer] = useState('');

  const currentQuestion = questions[currentStep];
  const isLastStep = currentStep === questions.length - 1;
  const progress = ((currentStep + 1) / questions.length) * 100;

  const handleNext = () => {
    // Save current answer
    setAnswers({ ...answers, [currentQuestion.key]: currentAnswer });

    if (isLastStep) {
      // Submit all answers
      onComplete({ ...answers, [currentQuestion.key]: currentAnswer });
    } else {
      // Move to next question
      setCurrentStep(currentStep + 1);
      setCurrentAnswer('');
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      // Load previous answer
      const prevQuestion = questions[currentStep - 1];
      setCurrentAnswer(answers[prevQuestion.key] || '');
    }
  };

  return (
    <div className="wizard-overlay">
      <div className="wizard-container">
        <div className="wizard-header">
          <h2>Enhance Your Request</h2>
          <p className="wizard-subtitle">
            Help us gather more details about: <strong>{requestTitle}</strong>
          </p>
          <button className="wizard-close" onClick={onSkip} title="Skip">
            ×
          </button>
        </div>

        <div className="wizard-progress">
          <div className="wizard-progress-bar" style={{ width: `${progress}%` }}></div>
          <span className="wizard-progress-text">
            Question {currentStep + 1} of {questions.length}
          </span>
        </div>

        <div className="wizard-body">
          <div className="wizard-question">
            <label className="wizard-label">
              {currentQuestion.question}
            </label>
            <textarea
              className="wizard-textarea"
              placeholder={currentQuestion.placeholder}
              value={currentAnswer}
              onChange={(e) => setCurrentAnswer(e.target.value)}
              rows={4}
              autoFocus
            />
          </div>
        </div>

        <div className="wizard-footer">
          <button
            className="wizard-btn-skip"
            onClick={onSkip}
          >
            Skip Questions
          </button>
          <div className="wizard-nav">
            {currentStep > 0 && (
              <button
                className="wizard-btn-secondary"
                onClick={handlePrevious}
              >
                ← Previous
              </button>
            )}
            <button
              className="wizard-btn-primary"
              onClick={handleNext}
            >
              {isLastStep ? 'Complete' : 'Next →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancementWizard;
