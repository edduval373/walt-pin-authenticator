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
  const API_URL = 'https://master.pinauth.com/mobile-upload';
  
  log(`Making direct API call to: ${API_URL}`);
  
  try {
    // Make the exact API request with required headers
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.MOBILE_API_KEY || 'pim_mobile_2505271605_7f8d9e2a1b4c6d8f9e0a1b2c3d4e5f6g'
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