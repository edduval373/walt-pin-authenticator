import fetch from 'node-fetch';
import { log } from './vite';

/**
 * Connect directly to the production Pin Authentication API
 * This uses the exact URL with no variables or modifications
 */
export async function callRealApi(
  frontImageBase64: string,
  backImageBase64?: string,
  angledImageBase64?: string
) {
  // Create the request payload
  const requestBody: Record<string, string> = {
    frontImageBase64
  };
  
  if (backImageBase64) {
    requestBody.backImageBase64 = backImageBase64;
  }
  
  if (angledImageBase64) {
    requestBody.angledImageBase64 = angledImageBase64;
  }
  
  // The exact API URL as specified
  const apiUrl = 'https://master.pinauth.com/mobile-upload';
  
  log(`Calling real API at exact URL: ${apiUrl}`);
  
  // Make the direct API call
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': 'pim_mobile_2505271605_7f8d9e2a1b4c6d8f9e0a1b2c3d4e5f6g'
    },
    body: JSON.stringify(requestBody)
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error (${response.status}): ${errorText}`);
  }
  
  return await response.json();
}