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
      // Handle mobile streaming response (4 packets)
      return await handleMobileStreamingResponse(requestData, sessionId);
    } else {
      // Handle desktop single response
      return await handleDesktopResponse(requestData, sessionId);
    }
  } catch (error: unknown) {
    console.error('Error in pin analysis:', error);
    throw error;
  }
}

/**
 * Handle streaming response for mobile devices (4 packets)
 */
async function handleMobileStreamingResponse(requestData: any, sessionId: string): Promise<PimAnalysisResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    console.log('Mobile streaming timeout - aborting...');
    controller.abort();
  }, 120000); // 2 minute total timeout for all packets

  try {
    const response = await fetch('/api/proxy/mobile-upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData),
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    // Read streaming response
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Stream reader not available');
    }

    const decoder = new TextDecoder();
    let buffer = '';
    const packets: any[] = [];
    
    console.log('Reading mobile streaming packets...');
    
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer
        
        for (const line of lines) {
          if (line.trim()) {
            try {
              const packet = JSON.parse(line);
              packets.push(packet);
              console.log(`Received packet ${packet.packetNumber}/${packet.totalPackets}: ${packet.packetType}`);
              
              if (packet.packetType === 'error') {
                throw new Error(packet.message || 'Stream error');
              }
            } catch (parseError) {
              console.warn('Failed to parse packet:', line);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
      clearTimeout(timeoutId);
    }

    // Combine packets into final response
    const combinedData = combineStreamingPackets(packets);
    console.log('Mobile streaming complete - packets combined:', packets.length);
    
    return formatPimResponse(combinedData, requestData);
    
  } catch (error) {
    clearTimeout(timeoutId);
    console.error('Mobile streaming error:', error);
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
 */
function combineStreamingPackets(packets: any[]): any {
  const combinedData: any = {
    success: true,
    sessionId: packets[0]?.sessionId
  };
  
  for (const packet of packets) {
    if (packet.packetType === 'basic_results') {
      Object.assign(combinedData, {
        success: packet.success,
        authentic: packet.authentic,
        authenticityRating: packet.authenticityRating,
        id: packet.id,
        timestamp: packet.timestamp,
        message: packet.message
      });
    } else if (packet.packetType === 'identification') {
      Object.assign(combinedData, {
        characters: packet.characters,
        identification: packet.identification
      });
    } else if (packet.packetType === 'analysis_complete') {
      Object.assign(combinedData, {
        analysis: packet.analysis,
        pricing: packet.pricing,
        frontHtml: packet.frontHtml,
        backHtml: packet.backHtml,
        angledHtml: packet.angledHtml,
        processingTime: packet.processingTime
      });
    }
  }
  
  return combinedData;
}

/**
 * Format the response data into PimAnalysisResponse format
 */
function formatPimResponse(data: any, requestData: any): PimAnalysisResponse {
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
      
      // Enhanced mobile debugging
      const errorMessage = fetchError instanceof Error ? fetchError.message : String(fetchError);
      const isTimeout = fetchError instanceof Error && fetchError.name === 'AbortError';
      const isMobileDevice = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const connectionInfo = (navigator as any).connection;
      
      console.error('MOBILE DEBUG - Network error:', {
        error: errorMessage,
        isTimeout,
        isMobileDevice,
        isOnline: navigator.onLine,
        connectionType: connectionInfo?.effectiveType || 'unknown',
        downlink: connectionInfo?.downlink || 'unknown',
        rtt: connectionInfo?.rtt || 'unknown',
        saveData: connectionInfo?.saveData || false
      });
      
      if (isTimeout && isMobileDevice) {
        throw new Error('Mobile timeout: Try WiFi instead of cellular data, or move to area with stronger signal');
      }
      
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