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

// ADO Work Item interfaces
export interface ADOWorkItem {
  id: number;
  url: string;
  fields: {
    'System.Id': number;
    'System.Title': string;
    'System.Description'?: string;
    'System.State': string;
    'System.WorkItemType': string;
    'System.TeamProject'?: string;  // Project name
    'System.CreatedDate'?: string;
    'System.ChangedDate'?: string;
    'System.Tags'?: string;
    'System.AreaPath'?: string;
    'System.IterationPath'?: string;
    [key: string]: any;
  };
}

export interface SearchADOParams {
  searchText?: string;
  workItemType?: string;
  state?: string;
  project?: string;  // 'All Projects' or specific project name
  maxResults?: number;
}

export interface SearchADOResult {
  success: boolean;
  workItems: ADOWorkItem[];
  count: number;
}

/**
 * Search for ADO work items
 */
export const searchADOWorkItems = async (params: SearchADOParams): Promise<SearchADOResult> => {
  const response = await api.post('/ado/search', params);
  return response.data;
};

/**
 * Get a single ADO work item by ID
 */
export const getADOWorkItem = async (id: number): Promise<ADOWorkItem> => {
  const response = await api.get(`/ado/workitem/${id}`);
  return response.data.workItem;
};
