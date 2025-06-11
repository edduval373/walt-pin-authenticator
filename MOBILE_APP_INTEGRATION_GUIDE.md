# Mobile App Integration Guide - Pin Master Library

## Overview
This guide provides the complete API integration requirements for mobile app developers to connect with the Pin Master Library system for Disney pin authentication and user feedback collection.

## Base Configuration

### API Endpoints
- **Production URL**: `https://master.pinauth.com/mobile-upload` (Live production endpoint)
- **Development URL**: `http://localhost:5000/mobile-upload` (Local testing)

### Authentication
```javascript
headers: {
  'Content-Type': 'application/json',
  'x-api-key': 'pim_mobile_2505271605_7f8d9e2a1b4c6d8f9e0a1b2c3d4e5f6g'
}
```

## API Endpoints

### 1. Mobile Upload - Submit Images for Analysis
**POST** `/mobile-upload`

Submit pin images and receive immediate analysis results with a database ID for tracking.

**Request Body:**
```json
{
  "sessionId": "250611135600",
  "frontImageData": "data:image/jpeg;base64,/9j/4AAQ...",
  "backImageData": "data:image/jpeg;base64,/9j/4AAQ...",
  "angledImageData": "data:image/jpeg;base64,/9j/4AAQ..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Pin analysis completed successfully",
  "sessionId": "250611135600",
  "id": 322,
  "timestamp": "2025-06-11T13:55:30.697Z",
  "authentic": true,
  "authenticityRating": 85,
  "analysis": "<p>ANALYSIS analysis unavailable</p>",
  "identification": "<p>IDENTIFICATION analysis unavailable</p>",
  "pricing": "<p>PRICING analysis unavailable</p>"
}
```

### 2. Confirm Pin - Submit User Agreement/Disagreement
**POST** `/api/mobile/confirm-pin`

Submit user's agreement or disagreement with the AI analysis using the record number.

**Request Body:**
```json
{
  "recordNumber": 1749559612345,
  "pinId": "250610124536",
  "userAgreement": "agree", // "agree" or "disagree"
  "feedbackComment": "Optional user comment"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Pin confirmation saved successfully",
  "recordNumber": 1749559612345,
  "pinId": "250610124536",
  "userAgreement": "agree",
  "feedbackComment": "Optional user comment",
  "timestamp": "2025-06-10T12:46:52.123Z",
  "sessionId": "session_1749559612000"
}
```

### 3. Get Provisional Pins - Retrieve Pending Confirmations
**GET** `/api/mobile/provisional-pins`

Retrieve pins that are awaiting user confirmation.

**Response:**
```json
{
  "success": true,
  "provisionalPins": [
    {
      "pinId": "250610124536",
      "recordNumber": 1749559612345,
      "name": "Mobile Analysis 250610124536",
      "createdAt": "2025-06-10T12:46:42.123Z"
    }
  ],
  "total": 1,
  "sessionId": "session_1749559612000"
}
```

## Implementation Flow

### Step 1: Image Capture and Verification
```javascript
// Capture pin images
const frontImage = captureImage(); // Convert to base64
const backImage = captureImage(); // Optional

// Submit for verification
const verificationResult = await fetch('/api/mobile/verify-pin', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': API_KEY,
    'x-session-id': sessionId
  },
  body: JSON.stringify({
    frontImageBase64: frontImage,
    backImageBase64: backImage
  })
});

const result = await verificationResult.json();
// Store result.recordNumber for later confirmation
```

### Step 2: Display Results and Collect User Feedback
```javascript
// Display AI analysis to user
displayAnalysis({
  authenticity: result.authenticityRating,
  analysis: result.analysis,
  identification: result.identification,
  pricing: result.pricing
});

// Collect user agreement/disagreement
const userFeedback = await getUserFeedback(); // UI interaction
```

### Step 3: Submit User Confirmation
```javascript
// Submit user's agreement/disagreement
const confirmationResult = await fetch('/api/mobile/confirm-pin', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': API_KEY,
    'x-session-id': sessionId
  },
  body: JSON.stringify({
    recordNumber: result.recordNumber,
    pinId: result.pinId,
    userAgreement: userFeedback.agreement, // "agree" or "disagree"
    feedbackComment: userFeedback.comment
  })
});
```

## Data Storage Requirements

### Local Storage
Store the following data locally for offline capability:
- Session ID
- Record numbers of pending confirmations
- Cached analysis results
- User preferences

### Network State Management
```javascript
// Handle network connectivity
if (navigator.onLine) {
  // Submit pending confirmations
  submitPendingFeedback();
} else {
  // Queue for later submission
  queueFeedbackForLater();
}
```

## Error Handling

### Common Error Responses
```json
{
  "success": false,
  "message": "Error description",
  "errorCode": "specific_error_code"
}
```

### Error Codes
- `missing_image`: Front image not provided
- `invalid_format`: Image format not supported
- `processing_error`: Analysis failed
- `missing_fields`: Required fields not provided
- `invalid_agreement`: userAgreement must be 'agree' or 'disagree'
- `record_not_found`: Record number not found

## Security Implementation

### API Key Management
```javascript
// Store API key securely
import { Keychain } from 'react-native-keychain';

// Store
await Keychain.setInternetCredentials(
  'pin-master-api',
  'api-key',
  API_KEY
);

// Retrieve
const credentials = await Keychain.getInternetCredentials('pin-master-api');
```

### Session Management
```javascript
// Generate unique session ID per app session
const sessionId = `mobile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
```

## Image Processing Guidelines

### Format Requirements
- **Format**: JPEG or PNG
- **Encoding**: Base64 with data URI prefix
- **Size**: Recommended 800x600 to 1920x1080
- **Quality**: High enough for detail analysis

### Implementation
```javascript
// Convert captured image to base64
const imageToBase64 = (imageUri) => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      const base64 = canvas.toDataURL('image/jpeg', 0.9);
      resolve(base64);
    };
    
    img.src = imageUri;
  });
};
```

## Testing

### Test the Integration
```bash
# Test verification endpoint
curl -X POST "https://pinauth.com/api/mobile/verify-pin" \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY" \
  -H "x-session-id: test-session-123" \
  -d '{"frontImageBase64": "data:image/jpeg;base64,..."}'

# Test confirmation endpoint
curl -X POST "https://pinauth.com/api/mobile/confirm-pin" \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY" \
  -H "x-session-id: test-session-123" \
  -d '{
    "recordNumber": 1749559612345,
    "pinId": "250610124536",
    "userAgreement": "agree",
    "feedbackComment": "Test feedback"
  }'
```

## Migration from Legacy API

### Old Endpoint (Deprecated)
- `POST /api/mobile/direct-verify`

### New Workflow
1. Replace `direct-verify` calls with `verify-pin`
2. Add user confirmation step with `confirm-pin`
3. Implement record number tracking
4. Update error handling for new response format

## Support

For integration support or API issues, provide:
- Session ID
- Record number
- Request/response logs
- Error details

The system tracks all interactions for debugging and improvement.