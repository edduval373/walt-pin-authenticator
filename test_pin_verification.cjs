const fetch = require('node-fetch');

// Create a minimal test image (1x1 pixel PNG in base64)
const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

async function testPinVerification() {
  try {
    console.log('Testing pin verification with Master App...');
    
    const response = await fetch('http://localhost:5000/api/mobile/verify-pin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-session-id': 'test_session_' + Date.now()
      },
      body: JSON.stringify({
        frontImageBase64: testImageBase64
      })
    });
    
    const result = await response.json();
    console.log('Pin verification response:');
    console.log(JSON.stringify(result, null, 2));
    
    if (result.success && result.recordNumber) {
      console.log('\n=== ID FIELD TEST PASSED ===');
      console.log('Record Number received:', result.recordNumber);
      console.log('Pin ID received:', result.pinId);
      
      // Test feedback storage
      await testFeedbackStorage(result.recordNumber, result.pinId);
    } else {
      console.log('\n=== ID FIELD TEST FAILED ===');
      console.log('No recordNumber or pinId received');
    }
    
  } catch (error) {
    console.error('Error testing pin verification:', error.message);
  }
}

async function testFeedbackStorage(recordNumber, pinId) {
  try {
    console.log('\nTesting feedback storage...');
    
    const feedbackResponse = await fetch('http://localhost:5000/api/mobile/confirm-pin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-session-id': 'test_session_feedback'
      },
      body: JSON.stringify({
        recordNumber: recordNumber,
        pinId: pinId,
        userAgreement: 'agree',
        feedbackComment: 'Test feedback from mobile app verification'
      })
    });
    
    const feedbackResult = await feedbackResponse.json();
    console.log('Feedback storage response:');
    console.log(JSON.stringify(feedbackResult, null, 2));
    
    if (feedbackResult.success) {
      console.log('\n=== FEEDBACK STORAGE TEST PASSED ===');
      console.log('User feedback stored successfully');
    } else {
      console.log('\n=== FEEDBACK STORAGE TEST FAILED ===');
      console.log('Failed to store user feedback');
    }
    
  } catch (error) {
    console.error('Error testing feedback storage:', error.message);
  }
}

testPinVerification();
