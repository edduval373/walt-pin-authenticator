# Mobile API Specification for Disney Pin Authentication

## API Endpoint Specification

### Base Information
- **Endpoint**: `POST /mobile-upload`
- **Content-Type**: `application/json`
- **Authentication**: `x-api-key` header (lowercase)
- **Response Type**: Streaming JSON for mobile, Single JSON for desktop

## Request Format

### Headers
```
Content-Type: application/json
x-api-key: your_api_key_here
User-Agent: [Device identification string]
```

### Request Body
```json
{
    "sessionId": "250617142540",
    "frontImageData": "base64_encoded_image_data_without_prefix",
    "backImageData": "base64_encoded_image_data_without_prefix",
    "angledImageData": "base64_encoded_image_data_without_prefix"
}
```

**Important**: Image data should be raw base64 without the `data:image/jpeg;base64,` prefix.

## Response Format

### Device Detection Logic
```javascript
const userAgent = req.headers['user-agent'] || '';
const isMobile = /Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
```

### Mobile Response (Streaming)

#### Response Headers
```
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: no-cache
Connection: keep-alive
Access-Control-Allow-Origin: *
Access-Control-Allow-Headers: Content-Type, Authorization
```

#### Packet Format
Each packet is a JSON object followed by a newline character (`\n`):

```
{"packetType":"CONNECTION_ESTABLISHED","sessionId":"250617142540",...}\n
{"packetType":"AUTHENTICATION_RESULT","sessionId":"250617142540",...}\n
{"packetType":"ANALYSIS_COMPLETE","sessionId":"250617142540",...}\n
```

### Packet Types and Schemas

#### 1. CONNECTION_ESTABLISHED
**Timing**: Send immediately upon request receipt
```json
{
    "packetType": "CONNECTION_ESTABLISHED",
    "sessionId": "250617142540",
    "message": "Connected to master server, starting analysis...",
    "timestamp": "2025-06-17T18:25:39.000Z"
}
```

#### 2. PROCESSING_STARTED
**Timing**: Send when image processing begins
```json
{
    "packetType": "PROCESSING_STARTED",
    "sessionId": "250617142540",
    "message": "Image analysis in progress...",
    "timestamp": "2025-06-17T18:25:41.000Z"
}
```

#### 3. AUTHENTICATION_RESULT
**Timing**: Send when authenticity analysis completes (can be first result)
```json
{
    "packetType": "AUTHENTICATION_RESULT",
    "sessionId": "250617142540",
    "authentic": true,
    "authenticityRating": 85,
    "confidence": 0.85,
    "timestamp": "2025-06-17T18:25:45.000Z"
}
```

#### 4. CHARACTER_IDENTIFICATION
**Timing**: Send when character recognition completes
```json
{
    "packetType": "CHARACTER_IDENTIFICATION",
    "sessionId": "250617142540",
    "characters": "Pascal, the chameleon character from the animated film \"Tangled\"",
    "identification": "<p>## Character Identification</p><p>This pin features Pascal...</p>",
    "timestamp": "2025-06-17T18:25:48.000Z"
}
```

#### 5. PRICING_ANALYSIS
**Timing**: Send when pricing analysis completes
```json
{
    "packetType": "PRICING_ANALYSIS",
    "sessionId": "250617142540",
    "pricing": "<p>## Pricing Estimate</p><p>Current market value: $15-25...</p>",
    "timestamp": "2025-06-17T18:25:52.000Z"
}
```

#### 6. DETAILED_ANALYSIS
**Timing**: Send when detailed analysis completes
```json
{
    "packetType": "DETAILED_ANALYSIS",
    "sessionId": "250617142540",
    "analysis": "<p>## Detailed Pin Analysis</p><p>Manufacturing details, release info...</p>",
    "timestamp": "2025-06-17T18:25:54.000Z"
}
```

#### 7. HTML_DISPLAY_DATA
**Timing**: Send when HTML formatting is ready
```json
{
    "packetType": "HTML_DISPLAY_DATA",
    "sessionId": "250617142540",
    "frontHtml": "<div class=\"analysis-result\">...</div>",
    "backHtml": "<div class=\"analysis-result\">...</div>",
    "angledHtml": "<div class=\"analysis-result\">...</div>",
    "timestamp": "2025-06-17T18:25:55.000Z"
}
```

#### 8. ANALYSIS_COMPLETE (Required Last)
**Timing**: Send when all processing is complete and database record is created
```json
{
    "packetType": "ANALYSIS_COMPLETE",
    "sessionId": "250617142540",
    "success": true,
    "id": 397,
    "message": "Pin analysis completed successfully",
    "processingTime": 15563,
    "timestamp": "2025-06-17T18:25:56.000Z",
    "complete": true
}
```

#### Error Packet
**Timing**: Send immediately if any error occurs
```json
{
    "packetType": "ERROR",
    "sessionId": "250617142540",
    "success": false,
    "message": "Analysis failed",
    "error": "Specific error description",
    "timestamp": "2025-06-17T18:25:45.000Z"
}
```

### Desktop Response (Single JSON)

For non-mobile devices, return all data in a single response:

```json
{
    "success": true,
    "sessionId": "250617142540",
    "id": 397,
    "timestamp": "2025-06-17T18:25:56.000Z",
    "authentic": true,
    "authenticityRating": 85,
    "characters": "Pascal, the chameleon character from the animated film \"Tangled\"",
    "identification": "<p>## Character Identification</p>...",
    "analysis": "<p>## Detailed Pin Analysis</p>...",
    "pricing": "<p>## Pricing Estimate</p>...",
    "message": "Pin analysis completed successfully",
    "frontHtml": "<div class=\"analysis-result\">...</div>",
    "backHtml": "<div class=\"analysis-result\">...</div>",
    "angledHtml": "<div class=\"analysis-result\">...</div>"
}
```

## Implementation Requirements

### Critical Requirements

1. **Packet Order Flexibility**: Packets 3-7 can arrive in ANY order
2. **Session Correlation**: Every packet MUST include the same sessionId
3. **Immediate Transmission**: Send each packet immediately when that analysis completes
4. **Mobile Detection**: Use User-Agent header for device type detection
5. **Completion Guarantee**: ANALYSIS_COMPLETE must always be the final packet
6. **Error Handling**: Send ERROR packet for any failures

### Performance Requirements

1. **Packet Size**: Keep individual packets under 8KB
2. **Total Timeout**: Complete all analysis within 90 seconds
3. **Progressive Delivery**: Don't wait for all analysis to complete before sending first results
4. **Parallel Processing**: Run analysis components simultaneously, not sequentially

### Database Integration

Create database record when analysis completes, include ID in ANALYSIS_COMPLETE packet:

```sql
INSERT INTO pin_analysis (
    session_id,
    front_image_data,
    authentic,
    authenticity_rating,
    characters,
    identification,
    analysis,
    pricing,
    timestamp
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
```

## Example Implementation Flow

```javascript
app.post('/mobile-upload', async (req, res) => {
    const { sessionId, frontImageData } = req.body;
    const isMobile = detectMobileDevice(req);
    
    if (isMobile) {
        // Set streaming headers
        res.writeHead(200, streamingHeaders);
        
        // Send immediate packets
        sendPacket(res, 'CONNECTION_ESTABLISHED', { sessionId, message: 'Connected...' });
        sendPacket(res, 'PROCESSING_STARTED', { sessionId, message: 'Processing...' });
        
        // Start parallel analysis
        const promises = [
            analyzeAuthenticity(frontImageData).then(result => 
                sendPacket(res, 'AUTHENTICATION_RESULT', { sessionId, ...result })),
            analyzeCharacters(frontImageData).then(result => 
                sendPacket(res, 'CHARACTER_IDENTIFICATION', { sessionId, ...result })),
            analyzePricing(frontImageData).then(result => 
                sendPacket(res, 'PRICING_ANALYSIS', { sessionId, ...result })),
            // ... other analysis components
        ];
        
        // Wait for completion
        await Promise.allSettled(promises);
        
        // Create database record
        const dbRecord = await createRecord(sessionId, results);
        
        // Send completion
        sendPacket(res, 'ANALYSIS_COMPLETE', { 
            sessionId, 
            success: true, 
            id: dbRecord.id, 
            complete: true 
        });
        
        res.end();
    } else {
        // Desktop - single response
        const results = await completeAnalysis(frontImageData);
        res.json(results);
    }
});

function sendPacket(res, packetType, data) {
    const packet = {
        packetType,
        timestamp: new Date().toISOString(),
        ...data
    };
    res.write(JSON.stringify(packet) + '\n');
}
```

## Testing Checklist

- [ ] Mobile User-Agent detection working
- [ ] Streaming headers set correctly
- [ ] Packets sent immediately when analysis completes
- [ ] Packets can be processed in any order by client
- [ ] ANALYSIS_COMPLETE always sent last
- [ ] Database record created with correct ID
- [ ] Desktop single response still works
- [ ] Error handling sends ERROR packet
- [ ] All packets include sessionId
- [ ] Processing completes within 90 seconds

This specification ensures mobile devices receive results progressively without cellular network timeouts while maintaining backward compatibility with desktop clients.