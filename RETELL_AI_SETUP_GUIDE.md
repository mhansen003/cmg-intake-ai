# Retell AI Setup Guide

## Quick Setup Checklist

- [ ] Add MCP server to Retell AI
- [ ] Configure agent system prompt
- [ ] Test with a voice call
- [ ] Verify ticket appears in Azure DevOps

---

## Step 1: Add MCP Server to Retell AI

### Navigate to Retell AI Dashboard
https://retellai.com/dashboard

### Add Your MCP Server

1. Look for **"Tools"**, **"Custom Tools"**, **"Integrations"**, or **"MCP Servers"** in the menu
2. Click **"Add MCP Server"** or similar button
3. Fill in:

```
MCP Name: CMG ADO Integration
MCP URL: https://cmg-intake-f4d9ok5so-cmgprojects.vercel.app/api/mcp
Timeout (ms): 10000
Headers: (leave empty)
Query Parameters: (leave empty)
```

4. Click **"Save"**

---

## Step 2: Configure Agent System Prompt

Go to your agent's configuration and paste this system prompt:

```
You are a helpful CMG Change Management intake assistant. Your job is to help users create change request tickets in Azure DevOps.

## Your Role
- Listen to users describe issues, bugs, or feature requests
- Ask clarifying questions to understand their needs
- Collect required information
- Create tickets using the create_ado_ticket tool

## Required Information to Collect
You MUST collect these 4 pieces of information before creating a ticket:
1. **Title** - A brief summary of the request (1 sentence)
2. **Description** - Detailed explanation of what they need
3. **User's Name** - Their full name
4. **User's Email** - Their email address

## Optional Information (ask if relevant)
- **Software Platforms** - Which systems are affected? (e.g., SmartApp, AIO Portal)
- **Impacted Areas** - Which business areas? (e.g., Processing, Underwriting)
- **Channels** - Which channels? (e.g., Retail, Consumer Direct)

## Conversation Flow

1. **Greeting**: Warmly greet the user and ask how you can help

2. **Understand the Request**:
   - Let them describe their issue or request
   - Ask clarifying questions to understand the details
   - Summarize what you heard to confirm understanding

3. **Collect Required Info**:
   - If they haven't provided their name, ask: "Can I get your name for the ticket?"
   - If they haven't provided their email, ask: "And what's your email address?"
   - Create a clear title from their description if they didn't provide one

4. **Create the Ticket**:
   - Once you have title, description, name, and email, use the create_ado_ticket tool
   - Call it with all the information you collected

5. **Confirm Success**:
   - Tell them the ticket was created successfully
   - Give them the work item number
   - Let them know someone will follow up

## Example Conversation

User: "Hi, I'm having trouble logging into SmartApp"

You: "I'd be happy to help you create a ticket for that. Can you tell me more about what's happening when you try to log in?"

User: "The login button doesn't respond when I click it. I've tried refreshing but nothing happens."

You: "I understand - the login button in SmartApp isn't responding even after refreshing. Let me create a ticket for this. Can I get your name?"

User: "Mark Hansen"

You: "Thanks Mark. And what's your email address?"

User: "mark.hansen@cmg.com"

You: "Perfect, let me create that ticket for you right now."

[Uses create_ado_ticket tool with:
- title: "SmartApp login button not responding"
- description: "User reports that the login button in SmartApp doesn't respond when clicked. Issue persists after refreshing the page."
- userName: "Mark Hansen"
- userEmail: "mark.hansen@cmg.com"
- softwarePlatforms: ["SmartApp"]
- impactedAreas: ["Authentication"]
]

You: "Done! I've created work item #85979 for you. The team will review it and reach out to you at mark.hansen@cmg.com. Is there anything else I can help you with?"

## Important Rules
- ALWAYS collect name and email before creating a ticket
- Be conversational and helpful, not robotic
- Summarize what you heard to confirm understanding
- If unsure about details, ask clarifying questions
- After creating a ticket, always tell them the work item number
- Be patient if they don't provide all info at once
- If they're reporting a bug, ask about impact and affected systems
```

---

## Step 3: Test Your Configuration

### Test Call Script

Call your Retell AI agent and say:

```
"Hi, I need to report a problem with SmartApp.
The login button isn't working when I click it.
My name is [Your Name] and my email is [your.email@cmg.com]"
```

### What Should Happen

1. **Agent greets you** and acknowledges your issue
2. **Agent may ask clarifying questions** about the problem
3. **Agent confirms it has your name and email**
4. **Agent says**: "Let me create that ticket for you"
5. **Agent confirms**: "Done! I've created work item #XXXXX"

### Verify in Azure DevOps

Go to: https://cmgfidev.visualstudio.com/EX%20Intake%20and%20Change%20Management/_boards/board/t/EX%20Intake%20and%20Change%20Management%20Team/Stories

Look for the new work item with your test data.

---

## MCP Tool Parameters

The agent will call `create_ado_ticket` with these parameters:

### Required
```json
{
  "title": "Brief summary",
  "description": "Detailed description",
  "userName": "User's full name",
  "userEmail": "user@email.com"
}
```

### Optional
```json
{
  "softwarePlatforms": ["SmartApp", "AIO Portal"],
  "impactedAreas": ["Processing", "Underwriting"],
  "channels": ["Retail", "Consumer Direct"]
}
```

---

## Troubleshooting

### Agent doesn't call the tool

**Problem**: Agent acknowledges the request but doesn't create a ticket

**Solution**:
- Make sure you provided all 4 required fields (title, description, name, email)
- Check that the MCP server was saved correctly in Retell AI
- Try saying explicitly: "Please create a ticket for this"

---

### Tool call fails

**Problem**: Agent says it tried but got an error

**Solution**:
1. Test the MCP endpoint manually:
   ```bash
   curl -X POST https://cmg-intake-f4d9ok5so-cmgprojects.vercel.app/api/mcp \
     -H "Content-Type: application/json" \
     -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
   ```
2. Check Vercel logs: https://vercel.com/cmgprojects/cmg-intake-ai
3. Verify environment variables are set in Vercel dashboard

---

### Agent doesn't collect all information

**Problem**: Agent tries to create ticket without name/email

**Solution**:
- Update the system prompt to emphasize collecting required fields
- Add explicit checks in the prompt: "Before using the tool, ensure you have..."

---

## Advanced Configuration

### Adding More Context to Tickets

Edit the system prompt to ask about:
- **Priority**: Is this urgent?
- **Impact**: How many users are affected?
- **Workaround**: Is there a temporary solution?
- **Steps to Reproduce**: For bugs, how can we recreate this?

Then include this information in the `description` field.

### Auto-Detecting Software Platforms

Train the agent to recognize platform names:
- "I can't log into **SmartApp**" → softwarePlatforms: ["SmartApp"]
- "The **AIO Portal** is slow" → softwarePlatforms: ["AIO Portal"]

Add this to the system prompt:
```
When users mention specific systems, automatically include them in softwarePlatforms:
- SmartApp
- AIO Portal
- Build and Lock Portal
- etc.
```

### Custom Greeting

Personalize the greeting in the system prompt:
```
## Greeting
Start with: "Hello! I'm the CMG Change Management assistant. I can help you create tickets for system issues or feature requests. What can I help you with today?"
```

---

## Testing Checklist

Before going live:

- [ ] Test call works end-to-end
- [ ] Ticket appears in Azure DevOps
- [ ] Work item has correct title and description
- [ ] Requester name and email are in the description
- [ ] Agent confirms the work item number
- [ ] Agent handles missing information gracefully
- [ ] Agent can handle multiple tickets in one call
- [ ] Test with different scenarios (bug, feature request, question)

---

## Your MCP Server Details

**Production URL**: https://cmg-intake-f4d9ok5so-cmgprojects.vercel.app/api/mcp

**Available Tool**: `create_ado_ticket`

**Environment**: Vercel (serverless)

**Monitoring**: https://vercel.com/cmgprojects/cmg-intake-ai

---

## Need Help?

Check these files in your project:
- `QUICK_START_MCP.md` - Quick start guide
- `VERCEL_MCP_DEPLOYMENT.md` - Deployment details
- `MCP_ARCHITECTURE.md` - Technical architecture
- `MCP_SERVER_SETUP.md` - Full documentation

---

**Ready to test?** Call your Retell AI agent and create your first ticket! 🎉
