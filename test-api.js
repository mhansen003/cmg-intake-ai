const axios = require('axios');
const fs = require('fs');

const testText = fs.readFileSync('test-sample.txt', 'utf-8');

async function testAnalyze() {
  try {
    console.log('🧪 Testing AI Analysis...\n');
    console.log('📝 Input text (first 100 chars):', testText.substring(0, 100) + '...\n');

    const response = await axios.post(
      'http://localhost:3001/api/analyze',
      { textInput: testText },
      { headers: { 'Content-Type': 'application/json' } }
    );

    console.log('✅ SUCCESS! AI Analysis Results:\n');
    console.log('📊 Confidence Score:', (response.data.confidence * 100).toFixed(1) + '%');
    console.log('\n📋 Extracted Data:');
    console.log(JSON.stringify(response.data.extractedData, null, 2));

    if (response.data.missingFields.length > 0) {
      console.log('\n⚠️  Missing Fields:', response.data.missingFields.join(', '));
    }

    if (response.data.clarificationQuestions && response.data.clarificationQuestions.length > 0) {
      console.log('\n❓ Clarification Questions:');
      response.data.clarificationQuestions.forEach((q, i) => {
        console.log(`   ${i + 1}. ${q}`);
      });
    }

    console.log('\n✨ Test completed successfully!');
  } catch (error) {
    console.error('❌ ERROR:', error.response?.data || error.message);
  }
}

testAnalyze();
