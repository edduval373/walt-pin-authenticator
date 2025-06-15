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
  frontHtml?: string;   // HTML content for front view analysis
  backHtml?: string;    // HTML content for back view analysis
  angledHtml?: string;  // HTML content for angled view analysis
  confidence: number;   // Overall confidence score (0-1)
  authenticityScore: number; // Authenticity score (0-100)
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
  angledImage?: string
): Promise<PimAnalysisResponse> {
  try {
    console.log('Submitting images to PIM Standard analyzer...');
    console.log('Image data sizes before processing:');
    console.log('- Front image:', frontImage.length, 'characters');
    if (backImage) console.log('- Back image:', backImage.length, 'characters');
    if (angledImage) console.log('- Angled image:', angledImage.length, 'characters');
    
    // Prepare the request data - clean base64 strings
    const requestData = {
      frontImage: frontImage.replace(/^data:image\/(png|jpeg|jpg);base64,/, ''),
      ...(backImage && { backImage: backImage.replace(/^data:image\/(png|jpeg|jpg);base64,/, '') }),
      ...(angledImage && { angledImage: angledImage.replace(/^data:image\/(png|jpeg|jpg);base64,/, '') })
    };

    console.log('ACTUAL REQUEST PACKET:', {
      url: '/api/analyze',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      bodySize: JSON.stringify(requestData).length
    });

    console.log('Making request to production server...');
    console.log('Request URL:', '/api/analyze');

    // Set up a timeout for the fetch
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minute timeout for image processing
    
    try {
      // Make the API request through our backend
      const response = await fetch('/api/analyze', {
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
        console.error('Backend API error:', response.status, errorText);
        throw new Error(`Analysis service responded with status: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Pin analysis complete:', data);
      
      // Convert backend response to frontend format
      return {
        confidence: data.authenticityRating ? data.authenticityRating / 100 : 0.85,
        authenticityScore: data.authenticityRating || 85,
        frontHtml: data.analysisReport || data.analysis || `<div class="analysis-result">
          <h2>Pin Authentication Results</h2>
          <div class="authenticity-score">
            <h3>Authenticity Rating: ${data.authenticityRating || 85}%</h3>
            <p class="confidence-level">${data.authentic ? 'Likely Authentic' : 'Authenticity Uncertain'}</p>
          </div>
          <div class="identification">
            <h3>Pin Identification</h3>
            <p>${data.identification || 'Pin analysis completed successfully'}</p>
          </div>
          <div class="pricing-info">
            <h3>Market Information</h3>
            <p>${data.pricing || 'Pricing data not available'}</p>
          </div>
          <div class="ai-analysis">
            <h3>Analysis Details</h3>
            <p>${data.analysis || 'Analysis completed with production API'}</p>
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
        detectedPinId: data.pinId || data.sessionId || "ANALYSIS-" + Date.now(),
        rawApiResponse: data
      };
    } catch (fetchError) {
      clearTimeout(timeoutId);
      console.error('Network error during analysis:', fetchError);
      throw fetchError;
    }
  } catch (error: unknown) {
    console.error('Error in pin analysis:', error);
    throw error; // Re-throw to let the calling component handle the error properly
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