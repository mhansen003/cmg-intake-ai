# MCP Server Setup for Retell AI Integration

## Overview

This MCP (Model Context Protocol) server allows Retell AI voice agents to create Azure DevOps work items directly through voice conversations. Users can describe their change requests, provide their name and email, and the system automatically creates tickets in your ADO system.

## Architecture

```
Retell AI Voice Agent → MCP Server → Azure DevOps API → Work Item Created
```

1. **User** speaks to Retell AI voice agent
2. **Retell AI** processes the conversation and calls the MCP tool `create_ado_ticket`
3. **MCP Server** receives the request with description, username, and email
4. **ADO Service** creates a work item in Azure DevOps
5. **Response** returns with work item ID and URL

## Prerequisites

✅ Azure DevOps Personal Access Token (PAT) with Work Items Read & Write permissions
✅ Node.js and npm installed
✅ TypeScript installed
✅ Environment variables configured in `server/.env`

## Installation

### 1. Install Dependencies

From the project root:

```bash
cd server
npm install
```

This will install:
- `@modelcontextprotocol/sdk` - MCP protocol implementation
- `zod` - Schema validation
- All existing dependencies (axios, express, etc.)

### 2. Configure Environment Variables

Ensure your `server/.env` file has the following ADO configuration:

```env
# Azure DevOps Configuration
ADO_ORGANIZATION=cmgfidev
ADO_PROJECT=EX Intake and Change Management
ADO_PAT=your_personal_access_token_here
ADO_AREA_PATH=EX Intake and Change Management
ADO_ITERATION_PATH=EX Intake and Change Management
```

If you haven't created a PAT yet, see [ADO_INTEGRATION_SETUP.md](./ADO_INTEGRATION_SETUP.md) for detailed instructions.

## Running the MCP Server

### Development Mode

```bash
cd server
npm run dev:mcp
```

You should see:
```
🚀 Starting CMG ADO MCP Server...
✅ Azure DevOps service initialized
✅ MCP Server running and ready to accept connections
📋 Available tools: create_ado_ticket
```

### Production Mode

First, build the TypeScript code:

```bash
cd server
npm run build
npm run start:mcp
```

## Configuring Retell AI to Use Your MCP Server

### Option 1: Local Development (Testing)

If testing locally, you'll need to expose your MCP server to the internet so Retell AI can reach it. You can use:

- **ngrok**: `ngrok http 3002` (if running on port 3002)
- **localtunnel**: `lt --port 3002`
- **VS Code Port Forwarding**: If using VS Code, right-click the terminal port and select "Forward Port"

Then configure Retell AI with:
- **MCP Name**: CMG ADO Integration
- **MCP URL**: `http://your-ngrok-url` or `https://your-tunnel-url`

### Option 2: Production Deployment

Deploy your MCP server to a cloud provider:

**Vercel/Railway/Render:**
```bash
# Deploy using your preferred platform
# Make sure to set environment variables in the deployment dashboard
```

Then configure Retell AI with:
- **MCP Name**: CMG ADO Integration
- **MCP URL**: `https://your-deployed-url.com`

### Retell AI Configuration

In your Retell AI dashboard (retellai.com):

1. **Go to Integrations** → **Add MCP Server**
2. **Enter the following:**
   - **Name**: CMG ADO Integration
   - **URL**: Your MCP server URL (local tunnel or production URL)
   - **Timeout**: 10000 ms (10 seconds is usually sufficient)

3. **Optional Headers** (if you add authentication later):
   - Leave blank for now

4. **Query Parameters**: None required

5. **Click Save**

## Testing the MCP Server

### Test 1: Direct Command Line Test

Create a test script to verify the MCP server works:

```bash
cd server
node -e "
const { spawn } = require('child_process');
const mcp = spawn('npm', ['run', 'dev:mcp']);

// Send a test request
setTimeout(() => {
  console.log('MCP server should be running...');
}, 3000);

mcp.stdout.on('data', (data) => console.log(data.toString()));
mcp.stderr.on('data', (data) => console.error(data.toString()));
"
```

### Test 2: Verify with Retell AI

Once configured in Retell AI:

1. **Create a test call** in Retell AI dashboard
2. **Say something like:**
   - "Hi, I need to create a change request"
   - "I need to update the SmartApp platform to fix a processing bug"
   - "My name is John Doe and my email is john.doe@example.com"

3. **The voice agent should:**
   - Collect: title/description, name, and email
   - Call the MCP tool `create_ado_ticket`
   - Respond with the work item ID

4. **Verify in Azure DevOps:**
   - Go to your ADO board
   - Look for the newly created work item

## MCP Tool Reference

### `create_ado_ticket`

Creates an Azure DevOps work item from voice conversation data.

**Required Parameters:**
- `title` (string): Brief summary of the request (max 128 chars)
- `description` (string): Detailed description of the change needed
- `userName` (string): Name of the person requesting the change
- `userEmail` (string): Email address of the requester

**Optional Parameters:**
- `softwarePlatforms` (array of strings): e.g., ["SmartApp", "AIO Portal"]
- `impactedAreas` (array of strings): e.g., ["Processing", "Underwriting"]
- `channels` (array of strings): e.g., ["Retail", "Consumer Direct"]

**Example Request:**
```json
{
  "name": "create_ado_ticket",
  "arguments": {
    "title": "Fix login bug in SmartApp",
    "description": "Users are unable to login to SmartApp after the recent update. The login button is not responding.",
    "userName": "John Doe",
    "userEmail": "john.doe@cmg.com",
    "softwarePlatforms": ["SmartApp"],
    "impactedAreas": ["Authentication"],
    "channels": ["Retail"]
  }
}
```

**Example Response:**
```json
{
  "success": true,
  "message": "Work item created successfully",
  "workItem": {
    "id": 78430,
    "url": "https://dev.azure.com/cmgfidev/...",
    "title": "Fix login bug in SmartApp",
    "state": "New"
  },
  "requestedBy": {
    "name": "John Doe",
    "email": "john.doe@cmg.com"
  }
}
```

## Configuring Retell AI Prompts

To make the voice agent collect the right information, add this to your Retell AI agent's system prompt:

```
You are a CMG Change Management intake assistant. Your job is to help users create change requests.

When a user describes a change they need:
1. Ask clarifying questions to understand the request
2. Collect the following information:
   - Title: A brief summary of the change
   - Description: Detailed explanation of what needs to change
   - Name: The user's full name
   - Email: The user's email address
   - Optional: Which software platforms are affected
   - Optional: Which business areas are impacted
   - Optional: Which channels are affected

3. Once you have title, description, name, and email, use the create_ado_ticket tool to create the work item.

4. Confirm the work item was created and provide the work item ID to the user.

Example conversation:
User: "I need to report a bug in SmartApp"
Assistant: "I can help you create a change request. Can you describe the bug you're experiencing?"
User: "When I click the login button, nothing happens"
Assistant: "I understand. To create this ticket, I'll need your name and email address."
User: "I'm John Doe, john.doe@cmg.com"
Assistant: "Great! Let me create this work item for you."
[Calls create_ado_ticket tool]
Assistant: "Done! I've created work item #78430 for you. The team will review it and get back to you."
```

## Troubleshooting

### MCP Server won't start

**Problem:** Error: "Missing required ADO configuration"

**Solution:**
- Check that `server/.env` has all required variables
- Verify `ADO_PAT` is set and not expired
- Ensure there are no extra spaces in variable names

---

**Problem:** TypeError: Cannot read property 'createWorkItem'

**Solution:**
- Ensure `ado-service.ts` is compiled correctly
- Try rebuilding: `npm run build`
- Check that all imports are correct

### Retell AI can't connect to MCP server

**Problem:** "Connection refused" or timeout

**Solution:**
- Verify the MCP server is running
- Check the URL is correct and accessible
- If using ngrok/tunnel, ensure it's still active
- Check firewall settings

---

**Problem:** Retell AI receives 404

**Solution:**
- Verify the MCP server URL doesn't include `/api` or other paths
- The MCP SDK handles routing automatically
- Use the base URL only

### Work items not creating

**Problem:** MCP tool called but no work item appears

**Solution:**
- Check server logs for detailed error messages
- Verify PAT permissions (Work Items: Read & Write)
- Test ADO service directly using `test-ado-integration.js`
- Check project name is exactly: `EX Intake and Change Management`

### Voice agent not collecting information

**Problem:** Agent doesn't ask for name/email

**Solution:**
- Update Retell AI system prompt (see "Configuring Retell AI Prompts" above)
- Make sure the agent knows to collect required fields before calling the tool
- Test with explicit user input

## Security Considerations

⚠️ **IMPORTANT:**

1. **Never expose your PAT** in client-side code or logs
2. **Use HTTPS** in production (not HTTP)
3. **Add authentication** to your MCP server in production:
   - Add API key validation
   - Use Retell AI's signature verification
4. **Rotate PATs** regularly (every 90 days recommended)
5. **Monitor usage** in Azure DevOps to detect unusual activity

### Adding Authentication (Recommended for Production)

Edit `mcp-server.ts` to add API key validation:

```typescript
const API_KEY = process.env.MCP_API_KEY;

// Validate requests have the correct API key
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  // Add API key validation here
  const apiKey = request.meta?.apiKey;
  if (apiKey !== API_KEY) {
    throw new Error('Unauthorized');
  }

  // ... rest of handler
});
```

Then add the API key in Retell AI headers:
- **Key**: `X-API-Key`
- **Value**: Your secret API key

## Advanced Configuration

### Custom Work Item Types

To create different work item types (Bug, Task, etc.), edit `mcp-server.ts`:

```typescript
// Change from User Story to Bug
const workItem = await adoService.createWorkItem(formData);

// Modify ado-service.ts createWorkItem method:
// Change: '/_apis/wit/workitems/$User Story?api-version=7.1'
// To: '/_apis/wit/workitems/$Bug?api-version=7.1'
```

### Adding Custom Fields

To add custom ADO fields, modify the `formData` structure in `mcp-server.ts`:

```typescript
const formData: CMGFormData & { customField?: string } = {
  title: title,
  description: fullDescription,
  customField: args.customField,
  // ...
};
```

Then update `ado-service.ts` to include the custom field in the patch document.

### Multiple ADO Projects

To support creating work items in different projects:

1. Add a `project` parameter to the MCP tool
2. Create multiple `AzureDevOpsService` instances (one per project)
3. Route requests to the appropriate service based on the project parameter

## Monitoring and Logging

The MCP server logs all requests to stdout/stderr. To save logs to a file:

```bash
npm run dev:mcp > mcp-server.log 2>&1
```

Or use a process manager like PM2:

```bash
npm install -g pm2
pm2 start npm --name "mcp-server" -- run dev:mcp
pm2 logs mcp-server
```

## Next Steps

1. ✅ Configure your `server/.env` with ADO credentials
2. ✅ Start the MCP server: `npm run dev:mcp`
3. ✅ Expose to internet (ngrok for testing)
4. ✅ Add MCP server to Retell AI dashboard
5. ✅ Configure Retell AI agent prompt
6. ✅ Test with a voice call
7. ✅ Verify work items appear in ADO
8. ✅ Deploy to production

## Support

- **MCP SDK Documentation**: https://modelcontextprotocol.io
- **Retell AI Documentation**: https://docs.retellai.com
- **Azure DevOps API**: https://docs.microsoft.com/en-us/rest/api/azure/devops/

---

Built with ❤️ for CMG Change Management
