import fetch from 'node-fetch';
import { log } from './vite';

/**
 * Makes a direct call to the exact API endpoint required by the mobile app
 */
export async function directVerify(
  frontImageBase64: string,
  backImageBase64?: string,
  angledImageBase64?: string
) {
  // Prepare request payload
  const requestPayload: Record<string, any> = {
    frontImageBase64
  };
  
  if (backImageBase64) {
    requestPayload.backImageBase64 = backImageBase64;
  }
  
  if (angledImageBase64) {
    requestPayload.angledImageBase64 = angledImageBase64;
  }
  
  // Use the exact URL format required by the mobile app
  const API_URL = 'https://pim-master-library.replit.app/api/mobile/direct-verify';
  
  log(`Making direct API call to: ${API_URL}`);
  
  try {
    // Make the exact API request with required headers
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': 'mobile-test-key'
      },
      body: JSON.stringify(requestPayload)
    });
    
    // Parse the response
    const responseData = await response.text();
    
    // Check if it's valid JSON
    try {
      const jsonData = JSON.parse(responseData);
      log(`API response received: status=${response.status}`);
      
      if (!response.ok) {
        throw new Error(`API Error (${response.status}): ${responseData}`);
      }
      
      return jsonData;
    } catch (jsonError) {
      throw new Error(`Invalid JSON response: ${responseData}`);
    }
  } catch (error: any) {
    log(`API call failed: ${error.message}`);
    throw error;
  }
}