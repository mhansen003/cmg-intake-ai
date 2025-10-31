import express, { Request, Response } from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { OpenAIService } from './openai-service';
import { AzureDevOpsService } from './ado-service';
import { FORM_OPTIONS } from './types';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize OpenAI service
const openaiService = new OpenAIService(process.env.OPENAI_API_KEY || '');

// Initialize Azure DevOps service (if configured)
let adoService: AzureDevOpsService | null = null;
if (process.env.ADO_ORGANIZATION && process.env.ADO_PROJECT && process.env.ADO_PAT) {
  adoService = new AzureDevOpsService({
    organization: process.env.ADO_ORGANIZATION,
    project: process.env.ADO_PROJECT,
    personalAccessToken: process.env.ADO_PAT,
    areaPath: process.env.ADO_AREA_PATH,
    iterationPath: process.env.ADO_ITERATION_PATH
  });
  console.log('✅ Azure DevOps integration enabled');
} else {
  console.log('ℹ️  Azure DevOps integration disabled (missing configuration)');
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, images, and text documents are allowed.'));
    }
  }
});

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'CMG Intake API is running' });
});

// Get form options
app.get('/api/form-options', (req: Request, res: Response) => {
  res.json(FORM_OPTIONS);
});

// Analyze content endpoint
app.post('/api/analyze', upload.array('files', 10), async (req: Request, res: Response) => {
  try {
    const { textInput } = req.body;
    const files = req.files as Express.Multer.File[];

    if (!textInput && (!files || files.length === 0)) {
      return res.status(400).json({
        error: 'Please provide either text input or upload files'
      });
    }

    console.log('Analyzing content...');
    console.log('Text input length:', textInput?.length || 0);
    console.log('Files uploaded:', files?.length || 0);

    // Analyze content using OpenAI
    const result = await openaiService.analyzeContent(textInput || '', files || []);

    // Clean up uploaded files
    if (files && files.length > 0) {
      files.forEach(file => {
        try {
          fs.unlinkSync(file.path);
        } catch (error) {
          console.error('Error deleting file:', error);
        }
      });
    }

    res.json(result);
  } catch (error: any) {
    console.error('Error in /api/analyze:', error);
    res.status(500).json({
      error: 'Failed to analyze content',
      message: error.message
    });
  }
});

// Generate clarification questions endpoint
app.post('/api/clarify', async (req: Request, res: Response) => {
  try {
    const { partialData, missingFields } = req.body;

    if (!partialData || !missingFields) {
      return res.status(400).json({
        error: 'Missing required fields: partialData and missingFields'
      });
    }

    const questions = await openaiService.generateClarificationQuestions(
      partialData,
      missingFields
    );

    res.json({ questions });
  } catch (error: any) {
    console.error('Error in /api/clarify:', error);
    res.status(500).json({
      error: 'Failed to generate clarification questions',
      message: error.message
    });
  }
});

// Enhance description endpoint
app.post('/api/enhance-description', async (req: Request, res: Response) => {
  try {
    const { description } = req.body;

    if (!description || description.trim().length === 0) {
      return res.status(400).json({
        error: 'Description is required and cannot be empty'
      });
    }

    console.log('Enhancing description...');
    const enhancedDescription = await openaiService.enhanceDescription(description);

    res.json({
      enhancedDescription,
      success: true
    });
  } catch (error: any) {
    console.error('Error in /api/enhance-description:', error);
    res.status(500).json({
      error: 'Failed to enhance description',
      message: error.message
    });
  }
});

// Submit final form (this would typically save to a database or forward to the actual Microsoft Form)
app.post('/api/submit', async (req: Request, res: Response) => {
  try {
    const formData = req.body;

    // Validate required fields
    if (!formData.title || !formData.description) {
      return res.status(400).json({
        error: 'Missing required fields: title and description are required'
      });
    }

    console.log('Form submission received:', formData);

    // Try to create work item in Azure DevOps (if configured)
    let adoWorkItem = null;
    let adoError = null;

    if (adoService) {
      try {
        console.log('Creating work item in Azure DevOps...');
        adoWorkItem = await adoService.createWorkItem(formData);
        console.log(`✅ ADO Work Item created: ${adoWorkItem.id}`);
      } catch (error: any) {
        // Log the error but don't fail the submission
        console.error('⚠️  Failed to create ADO work item:', error.message);
        adoError = error.message;
      }
    }

    // In a real application, you might also:
    // 1. Save to a database
    // 2. Forward to Microsoft Forms API
    // 3. Send notifications

    res.json({
      success: true,
      message: 'Form submitted successfully',
      submissionId: Date.now().toString(),
      data: formData,
      adoWorkItem: adoWorkItem ? {
        id: adoWorkItem.id,
        url: adoWorkItem.url
      } : null,
      adoError: adoError
    });
  } catch (error: any) {
    console.error('Error in /api/submit:', error);
    res.status(500).json({
      error: 'Failed to submit form',
      message: error.message
    });
  }
});

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: any) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// Start server (only when not running in Vercel)
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`\n🚀 CMG Intake API Server running on http://localhost:${PORT}`);
    console.log(`📝 API Endpoints:`);
    console.log(`   - GET  /api/health - Health check`);
    console.log(`   - GET  /api/form-options - Get form options`);
    console.log(`   - POST /api/analyze - Analyze documents and extract form data`);
    console.log(`   - POST /api/clarify - Generate clarification questions`);
    console.log(`   - POST /api/enhance-description - Enhance description with AI`);
    console.log(`   - POST /api/submit - Submit final form\n`);
  });
}

// Export the Express app for Vercel
export default app;

