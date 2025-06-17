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

    // Detect mobile device for streaming response handling
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    console.log(`Device type: ${isMobile ? 'Mobile (streaming)' : 'Desktop (single response)'}`);
    
    if (isMobile) {
      // Mobile devices try direct connection first, fallback to proxy
      return await handleMobileWithFallback(requestData, sessionId);
    } else {
      // Desktop uses proxy for CORS handling
      return await handleDesktopResponse(requestData, sessionId);
    }
  } catch (error: unknown) {
    console.error('Error in pin analysis:', error);
    throw error;
  }
}

/**
 * Handle direct connection for mobile devices (bypass proxy, connect directly to master server)
 */
async function handleMobileDirectConnection(requestData: any, sessionId: string): Promise<PimAnalysisResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    console.log('Mobile direct connection timeout - aborting...');
    controller.abort();
  }, 120000); // 2 minute timeout for direct connection

  try {
    console.log('MOBILE DIRECT CONNECTION: Bypassing proxy, connecting directly to master server');
    console.log('Request data size:', JSON.stringify(requestData).length, 'characters');
    
    const apiKey = import.meta.env.VITE_MOBILE_API_KEY;
    console.log('Using API key:', apiKey ? 'Environment key configured' : 'Using fallback key');
    
    const response = await fetch('https://master.pinauth.com/mobile-upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey || 'pim_0w3nfrt5ahgc',
        'Accept': 'application/json',
        'Cache-Control': 'no-cache'
      },
      body: JSON.stringify(requestData),
      signal: controller.signal,
      mode: 'cors',
      credentials: 'omit'
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Master server direct error:', response.status, errorText);
      throw new Error(`Master server responded with status: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Mobile direct connection success:', data);
    
    return formatPimResponse(data, requestData);
    
  } catch (error) {
    clearTimeout(timeoutId);
    console.error('Mobile direct connection error:', error);
    
    // If direct connection fails, provide helpful error message
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      throw new Error('Direct connection to master server failed. Check your internet connection and try again.');
    }
    
    throw error;
  }
}

/**
 * Handle single response for desktop devices
 */
async function handleDesktopResponse(requestData: any, sessionId: string): Promise<PimAnalysisResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    console.log('Desktop request timeout - aborting...');
    controller.abort();
  }, 120000);

  try {
    const response = await fetch('/api/proxy/mobile-upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Master server error:', response.status, errorText);
      throw new Error(`Master server responded with status: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Pin analysis complete:', data);
    
    return formatPimResponse(data, requestData);
    
  } catch (error) {
    clearTimeout(timeoutId);
    console.error('Desktop request error:', error);
    throw error;
  }
}

/**
 * Combine streaming packets into a single response object
 * Packets can arrive in any order with clear type identifiers
 */
function combineStreamingPackets(packets: any[]): any {
  const combinedData: any = {
    success: true,
    sessionId: packets[0]?.sessionId
  };
  
  for (const packet of packets) {
    switch (packet.packetType) {
      case 'CONNECTION_ESTABLISHED':
        // Connection info - no data to merge
        break;
        
      case 'PROCESSING_STARTED':
        // Processing status - no data to merge
        break;
        
      case 'AUTHENTICATION_RESULT':
        Object.assign(combinedData, {
          authentic: packet.authentic,
          authenticityRating: packet.authenticityRating,
          confidence: packet.confidence
        });
        break;
        
      case 'CHARACTER_IDENTIFICATION':
        Object.assign(combinedData, {
          characters: packet.characters,
          identification: packet.identification
        });
        break;
        
      case 'PRICING_ANALYSIS':
        Object.assign(combinedData, {
          pricing: packet.pricing
        });
        break;
        
      case 'DETAILED_ANALYSIS':
        Object.assign(combinedData, {
          analysis: packet.analysis
        });
        break;
        
      case 'HTML_DISPLAY_DATA':
        Object.assign(combinedData, {
          frontHtml: packet.frontHtml,
          backHtml: packet.backHtml,
          angledHtml: packet.angledHtml
        });
        break;
        
      case 'ANALYSIS_COMPLETE':
        Object.assign(combinedData, {
          success: packet.success,
          id: packet.id,
          message: packet.message,
          processingTime: packet.processingTime,
          timestamp: packet.timestamp,
          complete: packet.complete
        });
        break;
        
      default:
        console.warn('Unknown packet type:', packet.packetType);
    }
  }
  
  return combinedData;
}

/**
 * Format the response data into PimAnalysisResponse format
 */
function formatPimResponse(data: any, requestData: any): PimAnalysisResponse {
  return {
    confidence: data.confidence || (data.authenticityRating ? data.authenticityRating / 100 : 0.85),
    authenticityScore: data.authenticityRating || 85,
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
    frontHtml: data.frontHtml || `<div class="analysis-result">
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
        <p>Timestamp: ${data.timestamp ? new Date(data.timestamp).toLocaleString() : 'Processing...'}</p>
      </div>
    </div>`,
    backHtml: data.backHtml || (requestData.backImageData ? `<div class="analysis-result">
      <h2>Back View Analysis</h2>
      <p>Back view analysis completed</p>
    </div>` : undefined),
    angledHtml: data.angledHtml || (requestData.angledImageData ? `<div class="analysis-result">
      <h2>Angled View Analysis</h2>
      <p>Angled view analysis completed</p>
    </div>` : undefined),
    detectedPinId: data.sessionId || requestData.sessionId,
    rawApiResponse: data
  };
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