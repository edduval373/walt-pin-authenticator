import fetch from 'node-fetch';
import { log } from './vite';

/**
 * This client only uses code that is confirmed to work with the external API
 */
export async function directApiCall(
  frontImageBase64: string,
  backImageBase64?: string,
  angledImageBase64?: string
) {
  // Create the exact request body
  const requestBody: any = {
    frontImageBase64: frontImageBase64
  };
  
  // Add optional images if provided
  if (backImageBase64) {
    requestBody.backImageBase64 = backImageBase64;
  }
  
  if (angledImageBase64) {
    requestBody.angledImageBase64 = angledImageBase64;
  }
  
  // Use the exact URL that matches our confirmed working endpoint
  const apiUrl = 'https://pim-master-library.replit.app/api/mobile/direct-verify';
  
  // Use the exact headers that work with the API
  const headers = {
    'Content-Type': 'application/json',
    'X-API-Key': 'mobile-test-key'
  };
  
  log(`Calling direct API at ${apiUrl}`);
  log(`Request headers: ${JSON.stringify(headers)}`);
  
  // Make the API request exactly as it works in curl
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(requestBody)
  });
  
  // Extract the response
  const responseText = await response.text();
  
  log(`API Response status: ${response.status}`);
  
  // Try to parse as JSON if possible
  try {
    return JSON.parse(responseText);
  } catch (e) {
    // Return as text if not JSON
    return {
      success: false,
      message: `API responded with non-JSON: ${responseText}`
    };
  }
}