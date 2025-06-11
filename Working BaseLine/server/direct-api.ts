import fetch from 'node-fetch';
import { log } from './vite';

/**
 * Connect directly to the real production Pin Authentication API
 * This makes a direct call to the exact required endpoint with no fallbacks
 */
export const directVerifyPin = async (
  frontImageBase64: string,
  backImageBase64?: string,
  angledImageBase64?: string
) => {
  try {
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
    
    // Using the path format from the screenshot logs
    const REAL_API_URL = 'https://pim-master-library.replit.app';
    
    log(`Sending direct API request to ${REAL_API_URL}`);
    
    // Make the direct API call to the real system with the exact path format
    const response = await fetch(`${REAL_API_URL}/api/mobile/direct-verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': 'mobile-test-key'
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error (${response.status}): ${errorText}`);
    }
    
    return await response.json();
  } catch (error: any) {
    log(`Error in direct API verification: ${error.message}`);
    throw error;
  }
}