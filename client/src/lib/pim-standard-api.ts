/**
 * PIM Standard Library API Integration
 * 
 * This module provides integration with the PIM Standard library for analyzing pin images
 * and determining their authenticity.
 */

/**
 * Master Server Response Format - Exactly 8 fields as specified
 */
export interface PimAnalysisResponse {
  success: boolean;        // Operation success status
  message: string;         // Response message
  sessionId: string;       // Session identifier
  id: number;             // Database record ID
  characters: string | null;    // Character analysis (authentic AI content or null)
  analysis: string | null;      // Analysis details (authentic AI content or null) 
  identification: string | null; // Pin identification (authentic AI content or null)
  pricing: string | null;       // Pricing information (authentic AI content or null)
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
  angledImage?: string
): Promise<PimAnalysisResponse> {
  try {
    console.log('Submitting images to PIM Standard analyzer...');
    console.log('Image data sizes before processing:');
    console.log('- Front image:', frontImage.length, 'characters');
    if (backImage) console.log('- Back image:', backImage.length, 'characters');
    if (angledImage) console.log('- Angled image:', angledImage.length, 'characters');
    
    // Generate session ID in YYMMDDHHMMSS format (12 digits)
    const now = new Date();
    const sessionId = `${String(now.getFullYear()).slice(-2)}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;

    // Prepare the request data - extract base64 data only (no data URL prefix)
    const requestData = {
      sessionId,
      frontImageData: frontImage.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, ''),
      ...(backImage && { backImageData: backImage.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '') }),
      ...(angledImage && { angledImageData: angledImage.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '') })
    };

    const apiKey = import.meta.env.VITE_MOBILE_API_KEY;
    
    console.log('DIRECT MASTER SERVER REQUEST:', {
      url: 'https://master.pinauth.com/mobile-upload',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': '[HIDDEN]' },
      sessionId: sessionId
    });

    console.log('Connecting directly to https://master.pinauth.com/mobile-upload');
    console.log('Session ID:', sessionId);

    // Set up a timeout for the fetch
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minute timeout for image processing
    
    try {
      // Make direct API request to master server with proper CORS handling
      const response = await fetch('/api/proxy/mobile-upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData),
        signal: controller.signal
      });
      
      // Clear the timeout when the fetch is complete
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Master server error:', response.status, errorText);
        throw new Error(`Master server responded with status: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Pin analysis complete:', data);
      
      // Return only authentic server response fields as specified
      return {
        success: data.success,
        message: data.message,
        sessionId: data.sessionId,
        id: data.id,
        characters: data.characters,
        identification: data.identification,
        analysis: data.analysis,
        pricing: data.pricing
      };
    } catch (fetchError) {
      clearTimeout(timeoutId);
      console.error('Network error during analysis:', fetchError);
      throw fetchError;
    }
  } catch (error: unknown) {
    console.error('Error in pin analysis:', error);
    throw error;
  }
}

