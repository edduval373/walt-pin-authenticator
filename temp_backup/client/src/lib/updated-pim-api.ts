/**
 * PIM Standard Library API Integration
 * 
 * This module provides integration with the PIM Standard library for analyzing pin images
 * and determining their authenticity.
 */

/**
 * Response from the PIM Standard analysis API
 */
export interface PimAnalysisResponse {
  // Raw analysis report text from API
  analysisReport: string;
  confidence?: number;   // Overall confidence score (0-1)
  authenticityScore?: number; // Authenticity score (0-100)
  detectedPinId?: string; // ID of the detected pin if a match was found
  rawApiResponse?: any; // Raw API response for debugging
}

/**
 * Analyze pin images using the PIM Standard library
 * 
 * @param frontImage - Base64 encoded front view image (required)
 * @param backImage - Base64 encoded back view image (optional)
 * @param angledImage - Base64 encoded angled view image (optional)
 * @returns Promise resolving to analysis response
 */
export async function analyzePinImagesWithPimStandard(
  frontImage: string,
  backImage?: string,
  angledImage?: string,
  apiKey?: string,
  sessionId?: string
): Promise<any> {
  try {
    console.log('Submitting images to PIM Standard analyzer...');
    
    // Check if the image data is valid
    if (!frontImage || frontImage.length < 100) {
      console.error('Front image data is invalid or too short:', frontImage ? frontImage.length : 0, 'characters');
      throw new Error('Front image data is invalid or missing');
    }
    
    // Log image data sizes for debugging
    console.log('Image data sizes before processing:');
    console.log('- Front image:', frontImage.length, 'characters');
    if (backImage) console.log('- Back image:', backImage.length, 'characters');
    if (angledImage) console.log('- Angled image:', angledImage.length, 'characters');
    
    // Clean the image data (remove data URI prefix if present)
    const cleanFrontImage = frontImage.replace(/^data:image\/[a-z]+;base64,/, '');
    const cleanBackImage = backImage ? backImage.replace(/^data:image\/[a-z]+;base64,/, '') : null;
    const cleanAngledImage = angledImage ? angledImage.replace(/^data:image\/[a-z]+;base64,/, '') : null;
    
    // Verify the cleaned image data is still valid
    if (cleanFrontImage.length < 100) {
      console.error('Cleaned front image data is too short:', cleanFrontImage.length, 'characters');
      throw new Error('Front image data is invalid after processing');
    }
    
    // Generate session ID if not provided
    const finalSessionId = sessionId || new Date().toISOString().replace(/[-:T]/g, '').slice(2, 14);
    
    // Prepare request body with proper data URI format as specified
    const body = {
      sessionId: finalSessionId,
      frontImageData: `data:image/png;base64,${cleanFrontImage}`
    };
    
    // Add optional images if provided
    if (cleanBackImage && cleanBackImage.length > 100) {
      Object.assign(body, { 
        backImageData: `data:image/png;base64,${cleanBackImage}`
      });
    }
    
    if (cleanAngledImage && cleanAngledImage.length > 100) {
      Object.assign(body, { 
        angledImageData: `data:image/png;base64,${cleanAngledImage}`
      });
    }
    
    // Set up request timeout
    const timeoutId = setTimeout(() => {
      throw new Error('Request to PIM Standard API timed out after 60 seconds');
    }, 60000);
    
    try {
      // Store COMPLETE request details in session storage for logging
      const requestLog = {
        timestamp: new Date().toISOString(),
        url: '/mobile-upload',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: body // Store the complete body with all image data
      };
      
      // Save the request log
      const existingLogsJson = sessionStorage.getItem('apiRequestLogs');
      const existingLogs = existingLogsJson ? JSON.parse(existingLogsJson) : [];
      existingLogs.unshift(requestLog);
      sessionStorage.setItem('apiRequestLogs', JSON.stringify(existingLogs.slice(0, 10))); // Keep the last 10 logs
      
      // Call the direct external endpoint with proper authentication
      const requestHeaders = {
        'Content-Type': 'application/json',
        'x-api-key': import.meta.env.VITE_MOBILE_API_KEY || 'pim_mobile_2505271605_7f8d9e2a1b4c6d8f9e0a1b2c3d4e5f6g'
      };
      
      const requestBody = JSON.stringify(body);
      
      // Log the actual packet being sent
      console.log('ACTUAL REQUEST PACKET:', {
        url: 'https://master.pinauth.com/mobile-upload',
        method: 'POST',
        headers: requestHeaders,
        bodySize: requestBody.length
      });
      
      console.log('Making request to production server...');
      console.log('Request URL:', 'https://master.pinauth.com/mobile-upload');
      console.log('API Key:', import.meta.env.VITE_MOBILE_API_KEY ? 'Configured from env' : 'Using fallback');
      
      const response = await fetch('https://master.pinauth.com/mobile-upload', {
        method: 'POST',
        mode: 'cors',
        credentials: 'omit',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': import.meta.env.VITE_MOBILE_API_KEY || 'pim_mobile_2505271605_7f8d9e2a1b4c6d8f9e0a1b2c3d4e5f6g'
        },
        body: requestBody
      });
      
      console.log('Response received:', response.status, response.statusText);
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const text = await response.text();
        console.log(`Server error response (${response.status}):`, text);
        
        // Create an error object with full details
        const errorData = {
          status: response.status,
          statusText: response.statusText,
          responseText: text,
          timestamp: new Date().toISOString()
        };
        
        // Store error in sessionStorage for debugging
        sessionStorage.setItem('lastApiError', JSON.stringify(errorData));
        
        // Special handling for service unavailability errors
        if (response.status === 503 || response.status === 502 || response.status === 504 || response.status === 404) {
          const error = new Error(`Server unavailable: Master server is not responding (${response.status})`);
          (error as any).serverError = errorData;
          (error as any).isServerError = true;
          throw error;
        }
        
        const error = new Error(`API error ${response.status}: ${text}`);
        (error as any).serverError = errorData;
        throw error;
      }
      
      const data = await response.json();
      console.log('PIM Standard analysis complete:', data);
      
      // Store response details in session storage for logging
      const responseLog = {
        timestamp: new Date().toISOString(),
        status: response.status,
        data: data
      };
      
      // Save the response log
      const existingResponseLogsJson = sessionStorage.getItem('apiResponseLogs');
      const existingResponseLogs = existingResponseLogsJson ? JSON.parse(existingResponseLogsJson) : [];
      existingResponseLogs.unshift(responseLog);
      sessionStorage.setItem('apiResponseLogs', JSON.stringify(existingResponseLogs.slice(0, 10))); // Keep the last 10 logs
      
      // Map response exactly as received from production server
      return {
        success: data.success || false,
        message: data.message || 'Analysis complete',
        id: data.id,
        sessionId: data.sessionId || body.sessionId,
        timestamp: data.timestamp || new Date().toISOString(),
        authentic: data.authentic !== undefined ? data.authentic : false,
        authenticityRating: data.authenticityRating || 0,
        // Use exact field names from production server response
        analysis: data.analysis || '',
        identification: data.identification || '',
        pricing: data.pricing || '',
        characters: data.characters || '',
        // Legacy compatibility fields
        analysisReport: data.analysis || '',
        confidence: (data.authenticityRating || 0) / 100,
        authenticityScore: data.authenticityRating || 0,
        detectedPinId: data.identification || '',
        rawApiResponse: data
      };
    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      // Store error details in session storage for logging
      const errorLog = {
        timestamp: new Date().toISOString(),
        message: fetchError instanceof Error ? fetchError.message : String(fetchError),
        details: fetchError instanceof Error ? (fetchError as any).serverError : null
      };
      
      // Save the error log
      const existingErrorLogsJson = sessionStorage.getItem('apiErrorLogs');
      const existingErrorLogs = existingErrorLogsJson ? JSON.parse(existingErrorLogsJson) : [];
      existingErrorLogs.unshift(errorLog);
      sessionStorage.setItem('apiErrorLogs', JSON.stringify(existingErrorLogs.slice(0, 10))); // Keep the last 10 logs
      
      // Mark network/fetch errors as server errors
      if (fetchError instanceof Error && (fetchError.message.includes('fetch') || fetchError.message.includes('network'))) {
        (fetchError as any).isServerError = true;
      }
      throw fetchError;
    }
  } catch (error: unknown) {
    console.error('Error in pin analysis:', error);
    
    // Check if this is a server connectivity error and rethrow it
    if (error instanceof Error && ((error as any).isServerError || error.message.includes('Server unavailable'))) {
      throw error;
    }
    
    // Do not return fallback data - propagate the error to show connection issues
    throw error;
  }
}