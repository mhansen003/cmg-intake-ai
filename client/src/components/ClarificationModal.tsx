import React, { useState } from 'react';

interface ClarificationModalProps {
  questions: string[];
  missingFields: string[];
  onAnswer: (answers: Record<string, string>) => void;
  onSkip: () => void;
}

const ClarificationModal: React.FC<ClarificationModalProps> = ({
  questions,
  missingFields,
  onAnswer,
  onSkip,
}) => {
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const handleAnswerChange = (question: string, answer: string) => {
    setAnswers((prev) => ({ ...prev, [question]: answer }));
  };

  const handleSubmit = () => {
    onAnswer(answers);
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2>Additional Information Needed</h2>
          <p className="modal-subtitle">
            Please provide clarification for the following missing or unclear
            information:
          </p>
        </div>

        <div className="modal-content">
          {missingFields.length > 0 && (
            <div className="missing-fields">
              <h3>Missing Fields:</h3>
              <ul>
                {missingFields.map((field, index) => (
                  <li key={index}>{field}</li>
                ))}
              </ul>
            </div>
          )}

          {questions.length > 0 && (
            <div className="clarification-questions">
              <h3>Clarification Questions:</h3>
              {questions.map((question, index) => (
                <div key={index} className="question-item">
                  <label className="question-label">
                    {index + 1}. {question}
                  </label>
                  <textarea
                    className="question-input"
                    placeholder="Your answer..."
                    value={answers[question] || ''}
                    onChange={(e) =>
                      handleAnswerChange(question, e.target.value)
                    }
                    rows={3}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="modal-actions">
          <button className="btn-secondary" onClick={onSkip}>
            Skip for Now
          </button>
          <button
            className="btn-primary"
            onClick={handleSubmit}
            disabled={Object.keys(answers).length === 0}
          >
            Submit Answers
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClarificationModal;
