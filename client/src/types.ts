export interface CMGFormData {
  title: string;
  description: string;
  businessStakeholder: string;
  requestorName: string;
  requestorEmail: string;
  softwarePlatforms: string[];
  impactedAreas: string[];
  channels: string[];
}

export interface FormOptions {
  softwarePlatforms: string[];
  impactedAreas: string[];
  channels: string[];
}

export type RequestType = 'change' | 'support' | 'training';

export interface AnalysisResult {
  extractedData: Partial<CMGFormData>;
  missingFields: string[];
  confidence: number;
  clarificationQuestions?: string[];
  requestType: RequestType;
  requestTypeConfidence: number;
  requestTypeReason: string;
  filePaths?: string[];
}

export interface SubmissionResult {
  success: boolean;
  message: string;
  submissionId?: string;
  data?: CMGFormData;
  adoWorkItem?: {
    id: number;
    url: string;
  };
  adoError?: string;
}
