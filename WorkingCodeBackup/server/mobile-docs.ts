/**
 * Documentation and diagnostic page for mobile app API integration
 * This provides the exact required information for mobile app development teams
 */

/**
 * Generate HTML documentation for mobile API integration
 */
export function generateMobileApiDocs(): string {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mobile API Integration Guide</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    h1 { color: #2c5282; }
    h2 { color: #3182ce; margin-top: 30px; }
    h3 { color: #4299e1; }
    pre {
      background-color: #f7fafc;
      border-radius: 5px;
      padding: 15px;
      overflow-x: auto;
      border: 1px solid #e2e8f0;
    }
    code {
      font-family: Menlo, Monaco, Consolas, "Liberation Mono", monospace;
      background-color: #f7fafc;
      padding: 2px 4px;
      border-radius: 3px;
    }
    .endpoint {
      background-color: #ebf8ff;
      border-left: 4px solid #3182ce;
      padding: 10px 15px;
      margin: 15px 0;
    }
    .header {
      background-color: #e6fffa;
      border-left: 4px solid #38b2ac;
      padding: 10px 15px;
      margin: 15px 0;
    }
    .important {
      background-color: #feebc8;
      border-left: 4px solid #dd6b20;
      padding: 10px 15px;
      margin: 15px 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    th, td {
      border: 1px solid #e2e8f0;
      padding: 8px 12px;
      text-align: left;
    }
    th {
      background-color: #f7fafc;
    }
    tr:nth-child(even) {
      background-color: #f7fafc;
    }
  </style>
</head>
<body>
  <h1>PinAuth Mobile API Integration Guide</h1>
  
  <div class="important">
    <h3>IMPORTANT: Production API Information</h3>
    <p>This document provides the exact production API endpoint and authentication details required for mobile app integration.</p>
  </div>

  <h2>API Endpoint</h2>
  
  <div class="endpoint">
    <h3>Production API URL:</h3>
    <pre><code>https://pim-master-library.replit.app/api/mobile/simple-verify</code></pre>
  </div>

  <h2>Authentication</h2>
  
  <div class="header">
    <h3>Required Header:</h3>
    <pre><code>X-API-Key: mobile-test-key</code></pre>
    <p>This is a literal string value, not a placeholder. Use exactly as shown.</p>
  </div>

  <h2>Request Format</h2>
  
  <h3>HTTP Method:</h3>
  <pre><code>POST</code></pre>
  
  <h3>Content-Type Header:</h3>
  <pre><code>Content-Type: application/json</code></pre>
  
  <h3>Request Body Schema:</h3>
  <pre><code>{
  "frontImageBase64": "base64_encoded_string", // Required
  "backImageBase64": "base64_encoded_string",   // Optional
  "angledImageBase64": "base64_encoded_string"  // Optional
}</code></pre>

  <h2>Example Request</h2>
  
  <h3>Using fetch (JavaScript):</h3>
  <pre><code>const response = await fetch('https://pim-master-library.replit.app/api/mobile/simple-verify', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'mobile-test-key'
  },
  body: JSON.stringify({
    frontImageBase64: 'base64_encoded_front_image',
    backImageBase64: 'base64_encoded_back_image', // Optional
    angledImageBase64: 'base64_encoded_angled_image' // Optional
  })
});</code></pre>

  <h3>Using Axios (JavaScript):</h3>
  <pre><code>const response = await axios.post(
  'https://pim-master-library.replit.app/api/mobile/simple-verify',
  {
    frontImageBase64: 'base64_encoded_front_image',
    backImageBase64: 'base64_encoded_back_image', // Optional
    angledImageBase64: 'base64_encoded_angled_image' // Optional
  },
  {
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': 'mobile-test-key'
    }
  }
);</code></pre>

  <h3>Using URLSession (Swift):</h3>
  <pre><code>let url = URL(string: "https://pim-master-library.replit.app/api/mobile/simple-verify")!
var request = URLRequest(url: url)
request.httpMethod = "POST"
request.addValue("application/json", forHTTPHeaderField: "Content-Type")
request.addValue("mobile-test-key", forHTTPHeaderField: "X-API-Key")

let parameters: [String: Any] = [
  "frontImageBase64": "base64_encoded_front_image",
  "backImageBase64": "base64_encoded_back_image", // Optional
  "angledImageBase64": "base64_encoded_angled_image" // Optional
]

request.httpBody = try? JSONSerialization.data(withJSONObject: parameters)</code></pre>

  <h3>Using OkHttp (Kotlin/Java):</h3>
  <pre><code>val client = OkHttpClient()
val mediaType = "application/json".toMediaType()
val requestBody = """
{
  "frontImageBase64": "base64_encoded_front_image",
  "backImageBase64": "base64_encoded_back_image",
  "angledImageBase64": "base64_encoded_angled_image"
}
""".trimIndent().toRequestBody(mediaType)

val request = Request.Builder()
  .url("https://pim-master-library.replit.app/api/mobile/simple-verify")
  .post(requestBody)
  .addHeader("Content-Type", "application/json")
  .addHeader("X-API-Key", "mobile-test-key")
  .build()</code></pre>

  <h2>Response Format</h2>
  
  <h3>Success Response (200 OK):</h3>
  <pre><code>{
  "success": true,
  "authentic": true|false,
  "authenticityRating": 0-100,
  "message": "Verification message",
  "analysis": "Detailed analysis text",
  "identification": "Pin identification details",
  "pricing": "Pricing information",
  "sessionId": "unique_session_id",
  "timestamp": "ISO timestamp"
}</code></pre>

  <h3>Error Response:</h3>
  <pre><code>{
  "success": false,
  "message": "Error description",
  "errorCode": "ERROR_CODE" // Optional
}</code></pre>

  <h2>Common Error Codes</h2>
  
  <table>
    <tr>
      <th>Status Code</th>
      <th>Error Code</th>
      <th>Description</th>
    </tr>
    <tr>
      <td>400</td>
      <td>MISSING_IMAGE</td>
      <td>Front image is required but not provided</td>
    </tr>
    <tr>
      <td>400</td>
      <td>INVALID_IMAGE</td>
      <td>Image data is not valid base64 or is corrupted</td>
    </tr>
    <tr>
      <td>401</td>
      <td>INVALID_API_KEY</td>
      <td>The API key is invalid or missing</td>
    </tr>
    <tr>
      <td>429</td>
      <td>RATE_LIMIT_EXCEEDED</td>
      <td>Too many requests in a short period</td>
    </tr>
    <tr>
      <td>500</td>
      <td>SERVER_ERROR</td>
      <td>Internal server error occurred</td>
    </tr>
  </table>

  <h2>Testing</h2>
  
  <p>You can test the API connection by sending a simple POST request with minimal data:</p>
  
  <pre><code>curl -X POST "https://pim-master-library.replit.app/api/mobile/simple-verify" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: mobile-test-key" \\
  -d '{"frontImageBase64": "test", "testMode": true}'</code></pre>

  <p>This test request should return a success response without performing actual analysis.</p>

  <hr>
  <p><small>Last updated: ${new Date().toISOString()}</small></p>
</body>
</html>
  `;

  return html;
}