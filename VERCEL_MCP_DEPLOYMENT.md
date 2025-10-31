# Deploying MCP Server to Vercel

## Overview

Your MCP server is now configured to run on Vercel as a serverless HTTP endpoint! This guide will walk you through deploying it.

## What Changed

✅ **Created**: `api/mcp.ts` - HTTP-based MCP endpoint (Vercel-compatible)
✅ **Updated**: `vercel.json` - Added MCP route and environment variables
✅ **Compatible**: Works with Vercel's serverless architecture

## Architecture

```
Retell AI → [HTTPS] → https://your-app.vercel.app/api/mcp → MCP Handler → ADO Service → Azure DevOps
```

Instead of STDIO transport (which requires persistent processes), the HTTP version uses standard HTTP POST requests - perfect for Vercel!

## Deployment Steps

### Step 1: Set Environment Variables in Vercel

1. **Go to your Vercel dashboard**: https://vercel.com/dashboard
2. **Select your project** (or create new one)
3. **Go to Settings** → **Environment Variables**
4. **Add the following variables**:

```
ADO_ORGANIZATION = cmgfidev
ADO_PROJECT = EX Intake and Change Management
ADO_PAT = your_personal_access_token_here
ADO_AREA_PATH = EX Intake and Change Management
ADO_ITERATION_PATH = EX Intake and Change Management
```

⚠️ **IMPORTANT**:
- Set each variable for **All Environments** (Production, Preview, Development)
- Click "Save" after adding each variable
- Never commit your PAT to Git!

### Step 2: Deploy to Vercel

#### Option A: Deploy via Vercel CLI

```bash
# Install Vercel CLI (if not already installed)
npm install -g vercel

# Login to Vercel
vercel login

# Deploy from project root
cd C:\GitHub\cmg-intake-ai
vercel --prod
```

#### Option B: Deploy via Git

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Add MCP server for Vercel"
   git push
   ```

2. **Connect to Vercel**:
   - Go to https://vercel.com/new
   - Import your GitHub repository
   - Vercel will auto-detect the configuration
   - Click "Deploy"

#### Option C: Deploy via Vercel Dashboard

1. Go to https://vercel.com/new
2. Click "Add New Project"
3. Import from Git or upload your project folder
4. Vercel will use your `vercel.json` configuration
5. Click "Deploy"

### Step 3: Get Your MCP Endpoint URL

After deployment, your MCP endpoint will be available at:

```
https://your-project-name.vercel.app/api/mcp
```

**Example**:
```
https://cmg-intake-ai.vercel.app/api/mcp
```

Copy this URL - you'll need it for Retell AI configuration.

### Step 4: Test Your Deployment

Test that the MCP endpoint is working:

```bash
curl -X POST https://your-project-name.vercel.app/api/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/list",
    "params": {}
  }'
```

**Expected Response**:
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "tools": [
      {
        "name": "create_ado_ticket",
        "description": "Create an Azure DevOps work item...",
        "inputSchema": { ... }
      }
    ]
  }
}
```

### Step 5: Configure Retell AI

Now configure Retell AI to use your deployed MCP server:

1. **Go to Retell AI dashboard**: https://retellai.com/dashboard
2. **Navigate to Integrations** → **MCP Servers**
3. **Click "Add MCP Server"**
4. **Fill in the form**:

```
MCP Name: CMG ADO Integration
MCP URL: https://your-project-name.vercel.app/api/mcp
Timeout: 10000
Headers: (leave empty for now)
Query Parameters: (leave empty)
```

5. **Click Save**

### Step 6: Test with Retell AI

1. Create a test call in Retell AI
2. Say: _"I need to create a change request for a bug in SmartApp. The login button doesn't work. My name is John Doe and my email is john.doe@example.com"_
3. The agent should:
   - Collect the information
   - Call your MCP endpoint on Vercel
   - Create the ADO work item
   - Respond with the work item ID

## Vercel Configuration Explained

### vercel.json

```json
{
  "builds": [
    {
      "src": "api/mcp.ts",        // ← Your MCP endpoint
      "use": "@vercel/node"        // ← Use Node.js runtime
    }
  ],
  "routes": [
    {
      "src": "/api/mcp",           // ← URL path
      "dest": "/api/mcp.ts"        // ← Handler file
    }
  ],
  "env": {
    "ADO_ORGANIZATION": "@ado_organization",  // ← Refs to env vars
    "ADO_PROJECT": "@ado_project",
    "ADO_PAT": "@ado_pat"
  }
}
```

The `@` prefix in `env` tells Vercel to use environment variables you set in the dashboard.

## MCP HTTP Endpoint

### api/mcp.ts

This file handles three MCP methods:

1. **initialize** - MCP handshake (optional)
   ```json
   { "method": "initialize" }
   ```

2. **tools/list** - List available tools
   ```json
   { "method": "tools/list" }
   ```

3. **tools/call** - Execute a tool
   ```json
   {
     "method": "tools/call",
     "params": {
       "name": "create_ado_ticket",
       "arguments": { ... }
     }
   }
   ```

## Testing Locally Before Deployment

You can test the Vercel deployment locally using Vercel Dev:

```bash
cd C:\GitHub\cmg-intake-ai

# Install Vercel CLI if needed
npm install -g vercel

# Run Vercel dev server
vercel dev
```

This will start a local server (usually on `http://localhost:3000`) that simulates the Vercel environment.

**Test the MCP endpoint**:
```bash
curl -X POST http://localhost:3000/api/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/list",
    "params": {}
  }'
```

## Troubleshooting

### ❌ "Missing required ADO configuration"

**Problem**: Environment variables not set in Vercel

**Solution**:
1. Go to Vercel Dashboard → Settings → Environment Variables
2. Add all ADO variables (see Step 1 above)
3. Redeploy: `vercel --prod`

### ❌ "Module not found: ado-service"

**Problem**: Import path issue

**Solution**:
The `api/mcp.ts` imports from `server/src/`. Make sure your project structure is:
```
C:\GitHub\cmg-intake-ai/
├── api/
│   └── mcp.ts
├── server/
│   └── src/
│       ├── ado-service.ts
│       └── types.ts
```

### ❌ "Invalid Request: jsonrpc must be '2.0'"

**Problem**: Retell AI sending wrong format

**Solution**:
- Verify the MCP URL in Retell AI is correct
- Make sure you're using POST method
- Check that Retell AI is configured to send JSON-RPC 2.0 format

### ❌ "401 Unauthorized" from Azure DevOps

**Problem**: ADO_PAT is invalid or expired

**Solution**:
1. Generate a new PAT (see ADO_INTEGRATION_SETUP.md)
2. Update in Vercel: Settings → Environment Variables
3. Redeploy

### ❌ Retell AI can't connect

**Problem**: URL incorrect or deployment failed

**Solution**:
1. Check deployment status in Vercel dashboard
2. Test the endpoint directly with curl
3. Verify URL has no typos: `https://your-app.vercel.app/api/mcp`

## Monitoring

### View Logs in Vercel

1. Go to Vercel Dashboard → Your Project
2. Click "Deployments"
3. Click on the latest deployment
4. Click "Functions" → "api/mcp.ts"
5. View real-time logs

### Enable Function Logging

Add logging in `api/mcp.ts`:

```typescript
console.log('📝 MCP Request:', mcpRequest.method);
console.log('📝 Creating ADO ticket:', args.title);
console.log('✅ Work item created:', workItem.id);
```

These will appear in Vercel's function logs.

## Costs

Vercel's **Hobby plan is FREE** and includes:
- ✅ 100GB bandwidth/month
- ✅ 100 function executions/day
- ✅ Unlimited deployments

For production with higher usage, consider upgrading to **Pro plan** ($20/month):
- ✅ 1000GB bandwidth/month
- ✅ Unlimited function executions
- ✅ Priority support

Your MCP endpoint should easily fit within the free tier for testing!

## Security Best Practices

### 1. Add API Key Authentication

Update `api/mcp.ts` to require an API key:

```typescript
export default async function handler(req: Request, res: Response) {
  // Verify API key
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== process.env.MCP_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // ... rest of handler
}
```

Add `MCP_API_KEY` to Vercel environment variables.

Then in Retell AI, add a header:
- **Key**: `X-API-Key`
- **Value**: Your API key

### 2. Rate Limiting

Consider adding rate limiting with Vercel's Edge Config or Upstash Redis.

### 3. IP Allowlist

If Retell AI provides static IPs, you can restrict access to those IPs only.

## Comparison: STDIO vs HTTP

| Feature | STDIO (server/src/mcp-server.ts) | HTTP (api/mcp.ts) |
|---------|----------------------------------|-------------------|
| **Transport** | Standard Input/Output | HTTP POST |
| **Vercel Compatible** | ❌ No | ✅ Yes |
| **Hosting** | Railway, Render, VPS | Vercel, Netlify, Cloudflare |
| **Scaling** | Manual | Auto-scales |
| **Cost** | Always-on server | Pay-per-request |

**Recommendation**: Use the **HTTP version** (`api/mcp.ts`) for Vercel deployment.

## What About the STDIO Version?

The STDIO version (`server/src/mcp-server.ts`) is still useful for:

- **Local development** with MCP clients
- **Self-hosted deployments** (Railway, Render, VPS)
- **Desktop integration** (if you want to run locally)

You can keep both versions - they use the same underlying `ado-service.ts`!

## Next Steps

1. ✅ **Deploy to Vercel** (see Step 2 above)
2. ✅ **Set environment variables** in Vercel dashboard
3. ✅ **Test the endpoint** with curl
4. ✅ **Configure Retell AI** with your Vercel URL
5. ✅ **Test with voice call**
6. ✅ **Monitor logs** in Vercel dashboard
7. ✅ **Add API key** for production security

## Summary

✅ Your MCP server now works on Vercel!
✅ HTTP-based endpoint: `https://your-app.vercel.app/api/mcp`
✅ Uses same ADO service as your web app
✅ Auto-scales with Vercel's serverless infrastructure
✅ Free tier is sufficient for testing

**Ready to deploy?** Run:

```bash
vercel --prod
```

Then configure Retell AI with your deployment URL! 🚀

---

**Questions?** Check:
- Vercel Docs: https://vercel.com/docs
- MCP Spec: https://modelcontextprotocol.io
- Your other guides: MCP_SERVER_SETUP.md, QUICK_START_MCP.md
