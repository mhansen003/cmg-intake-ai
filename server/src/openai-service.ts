import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { CMGFormData, FORM_OPTIONS, AnalysisResult } from './types';
import { identifyScenarioType, getFollowUpQuestions, getDepartmentSuggestions, getRiskLevel } from './mortgage-guidelines';

// Load training catalog
const trainingCatalogPath = path.join(__dirname, 'data', 'training-catalog.json');
const trainingCatalog = JSON.parse(fs.readFileSync(trainingCatalogPath, 'utf-8'));

// PDF parser will be loaded lazily only when needed to avoid serverless environment issues

export class OpenAIService {
  private openai: OpenAI;

  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey });
  }

  /**
   * Extract text from PDF file
   * Uses OpenAI Vision API in serverless environments where pdf-parse doesn't work
   */
  private async extractTextFromPDF(filePath: string): Promise<string> {
    // Check if we're in a serverless environment (Vercel)
    const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME;

    if (isServerless) {
      // In serverless environments, use OpenAI Vision API instead of pdf-parse
      console.log('Using OpenAI Vision API for PDF extraction (serverless environment)');

      try {
        const response = await this.openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: 'Please extract all the text content from this PDF document. Provide a complete transcription of all visible text.'
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:application/pdf;base64,${fs.readFileSync(filePath).toString('base64')}`
                  }
                }
              ]
            }
          ],
          max_tokens: 4096
        });

        return response.choices[0]?.message?.content || '';
      } catch (error) {
        console.error('Error extracting text from PDF with Vision API:', error);
        throw new Error('Failed to extract text from PDF. Please try uploading the PDF as images or text instead.');
      }
    }

    // Local development: use pdf-parse
    try {
      const pdf = require('pdf-parse');
      const dataBuffer = fs.readFileSync(filePath);
      const pdfData = await pdf(dataBuffer);
      return pdfData.text;
    } catch (error) {
      console.error('Error extracting text from PDF:', error);
      throw new Error('Failed to extract text from PDF');
    }
  }

  /**
   * Convert image to base64 for OpenAI Vision API
   */
  private imageToBase64(filePath: string): string {
    const imageBuffer = fs.readFileSync(filePath);
    return imageBuffer.toString('base64');
  }

  /**
   * Analyze image using OpenAI Vision API
   */
  private async analyzeImage(filePath: string): Promise<string> {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes: { [key: string]: string } = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp'
    };

    const mimeType = mimeTypes[ext] || 'image/jpeg';
    const base64Image = this.imageToBase64(filePath);

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Please extract all text and relevant information from this image. Describe what you see in detail.'
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`
              }
            }
          ]
        }
      ],
      max_tokens: 2000
    });

    return response.choices[0]?.message?.content || '';
  }

  /**
   * Process uploaded files and extract content
   */
  private async extractContentFromFiles(files: Express.Multer.File[]): Promise<string> {
    const contents: string[] = [];

    for (const file of files) {
      const ext = path.extname(file.originalname).toLowerCase();

      try {
        if (ext === '.pdf') {
          const pdfText = await this.extractTextFromPDF(file.path);
          contents.push(`PDF Content (${file.originalname}):\n${pdfText}`);
        } else if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) {
          const imageText = await this.analyzeImage(file.path);
          contents.push(`Image Analysis (${file.originalname}):\n${imageText}`);
        } else if (['.txt', '.md', '.doc', '.docx'].includes(ext)) {
          // For text files, read directly
          const textContent = fs.readFileSync(file.path, 'utf-8');
          contents.push(`Text File (${file.originalname}):\n${textContent}`);
        }
      } catch (error) {
        console.error(`Error processing file ${file.originalname}:`, error);
        contents.push(`Failed to process file: ${file.originalname}`);
      }
    }

    return contents.join('\n\n---\n\n');
  }

  /**
   * Analyze content and extract structured CMG form data
   */
  async analyzeContent(
    textInput: string,
    files: Express.Multer.File[]
  ): Promise<AnalysisResult> {
    // Extract content from uploaded files
    const fileContents = files.length > 0 ? await this.extractContentFromFiles(files) : '';

    // Combine all content
    const combinedContent = [textInput, fileContents].filter(Boolean).join('\n\n---\n\n');

    // Identify scenario types based on keywords
    const scenarioTypes = identifyScenarioType(combinedContent);
    const suggestedDepartments = getDepartmentSuggestions(scenarioTypes);
    const riskLevel = getRiskLevel(scenarioTypes);
    const guidelineQuestions = getFollowUpQuestions(scenarioTypes);

    console.log('Detected scenario types:', scenarioTypes);
    console.log('Suggested departments:', suggestedDepartments);
    console.log('Risk level:', riskLevel);
    console.log('Guideline questions:', guidelineQuestions);

    // Create enhanced analysis prompt with mortgage industry knowledge
    const systemPrompt = `You are an AI assistant specialized in mortgage operations with deep knowledge of 150+ common change management scenarios across:
- Loan Origination (LOS systems, processing, application intake)
- Underwriting (conditions, stipulations, AUS, investor guidelines)
- Closing/Funding (CTC, document prep, wires, TRID compliance)
- Servicing (payments, escrow, loss mitigation, default management)
- Compliance (TRID, RESPA, HMDA, Fair Lending, QM/ATR)
- IT/Systems (integrations, LOS configurations, data management)

Your task is to analyze change management requests and extract relevant information to populate the intake form fields.

DETECTED SCENARIO CONTEXT:
- Scenario Types: ${scenarioTypes.length > 0 ? scenarioTypes.join(', ') : 'General'}
- Suggested Departments: ${suggestedDepartments.length > 0 ? suggestedDepartments.join(', ') : 'To be determined'}
- Risk Level: ${riskLevel}

The form has the following fields:
1. Title: A short title of the issue (max 128 characters)
2. Description: Detailed description of the issue or feature request
3. Software Platforms: Which software platforms will be impacted (multi-select from: ${FORM_OPTIONS.softwarePlatforms.join(', ')})
4. Impacted Areas: Who will be impacted by this change (multi-select from: ${FORM_OPTIONS.impactedAreas.join(', ')})
5. Channels: Which channels will be impacted (multi-select from: ${FORM_OPTIONS.channels.join(', ')})

Based on the detected scenario type(s), you should generate intelligent follow-up questions from these categories:
${guidelineQuestions.length > 0 ? guidelineQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n') : 'Standard clarification questions'}

IMPORTANT - REQUEST TYPE CLASSIFICATION:
Before filling out the form, first classify this request into ONE of these categories:

1. "change" - This is a legitimate Change Management request:
   - Software/system changes (new features, enhancements, configurations)
   - Bug fixes or defect corrections
   - Process changes that require IT/system modifications
   - Compliance or regulatory changes requiring system updates

2. "support" - This is an Application Support issue:
   - User can't access a system or feature
   - System is down or experiencing errors
   - User needs help with a specific transaction or task
   - Password resets, permission issues, access problems
   - "How do I do X?" questions about using existing features
   - Troubleshooting existing functionality

3. "training" - This is a Training request:
   - User asking how to use a feature properly
   - Requests for training materials or guides
   - Questions about workflows or processes
   - "Where can I learn about..." questions
   - Certification or training program inquiries

Return your response as a JSON object with this exact structure:
{
  "title": "extracted title or null",
  "description": "extracted description or null",
  "softwarePlatforms": ["array of matching platforms"],
  "impactedAreas": ["array of matching areas"],
  "channels": ["array of matching channels"],
  "missingFields": ["array of field names that couldn't be determined"],
  "clarificationQuestions": ["array of specific questions to ask the user - use the guideline questions above as reference"],
  "confidence": 0.85,
  "scenarioType": "${scenarioTypes.length > 0 ? scenarioTypes[0] : 'general'}",
  "requestType": "change or support or training",
  "requestTypeConfidence": 0.95,
  "requestTypeReason": "brief explanation of why this was classified as change/support/training"
}

Important:
- Only include platforms, areas, and channels that EXACTLY match the provided options
- If you're not sure about a field, include it in missingFields
- Generate clarification questions specific to the detected scenario type
- For mortgage-specific requests, ask about key details like: system names, timing requirements, compliance considerations, testing needs, stakeholder approval
- Confidence should be between 0 and 1
- Be thorough but conservative - it's better to ask for clarification than to guess incorrectly`;

    const userPrompt = `Please analyze the following mortgage change management request and extract information for the CMG intake form:\n\n${combinedContent}`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3
      });

      const result = JSON.parse(response.choices[0]?.message?.content || '{}');

      // Log OpenAI's classification decision
      console.log('═══════════════════════════════════════════════════');
      console.log('🤖 OpenAI REQUEST TYPE CLASSIFICATION:');
      console.log('   Type:', result.requestType || 'change');
      console.log('   Confidence:', ((result.requestTypeConfidence || 0) * 100).toFixed(1) + '%');
      console.log('   Reason:', result.requestTypeReason || 'Not provided');
      console.log('═══════════════════════════════════════════════════');

      return {
        extractedData: {
          title: result.title || undefined,
          description: result.description || undefined,
          softwarePlatforms: result.softwarePlatforms || [],
          impactedAreas: result.impactedAreas || [],
          channels: result.channels || []
        },
        missingFields: result.missingFields || [],
        confidence: result.confidence || 0,
        clarificationQuestions: result.clarificationQuestions || [],
        requestType: result.requestType || 'change',
        requestTypeConfidence: result.requestTypeConfidence || 0,
        requestTypeReason: result.requestTypeReason || ''
      };
    } catch (error) {
      console.error('Error analyzing content with OpenAI:', error);
      throw new Error('Failed to analyze content');
    }
  }

  /**
   * Generate clarification questions for missing fields
   */
  async generateClarificationQuestions(
    partialData: Partial<CMGFormData>,
    missingFields: string[]
  ): Promise<string[]> {
    const prompt = `Based on the following partially filled change management request form, generate 2-3 specific, targeted questions to help fill in the missing information.

Current Data:
${JSON.stringify(partialData, null, 2)}

Missing Fields: ${missingFields.join(', ')}

Generate questions that are:
1. Specific and actionable
2. Help clarify the missing information
3. Easy for the user to answer

Return only the questions as a JSON array of strings.`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.5
      });

      const result = JSON.parse(response.choices[0]?.message?.content || '{"questions": []}');
      return result.questions || [];
    } catch (error) {
      console.error('Error generating clarification questions:', error);
      return [];
    }
  }

  /**
   * Enhance a description with AI to make it more complete and detailed
   */
  async enhanceDescription(description: string): Promise<string> {
    const systemPrompt = `You are an expert in writing detailed change management requests for mortgage operations. Your task is to enhance user-provided descriptions to make them more complete, clear, and actionable while maintaining the original intent.

When enhancing descriptions:
1. Keep the original meaning and intent
2. Add relevant details about business impact, affected systems, and timing if mentioned
3. Structure the description with clear sections if appropriate (e.g., Current State, Desired State, Business Impact)
4. Use professional mortgage industry terminology
5. Make it more specific and actionable
6. Keep it concise but comprehensive (aim for 2-4 paragraphs)

Return only the enhanced description as plain text, no JSON or extra formatting.`;

    const userPrompt = `Please enhance this change management request description to make it more complete and professional:

${description}`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 1000
      });

      return response.choices[0]?.message?.content || description;
    } catch (error) {
      console.error('Error enhancing description:', error);
      throw new Error('Failed to enhance description');
    }
  }

  /**
   * Recommend training courses based on user's issue description
   */
  async recommendTraining(userIssue: string): Promise<any> {
    const systemPrompt = `You are an AI training recommendation assistant with access to 277 training courses across 21 categories at ThinkITHub.

Your task is to analyze the user's issue and recommend 1-5 most relevant training courses from the training catalog.

TRAINING CATALOG OVERVIEW:
${JSON.stringify(trainingCatalog.categories.map(cat => ({
  id: cat.id,
  name: cat.name,
  description: cat.description,
  keywords: cat.keywords,
  course_count: cat.course_count
})), null, 2)}

AVAILABLE QUICK ACCESS LINKS:
${JSON.stringify(trainingCatalog.quick_access, null, 2)}

Instructions:
1. Analyze the user's issue to understand what they're struggling with
2. Match keywords from the issue to relevant categories
3. Select 1-5 most relevant courses that will help solve their specific problem
4. Prioritize courses that directly address the user's need
5. Include a mix of specific courses and general resources when appropriate
6. For ILC (Instructor-Led Courses), note that they are live sessions

Return a JSON response with this structure:
{
  "primaryRecommendation": {
    "title": "course title",
    "url": "full URL",
    "description": "2-3 sentence description",
    "duration": "duration",
    "reason": "1-2 sentences explaining WHY this course is perfect for their issue"
  },
  "additionalRecommendations": [
    {
      "title": "course title",
      "url": "full URL",
      "description": "2-3 sentence description",
      "duration": "duration",
      "reason": "why this helps"
    }
  ],
  "quickAccessLinks": [
    {
      "title": "Resource Hub or Catalog",
      "url": "quick access URL",
      "description": "what they'll find here"
    }
  ],
  "summary": "A friendly 2-3 sentence summary explaining the recommended learning path"
}`;

    const userPrompt = `User's Issue: ${userIssue}

Please recommend the most helpful training resources from the ThinkITHub catalog.`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.4
      });

      const recommendations = JSON.parse(response.choices[0]?.message?.content || '{}');

      console.log('🎓 Training Recommendations Generated:');
      console.log('   Primary:', recommendations.primaryRecommendation?.title);
      console.log('   Additional:', recommendations.additionalRecommendations?.length || 0, 'courses');

      return recommendations;
    } catch (error) {
      console.error('Error recommending training:', error);
      throw new Error('Failed to generate training recommendations');
    }
  }
}
