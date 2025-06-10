# Host Agent API Specification
## Data Exchange Format for Mobile App Integration

### Overview
This document specifies the exact data exchange format between the mobile app verification system and the host agent's pin authentication API.

## 1. OUTGOING REQUEST TO HOST AGENT

### Endpoint: `/mobile-upload`
**Method:** POST  
**Content-Type:** application/json  
**Headers:**
- `x-api-key`: Authentication key for the host agent
- `Content-Type`: application/json

### Request Body Structure:
```json
{
  "sessionId": "250610194725",
  "frontImageData": "[BASE64_IMAGE_DATA]",
  "backImageData": "[BASE64_IMAGE_DATA]",    // Optional
  "angledImageData": "[BASE64_IMAGE_DATA]"   // Optional
}
```

### Field Details:
1. **sessionId** (string, required)
   - Format: YYMMDDHHMMSS (12 digits)
   - Example: "250610194725" (June 10, 2025, 19:47:25)
   - Used for tracking and correlation

2. **frontImageData** (string, required)
   - Base64 encoded image data (no data URI prefix)
   - High quality image capture from mobile device
   - Already cleaned of "data:image/[type];base64," prefix

3. **backImageData** (string, optional)
   - Base64 encoded back view image
   - Same format as frontImageData

4. **angledImageData** (string, optional)
   - Base64 encoded angled view image
   - Same format as frontImageData

### Sample Request:
```
POST /mobile-upload HTTP/1.1
Host: [HOST_AGENT_DOMAIN]
Content-Type: application/json
x-api-key: pim_mobile_2505271605_7f8d9e2a1b4c6d8f9e0a1b2c3d4e5f6g

{
  "sessionId": "250610194725",
  "frontImageData": "iVBORw0KGgoAAAANSUhEUgAAA...",
  "backImageData": "iVBORw0KGgoAAAANSUhEUgAAA...",
  "angledImageData": "iVBORw0KGgoAAAANSUhEUgAAA..."
}
```

## 2. EXPECTED RESPONSE FROM HOST AGENT

### Success Response Structure:
```json
{
  "success": true,
  "message": "Verification completed successfully",
  "sessionId": "250610194725",
  "recordNumber": 12345,
  "recordId": 12345,
  "timestamp": "2025-06-10T19:47:25.000Z",
  "authentic": true,
  "authenticityRating": 95,
  "analysis": "This pin shows authentic characteristics...",
  "identification": "Disney Pin #12345 - Mickey Mouse Anniversary",
  "pricing": "$25-30 USD based on current market"
}
```

### Required Response Fields (in order):
1. **success** (boolean, required)
   - Must be `true` for successful analysis
   - `false` indicates processing failure

2. **message** (string, required)
   - Human-readable status message
   - Example: "Verification completed successfully"

3. **sessionId** (string, required)
   - Echo back the sessionId from request
   - Used for correlation tracking

4. **recordNumber** or **recordId** (integer, required)
   - Database record ID where pin data is stored
   - Used by mobile app for user agreement tracking
   - Should be an integer, not timestamp

5. **timestamp** (string, required)
   - ISO 8601 formatted timestamp
   - When analysis was completed

6. **authentic** (boolean, required)
   - `true` if pin is determined to be authentic
   - `false` if pin is counterfeit or suspicious

7. **authenticityRating** (integer, required)
   - Scale 0-100 (0 = definitely fake, 100 = definitely authentic)
   - Numerical confidence score

8. **analysis** (string, required)
   - Detailed analysis text or HTML
   - Technical findings and reasoning

9. **identification** (string, required)
   - Pin identification details
   - Series, name, year, etc.

10. **pricing** (string, required)
    - Current market value assessment
    - Price range or specific valuation

### Error Response Structure:
```json
{
  "success": false,
  "message": "Authentication service temporarily unavailable",
  "sessionId": "250610194725",
  "timestamp": "2025-06-10T19:47:25.000Z"
}
```

## 3. MOBILE APP WORKFLOW

### Step 1: Image Submission
- Mobile app sends images to our API
- We forward to host agent with above format
- Host agent processes and returns analysis

### Step 2: User Agreement Tracking
- Mobile app receives database ID from verification
- User can agree/disagree with analysis
- System updates database: `UPDATE pins SET user_agreement = 'agree' WHERE id = [ID]`

## 4. CRITICAL REQUIREMENTS

### For Host Agent:
1. **Return authentic data only** - Never provide synthetic or placeholder responses
2. **Use integer IDs** - recordNumber/recordId must be integers for database compatibility
3. **Maintain sessionId** - Always echo back the sessionId for correlation
4. **Provide complete responses** - All required fields must be present

### Data Integrity:
- System will never accept or process synthetic data
- If host agent is unavailable, clear error messages are returned
- No fallback to mock data - maintains authentic data policy

## 5. TESTING VERIFICATION

Host agent can verify integration by:
1. Confirming API endpoint accepts POST requests to `/mobile-upload`
2. Validating request format matches specification above
3. Ensuring response includes all required fields in correct data types
4. Testing with actual image data to verify processing pipeline

This specification ensures seamless integration between mobile app image capture and host agent authentication services.