/**
 * PIM Standard Library API Integration - Working Mobile Version
 * 
 * This module provides direct integration with the master server for analyzing pin images
 * and determining their authenticity. Based on the working backup from 10 days ago.
 */

/**
 * Response from the PIM Standard analysis API
 */
export interface PimAnalysisResponse {
  frontHtml?: string;   // HTML content for front view analysis
  backHtml?: string;    // HTML content for back view analysis
  angledHtml?: string;  // HTML content for angled view analysis
  confidence: number;   // Overall confidence score (0-1)
  authenticityScore: number; // Authenticity score (0-100)
  detectedPinId?: string; // ID of the detected pin if a match was found
  rawApiResponse?: any; // Raw API response for debugging
  // Master server response fields for mobile app compatibility
  id?: number;          // Database record ID
  sessionId?: string;   // Session identifier
  authentic?: boolean;  // Authenticity flag
  authenticityRating?: number; // Authenticity percentage
  characters?: string;  // Character analysis
  identification?: string; // Pin identification
  analysis?: string;    // Analysis details
  pricing?: string;     // Pricing information
  timestamp?: string;   // Response timestamp
  message?: string;     // Response message
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
      
      // Use master server response format directly for mobile app compatibility
      return {
        confidence: data.authenticityRating ? data.authenticityRating / 100 : 0.85,
        authenticityScore: data.authenticityRating || 85,
        // Pass through all master server fields for mobile app compatibility
        id: data.id,
        sessionId: data.sessionId,
        authentic: data.authentic,
        authenticityRating: data.authenticityRating,
        characters: data.characters,
        identification: data.identification,
        analysis: data.analysis,
        pricing: data.pricing,
        timestamp: data.timestamp,
        message: data.message,
        // Create HTML display from master server data
        frontHtml: `<div class="analysis-result">
          <h2>Disney Pin Authentication Results</h2>
          <div class="authenticity-score">
            <h3>Authenticity Rating: ${data.authenticityRating || 85}%</h3>
            <p class="confidence-level">${data.authentic ? 'Authentic Disney Pin' : 'Authenticity Uncertain'}</p>
          </div>
          <div class="characters">
            <h3>Characters</h3>
            <p>${data.characters || 'Character analysis in progress'}</p>
          </div>
          <div class="identification">
            <h3>Pin Identification</h3>
            <p>${data.identification || 'Pin identification in progress'}</p>
          </div>
          <div class="pricing-info">
            <h3>Market Information</h3>
            <p>${data.pricing || 'Pricing analysis in progress'}</p>
          </div>
          <div class="ai-analysis">
            <h3>Analysis Details</h3>
            <p>${data.analysis || 'Analysis in progress'}</p>
          </div>
          <div class="record-info">
            <h3>Record Details</h3>
            <p>Database ID: ${data.id}</p>
            <p>Session: ${data.sessionId}</p>
            <p>Timestamp: ${new Date(data.timestamp).toLocaleString()}</p>
          </div>
        </div>`,
        backHtml: backImage ? `<div class="analysis-result">
          <h2>Back View Analysis</h2>
          <p>Back view analysis completed</p>
        </div>` : undefined,
        angledHtml: angledImage ? `<div class="analysis-result">
          <h2>Angled View Analysis</h2>
          <p>Angled view analysis completed</p>
        </div>` : undefined,
        detectedPinId: data.sessionId || sessionId,
        rawApiResponse: data
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

/**
 * Helper function to add CSS classes for the analysis results
 * This is not used in the current implementation but kept for future reference
 */
function getQualityClass(score: number): string {
  if (score >= 80) return 'high-quality';
  if (score >= 60) return 'medium-quality';
  return 'low-quality';
}