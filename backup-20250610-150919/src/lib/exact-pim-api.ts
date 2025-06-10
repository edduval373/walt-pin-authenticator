/**
 * Exact PIM Standard Library API Integration
 * 
 * This module provides direct integration with the PIM Standard library
 * and returns the exact analysis report without any modifications.
 */

/**
 * Response from the PIM Standard analysis API
 */
export interface ExactPimAnalysisResponse {
  analysisReport: string;  // The exact report from the API with no modifications
  confidence?: number;    // Overall confidence score (0-1)
  authenticityScore?: number; // Authenticity score (0-100)
  detectedPinId?: string; // ID of the detected pin if a match was found
  
  // Additional fields based on the mobile API structure
  result?: {
    title?: string;
    authenticityRating?: number; // Rating on scale of 0-5
    characters?: string; // HTML content for characters section
    aiFindings?: string; // HTML content for analysis section
    pinId?: string; // HTML content for identification section  
    pricingInfo?: string; // HTML content for pricing section
  }
}

/**
 * Analyze pin images using the PIM Standard library
 * and return the exact report without modifications
 * 
 * @param frontImage - Base64 encoded front view image (required)
 * @param backImage - Base64 encoded back view image (optional)
 * @param angledImage - Base64 encoded angled view image (optional)
 * @returns Promise resolving to analysis response
 */
/**
 * Convert plain text report to HTML
 * This function transforms the raw analysis report text into formatted HTML
 */
export function convertReportToHtml(reportText: string): string {
  if (!reportText) return '';
  
  // Replace newlines with <br>
  let html = reportText.replace(/\n\n+/g, '<div class="section-break"></div>');
  
  // Format section titles (all caps text followed by newlines)
  html = html.replace(/^([A-Z][A-Z\s]+)$/gm, '<h2 class="section-title">$1</h2>');
  
  // Format table headers and rows
  if (html.includes('Category') && html.includes('Results') && html.includes('Score')) {
    // Extract the table section
    const tablePattern = /Category.*?Score.*?([\s\S]*?)(?:<div class="section-break"|$)/;
    const tableMatch = html.match(tablePattern);
    
    if (tableMatch && tableMatch[1]) {
      const tableRows = tableMatch[1].trim().split('\n');
      let tableHtml = '<table class="findings-table"><thead><tr><th>Category</th><th>Results</th><th>Score</th></tr></thead><tbody>';
      
      for (const row of tableRows) {
        // Split by multiple spaces or tabs
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
 * Analyze pin images using the PIM Standard library
 * 
 * @param frontImage - Base64 encoded front view image (required)
 * @param backImage - Base64 encoded back view image (optional)
 * @param angledImage - Base64 encoded angled view image (optional)
 * @param pinId - ID of the pin for verification (optional, defaults to 1)
 * @returns Promise resolving to analysis response
 */
export async function getExactPimAnalysisReport(
  frontImage: string,
  backImage?: string,
  angledImage?: string,
  pinId: number | string = 1
): Promise<ExactPimAnalysisResponse> {
  try {
    console.log('Sending request to PIM Standard API...');
    
    // Prepare request payload - following the React Native mobile pattern
    const payload = {
      pinId: pinId,
      frontImageBase64: frontImage.replace(/^data:image\/[a-z]+;base64,/, '')
    };
    
    // Add optional images if provided
    if (backImage) {
      Object.assign(payload, { 
        backImageBase64: backImage.replace(/^data:image\/[a-z]+;base64,/, '') 
      });
    }
    
    if (angledImage) {
      Object.assign(payload, { 
        angledImageBase64: angledImage.replace(/^data:image\/[a-z]+;base64,/, '') 
      });
    }
    
    console.log('Using API endpoint: /api/mobile/simple-verify');
    
    // Use the working simple-verify endpoint with mobile-test-key
    const response = await fetch('/api/mobile/simple-verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': 'mobile-test-key'  // Use the exact API key needed for mobile integration
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed with status ${response.status}: ${errorText}`);
    }
    
    const data = await response.json();
    console.log('Received analysis report from PIM API', data);
    
    if (!data.success && data.error) {
      throw new Error(data.error);
    }
    
    // Parse the authenticity rating from the report (example: "Final Rating: 4/5")
    let authenticityRating = 0;
    if (data.analysisReport) {
      const ratingMatch = data.analysisReport.match(/Final Rating:\s*(\d+)\/5/);
      if (ratingMatch && ratingMatch[1]) {
        authenticityRating = parseInt(ratingMatch[1], 10);
      }
    }
    
    // Create a complete response object with all expected fields
    // Handle the case where data may be empty or incomplete
    return {
      analysisReport: data.analysisReport || '',
      confidence: data.confidence || authenticityRating * 20 || 0, // Use API value or fallback
      authenticityScore: data.authenticityScore || authenticityRating * 20 || 0,
      detectedPinId: data.pinId?.toString() || '',
      
      // Structure the result to match the mobile API pattern
      result: {
        title: data.result?.title || "Analysis Results",
        authenticityRating: data.result?.authenticityRating || authenticityRating || 0,
        characters: data.result?.characters || createCharactersHtml(data.analysisReport || ''),
        aiFindings: data.result?.aiFindings || createFindingsHtml(data.analysisReport || ''),
        pinId: data.result?.pinId || createIdentificationHtml(data.analysisReport || ''),
        pricingInfo: data.result?.pricingInfo || createPricingHtml(data.analysisReport || ''),
      }
    };
  } catch (error: unknown) {
    console.error('Error in pin analysis:', error);
    throw error;
  }
}

/**
 * Parse the Characters section from the raw report
 */
function createCharactersHtml(report: string): string {
  if (!report) return '<p>No character information available</p>';
  
  // Extract sections related to character analysis - look for color accuracy, design features
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

/**
 * Parse the Findings section from the raw report
 */
function createFindingsHtml(report: string): string {
  if (!report) return '<p>No analysis information available</p>';
  
  // Extract the Findings section
  const findingsMatch = report.match(/Findings([\s\S]*?)(?=Summary|$)/);
  
  let html = '<div class="findings-analysis">';
  html += '<h2>AI Analysis Findings</h2>';
  
  if (findingsMatch && findingsMatch[1]) {
    html += '<div class="findings-content">';
    // Format the findings - typically a table of factors and scores
    html += findingsMatch[1].replace(/\n/g, '<br>');
    html += '</div>';
  } else {
    html += '<p>Detailed analysis findings not available in this report.</p>';
  }
  
  html += '</div>';
  return html;
}

/**
 * Parse the Identification section from the raw report
 */
function createIdentificationHtml(report: string): string {
  if (!report) return '<p>No identification information available</p>';
  
  // Extract the Pin Identification section
  const idMatch = report.match(/Pin Identification([\s\S]*?)(?=Overall Results|$)/);
  
  let html = '<div class="pin-identification">';
  html += '<h2>Pin Identification</h2>';
  
  if (idMatch && idMatch[1]) {
    // Format the identification info
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

/**
 * Create pricing HTML section (placeholder as this isn't in the sample report)
 */
function createPricingHtml(report: string): string {
  // This is a placeholder since the sample report doesn't include pricing
  return `
    <div class="pricing-info">
      <h2>Pricing Information</h2>
      <p>Pricing information is not available for this pin in the current report version.</p>
      <p>Please refer to collector resources for current market values.</p>
    </div>
  `;
}