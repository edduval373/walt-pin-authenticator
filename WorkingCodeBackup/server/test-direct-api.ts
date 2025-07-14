import fetch from 'node-fetch';

/**
 * Direct test of API endpoint
 */
async function testDirectVerifyEndpoint() {
  try {
    console.log('Testing direct-verify endpoint with mobile-test-key...');
    
    const response = await fetch('https://pim-master-library.replit.app/api/mobile/direct-verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': 'mobile-test-key'
      },
      body: JSON.stringify({
        frontImageBase64: 'test',
        testMode: true
      })
    });
    
    console.log('Response status:', response.status);
    
    const responseText = await response.text();
    console.log('Response text:', responseText);
    
    try {
      const jsonData = JSON.parse(responseText);
      console.log('Response JSON:', JSON.stringify(jsonData, null, 2));
    } catch (e) {
      console.log('Response is not valid JSON');
    }

    console.log('\nTesting with a different API key...');
    
    const response2 = await fetch('https://pim-master-library.replit.app/api/mobile/direct-verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': 'pim_0w3nfrt5ahgc'
      },
      body: JSON.stringify({
        frontImageBase64: 'test',
        testMode: true
      })
    });
    
    console.log('Response status:', response2.status);
    
    const responseText2 = await response2.text();
    console.log('Response text:', responseText2);
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the test
testDirectVerifyEndpoint();