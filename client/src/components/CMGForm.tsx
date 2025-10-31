import React from 'react';
import type { CMGFormData, FormOptions } from '../types';

interface CMGFormProps {
  formData: Partial<CMGFormData>;
  formOptions: FormOptions | null;
  onChange: (data: Partial<CMGFormData>) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

const CMGForm: React.FC<CMGFormProps> = ({
  formData,
  formOptions,
  onChange,
  onSubmit,
  isSubmitting,
}) => {
  const handleInputChange = (
    field: keyof CMGFormData,
    value: string | string[]
  ) => {
    onChange({ ...formData, [field]: value });
  };

  const handleCheckboxChange = (
    field: 'softwarePlatforms' | 'impactedAreas' | 'channels',
    option: string
  ) => {
    const currentValues = formData[field] || [];
    const newValues = currentValues.includes(option)
      ? currentValues.filter((v) => v !== option)
      : [...currentValues, option];
    handleInputChange(field, newValues);
  };

  const isFormValid = () => {
    return (
      formData.title &&
      formData.title.length > 0 &&
      formData.description &&
      formData.description.length > 0 &&
      formData.requestorName &&
      formData.requestorName.length > 0 &&
      formData.requestorEmail &&
      formData.requestorEmail.length > 0 &&
      formData.businessStakeholder &&
      formData.businessStakeholder.length > 0
    );
  };

  return (
    <div className="cmg-form">
      <h2>CMG Change Management Request</h2>
      <p className="form-subtitle">
        Review and complete the extracted information below
      </p>

      <div className="form-section">
        <label htmlFor="title" className="form-label required">
          1. Title of Issue
          <span className="char-limit">
            ({formData.title?.length || 0}/128 characters)
          </span>
        </label>
        <input
          type="text"
          id="title"
          className="form-input"
          placeholder="Short title for ease of identification"
          value={formData.title || ''}
          onChange={(e) => handleInputChange('title', e.target.value)}
          maxLength={128}
          required
        />
      </div>

      <div className="form-section">
        <label htmlFor="description" className="form-label required">
          2. Description
        </label>
        <p className="form-help-text">
          Provide as much information as possible, including any steps to reproduce
          issues, desired functionality for a new feature, or if this request
          involves external/third party integrations.
        </p>
        <textarea
          id="description"
          className="form-textarea"
          placeholder="Detailed description of the issue or feature request"
          value={formData.description || ''}
          onChange={(e) => handleInputChange('description', e.target.value)}
          rows={6}
          required
        />
      </div>

      <div className="form-section">
        <label htmlFor="requestorName" className="form-label required">
          3. Requestor Name
        </label>
        <input
          type="text"
          id="requestorName"
          className="form-input"
          placeholder="Your full name"
          value={formData.requestorName || ''}
          onChange={(e) => handleInputChange('requestorName', e.target.value)}
          required
        />
      </div>

      <div className="form-section">
        <label htmlFor="requestorEmail" className="form-label required">
          4. Requestor Email
        </label>
        <input
          type="email"
          id="requestorEmail"
          className="form-input"
          placeholder="your.email@cmgfi.com"
          value={formData.requestorEmail || ''}
          onChange={(e) => handleInputChange('requestorEmail', e.target.value)}
          required
        />
      </div>

      <div className="form-section">
        <label htmlFor="businessStakeholder" className="form-label required">
          5. Business Stakeholder
        </label>
        <p className="form-help-text">
          Name of the business stakeholder or department head who can approve this change
        </p>
        <input
          type="text"
          id="businessStakeholder"
          className="form-input"
          placeholder="Business stakeholder name"
          value={formData.businessStakeholder || ''}
          onChange={(e) => handleInputChange('businessStakeholder', e.target.value)}
          required
        />
      </div>

      {formOptions && (
        <>
          <div className="form-section">
            <label className="form-label">
              6. Which software platform will be impacted?
            </label>
            <p className="form-help-text">Select all that apply</p>
            <div className="checkbox-grid">
              {formOptions.softwarePlatforms.map((platform) => (
                <label key={platform} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={
                      formData.softwarePlatforms?.includes(platform) || false
                    }
                    onChange={() =>
                      handleCheckboxChange('softwarePlatforms', platform)
                    }
                  />
                  <span>{platform}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="form-section">
            <label className="form-label">
              7. Who will be impacted by this change (Area)?
            </label>
            <p className="form-help-text">Select all that apply</p>
            <div className="checkbox-grid">
              {formOptions.impactedAreas.map((area) => (
                <label key={area} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.impactedAreas?.includes(area) || false}
                    onChange={() => handleCheckboxChange('impactedAreas', area)}
                  />
                  <span>{area}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="form-section">
            <label className="form-label">
              8. Which channel will be impacted by this change?
            </label>
            <p className="form-help-text">Select all that apply</p>
            <div className="checkbox-grid">
              {formOptions.channels.map((channel) => (
                <label key={channel} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.channels?.includes(channel) || false}
                    onChange={() => handleCheckboxChange('channels', channel)}
                  />
                  <span>{channel}</span>
                </label>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Add padding at bottom to prevent content from being hidden behind floating button */}
      <div style={{ height: '100px' }}></div>

      {/* Floating submit button */}
      <div className="floating-submit-container">
        <button
          type="button"
          className="submit-btn floating-submit-btn"
          onClick={onSubmit}
          disabled={!isFormValid() || isSubmitting}
        >
          {isSubmitting ? (
            <>
              <span className="spinner-small"></span>
              Submitting...
            </>
          ) : (
            <>
              <svg className="btn-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Submit Request
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default CMGForm;
