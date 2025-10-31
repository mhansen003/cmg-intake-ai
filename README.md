# CMG Intake AI Assistant

An AI-powered Change Management Request submission system that automatically extracts and populates form fields from documents, PDFs, images, and text using OpenAI's GPT-4.

## 🚀 Features

### Web Interface
- **Drag & Drop File Upload**: Support for PDFs, images (JPG, PNG, GIF, WebP), and text documents
- **AI-Powered Extraction**: Uses OpenAI GPT-4o to intelligently read and extract form data
- **Image Analysis**: OCR and image understanding using GPT-4 Vision API
- **PDF Parsing**: Automatically extracts text from PDF documents
- **Smart Form Auto-Population**: Intelligently fills out all form fields based on content
- **Clarification Flow**: Asks targeted questions when information is missing or ambiguous
- **Confidence Scoring**: Shows AI confidence level for extracted data
- **Modern UI**: Beautiful, responsive interface with real-time feedback

### Voice Agent Integration (NEW!)
- **MCP Server**: Model Context Protocol server for AI agent integration
- **Retell AI Compatible**: Voice agents can create tickets via natural conversation
- **Azure DevOps Integration**: Automatically creates work items in ADO
- **Dual Interface**: Works via both web form and voice calls
- **Vercel Ready**: Deploy as serverless function or persistent server

## 📋 Form Fields

The system automatically extracts:

1. **Title**: Short title of the issue (max 128 characters)
2. **Description**: Detailed description of the issue or feature request
3. **Software Platforms**: Multi-select from 16 platforms (AIO Portal, Automation, Build and Lock Portal, etc.)
4. **Impacted Areas**: Multi-select from 10 areas (Sales, Processing, Underwriting, etc.)
5. **Channels**: Multi-select from 7 channels (Bank, Consumer Direct, Correspondent, etc.)

## 🛠️ Technology Stack

### Backend
- **Node.js** + **Express**: RESTful API server
- **TypeScript**: Type-safe development
- **OpenAI API**: GPT-4o for text and vision analysis
- **Multer**: File upload handling
- **pdf-parse**: PDF text extraction
- **MCP SDK**: Model Context Protocol for AI agent integration
- **Azure DevOps API**: Automatic work item creation

### Frontend
- **React** + **TypeScript**: Component-based UI
- **Vite**: Fast development and build tool
- **react-dropzone**: Drag-and-drop file uploads
- **Axios**: HTTP client for API calls

## 📦 Installation

### Prerequisites

- **Node.js** 18+ and npm
- **OpenAI API Key** (get one at https://platform.openai.com/api-keys)

### Setup Instructions

1. **Clone or navigate to the project**:
   ```bash
   cd C:\GitHub\cmg-intake-ai
   ```

2. **Install Backend Dependencies**:
   ```bash
   cd server
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the `server` directory:
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and add your OpenAI API key:
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   PORT=3001
   ```

4. **Install Frontend Dependencies**:
   ```bash
   cd ../client
   npm install
   ```

## 🚀 Running the Application

### Development Mode

1. **Start the Backend Server** (in `server` directory):
   ```bash
   cd server
   npm run dev
   ```
   Server will run on `http://localhost:3001`

2. **Start the Frontend** (in `client` directory, new terminal):
   ```bash
   cd client
   npm run dev
   ```
   Frontend will run on `http://localhost:5173`

3. **Open your browser** and navigate to:
   ```
   http://localhost:5173
   ```

### Production Build

1. **Build the Backend**:
   ```bash
   cd server
   npm run build
   npm start
   ```

2. **Build the Frontend**:
   ```bash
   cd client
   npm run build
   npm run preview
   ```

## 📖 Usage Guide

### Step 1: Input Your Request
You can provide information in two ways:
- **Type or paste text** describing your change management request
- **Drag and drop files** (PDFs, images, documents)
- **Or both!**

### Step 2: AI Analysis
Click **"Analyze with AI"** and the system will:
- Read and parse all uploaded documents
- Extract text from PDFs
- Analyze images using OCR and vision AI
- Intelligently map content to form fields

### Step 3: Clarification (if needed)
If information is missing or unclear, the system will:
- Show which fields couldn't be determined
- Ask specific questions to clarify
- Allow you to skip and fill manually

### Step 4: Review & Submit
- Review the auto-populated form
- See the AI confidence score
- Make any necessary corrections
- Submit your request

## 🎯 API Endpoints

### GET `/api/health`
Health check endpoint

### GET `/api/form-options`
Returns all available options for platforms, areas, and channels

### POST `/api/analyze`
Analyzes text and files to extract form data

**Request**: Multipart form data
- `textInput`: Text description (string)
- `files`: Array of files (PDF, images, documents)

**Response**:
```json
{
  "extractedData": {
    "title": "string",
    "description": "string",
    "softwarePlatforms": ["array"],
    "impactedAreas": ["array"],
    "channels": ["array"]
  },
  "missingFields": ["array"],
  "confidence": 0.85,
  "clarificationQuestions": ["array"]
}
```

### POST `/api/clarify`
Generates clarification questions for missing fields

### POST `/api/submit`
Submits the final form data

## 🔧 Configuration

### Supported File Types
- **PDFs**: `.pdf`
- **Images**: `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`
- **Documents**: `.txt`, `.doc`, `.docx`

### File Size Limit
- Maximum file size: **10MB per file**
- Maximum files per upload: **10 files**

### OpenAI Models Used
- **GPT-4o**: For text analysis and structured data extraction
- **GPT-4o Vision**: For image analysis and OCR

## 🎨 Customization

### Modify Form Fields
Edit `server/src/types.ts` to add or modify form fields and options

### Adjust AI Prompts
Edit `server/src/openai-service.ts` to customize how the AI analyzes content

### Change Styling
Edit `client/src/App.css` to customize the UI appearance

## 🐛 Troubleshooting

### "Failed to analyze content"
- Check that your OpenAI API key is correctly set in `.env`
- Ensure you have sufficient OpenAI credits
- Check the server logs for detailed error messages

### File Upload Errors
- Verify file type is supported
- Check file size is under 10MB
- Ensure the `uploads` directory exists in `server/`

### CORS Errors
- Make sure backend is running on port 3001
- Check that frontend is making requests to `http://localhost:3001`

## 🎙️ Voice Agent Integration (MCP Server)

This project now includes an **MCP (Model Context Protocol) server** that allows AI voice agents like Retell AI to create Azure DevOps tickets through natural conversation!

### Quick Start

**For Vercel Deployment** (Recommended):
```bash
# Deploy to Vercel
vercel --prod

# Your MCP endpoint will be:
# https://your-app.vercel.app/api/mcp
```

See [WHICH_MCP_VERSION.md](./WHICH_MCP_VERSION.md) for choosing between HTTP and STDIO versions.

### Documentation

- **[QUICK_START_MCP.md](./QUICK_START_MCP.md)** - Get started in 3 steps
- **[VERCEL_MCP_DEPLOYMENT.md](./VERCEL_MCP_DEPLOYMENT.md)** - Deploy to Vercel (detailed)
- **[MCP_SERVER_SETUP.md](./MCP_SERVER_SETUP.md)** - Full reference guide
- **[MCP_ARCHITECTURE.md](./MCP_ARCHITECTURE.md)** - Technical deep-dive
- **[ADO_INTEGRATION_SETUP.md](./ADO_INTEGRATION_SETUP.md)** - Azure DevOps setup
- **[WHICH_MCP_VERSION.md](./WHICH_MCP_VERSION.md)** - Choose the right version

### How It Works

```
User Voice Call → Retell AI → MCP Server → Azure DevOps API → Work Item Created
```

1. User speaks to Retell AI: _"I need to report a bug..."_
2. Retell AI collects: description, name, email
3. Calls MCP tool: `create_ado_ticket`
4. MCP server creates ADO work item
5. Returns work item ID to user

### Configure Retell AI

In your Retell AI dashboard:
- **MCP URL**: `https://your-app.vercel.app/api/mcp`
- **Timeout**: 10000 ms

See [VERCEL_MCP_DEPLOYMENT.md](./VERCEL_MCP_DEPLOYMENT.md) for detailed steps.

## 🔗 Azure DevOps Integration

Forms submitted through either the web interface or voice agent automatically create work items in Azure DevOps.

### Setup

1. Create an Azure DevOps Personal Access Token (PAT)
2. Add to `server/.env`:
   ```env
   ADO_ORGANIZATION=cmgfidev
   ADO_PROJECT=EX Intake and Change Management
   ADO_PAT=your_personal_access_token
   ADO_AREA_PATH=EX Intake and Change Management
   ADO_ITERATION_PATH=EX Intake and Change Management
   ```

See [ADO_INTEGRATION_SETUP.md](./ADO_INTEGRATION_SETUP.md) for detailed instructions.

## 📝 Future Enhancements

- [x] Azure DevOps integration
- [x] Voice agent integration (MCP server)
- [ ] Direct integration with Microsoft Forms API
- [ ] Database storage for submissions
- [ ] Email notifications
- [ ] Support for additional file formats (Excel, PowerPoint)
- [ ] User authentication and authorization
- [ ] Submission history and analytics
- [ ] Batch processing for multiple requests

## 🤝 Contributing

This is a custom internal tool for CMG Change Management. For questions or issues, contact the development team.

## 📄 License

Internal use only - CMG Change Management Group

---

**Built with ❤️ using OpenAI GPT-4 and modern web technologies**
