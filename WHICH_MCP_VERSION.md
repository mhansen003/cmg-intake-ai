# Which MCP Version Should I Use?

## Quick Answer

**For Vercel deployment** → Use `api/mcp.ts` (HTTP version) ✅

**For other hosting** → Use `server/src/mcp-server.ts` (STDIO version)

## Two Versions Explained

You now have **two MCP server implementations** that do the same thing but use different communication methods:

### 1. HTTP Version (api/mcp.ts)

**✅ Use this for:**
- Vercel deployment (serverless)
- Netlify Functions
- Cloudflare Workers
- AWS Lambda
- Any serverless platform

**How it works:**
```
Retell AI → HTTPS POST → https://your-app.vercel.app/api/mcp → Response
```

**File**: `api/mcp.ts`
**Transport**: HTTP (POST requests)
**Start command**: Deployed automatically with `vercel --prod`
**URL**: `https://your-app.vercel.app/api/mcp`

### 2. STDIO Version (server/src/mcp-server.ts)

**✅ Use this for:**
- Railway
- Render
- Heroku
- DigitalOcean
- Any VPS or container-based hosting
- Local development with MCP desktop clients

**How it works:**
```
Retell AI → Spawns process → STDIN/STDOUT communication → Response
```

**File**: `server/src/mcp-server.ts`
**Transport**: STDIO (Standard Input/Output)
**Start command**: `npm run dev:mcp`
**URL**: N/A (process-to-process communication)

## Comparison Table

| Feature | HTTP Version | STDIO Version |
|---------|-------------|---------------|
| **File** | `api/mcp.ts` | `server/src/mcp-server.ts` |
| **Vercel** | ✅ Yes | ❌ No |
| **Railway/Render** | ✅ Yes | ✅ Yes |
| **Auto-scale** | ✅ Yes | ❌ No |
| **Always-on** | No (on-demand) | Yes (persistent) |
| **Cost** | Pay-per-request | Fixed monthly |
| **Setup** | Deploy once | Keep process running |

## Since You Asked About Vercel...

**Answer**: Yes! Your MCP server **will run on Vercel** using the HTTP version.

**What I created for you:**

1. ✅ **HTTP-based endpoint** (`api/mcp.ts`) - Works on Vercel
2. ✅ **Updated vercel.json** - Routes `/api/mcp` to your handler
3. ✅ **Deployment guide** - Step-by-step Vercel setup
4. ✅ **Same functionality** - Both versions do the same thing!

## How to Deploy to Vercel (Quick Steps)

```bash
# 1. Set environment variables in Vercel dashboard
# (See VERCEL_MCP_DEPLOYMENT.md for details)

# 2. Deploy
cd C:\GitHub\cmg-intake-ai
vercel --prod

# 3. Copy your URL
# https://cmg-intake-ai.vercel.app/api/mcp

# 4. Add to Retell AI
# Paste the URL in the "Add MCP" dialog

# Done! 🎉
```

## Which Files Do What?

```
Your Project Structure:

├── api/
│   └── mcp.ts                      ⭐ HTTP version (for Vercel)
│
├── server/
│   └── src/
│       └── mcp-server.ts           ⭐ STDIO version (for Railway/Render)
│       └── ado-service.ts          ✅ Shared ADO logic
│       └── types.ts                ✅ Shared TypeScript types
│
└── vercel.json                     ✅ Vercel configuration

Both MCP versions use the same ado-service.ts!
```

## Testing Each Version

### Test HTTP Version (Vercel)

```bash
# After deploying to Vercel
curl -X POST https://your-app.vercel.app/api/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/list"
  }'
```

### Test STDIO Version (Local)

```bash
# In one terminal
cd server
npm run dev:mcp

# In another terminal
node test-mcp-server.js
```

## Why Two Versions?

Different hosting platforms have different requirements:

**Serverless platforms** (like Vercel):
- Ephemeral functions
- No persistent processes
- Require HTTP endpoints
- → Use HTTP version

**Container/VPS platforms** (like Railway):
- Persistent processes
- Can run long-lived servers
- Support STDIO communication
- → Can use either version

## Recommendation

**For your Vercel deployment**: Use the **HTTP version** (`api/mcp.ts`)

It's already configured and ready to deploy! Just:

1. Set environment variables in Vercel dashboard
2. Run `vercel --prod`
3. Copy the URL: `https://your-app.vercel.app/api/mcp`
4. Add to Retell AI

See [VERCEL_MCP_DEPLOYMENT.md](./VERCEL_MCP_DEPLOYMENT.md) for detailed steps.

## Can I Use Both?

**Yes!** You can keep both versions:

- Deploy **HTTP version** to Vercel for production
- Use **STDIO version** for local testing

They both use the same `ado-service.ts`, so they'll behave identically.

## Summary

✅ **You asked**: "Will this run on Vercel?"

✅ **Answer**: Yes! I created an HTTP-based version (`api/mcp.ts`) that works perfectly on Vercel.

✅ **What to do**: Follow [VERCEL_MCP_DEPLOYMENT.md](./VERCEL_MCP_DEPLOYMENT.md) to deploy.

✅ **Your URL**: `https://your-app.vercel.app/api/mcp`

✅ **Retell AI**: Use that URL in the "Add MCP" dialog

---

**Ready to deploy?**

```bash
vercel --prod
```

🚀
