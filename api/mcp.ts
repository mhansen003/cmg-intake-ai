/**
 * HTTP-based MCP Server for Vercel
 *
 * This endpoint handles MCP protocol requests over HTTP instead of STDIO,
 * making it compatible with Vercel's serverless architecture.
 */

import { Request, Response } from 'express';
import { AzureDevOpsService, ADOConfig } from '../server/src/ado-service';
import { CMGFormData } from '../server/src/types';

// MCP Protocol types
interface MCPRequest {
  jsonrpc: '2.0';
  id: string | number;
  method: string;
  params?: any;
}

interface MCPResponse {
  jsonrpc: '2.0';
  id: string | number;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, any>;
    required: string[];
  };
}

// Define available tools
const TOOLS: MCPTool[] = [
  {
    name: 'create_ado_ticket',
    description: 'Create an Azure DevOps work item (User Story) for a change management request. This tool captures user requests and creates tickets in the CMG change management system.',
    inputSchema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Brief title/summary of the change request (max 128 characters)',
        },
        description: {
          type: 'string',
          description: 'Detailed description of the issue, feature request, or change needed',
        },
        userName: {
          type: 'string',
          description: 'Name of the user requesting the change',
        },
        userEmail: {
          type: 'string',
          description: 'Email address of the user requesting the change',
        },
        softwarePlatforms: {
          type: 'array',
          items: { type: 'string' },
          description: 'Software platforms affected (e.g., SmartApp, AIO Portal, etc.)',
          default: [],
        },
        impactedAreas: {
          type: 'array',
          items: { type: 'string' },
          description: 'Business areas impacted (e.g., Processing, Underwriting, etc.)',
          default: [],
        },
        channels: {
          type: 'array',
          items: { type: 'string' },
          description: 'Channels affected (e.g., Retail, Consumer Direct, etc.)',
          default: [],
        },
      },
      required: ['title', 'description', 'userName', 'userEmail'],
    },
  },
];

// Initialize ADO service
let adoService: AzureDevOpsService | null = null;

function getADOService(): AzureDevOpsService {
  if (!adoService) {
    const adoConfig: ADOConfig = {
      organization: process.env.ADO_ORGANIZATION || '',
      project: process.env.ADO_PROJECT || '',
      personalAccessToken: process.env.ADO_PAT || '',
      areaPath: process.env.ADO_AREA_PATH,
      iterationPath: process.env.ADO_ITERATION_PATH,
    };

    // Validate required configuration
    if (!adoConfig.organization || !adoConfig.project || !adoConfig.personalAccessToken) {
      throw new Error('Missing required ADO configuration. Please check your environment variables.');
    }

    adoService = new AzureDevOpsService(adoConfig);
  }

  return adoService;
}

// Handle tools/list method
async function handleListTools(id: string | number): Promise<MCPResponse> {
  return {
    jsonrpc: '2.0',
    id,
    result: {
      tools: TOOLS,
    },
  };
}

// Handle tools/call method
async function handleCallTool(id: string | number, params: any): Promise<MCPResponse> {
  try {
    const { name, arguments: args } = params;

    if (name === 'create_ado_ticket') {
      const ado = getADOService();

      // Validate arguments exist
      if (!args) {
        throw new Error('No arguments provided');
      }

      // Extract and validate required arguments
      const {
        title,
        description,
        userName,
        userEmail,
        softwarePlatforms = [],
        impactedAreas = [],
        channels = []
      } = args as {
        title: string;
        description: string;
        userName: string;
        userEmail: string;
        softwarePlatforms?: string[];
        impactedAreas?: string[];
        channels?: string[];
      };

      if (!title || !description || !userName || !userEmail) {
        throw new Error('Missing required fields: title, description, userName, or userEmail');
      }

      // Build the full description with user information
      const fullDescription = `${description}\n\n---\n\n**Requested by:** ${userName}\n**Contact:** ${userEmail}`;

      // Build the form data structure
      const formData: CMGFormData = {
        title: title.substring(0, 128), // Ensure max 128 chars
        description: fullDescription,
        softwarePlatforms: softwarePlatforms,
        impactedAreas: impactedAreas,
        channels: channels,
      };

      console.log(`📝 Creating ADO ticket for ${userName} (${userEmail})`);
      console.log(`   Title: ${title}`);

      // Create the work item
      const workItem = await ado.createWorkItem(formData);

      return {
        jsonrpc: '2.0',
        id,
        result: {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  message: 'Work item created successfully',
                  workItem: {
                    id: workItem.id,
                    url: workItem.url,
                    title: workItem.fields['System.Title'],
                    state: workItem.fields['System.State'],
                  },
                  requestedBy: {
                    name: userName,
                    email: userEmail,
                  },
                },
                null,
                2
              ),
            },
          ],
        },
      };
    } else {
      throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error: any) {
    console.error(`❌ Error executing tool:`, error.message);
    return {
      jsonrpc: '2.0',
      id,
      error: {
        code: -32603,
        message: error.message,
        data: { error: error.toString() },
      },
    };
  }
}

// Handle initialize method (optional, for MCP handshake)
async function handleInitialize(id: string | number): Promise<MCPResponse> {
  return {
    jsonrpc: '2.0',
    id,
    result: {
      protocolVersion: '2024-11-05',
      capabilities: {
        tools: {},
      },
      serverInfo: {
        name: 'cmg-ado-mcp-server',
        version: '1.0.0',
      },
    },
  };
}

// Main handler for Vercel
export default async function handler(req: Request, res: Response) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method not allowed. Use POST to send MCP requests.',
    });
  }

  try {
    const mcpRequest: MCPRequest = req.body;

    // Validate JSON-RPC format
    if (mcpRequest.jsonrpc !== '2.0') {
      return res.status(400).json({
        jsonrpc: '2.0',
        id: mcpRequest.id || null,
        error: {
          code: -32600,
          message: 'Invalid Request: jsonrpc must be "2.0"',
        },
      });
    }

    let response: MCPResponse;

    // Route based on method
    switch (mcpRequest.method) {
      case 'initialize':
        response = await handleInitialize(mcpRequest.id);
        break;

      case 'tools/list':
        response = await handleListTools(mcpRequest.id);
        break;

      case 'tools/call':
        response = await handleCallTool(mcpRequest.id, mcpRequest.params);
        break;

      default:
        response = {
          jsonrpc: '2.0',
          id: mcpRequest.id,
          error: {
            code: -32601,
            message: `Method not found: ${mcpRequest.method}`,
          },
        };
    }

    return res.status(200).json(response);
  } catch (error: any) {
    console.error('❌ MCP Handler Error:', error);
    return res.status(500).json({
      jsonrpc: '2.0',
      id: null,
      error: {
        code: -32603,
        message: 'Internal server error',
        data: { error: error.message },
      },
    });
  }
}
