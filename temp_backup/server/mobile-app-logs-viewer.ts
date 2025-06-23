import { Request, Response } from 'express';
import { storage } from './storage';
import { log } from './vite';

/**
 * Mobile App Logs Viewer - Debug endpoint for checking host agent interactions
 */
export async function getMobileAppLogs(req: Request, res: Response) {
  try {
    const { sessionId, limit = 50 } = req.query;
    
    let logs;
    if (sessionId) {
      logs = await storage.getMobileAppLogsBySession(sessionId as string);
      log(`Retrieved ${logs.length} logs for session ${sessionId}`);
    } else {
      logs = await storage.getAllMobileAppLogs();
      log(`Retrieved ${logs.length} recent mobile app logs`);
    }
    
    // Format logs for easy debugging
    const formattedLogs = logs.slice(0, Number(limit)).map((logEntry: any) => ({
      id: logEntry.id,
      sessionId: logEntry.sessionId,
      requestType: logEntry.requestType,
      timestamp: logEntry.createdAt,
      hostApiCalled: logEntry.hostApiCalled,
      hostApiStatus: logEntry.hostApiStatus,
      responseStatus: logEntry.responseStatus,
      
      // Host API response details (if available)
      hostResponse: logEntry.hostApiResponse ? {
        success: (logEntry.hostApiResponse as any).success,
        recordNumber: (logEntry.hostApiResponse as any).recordNumber || (logEntry.hostApiResponse as any).recordId,
        authentic: (logEntry.hostApiResponse as any).authentic,
        authenticityRating: (logEntry.hostApiResponse as any).authenticityRating,
        hasAnalysis: !!(logEntry.hostApiResponse as any).analysis,
        hasIdentification: !!(logEntry.hostApiResponse as any).identification,
        hasPricing: !!(logEntry.hostApiResponse as any).pricing
      } : null,
      
      // Request details
      requestDetails: {
        frontImageLength: (logEntry.requestBody as any)?.frontImageLength,
        backImageLength: (logEntry.requestBody as any)?.backImageLength,
        angledImageLength: (logEntry.requestBody as any)?.angledImageLength,
        requestId: (logEntry.requestBody as any)?.requestId
      },
      
      // Final response to mobile app
      finalResponse: logEntry.responseBody ? {
        success: (logEntry.responseBody as any).success,
        id: (logEntry.responseBody as any).id,
        pinId: (logEntry.responseBody as any).pinId,
        hasAnalysis: !!(logEntry.responseBody as any).analysis
      } : null,
      
      errorMessage: logEntry.errorMessage
    }));
    
    return res.json({
      success: true,
      totalLogs: formattedLogs.length,
      sessionFilter: sessionId || null,
      logs: formattedLogs
    });
    
  } catch (error: any) {
    log(`Error retrieving mobile app logs: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve logs",
      error: error.message
    });
  }
}

/**
 * Generate HTML debug page for mobile app logs
 */
export function generateMobileAppLogsPage(): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mobile App API Logs - Debug Console</title>
    <style>
        body { font-family: monospace; margin: 20px; background: #1a1a1a; color: #00ff00; }
        .header { border-bottom: 2px solid #00ff00; padding-bottom: 10px; margin-bottom: 20px; }
        .log-entry { border: 1px solid #333; margin: 10px 0; padding: 15px; background: #222; }
        .success { border-left: 4px solid #00ff00; }
        .error { border-left: 4px solid #ff0000; }
        .warning { border-left: 4px solid #ffaa00; }
        .field { margin: 5px 0; }
        .label { color: #00aaff; font-weight: bold; }
        .value { color: #ffffff; }
        .json { background: #111; padding: 10px; border-radius: 4px; overflow-x: auto; }
        .filter { margin: 20px 0; }
        .filter input, .filter button { padding: 8px; margin: 5px; background: #333; color: #fff; border: 1px solid #555; }
        .filter button { cursor: pointer; }
        .filter button:hover { background: #555; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Mobile App API Logs - Debug Console</h1>
        <p>Track host agent interactions and ID assignments</p>
    </div>
    
    <div class="filter">
        <input type="text" id="sessionFilter" placeholder="Filter by Session ID">
        <button onclick="loadLogs()">Load Logs</button>
        <button onclick="loadLogs('')">Show All</button>
    </div>
    
    <div id="logs-container">
        Loading logs...
    </div>

    <script>
        async function loadLogs(sessionId = null) {
            const container = document.getElementById('logs-container');
            const sessionInput = document.getElementById('sessionFilter');
            
            if (sessionId === null) {
                sessionId = sessionInput.value.trim();
            } else {
                sessionInput.value = sessionId;
            }
            
            try {
                const url = sessionId ? 
                    \`/api/mobile/logs?sessionId=\${encodeURIComponent(sessionId)}\` : 
                    '/api/mobile/logs';
                    
                const response = await fetch(url);
                const data = await response.json();
                
                if (data.success) {
                    displayLogs(data.logs, data.totalLogs, sessionId);
                } else {
                    container.innerHTML = '<div class="error">Error loading logs: ' + data.message + '</div>';
                }
            } catch (error) {
                container.innerHTML = '<div class="error">Failed to fetch logs: ' + error.message + '</div>';
            }
        }
        
        function displayLogs(logs, total, sessionFilter) {
            const container = document.getElementById('logs-container');
            
            if (logs.length === 0) {
                container.innerHTML = '<div class="warning">No logs found' + 
                    (sessionFilter ? ' for session: ' + sessionFilter : '') + '</div>';
                return;
            }
            
            let html = '<h3>Found ' + total + ' logs' + 
                (sessionFilter ? ' for session: ' + sessionFilter : '') + '</h3>';
                
            logs.forEach(log => {
                const statusClass = log.errorMessage ? 'error' : 
                    log.hostApiCalled && log.hostResponse ? 'success' : 'warning';
                    
                html += \`
                    <div class="log-entry \${statusClass}">
                        <div class="field"><span class="label">Session:</span> <span class="value">\${log.sessionId}</span></div>
                        <div class="field"><span class="label">Type:</span> <span class="value">\${log.requestType}</span></div>
                        <div class="field"><span class="label">Timestamp:</span> <span class="value">\${new Date(log.timestamp).toLocaleString()}</span></div>
                        <div class="field"><span class="label">Host API Called:</span> <span class="value">\${log.hostApiCalled ? 'Yes' : 'No'}</span></div>
                        
                        \${log.hostResponse ? \`
                            <div class="field"><span class="label">Host Response:</span></div>
                            <div class="json">
                                Success: \${log.hostResponse.success}<br>
                                Record Number: \${log.hostResponse.recordNumber || 'Not provided'}<br>
                                Authentic: \${log.hostResponse.authentic}<br>
                                Rating: \${log.hostResponse.authenticityRating}<br>
                                Has Analysis: \${log.hostResponse.hasAnalysis}<br>
                                Has Identification: \${log.hostResponse.hasIdentification}<br>
                                Has Pricing: \${log.hostResponse.hasPricing}
                            </div>
                        \` : ''}
                        
                        \${log.finalResponse ? \`
                            <div class="field"><span class="label">Final Response to Mobile:</span></div>
                            <div class="json">
                                Success: \${log.finalResponse.success}<br>
                                ID: \${log.finalResponse.id || 'Not assigned'}<br>
                                Pin ID: \${log.finalResponse.pinId || 'Not assigned'}<br>
                                Has Analysis: \${log.finalResponse.hasAnalysis}
                            </div>
                        \` : ''}
                        
                        \${log.errorMessage ? \`
                            <div class="field"><span class="label">Error:</span> <span class="value" style="color: #ff6666;">\${log.errorMessage}</span></div>
                        \` : ''}
                    </div>
                \`;
            });
            
            container.innerHTML = html;
        }
        
        // Load logs on page load
        loadLogs();
        
        // Auto-refresh every 30 seconds
        setInterval(() => loadLogs(), 30000);
    </script>
</body>
</html>`;
}