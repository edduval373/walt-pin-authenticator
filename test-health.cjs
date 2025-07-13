const http = require('http');

// Test the exact health check that Railway performs
const testHealthCheck = () => {
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/healthz',
    method: 'GET',
    headers: {
      'User-Agent': 'Railway-Health-Check/1.0'
    }
  };

  const req = http.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Headers:`, res.headers);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log(`Response: ${data}`);
      
      if (res.statusCode === 200) {
        console.log('✅ Health check PASSED - Railway should accept this');
      } else {
        console.log('❌ Health check FAILED - Railway will reject this');
      }
    });
  });

  req.on('error', (e) => {
    console.error('❌ Health check ERROR:', e.message);
    console.log('This means the server is not running or not accessible');
  });

  req.end();
};

console.log('Testing health check endpoint as Railway would...');
testHealthCheck();