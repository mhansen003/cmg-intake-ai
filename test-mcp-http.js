/**
 * Test script for HTTP-based MCP Server
 *
 * This script tests the api/mcp.ts endpoint locally using vercel dev
 * or after deployment to test the production endpoint.
 */

const https = require('https');
const http = require('http');

// Configuration
const USE_PRODUCTION = false; // Set to true to test production deployment
const PRODUCTION_URL = 'https://your-app.vercel.app/api/mcp'; // Replace with your Vercel URL
const LOCAL_URL = 'http://localhost:3000/api/mcp';

const MCP_URL = USE_PRODUCTION ? PRODUCTION_URL : LOCAL_URL;

console.log('🧪 Testing HTTP-based MCP Server');
console.log('📍 Endpoint:', MCP_URL);
console.log('');

// Test data
const tests = [
  {
    name: 'Test 1: List Available Tools',
    request: {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/list',
      params: {}
    }
  },
  {
    name: 'Test 2: Initialize MCP Server',
    request: {
      jsonrpc: '2.0',
      id: 2,
      method: 'initialize',
      params: {}
    }
  },
  {
    name: 'Test 3: Create ADO Ticket',
    request: {
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: {
        name: 'create_ado_ticket',
        arguments: {
          title: 'Test Work Item from HTTP MCP Server',
          description: 'This is a test to verify the HTTP-based MCP server is working correctly on Vercel. The login functionality needs to be updated.',
          userName: 'Test User',
          userEmail: 'test.user@cmg.com',
          softwarePlatforms: ['SmartApp'],
          impactedAreas: ['Authentication', 'User Interface'],
          channels: ['Retail']
        }
      }
    }
  }
];

// Helper function to make HTTP request
function makeRequest(testCase) {
  return new Promise((resolve, reject) => {
    const url = new URL(MCP_URL);
    const protocol = url.protocol === 'https:' ? https : http;
    const postData = JSON.stringify(testCase.request);

    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = protocol.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          body: data
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

// Run tests sequentially
async function runTests() {
  console.log('🚀 Starting tests...\n');

  for (let i = 0; i < tests.length; i++) {
    const testCase = tests[i];
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📝 ${testCase.name}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log('Request:');
    console.log(JSON.stringify(testCase.request, null, 2));
    console.log('');

    try {
      const response = await makeRequest(testCase);

      console.log(`Status: ${response.statusCode}`);
      console.log('Response:');

      try {
        const parsed = JSON.parse(response.body);
        console.log(JSON.stringify(parsed, null, 2));

        if (response.statusCode === 200 && parsed.result) {
          console.log('✅ Test passed!');
        } else if (parsed.error) {
          console.log('⚠️  Test returned error:', parsed.error.message);
        } else {
          console.log('⚠️  Unexpected response');
        }
      } catch (e) {
        console.log(response.body);
        console.log('❌ Failed to parse JSON response');
      }
    } catch (error) {
      console.log('❌ Request failed:', error.message);

      if (error.code === 'ECONNREFUSED') {
        console.log('');
        console.log('💡 Tip: Make sure the server is running:');
        console.log('   For local testing: vercel dev');
        console.log('   For production: Set USE_PRODUCTION = true and update PRODUCTION_URL');
      }
    }

    console.log('');

    // Wait a bit between tests
    if (i < tests.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✨ All tests completed!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

// Run
console.log('💡 Configuration:');
console.log(`   Mode: ${USE_PRODUCTION ? 'PRODUCTION' : 'LOCAL'}`);
console.log(`   URL: ${MCP_URL}`);
console.log('');

if (!USE_PRODUCTION) {
  console.log('⚠️  Running in LOCAL mode');
  console.log('   Make sure you have started: vercel dev');
  console.log('');
}

runTests().catch(error => {
  console.error('❌ Test runner failed:', error);
  process.exit(1);
});
