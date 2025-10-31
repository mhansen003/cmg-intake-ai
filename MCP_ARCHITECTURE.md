# MCP Architecture Overview

## System Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                         USER INTERACTION                         │
└──────────────────────────────────────────────────────────────────┘
                                 │
                                 │ Voice
                                 ▼
┌──────────────────────────────────────────────────────────────────┐
│                      RETELL AI VOICE AGENT                       │
│  - Speech-to-Text (STT)                                          │
│  - Natural Language Processing                                   │
│  - Text-to-Speech (TTS)                                          │
│  - MCP Client                                                    │
└──────────────────────────────────────────────────────────────────┘
                                 │
                                 │ MCP Protocol (STDIO/HTTP)
                                 │ Tool Call: create_ado_ticket
                                 ▼
┌──────────────────────────────────────────────────────────────────┐
│                         YOUR MCP SERVER                          │
│  Location: server/src/mcp-server.ts                             │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Tool: create_ado_ticket                                   │ │
│  │  ├─ Receives: title, description, userName, userEmail     │ │
│  │  ├─ Validates: Required fields                            │ │
│  │  └─ Formats: Request for ADO                              │ │
│  └────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
                                 │
                                 │ Internal Call
                                 ▼
┌──────────────────────────────────────────────────────────────────┐
│                      AZURE DEVOPS SERVICE                        │
│  Location: server/src/ado-service.ts                            │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  • Authenticates with PAT                                  │ │
│  │  • Builds JSON Patch document                              │ │
│  │  • Formats HTML description                                │ │
│  │  • Adds tags and metadata                                  │ │
│  │  • Uploads attachments (optional)                          │ │
│  └────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
                                 │
                                 │ HTTPS REST API
                                 │ POST /workitems/$User Story
                                 ▼
┌──────────────────────────────────────────────────────────────────┐
│                    AZURE DEVOPS (ADO)                            │
│  Organization: cmgfidev                                          │
│  Project: EX Intake and Change Management                        │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Work Item Created:                                        │ │
│  │  • Type: User Story                                        │ │
│  │  • State: New                                              │ │
│  │  • Tags: CMG-Intake, AI-Submitted                          │ │
│  │  • Description: Formatted with user info                   │ │
│  └────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

## Data Flow

### Step 1: Voice Conversation

```
User: "I need to report a bug in SmartApp. The login button doesn't work."
```

Retell AI Agent:
- Converts speech to text
- Understands intent: create change request
- Asks follow-up questions: "What's your name and email?"

### Step 2: Information Collection

```
User: "I'm John Doe, john.doe@cmg.com"
```

Retell AI Agent:
- Collects required information:
  ✓ Title: "Fix login bug in SmartApp"
  ✓ Description: "The login button doesn't work"
  ✓ Name: "John Doe"
  ✓ Email: "john.doe@cmg.com"

### Step 3: MCP Tool Call

Retell AI sends this JSON to your MCP server:

```json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "create_ado_ticket",
    "arguments": {
      "title": "Fix login bug in SmartApp",
      "description": "The login button doesn't work",
      "userName": "John Doe",
      "userEmail": "john.doe@cmg.com",
      "softwarePlatforms": ["SmartApp"],
      "impactedAreas": ["Authentication"],
      "channels": ["Retail"]
    }
  }
}
```

### Step 4: MCP Server Processing

Your MCP server (`mcp-server.ts`):

```typescript
1. Validates arguments exist
2. Extracts required fields
3. Builds full description with user info:
   "The login button doesn't work

   ---

   **Requested by:** John Doe
   **Contact:** john.doe@cmg.com"

4. Creates CMGFormData object
5. Calls adoService.createWorkItem()
```

### Step 5: ADO Service Creates Work Item

ADO Service (`ado-service.ts`):

```typescript
1. Builds JSON Patch document:
   [
     { op: 'add', path: '/fields/System.Title', value: '...' },
     { op: 'add', path: '/fields/System.Description', value: '...' },
     { op: 'add', path: '/fields/System.Tags', value: '...' }
   ]

2. Sends POST request to:
   https://dev.azure.com/cmgfidev/EX%20Intake/.../workitems/$User Story

3. Receives response with work item ID
```

### Step 6: Response Back to User

MCP Server returns to Retell AI:

```json
{
  "success": true,
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

Retell AI tells the user:

```
"Great! I've created work item #78430 for you.
The team will review it and get back to you."
```

## MCP Protocol Details

### What is MCP?

**Model Context Protocol (MCP)** is a standard for exposing tools and resources to AI models. It allows AI agents (like Retell AI) to call functions in your backend systems.

### Key Concepts

1. **Server**: Your application that exposes tools (you built this!)
2. **Client**: The AI agent that calls tools (Retell AI)
3. **Tool**: A function the AI can call (`create_ado_ticket`)
4. **Transport**: How they communicate (STDIO or HTTP)

### Why STDIO Transport?

The MCP server uses **STDIO** (Standard Input/Output) transport because:

- **Simplicity**: No need to manage HTTP ports and routing
- **Security**: Process isolation - server runs as a subprocess
- **Reliability**: Direct pipe communication
- **MCP Standard**: Officially recommended by the MCP spec

### How Retell AI Connects

Retell AI acts as an MCP client and:

1. Spawns your MCP server as a subprocess (or connects via HTTP)
2. Sends tool calls via STDIN (standard input)
3. Receives responses via STDOUT (standard output)
4. Handles errors via STDERR (standard error)

## File Structure

```
C:\GitHub\cmg-intake-ai/
├── server/
│   ├── src/
│   │   ├── mcp-server.ts          ⭐ NEW: MCP server implementation
│   │   ├── ado-service.ts         ✅ Existing: ADO integration
│   │   ├── types.ts               ✅ Existing: TypeScript types
│   │   └── index.ts               ✅ Existing: Express API server
│   ├── package.json               ✅ Updated: Added MCP scripts
│   └── .env                       ✅ Required: ADO credentials
│
├── MCP_SERVER_SETUP.md            ⭐ NEW: Detailed setup guide
├── QUICK_START_MCP.md             ⭐ NEW: Quick start guide
├── MCP_ARCHITECTURE.md            ⭐ NEW: This file
├── test-mcp-server.js             ⭐ NEW: Test script
└── ADO_INTEGRATION_SETUP.md       ✅ Existing: ADO setup guide
```

## Configuration

### Environment Variables (server/.env)

```env
# Required for MCP server
ADO_ORGANIZATION=cmgfidev
ADO_PROJECT=EX Intake and Change Management
ADO_PAT=your_personal_access_token

# Optional
ADO_AREA_PATH=EX Intake and Change Management
ADO_ITERATION_PATH=EX Intake and Change Management
```

### Scripts (server/package.json)

```json
{
  "scripts": {
    "dev": "nodemon --exec ts-node src/index.ts",       // Express API
    "dev:mcp": "ts-node src/mcp-server.ts",             // MCP server ⭐ NEW
    "start:mcp": "node dist/mcp-server.js"              // MCP prod ⭐ NEW
  }
}
```

## Security Considerations

### Current Setup (Development)

✅ **Secure**:
- PAT stored in `.env` (gitignored)
- Server-to-server communication
- No client-side exposure

⚠️ **Not Secure**:
- No authentication on MCP server
- Anyone with the URL can create tickets

### Production Recommendations

1. **Add API Key Authentication**:
   ```typescript
   const API_KEY = process.env.MCP_API_KEY;
   // Validate in request handler
   ```

2. **Use HTTPS Only**:
   - Deploy to Vercel, Railway, or similar
   - Don't use ngrok in production

3. **Rate Limiting**:
   - Limit requests per IP/client
   - Prevent abuse

4. **Logging & Monitoring**:
   - Log all requests
   - Monitor for unusual patterns
   - Alert on failures

5. **Signature Verification**:
   - Verify requests come from Retell AI
   - Use Retell AI's webhook signature if available

## Comparison: MCP Server vs Express API

### Your Existing Express API (`src/index.ts`)

```typescript
// Traditional REST API
app.post('/api/submit', (req, res) => {
  // Web form submission
  // Returns JSON response
});
```

**Used by**: Web browsers, HTTP clients

### Your New MCP Server (`src/mcp-server.ts`)

```typescript
// MCP Protocol
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  // Tool call from AI agent
  // Returns structured response
});
```

**Used by**: AI agents (Retell AI, Claude, etc.)

### Key Differences

| Feature           | Express API            | MCP Server                |
|-------------------|------------------------|---------------------------|
| **Protocol**      | HTTP/REST              | MCP (STDIO/HTTP)          |
| **Clients**       | Web browsers           | AI agents                 |
| **Request Format**| Form data, JSON        | MCP tool call schema      |
| **Response**      | JSON                   | MCP result schema         |
| **Discovery**     | Manual (docs)          | Automatic (ListTools)     |
| **Validation**    | Manual                 | Schema-based              |

### Why Both?

You now have **two interfaces** to create ADO tickets:

1. **Express API** (`/api/submit`):
   - For your web application
   - Human users filling forms
   - File uploads supported

2. **MCP Server** (`create_ado_ticket`):
   - For AI agents (Retell AI)
   - Voice conversations
   - Structured tool calls

Both use the same underlying `ado-service.ts` to create work items! 🎉

## Next Steps

1. ✅ **Test Locally**: Use `test-mcp-server.js` to verify it works
2. ✅ **Expose with ngrok**: Make it accessible to Retell AI
3. ✅ **Configure Retell AI**: Add your MCP server URL
4. ✅ **Test Voice Call**: Verify end-to-end flow
5. ✅ **Deploy to Production**: Use Vercel, Railway, etc.
6. ✅ **Add Authentication**: Secure your production deployment
7. ✅ **Monitor Usage**: Track successful vs. failed requests

---

**Questions?** See [MCP_SERVER_SETUP.md](./MCP_SERVER_SETUP.md) for detailed documentation.
