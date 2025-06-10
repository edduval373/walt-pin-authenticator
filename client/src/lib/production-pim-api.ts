/**
 * Production PIM Standard API Client
 * 
 * This module provides the official production integration with the PIM Standard
 * API for the mobile application.
 */

/**
 * Response from the PIM Standard production API
 */
export interface PimProductionResponse {
  success: boolean;
  message: string;
  result?: {
    title?: string;
    authenticityRating?: number; 
    characters?: string; // HTML content for characters section
    aiFindings?: string; // HTML content for analysis section
    pinId?: string; // HTML content for identification section  
    pricingInfo?: string; // HTML content for pricing section
  };
  analysisReport: string; // Complete raw text analysis
}

/**
 * Submit pin images to the production PIM Standard API for verification
 * 
 * @param frontImageBase64 - Base64 encoded front view image (required)
 * @param backImageBase64 - Base64 encoded back view image (optional)
 * @param angledImageBase64 - Base64 encoded angled view image (optional)
 * @returns Promise resolving to the production API response
 */
export async function verifyPinWithProductionApi(
  frontImageBase64: string,
  backImageBase64?: string,
  angledImageBase64?: string
): Promise<PimProductionResponse> {
  console.log('Connecting to production PIM API...');
  
  try {
    // Generate a unique request ID based on timestamp
    const requestId = `mobile_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    
    // Ensure image data is properly formatted (remove data URL prefix if present)
    const front = frontImageBase64.replace(/^data:image\/[a-z]+;base64,/, '');
    const back = backImageBase64 ? backImageBase64.replace(/^data:image\/[a-z]+;base64,/, '') : undefined;
    const angled = angledImageBase64 ? angledImageBase64.replace(/^data:image\/[a-z]+;base64,/, '') : undefined;
    
    // Prepare the request body
    const requestBody: any = {
      frontImageBase64: front,
      requestId
    };
    
    // Add optional images if provided
    if (back) requestBody.backImageBase64 = back;
    if (angled) requestBody.angledImageBase64 = angled;
    
    // Set up timeout to handle unresponsive API
    const timeoutPromise = new Promise<never>((_, reject) => {
      const id = setTimeout(() => {
        clearTimeout(id);
        reject(new Error('API request timed out after 30 seconds'));
      }, 30000);
    });
    
    // Make the API request with proper headers
    const fetchPromise = fetch('/api/mobile/verify-pin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-session-id': requestId
      },
      body: JSON.stringify(requestBody)
    });
    
    // Execute the request with timeout handling
    const response = await Promise.race([fetchPromise, timeoutPromise]);
    
    // Handle HTTP error status codes
    if (response.status === 503 || response.status === 502 || response.status === 504) {
      throw new Error(`Service Unavailable: The PIM Authentication Service is temporarily down (${response.status})`);
    }
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error (${response.status}): ${errorText || response.statusText}`);
    }
    
    // Parse the JSON response
    const data = await response.json();
    console.log('Production API connection successful');
    
    return data;
  } catch (error) {
    console.error('Production API connection failed:', error);
    throw error;
  }
}