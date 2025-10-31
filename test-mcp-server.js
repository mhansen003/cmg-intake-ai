/**
 * Test script for MCP Server
 *
 * This script simulates an MCP client calling the create_ado_ticket tool
 * to verify the server is working correctly.
 */

const { spawn } = require('child_process');

// Test data for creating an ADO ticket
const testRequest = {
  jsonrpc: '2.0',
  id: 1,
  method: 'tools/call',
  params: {
    name: 'create_ado_ticket',
    arguments: {
      title: 'Test Work Item from MCP Server',
      description: 'This is a test description to verify the MCP server integration with Azure DevOps. The login button in SmartApp is not responding after the latest update.',
      userName: 'Test User',
      userEmail: 'test.user@cmg.com',
      softwarePlatforms: ['SmartApp'],
      impactedAreas: ['Authentication', 'User Interface'],
      channels: ['Retail']
    }
  }
};

console.log('🧪 Testing MCP Server...\n');
console.log('Test Request:');
console.log(JSON.stringify(testRequest, null, 2));
console.log('\n---\n');

// Start the MCP server process
const mcp = spawn('npm', ['run', 'dev:mcp'], {
  cwd: './server',
  shell: true
});

let serverOutput = '';
let serverReady = false;

// Capture stdout
mcp.stdout.on('data', (data) => {
  const output = data.toString();
  serverOutput += output;
  console.log('[MCP Server]', output.trim());

  // Check if server is ready
  if (output.includes('ready to accept connections')) {
    serverReady = true;
    console.log('\n✅ Server is ready!\n');

    // Wait a bit for server to fully initialize
    setTimeout(() => {
      console.log('📤 Sending test request to MCP server...\n');

      // Send the test request via stdin
      mcp.stdin.write(JSON.stringify(testRequest) + '\n');
    }, 1000);
  }
});

// Capture stderr
mcp.stderr.on('data', (data) => {
  console.error('[MCP Error]', data.toString().trim());
});

// Handle process exit
mcp.on('close', (code) => {
  console.log(`\n📊 Test completed. Process exited with code ${code}`);

  if (!serverReady) {
    console.error('\n❌ Server failed to start. Check your configuration:');
    console.error('   - Ensure server/.env has ADO credentials');
    console.error('   - Verify ADO_PAT, ADO_ORGANIZATION, and ADO_PROJECT are set');
  }
});

// Timeout after 30 seconds
setTimeout(() => {
  console.log('\n⏱️ Test timeout reached. Stopping server...');
  mcp.kill();
}, 30000);

// Handle Ctrl+C
process.on('SIGINT', () => {
  console.log('\n\n⚠️ Test interrupted by user. Stopping server...');
  mcp.kill();
  process.exit();
});

console.log('\n💡 Tip: Press Ctrl+C to stop the test at any time\n');
