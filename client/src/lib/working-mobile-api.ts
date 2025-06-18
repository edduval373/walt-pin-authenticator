/**
 * Working Mobile API - Restored from 10-day backup
 * Direct connection to master server that was proven to work on mobile devices
 */

export interface WorkingPimResponse {
  // Master server specification - authentic data only
  id?: number;
  sessionId?: string;
  authentic?: boolean;
  authenticityRating?: number;
  characters?: string;    // HTML content for character identification
  identification?: string; // HTML content for pin identification
  analysis?: string;      // HTML content for AI analysis findings
  pricing?: string;       // HTML content for pricing information
  timestamp?: string;
  message?: string;
}

/**
 * Convert plain text report to HTML
 */
function convertReportToHtml(reportText: string): string {
  if (!reportText) return '';
  
  // Replace newlines with <br>
  let html = reportText.replace(/\n\n+/g, '<div class="section-break"></div>');
  
  // Format section titles (all caps text followed by newlines)
  html = html.replace(/^([A-Z][A-Z\s]+)$/gm, '<h2 class="section-title">$1</h2>');
  
  // Format table headers and rows
  if (html.includes('Category') && html.includes('Results') && html.includes('Score')) {
    const tablePattern = /Category.*?Score.*?([\s\S]*?)(?:<div class="section-break"|$)/;
    const tableMatch = html.match(tablePattern);
    
    if (tableMatch && tableMatch[1]) {
      const tableRows = tableMatch[1].trim().split('\n');
      let tableHtml = '<table class="findings-table"><thead><tr><th>Category</th><th>Results</th><th>Score</th></tr></thead><tbody>';
      
      for (const row of tableRows) {
        const cells = row.split(/\s{2,}/).filter(Boolean);
        if (cells.length >= 2) {
          const category = cells[0];
          const results = cells.length >= 3 ? cells[1] : '';
          const score = cells.length >= 3 ? cells[2] : cells[1];
          
          tableHtml += `<tr><td>${category}</td><td>${results}</td><td>${score}</td></tr>`;
        }
      }
      
      tableHtml += '</tbody></table>';
      html = html.replace(tableMatch[0], tableHtml);
    }
  }
  
  // Convert remaining newlines to <br>
  html = html.replace(/\n/g, '<br>');
  
  // Style for pin title and description
  html = html.replace(/Pin Title: (.*?)<br>/g, '<div class="pin-title">Pin Title: <span class="pin-name">$1</span></div>');
  html = html.replace(/Pin Description: (.*?)<br>/g, '<div class="pin-description">Pin Description: <span>$1</span></div>');
  
  // Style for rating
  html = html.replace(/Final Rating: (.*?)<br>/g, '<div class="rating-box">Final Rating: <span class="rating-value">$1</span></div>');
  
  return `<div class="verification-report">${html}</div>`;
}

/**
 * Working mobile API call - exactly as it worked 10 days ago
 */
export async function callWorkingMobileApi(
  frontImage: string,
  backImage?: string,
  angledImage?: string
): Promise<WorkingPimResponse> {
  try {
    console.log('Using working mobile API from backup...');
    
    // Generate session ID in YYMMDDHHMMSS format (exactly 12 digits as required)
    const now = new Date();
    const sessionId = `${String(now.getFullYear()).slice(-2)}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
    
    // Remove data URI prefixes from base64 strings as required by master server
    const cleanFrontImage = frontImage.replace(/^data:image\/[a-z]+;base64,/, '');
    const cleanBackImage = backImage ? backImage.replace(/^data:image\/[a-z]+;base64,/, '') : null;
    const cleanAngledImage = angledImage ? angledImage.replace(/^data:image\/[a-z]+;base64,/, '') : null;
    
    // Prepare request payload exactly as specified by master app
    const payload = {
      sessionId: sessionId,
      frontImageData: cleanFrontImage,
      backImageData: cleanBackImage,
      angledImageData: cleanAngledImage,
      requireApproval: false,
      prompts: {}
    };
    
    console.log('Direct connection to master server (working backup approach)');
    
    // Always use local production server which has correct master server integration
    const apiUrl = '/mobile-upload';
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': import.meta.env.VITE_MOBILE_API_KEY
      },
      body: JSON.stringify(payload),
      // Set 180-second timeout as specified by master app
      signal: AbortSignal.timeout(180000)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed with status ${response.status}: ${errorText}`);
    }
    
    const data = await response.json();
    console.log('Working mobile API success:', data);
    
    // Check for explicit error responses only
    if (data.error && !data.message) {
      throw new Error(data.error);
    }
    
    // Return only authentic master server data - no synthetic generation
    return {
      id: data.id,
      sessionId: data.sessionId,
      authentic: data.authentic,
      authenticityRating: data.authenticityRating,
      characters: data.characters,
      identification: data.identification,
      analysis: data.analysis,
      pricing: data.pricing,
      timestamp: data.timestamp,
      message: data.message
    };
  } catch (error: unknown) {
    console.error('Working mobile API error:', error);
    throw error;
  }
}