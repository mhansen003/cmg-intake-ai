import { Server } from '@modelcontextprotocol/sdk/server/index';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types';
import { AzureDevOpsService, ADOConfig } from './ado-service';
import { CMGFormData } from './types';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Define the tools available in this MCP server
const TOOLS: Tool[] = [
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

// Initialize the MCP server
const server = new Server(
  {
    name: 'cmg-ado-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Initialize Azure DevOps service
let adoService: AzureDevOpsService | null = null;

function initializeADOService(): void {
  const adoConfig: ADOConfig = {
    organization: process.env.ADO_ORGANIZATION || '',
    project: process.env.ADO_PROJECT || '',
    personalAccessToken: process.env.ADO_PAT || '',
    areaPath: process.env.ADO_AREA_PATH,
    iterationPath: process.env.ADO_ITERATION_PATH,
  };

  // Validate required configuration
  if (!adoConfig.organization || !adoConfig.project || !adoConfig.personalAccessToken) {
    console.error('❌ Missing required ADO configuration. Please check your .env file.');
    console.error('Required: ADO_ORGANIZATION, ADO_PROJECT, ADO_PAT');
    process.exit(1);
  }

  adoService = new AzureDevOpsService(adoConfig);
  console.log('✅ Azure DevOps service initialized');
}

// Handler for listing available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: TOOLS,
  };
});

// Handler for tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === 'create_ado_ticket') {
      if (!adoService) {
        throw new Error('Azure DevOps service not initialized');
      }

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
      const workItem = await adoService.createWorkItem(formData);

      return {
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
      };
    } else {
      throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error: any) {
    console.error(`❌ Error executing tool ${name}:`, error.message);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: false,
              error: error.message,
              tool: name,
            },
            null,
            2
          ),
        },
      ],
      isError: true,
    };
  }
});

// Start the server
async function main() {
  console.log('🚀 Starting CMG ADO MCP Server...');

  // Initialize ADO service
  initializeADOService();

  // Create transport for stdio communication
  const transport = new StdioServerTransport();

  // Connect the server to the transport
  await server.connect(transport);

  console.log('✅ MCP Server running and ready to accept connections');
  console.log('📋 Available tools: create_ado_ticket');
}

// Handle errors
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
main().catch((error) => {
  console.error('❌ Failed to start MCP server:', error);
  process.exit(1);
});
