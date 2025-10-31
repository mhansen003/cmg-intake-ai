export interface CMGFormData {
  title: string;
  description: string;
  softwarePlatforms: string[];
  impactedAreas: string[];
  channels: string[];
  attachments?: string[];
}

export const FORM_OPTIONS = {
  softwarePlatforms: [
    "AIO Portal",
    "Automation",
    "Build and Lock Portal",
    "Byte",
    "Clear",
    "Clear Docs",
    "CMG/JV Websites",
    "Document Vendor",
    "Home Portal",
    "HomeFundIt",
    "List and Lock (MySite)",
    "Marketing Hub",
    "Optical Character Recognition",
    "Salesforce",
    "Secure Doc Upload",
    "Servicing Docs",
    "SmartApp"
  ],
  impactedAreas: [
    "Loan Origination  (Sales)",
    "Disclosures",
    "Processing",
    "Underwriting",
    "Closing",
    "Post Closing",
    "Servicing",
    "Product",
    "Risk/Compliance/QC/QA",
    "Secondary/Pricing"
  ],
  channels: [
    "Bank",
    "Consumer Direct",
    "Correspondent",
    "JV",
    "Retail",
    "Select Partner",
    "Wholesale"
  ]
};

export type RequestType = 'change' | 'support' | 'training';

export interface AnalysisResult {
  extractedData: Partial<CMGFormData>;
  missingFields: string[];
  confidence: number;
  clarificationQuestions?: string[];
  requestType: RequestType;
  requestTypeConfidence: number;
  requestTypeReason: string;
}
