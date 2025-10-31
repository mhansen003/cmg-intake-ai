# Azure DevOps Integration Setup Guide

## Overview

Your CMG Intake AI Assistant now automatically creates work items (User Stories) in Azure DevOps when an intake form is submitted and confirmed!

## What Was Added

### 1. **ADO Service Module** (`server/src/ado-service.ts`)
- Handles authentication with Azure DevOps REST API
- Creates work items using JSON Patch format
- Formats form data into rich HTML descriptions
- Includes automatic tagging and metadata

### 2. **Integration in Submit Endpoint** (`server/src/index.ts`)
- Automatically creates ADO work item on form submission
- Non-blocking: Form submission succeeds even if ADO fails
- Returns work item ID and URL in response

### 3. **Environment Configuration** (`.env`)
- Added ADO configuration variables
- Secure PAT (Personal Access Token) authentication

---

## Setup Instructions

### Step 1: Create a Personal Access Token (PAT)

1. **Navigate to Azure DevOps**:
   - Go to https://cmgfidev.visualstudio.com
   - Sign in with your credentials

2. **Create PAT**:
   - Click your profile icon (top right) → **Personal access tokens**
   - Click **+ New Token**

3. **Configure the Token**:
   - **Name**: `CMG Intake AI Integration`
   - **Organization**: `cmgfidev`
   - **Expiration**: Choose your preferred duration (90 days recommended)
   - **Scopes**:
     - ✅ **Work Items**: **Read & Write**
     - (You can use "Full access" for testing, but "Read & Write" on Work Items is sufficient)

4. **Copy the Token**:
   - Click **Create**
   - **IMPORTANT**: Copy the token immediately! You won't see it again.
   - Save it securely (you'll add it to `.env` next)

### Step 2: Update Environment Variables

1. **Open** `server/.env` file

2. **Update the ADO configuration**:
   ```env
   # Azure DevOps Configuration
   ADO_ORGANIZATION=cmgfidev
   ADO_PROJECT=EX Intake and Change Management
   ADO_PAT=<PASTE_YOUR_PERSONAL_ACCESS_TOKEN_HERE>
   ADO_AREA_PATH=EX Intake and Change Management
   ADO_ITERATION_PATH=EX Intake and Change Management
   ```

3. **Replace** `<PASTE_YOUR_PERSONAL_ACCESS_TOKEN_HERE>` with your actual PAT

4. **Optional**: Adjust `ADO_AREA_PATH` and `ADO_ITERATION_PATH` if you want work items in a specific area/iteration

### Step 3: Restart the Server

```bash
cd server
npm run dev
```

You should see:
```
✅ Azure DevOps integration enabled
🚀 CMG Intake API Server running on http://localhost:3001
```

If ADO credentials are missing or invalid, you'll see:
```
ℹ️  Azure DevOps integration disabled (missing configuration)
```

---

## Testing the Integration

### Option 1: Use the Web Interface

1. **Start both client and server**:
   ```bash
   # Terminal 1 - Server
   cd server
   npm run dev

   # Terminal 2 - Client
   cd client
   npm run dev
   ```

2. **Open the app**: http://localhost:5173

3. **Submit a test form**:
   - Upload a document or enter text
   - Click "Analyze with AI"
   - Review and submit the form

4. **Check the response** - You should see the ADO work item ID and URL in the browser console

5. **Verify in Azure DevOps**:
   - Go to https://cmgfidev.visualstudio.com/EX%20Intake%20and%20Change%20Management/_boards/board/t/EX%20Intake%20and%20Change%20Management%20Team/Stories
   - Your new work item should appear in the "New" column

### Option 2: Test with cURL (Direct API Test)

```bash
curl -X POST http://localhost:3001/api/submit \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Work Item from API",
    "description": "This is a test description to verify ADO integration",
    "softwarePlatforms": ["SmartApp", "AIO Portal"],
    "impactedAreas": ["Processing", "Underwriting"],
    "channels": ["Retail", "Consumer Direct"]
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "message": "Form submitted successfully",
  "submissionId": "1730332800000",
  "data": { ... },
  "adoWorkItem": {
    "id": 78429,
    "url": "https://dev.azure.com/cmgfidev/..."
  },
  "adoError": null
}
```

---

## Work Item Format

Each submitted intake creates a User Story with:

### **Title**
- Direct from form submission (max 128 characters)

### **Description** (HTML formatted)
Includes:
- **Description**: Main issue/feature description
- **Software Platforms**: Bulleted list
- **Impacted Areas**: Bulleted list
- **Channels**: Bulleted list
- **Metadata**: Submission date and source

### **Tags**
Automatically tagged with:
- `CMG-Intake`
- `AI-Submitted`
- First platform (e.g., `SmartApp`)
- First impacted area (e.g., `Processing`)

### **Area Path**
- Uses `ADO_AREA_PATH` from `.env`
- Default: `EX Intake and Change Management`

### **Iteration Path**
- Uses `ADO_ITERATION_PATH` from `.env`
- Default: `EX Intake and Change Management`

### **State**
- Initial state: **New**

---

## Troubleshooting

### Problem: "ADO integration disabled"
**Solution**:
- Check that all ADO variables are set in `server/.env`
- Restart the server after updating `.env`

### Problem: "Failed to create ADO work item: 401 Unauthorized"
**Solution**:
- Verify your PAT is correct in `.env`
- Check PAT hasn't expired
- Ensure PAT has "Work Items: Read & Write" permissions

### Problem: "Failed to create ADO work item: 404 Not Found"
**Solution**:
- Verify `ADO_ORGANIZATION` and `ADO_PROJECT` match your Azure DevOps setup
- Check project name is exactly: `EX Intake and Change Management`

### Problem: Work item created but in wrong area/iteration
**Solution**:
- Update `ADO_AREA_PATH` and `ADO_ITERATION_PATH` in `.env`
- Get exact paths from Azure DevOps board settings

### Problem: Form submits but no work item created
**Solution**:
- Check server console for detailed error messages
- The form submission will succeed even if ADO fails (by design)
- Review `adoError` field in API response

---

## Security Notes

⚠️ **IMPORTANT**:
- **Never commit** `.env` file to version control
- **Never share** your Personal Access Token
- **Rotate tokens** regularly (every 90 days recommended)
- **Use minimum permissions** (Work Items: Read & Write only)

The `.env` file is already in `.gitignore` to prevent accidental commits.

---

## Advanced Configuration

### Custom Field Mapping

To map additional form fields to ADO work items, edit `server/src/ado-service.ts`:

```typescript
// Add custom fields to the patch document
patchDocument.push({
  op: 'add',
  path: '/fields/Custom.FieldName',
  value: formData.customField
});
```

### Different Work Item Types

To create different work item types (e.g., Bug, Task):

1. Edit `createWorkItem()` method in `ado-service.ts`
2. Change the API endpoint from `$User Story` to `$Bug` or `$Task`

### Retry Logic

Add retry logic for failed ADO requests in the submit endpoint.

---

## API Response Format

When a work item is successfully created:

```json
{
  "success": true,
  "message": "Form submitted successfully",
  "submissionId": "1730332800000",
  "data": { ... form data ... },
  "adoWorkItem": {
    "id": 78429,
    "url": "https://dev.azure.com/cmgfidev/..."
  },
  "adoError": null
}
```

When ADO creation fails (form still succeeds):

```json
{
  "success": true,
  "message": "Form submitted successfully",
  "submissionId": "1730332800000",
  "data": { ... form data ... },
  "adoWorkItem": null,
  "adoError": "Failed to create ADO work item: 401 Unauthorized"
}
```

---

## Next Steps

1. ✅ Create your Personal Access Token
2. ✅ Update `server/.env` with your PAT
3. ✅ Restart the server
4. ✅ Test the integration
5. ✅ Submit a real intake and verify it appears in ADO

**Questions?** Check the troubleshooting section or review the server logs for detailed error messages.

---

Built with ❤️ for CMG Change Management
