import express, { Request, Response } from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { OpenAIService } from './openai-service';
import { AzureDevOpsService } from './ado-service';
import { EmailService } from './email-service';
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

// Initialize Email service (if configured)
let emailService: EmailService | null = null;
if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
  emailService = new EmailService({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
  console.log('✅ Email service enabled');
} else {
  console.log('ℹ️  Email service disabled (missing SMTP configuration)');
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure multer for file uploads
// Use /tmp directory in serverless environments (Vercel), local uploads directory otherwise
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Detect serverless environment (Vercel or AWS Lambda)
    const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME;
    const uploadDir = isServerless ? '/tmp' : path.join(__dirname, '../uploads');

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

// Debug endpoint to check environment variables
app.get('/api/debug', (req: Request, res: Response) => {
  res.json({
    openaiKeySet: !!process.env.OPENAI_API_KEY,
    openaiKeyLength: process.env.OPENAI_API_KEY?.length || 0,
    openaiKeyPrefix: process.env.OPENAI_API_KEY?.substring(0, 10) || 'NOT SET',
    adoConfigured: !!process.env.ADO_ORGANIZATION && !!process.env.ADO_PROJECT && !!process.env.ADO_PAT,
    nodeEnv: process.env.NODE_ENV,
    port: process.env.PORT
  });
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

    // Store file paths for later use (don't delete yet)
    const filePaths = files && files.length > 0 ? files.map(f => f.path) : [];

    res.json({
      ...result,
      filePaths // Include file paths so they can be sent to ADO later
    });
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

// Get training recommendations endpoint
app.post('/api/recommend-training', async (req: Request, res: Response) => {
  try {
    const { userIssue } = req.body;

    if (!userIssue || userIssue.trim().length === 0) {
      return res.status(400).json({
        error: 'User issue description is required and cannot be empty'
      });
    }

    console.log('Generating training recommendations for issue...');
    const recommendations = await openaiService.recommendTraining(userIssue);

    res.json({
      recommendations,
      success: true
    });
  } catch (error: any) {
    console.error('Error in /api/recommend-training:', error);
    res.status(500).json({
      error: 'Failed to generate training recommendations',
      message: error.message
    });
  }
});

// Submit final form (this would typically save to a database or forward to the actual Microsoft Form)
app.post('/api/submit', async (req: Request, res: Response) => {
  try {
    const { filePaths, ...formData } = req.body;

    // Validate required fields
    if (!formData.title || !formData.description) {
      return res.status(400).json({
        error: 'Missing required fields: title and description are required'
      });
    }

    console.log('Form submission received:', formData);
    console.log('Attachments to include:', filePaths?.length || 0);
    console.log('Send confirmation email?', formData.sendConfirmation, typeof formData.sendConfirmation);
    console.log('Requestor email:', formData.requestorEmail);
    console.log('Email service available?', !!emailService);

    // Try to create work item in Azure DevOps (if configured)
    let adoWorkItem = null;
    let adoError = null;

    if (adoService) {
      try {
        console.log('Creating work item in Azure DevOps...');
        adoWorkItem = await adoService.createWorkItem(formData, filePaths);
        console.log('ADO Work Item Response:', JSON.stringify(adoWorkItem, null, 2));
        console.log(`✅ ADO Work Item created: ${adoWorkItem?.id || 'NO ID'}`);

        // Clean up uploaded files after successful ADO submission
        if (filePaths && filePaths.length > 0) {
          filePaths.forEach((filePath: string) => {
            try {
              if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                console.log(`🗑️  Cleaned up file: ${filePath}`);
              }
            } catch (error: any) {
              console.error(`⚠️  Failed to delete file ${filePath}:`, error.message);
            }
          });
        }
      } catch (error: any) {
        // Log the error but don't fail the submission
        console.error('⚠️  Failed to create ADO work item:', error.message);
        console.error('Error stack:', error.stack);
        adoError = error.message;
      }
    }

    // Send confirmation email if requested
    if (formData.sendConfirmation && formData.requestorEmail && emailService) {
      try {
        console.log('Sending confirmation email to:', formData.requestorEmail);
        await emailService.sendConfirmationEmail(
          formData.requestorEmail,
          formData.requestorName || 'User',
          formData.title,
          formData.description,
          adoWorkItem ? { id: adoWorkItem.id, url: adoWorkItem.url } : undefined
        );
      } catch (error: any) {
        console.error('⚠️  Failed to send confirmation email:', error.message);
        // Don't fail the whole submission if confirmation fails
      }
    }

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

// POST /api/send-support-email - Send support email
app.post('/api/send-support-email', async (req: Request, res: Response) => {
  try {
    if (!emailService) {
      return res.status(503).json({
        error: 'Email service not configured',
        message: 'SMTP settings are missing. Please configure email service.'
      });
    }

    const { fromEmail, fromName, subject, body, filePaths } = req.body;

    // Validate required fields
    if (!fromEmail || !subject || !body) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'fromEmail, subject, and body are required'
      });
    }

    console.log('Support email request received from:', fromEmail);
    console.log('Subject:', subject);
    console.log('Attachments:', filePaths?.length || 0);

    // Send support email
    await emailService.sendSupportEmail({
      fromEmail,
      fromName,
      subject,
      body,
      attachmentPaths: filePaths
    });

    // Clean up uploaded files after successful email send
    if (filePaths && filePaths.length > 0) {
      filePaths.forEach((filePath: string) => {
        try {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`🗑️  Cleaned up file: ${filePath}`);
          }
        } catch (cleanupError) {
          console.error(`Failed to cleanup file ${filePath}:`, cleanupError);
        }
      });
    }

    res.json({
      success: true,
      message: 'Support email sent successfully'
    });
  } catch (error: any) {
    console.error('Error in /api/send-support-email:', error);
    res.status(500).json({
      error: 'Failed to send support email',
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
    console.log(`   - POST /api/submit - Submit final form`);
    console.log(`   - POST /api/send-support-email - Send support email to appsupport@cmgfi.com\n`);
  });
}

// Export the Express app for Vercel
export default app;

