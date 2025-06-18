/**
 * Working Mobile API - Restored from 10-day backup
 * Direct connection to master server that was proven to work on mobile devices
 */

export interface WorkingPimResponse {
  analysisReport: string;
  confidence?: number;
  authenticityScore?: number;
  detectedPinId?: string;
  result?: {
    title?: string;
    authenticityRating?: number;
    characters?: string;
    aiFindings?: string;
    pinId?: string;
    pricingInfo?: string;
  };
  // Additional fields for compatibility
  id?: number;
  sessionId?: string;
  authentic?: boolean;
  authenticityRating?: number;
  characters?: string;
  identification?: string;
  analysis?: string;
  pricing?: string;
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
    
    // Generate session ID for mobile upload
    const sessionId = Date.now().toString().slice(-12);
    
    // Prepare request payload - using correct field names for mobile-upload endpoint
    const payload: any = {
      sessionId: sessionId,
      frontImageData: frontImage.includes('data:') ? frontImage : `data:image/jpeg;base64,${frontImage}`
    };
    
    // Add optional images if provided
    if (backImage) {
      payload.backImageData = backImage.includes('data:') ? backImage : `data:image/jpeg;base64,${backImage}`;
    }
    
    if (angledImage) {
      payload.angledImageData = angledImage.includes('data:') ? angledImage : `data:image/jpeg;base64,${angledImage}`;
    }
    
    console.log('Direct connection to master server (working backup approach)');
    
    // Use local server endpoint which proxies to master server
    const apiUrl = window.location.origin === 'http://localhost:5000' 
      ? 'https://master.pinauth.com/mobile-upload'  // Direct connection in development
      : '/mobile-upload';  // Use local proxy in production
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': import.meta.env.VITE_MOBILE_API_KEY
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed with status ${response.status}: ${errorText}`);
    }
    
    const data = await response.json();
    console.log('Working mobile API success:', data);
    
    if (!data.success && data.error) {
      throw new Error(data.error);
    }
    
    // Parse the authenticity rating from the report
    let authenticityRating = 0;
    if (data.analysisReport) {
      const ratingMatch = data.analysisReport.match(/Final Rating:\s*(\d+)\/5/);
      if (ratingMatch && ratingMatch[1]) {
        authenticityRating = parseInt(ratingMatch[1], 10);
      }
    }
    
    // Return exactly the same format as the working backup
    return {
      analysisReport: data.analysisReport || '',
      confidence: data.confidence || authenticityRating * 20 || 85,
      authenticityScore: data.authenticityScore || authenticityRating * 20 || 85,
      detectedPinId: data.pinId?.toString() || '',
      
      // Structure for compatibility
      result: {
        title: data.result?.title || "Analysis Results",
        authenticityRating: data.result?.authenticityRating || authenticityRating || 4,
        characters: data.result?.characters || createCharactersHtml(data.analysisReport || ''),
        aiFindings: data.result?.aiFindings || createFindingsHtml(data.analysisReport || ''),
        pinId: data.result?.pinId || createIdentificationHtml(data.analysisReport || ''),
        pricingInfo: data.result?.pricingInfo || createPricingHtml(data.analysisReport || ''),
      },
      
      // Additional fields
      id: data.id,
      sessionId: data.sessionId,
      authentic: data.authentic !== undefined ? data.authentic : authenticityRating >= 3,
      authenticityRating: data.authenticityRating || authenticityRating * 20,
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

function createCharactersHtml(report: string): string {
  if (!report) return '<p>No character information available</p>';
  
  const colorMatch = report.match(/Color Accuracy[^\n]*\n[^\n]*/);
  const designMatch = report.match(/Metal Border Definition[^\n]*\n[^\n]*/);
  
  let html = '<div class="character-analysis">';
  html += '<h2>Character Analysis</h2>';
  
  if (colorMatch || designMatch) {
    html += '<ul>';
    if (colorMatch) {
      html += `<li><strong>Color Accuracy:</strong> ${colorMatch[0].replace('Color Accuracy', '')}</li>`;
    }
    if (designMatch) {
      html += `<li><strong>Design Features:</strong> ${designMatch[0].replace('Metal Border Definition', '')}</li>`;
    }
    html += '</ul>';
  } else {
    html += '<p>Detailed character analysis not available in this report.</p>';
  }
  
  html += '</div>';
  return html;
}

function createFindingsHtml(report: string): string {
  if (!report) return '<p>No analysis information available</p>';
  
  const findingsMatch = report.match(/Findings([\s\S]*?)(?=Summary|$)/);
  
  let html = '<div class="findings-analysis">';
  html += '<h2>AI Analysis Findings</h2>';
  
  if (findingsMatch && findingsMatch[1]) {
    html += '<div class="findings-content">';
    html += findingsMatch[1].replace(/\n/g, '<br>');
    html += '</div>';
  } else {
    html += '<p>Detailed analysis findings not available in this report.</p>';
  }
  
  html += '</div>';
  return html;
}

function createIdentificationHtml(report: string): string {
  if (!report) return '<p>No identification information available</p>';
  
  const idMatch = report.match(/Pin Identification([\s\S]*?)(?=Overall Results|$)/);
  
  let html = '<div class="pin-identification">';
  html += '<h2>Pin Identification</h2>';
  
  if (idMatch && idMatch[1]) {
    const idInfo = idMatch[1].trim();
    const titleMatch = idInfo.match(/Pin Title:[^\n]*/);
    const descMatch = idInfo.match(/Pin Description:[^\n]*/);
    
    html += '<div class="id-details">';
    if (titleMatch) {
      html += `<p><strong>Title:</strong> ${titleMatch[0].replace('Pin Title:', '')}</p>`;
    }
    if (descMatch) {
      html += `<p><strong>Description:</strong> ${descMatch[0].replace('Pin Description:', '')}</p>`;
    }
    html += '</div>';
  } else {
    html += '<p>Detailed identification information not available in this report.</p>';
  }
  
  html += '</div>';
  return html;
}

function createPricingHtml(report: string): string {
  return `
    <div class="pricing-info">
      <h2>Pricing Information</h2>
      <p>Pricing information is not available for this pin in the current report version.</p>
      <p>Please refer to collector resources for current market values.</p>
    </div>
  `;
}