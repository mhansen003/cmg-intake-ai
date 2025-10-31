# 🚀 Quick Start Guide

## Required: OpenAI API Key Setup

Before running the application, you **MUST** configure your OpenAI API key:

### 1. Get Your OpenAI API Key

1. Go to https://platform.openai.com/api-keys
2. Sign in or create an account
3. Click "Create new secret key"
4. Copy the key (starts with `sk-`)

### 2. Configure the Backend

1. Navigate to the server directory:
   ```bash
   cd C:\GitHub\cmg-intake-ai\server
   ```

2. Create a `.env` file:
   ```bash
   # On Windows PowerShell:
   Copy-Item .env.example .env

   # Or manually create the file with this content:
   ```

3. Edit `.env` and paste your OpenAI API key:
   ```env
   OPENAI_API_KEY=sk-your-actual-api-key-here
   PORT=3001
   ```

   **Important**: Replace `sk-your-actual-api-key-here` with your actual API key!

### 3. Start the Application

**Option A: Using npm (Recommended)**

Open TWO terminal windows:

**Terminal 1 - Backend:**
```bash
cd C:\GitHub\cmg-intake-ai\server
npm run dev
```

Wait for: `🚀 CMG Intake API Server running on http://localhost:3001`

**Terminal 2 - Frontend:**
```bash
cd C:\GitHub\cmg-intake-ai\client
npm run dev
```

Wait for: `Local: http://localhost:5173/`

**Option B: Using the provided scripts (if available)**

```bash
cd C:\GitHub\cmg-intake-ai
npm run start:all
```

### 4. Open the Application

Open your browser and go to:
```
http://localhost:5173
```

## ✅ Verify It's Working

1. You should see the "CMG Intake AI Assistant" landing page
2. Try typing some text or uploading a test PDF
3. Click "Analyze with AI"
4. The form should auto-populate with extracted data

## 🐛 Common Issues

### Issue: "Failed to analyze content"
**Solution**: Check that your OpenAI API key is correctly set in `server/.env`

### Issue: "Cannot connect to server"
**Solution**: Make sure the backend is running on http://localhost:3001

### Issue: npm command not found
**Solution**: Install Node.js from https://nodejs.org/ (version 18 or higher)

### Issue: Port already in use
**Solution**:
- Change the port in `server/.env` (e.g., `PORT=3002`)
- Update the API URL in `client/src/api.ts` to match

## 📊 Testing the System

### Sample Test Input

Try pasting this into the text field:

```
We need to update the SmartApp platform to support the new loan processing workflow.
This change will impact the Processing and Underwriting teams across the Retail and
Wholesale channels. We need to add a new document upload feature that integrates with
the Document Vendor system. The feature should allow loan officers to upload multiple
documents at once and automatically categorize them based on document type.
```

The AI should extract:
- **Title**: Update SmartApp for new loan processing workflow
- **Platforms**: SmartApp, Document Vendor
- **Areas**: Processing, Underwriting
- **Channels**: Retail, Wholesale

## 📞 Need Help?

If you encounter issues:
1. Check the server terminal for error messages
2. Check the browser console (F12) for frontend errors
3. Verify your OpenAI API key is valid and has credits
4. Review the troubleshooting section in README.md

---

**Ready to revolutionize your CMG intake process! 🎉**
