// Test script for Azure DevOps integration
const axios = require('axios');

async function testADOIntegration() {
  console.log('🧪 Testing Azure DevOps Integration...\n');

  const testData = {
    title: 'TEST: CMG Intake AI - ADO Integration Test',
    description: 'This is a test work item created automatically by the CMG Intake AI system to verify the Azure DevOps integration is working correctly. If you see this, the integration is successful!',
    softwarePlatforms: ['SmartApp', 'AIO Portal'],
    impactedAreas: ['Processing', 'Underwriting'],
    channels: ['Retail', 'Consumer Direct']
  };

  try {
    console.log('📤 Submitting test intake to API...');
    console.log('Data:', JSON.stringify(testData, null, 2));
    console.log();

    const response = await axios.post('http://localhost:3001/api/submit', testData);

    console.log('✅ SUCCESS! Response received:\n');
    console.log('Status:', response.status);
    console.log('Success:', response.data.success);
    console.log('Message:', response.data.message);
    console.log();

    if (response.data.adoWorkItem) {
      console.log('🎉 WORK ITEM CREATED IN AZURE DEVOPS!');
      console.log('   ID:', response.data.adoWorkItem.id);
      console.log('   URL:', response.data.adoWorkItem.url);
      console.log();
      console.log('👀 View it here:', response.data.adoWorkItem.url);
    } else if (response.data.adoError) {
      console.log('❌ ADO Error:', response.data.adoError);
      console.log('   (Form submitted successfully, but ADO work item creation failed)');
    } else {
      console.log('ℹ️  No ADO work item created (integration may be disabled)');
    }

  } catch (error) {
    console.error('❌ TEST FAILED:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Error:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

testADOIntegration();
