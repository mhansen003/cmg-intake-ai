import axios from 'axios';
import type { AnalysisResult, CMGFormData, FormOptions, SubmissionResult } from './types';

const API_BASE_URL = 'https://intake.cmgfinancial.ai/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getFormOptions = async (): Promise<FormOptions> => {
  const response = await api.get('/form-options');
  return response.data;
};

export const analyzeContent = async (
  textInput: string,
  files: File[]
): Promise<AnalysisResult> => {
  const formData = new FormData();
  formData.append('textInput', textInput);

  files.forEach((file) => {
    formData.append('files', file);
  });

  const response = await api.post('/analyze', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};

export const getClarificationQuestions = async (
  partialData: Partial<CMGFormData>,
  missingFields: string[]
): Promise<string[]> => {
  const response = await api.post('/clarify', {
    partialData,
    missingFields,
  });

  return response.data.questions;
};

export const submitForm = async (
  formData: CMGFormData,
  filePaths?: string[]
): Promise<SubmissionResult> => {
  const response = await api.post('/submit', {
    ...formData,
    filePaths
  });
  return response.data;
};

export const enhanceDescription = async (description: string): Promise<string> => {
  const response = await api.post('/enhance-description', { description });
  return response.data.enhancedDescription;
};
