import fetch from 'node-fetch';
import { log } from './vite';

/**
 * Client for the real PIM Authentication API
 * This makes direct calls to the production API with no fallbacks or mock data
 */
export async function callRealApi(
  frontImageBase64: string,
  backImageBase64?: string,
  angledImageBase64?: string
) {
  // Prepare the API request payload
  const requestBody: Record<string, string> = {
    frontImageBase64
  };
  
  if (backImageBase64) {
    requestBody.backImageBase64 = backImageBase64;
  }
  
  if (angledImageBase64) {
    requestBody.angledImageBase64 = angledImageBase64;
  }
  
  // The exact specified API URL
  const apiUrl = 'https://master.pinauth.com/mobile-upload';
  
  log(`Calling real API at exact URL: ${apiUrl}`);
  
  // Make the API request with exact headers
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': 'pim_mobile_2505271605_7f8d9e2a1b4c6d8f9e0a1b2c3d4e5f6g'
    },
    body: JSON.stringify(requestBody)
  });
  
  // Get the response data
  const responseData = await response.json() as any;
  
  if (!response.ok) {
    log(`API Error: ${response.status} ${JSON.stringify(responseData)}`);
    throw new Error(`API Error: ${response.status} - ${responseData.message || 'Unknown error'}`);
  }
  
  return responseData;
}