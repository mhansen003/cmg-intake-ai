import axios from 'axios';
import type { AnalysisResult, CMGFormData, FormOptions, SubmissionResult } from './types';

// Use environment-aware API URL
// In development: uses Vite proxy to localhost:3001
// In production: uses production API URL
const API_BASE_URL = import.meta.env.PROD
  ? 'https://intake.cmgfinancial.ai/api'
  : '/api'; // Vite will proxy this to localhost:3001

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

export interface WizardQuestion {
  question: string;
  placeholder: string;
  key: string;
}

export const generateWizardQuestions = async (title: string, description: string): Promise<WizardQuestion[]> => {
  const response = await api.post('/generate-questions', { title, description });
  return response.data.questions;
};

export interface SendSupportEmailParams {
  fromEmail: string;
  fromName?: string;
  subject: string;
  body: string;
  filePaths?: string[];
}

export const sendSupportEmail = async (params: SendSupportEmailParams): Promise<{ success: boolean; message: string }> => {
  const response = await api.post('/send-support-email', params);
  return response.data;
};

export const uploadAdditionalFiles = async (files: File[]): Promise<string[]> => {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append('files', file);
  });

  const response = await api.post('/upload-additional-files', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data.filePaths;
};
