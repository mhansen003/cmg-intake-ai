# MCP Server Quick Start Guide

## What You Now Have

✅ **MCP Server** (`server/src/mcp-server.ts`) - Receives calls from Retell AI
✅ **Tool: `create_ado_ticket`** - Creates ADO work items with description, username, email
✅ **Scripts** - `npm run dev:mcp` to start the server
✅ **Documentation** - Full setup guide in `MCP_SERVER_SETUP.md`

## Quick Start (3 Steps)

### Step 1: Verify Environment Configuration

Make sure `server/.env` has your ADO credentials:

```env
ADO_ORGANIZATION=cmgfidev
ADO_PROJECT=EX Intake and Change Management
ADO_PAT=your_personal_access_token_here
ADO_AREA_PATH=EX Intake and Change Management
ADO_ITERATION_PATH=EX Intake and Change Management
```

If you don't have a PAT yet, see [ADO_INTEGRATION_SETUP.md](./ADO_INTEGRATION_SETUP.md).

### Step 2: Start the MCP Server

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

### Step 3: Configure Retell AI

#### A. Expose Your Local Server (For Testing)

Use one of these tools to expose your local MCP server to the internet:

**Option 1: ngrok**
```bash
# Install: https://ngrok.com/download
ngrok http 3002
# Copy the https:// URL (e.g., https://abc123.ngrok.io)
```

**Option 2: VS Code Port Forwarding**
1. Open the terminal where MCP server is running
2. Look for the "PORTS" tab at the bottom of VS Code
3. Click "Forward Port" and enter the port number
4. Right-click → "Port Visibility" → "Public"
5. Copy the forwarded URL

#### B. Add MCP Server to Retell AI

1. Go to https://retellai.com/dashboard
2. Navigate to **Integrations** → **MCP Servers**
3. Click **"Add MCP Server"**
4. Fill in the form:

```
MCP Name: CMG ADO Integration
MCP URL: [Your ngrok or forwarded URL]
Timeout: 10000
Headers: [Leave empty for now]
Query Parameters: [Leave empty]
```

5. Click **Save**

#### C. Configure Your Retell AI Agent

Go to your agent's configuration and update the system prompt to include:

```
You are a CMG Change Management intake assistant. When a user needs to create a change request:

1. Collect the following information:
   - Title: Brief summary of the request
   - Description: Detailed explanation
   - Name: User's full name
   - Email: User's email address

2. Once you have all required information, use the create_ado_ticket tool to create the work item.

3. Confirm the work item ID to the user.

Example:
User: "I need to report a bug in SmartApp"
You: "I can help! Can you describe the bug?"
User: "The login button doesn't work"
You: "I'll need your name and email to create this ticket."
User: "John Doe, john@example.com"
You: [Use create_ado_ticket tool]
You: "Done! Created work item #78430 for you."
```

## Testing the Integration

### Test 1: Make a Voice Call

1. Go to Retell AI dashboard
2. Create a test call to your agent
3. Say: _"Hi, I need to create a change request for a bug in SmartApp. The login button doesn't respond when clicked. My name is John Doe and my email is john.doe@example.com"_
4. The agent should:
   - Acknowledge your request
   - Call the MCP tool
   - Confirm the work item was created
5. **Verify**: Check Azure DevOps for the new work item

### Test 2: Check the Logs

While the call is happening, watch the MCP server terminal:

```
📝 Creating ADO ticket for John Doe (john.doe@example.com)
   Title: Fix login bug in SmartApp
Creating ADO work item...
✅ Work item created successfully! ID: 78430
```

### Test 3: Verify in Azure DevOps

1. Go to: https://cmgfidev.visualstudio.com
2. Open your project: **EX Intake and Change Management**
3. Navigate to **Boards** → **Work Items**
4. Look for the newly created User Story
5. Verify it has:
   - ✅ Title from the conversation
   - ✅ Description with user info
   - ✅ Requester name and email in description
   - ✅ Tags: `CMG-Intake`, `AI-Submitted`

## The MCP Tool Parameters

When Retell AI calls `create_ado_ticket`, it sends:

**Required:**
- `title` (string) - Brief summary
- `description` (string) - Detailed description
- `userName` (string) - Name of requester
- `userEmail` (string) - Email of requester

**Optional:**
- `softwarePlatforms` (array) - e.g., ["SmartApp", "AIO Portal"]
- `impactedAreas` (array) - e.g., ["Processing", "Underwriting"]
- `channels` (array) - e.g., ["Retail", "Consumer Direct"]

## Common Issues

### ❌ "ADO integration disabled"

**Fix:**
- Check `server/.env` has all ADO variables
- Restart the MCP server

### ❌ Retell AI can't connect

**Fix:**
- Verify ngrok/tunnel is running
- Check the URL is correct
- Ensure MCP server is running

### ❌ Tool not called by agent

**Fix:**
- Update Retell AI agent's system prompt
- Make sure the prompt instructs the agent to collect all required fields
- Test by explicitly providing all info in one message

## Next Steps

Once testing works:

1. **Deploy to Production**
   - Deploy your server to Vercel, Railway, or similar
   - Update Retell AI with the production URL
   - Add API key authentication (see MCP_SERVER_SETUP.md)

2. **Customize the Tool**
   - Add more parameters (priority, due date, etc.)
   - Map to custom ADO fields
   - Support multiple work item types

3. **Monitor Usage**
   - Set up logging with PM2 or similar
   - Monitor ADO API usage
   - Track successful vs. failed requests

## Summary

You now have:

✅ MCP server that exposes `create_ado_ticket` tool
✅ Integration with your existing Azure DevOps service
✅ Ready to receive calls from Retell AI voice agents
✅ Captures: description, username, email (plus optional fields)

**To answer your original question:** Yes, this is the right way! The image you showed is for *connecting* to an MCP server. You've now *created* the MCP server that Retell AI will connect to. 🎉

---

**Need Help?** See [MCP_SERVER_SETUP.md](./MCP_SERVER_SETUP.md) for detailed documentation.
