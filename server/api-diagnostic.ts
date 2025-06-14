import fetch from 'node-fetch';
import { log } from './vite';

/**
 * Test different possible API endpoints and configurations to diagnose connectivity issues
 */
export async function diagnosePimApiConnection(): Promise<{
  success: boolean;
  workingEndpoint?: string;
  workingConfig?: {
    url: string;
    method: string;
    headers: Record<string, string>;
  };
  error?: string;
  diagnosticLog: string[];
}> {
  const logs: string[] = [];
  const addLog = (message: string) => {
    log(message, 'api-diagnostic');
    logs.push(message);
  };

  addLog('Starting PIM API connection diagnostics');

  // Test domains to check
  const domains = [
    'https://master.pinauth.com'
  ];
  
  // Various API paths to test
  const paths = [
    '/mobile-upload',
    '/health'
  ];
  
  // API keys to test
  const apiKeys = [
    process.env.PIM_STANDARD_API_KEY || 'pim_mobile_2505271605_7f8d9e2a1b4c6d8f9e0a1b2c3d4e5f6g'
  ];
  
  // Small test image data
  const smallTestImage = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
  
  // Test each domain with a simple GET first to see if it's reachable
  addLog('Testing basic connectivity to domains...');
  
  for (const domain of domains) {
    try {
      const response = await fetch(domain, { method: 'GET' });
      addLog(`Domain ${domain} - Status: ${response.status}`);
    } catch (error: any) {
      addLog(`Domain ${domain} - Error: ${error.message}`);
    }
  }
  
  // Test each combination of domain + path with GET
  addLog('Testing API endpoints with GET requests...');
  
  for (const domain of domains) {
    for (const path of paths) {
      const url = `${domain}${path}`;
      try {
        const response = await fetch(url, { method: 'GET' });
        addLog(`GET ${url} - Status: ${response.status}`);
      } catch (error: any) {
        addLog(`GET ${url} - Error: ${error.message}`);
      }
    }
  }
  
  // Test the most likely endpoints with POST + API keys
  addLog('Testing specific API endpoints with POST requests + API keys...');
  
  let workingEndpoint: string | undefined = undefined;
  let workingConfig: { url: string; method: string; headers: Record<string, string> } | undefined = undefined;
  
  for (const domain of domains) {
    for (const path of paths) {
      if (!path.includes('verify')) continue;  // Skip non-verification endpoints for POST
      
      const url = `${domain}${path}`;
      
      for (const apiKey of apiKeys) {
        if (!apiKey) continue;  // Skip empty API keys
        
        try {
          addLog(`Testing POST ${url} with API key: ${apiKey.substring(0, 4)}...`);
          
          const headers = {
            'Content-Type': 'application/json',
            'X-API-Key': apiKey
          };
          
          const body = JSON.stringify({
            frontImageBase64: smallTestImage
          });
          
          const response = await fetch(url, {
            method: 'POST',
            headers,
            body
          });
          
          const statusText = await response.text();
          addLog(`POST ${url} - Status: ${response.status}, Response: ${statusText.substring(0, 50)}...`);
          
          // If we get a 2xx status, or a 4xx that indicates the API is working but rejected our request
          if (response.status >= 200 && response.status < 300) {
            addLog(`Found working endpoint: ${url} with API key: ${apiKey.substring(0, 4)}...`);
            workingEndpoint = url;
            workingConfig = {
              url,
              method: 'POST',
              headers
            };
            break;
          }
          
        } catch (error: any) {
          addLog(`POST ${url} - Error: ${error.message}`);
        }
      }
      
      if (workingEndpoint) break;
    }
    
    if (workingEndpoint) break;
  }
  
  if (workingEndpoint) {
    addLog(`Diagnostic complete - Found working endpoint: ${workingEndpoint}`);
    return {
      success: true,
      workingEndpoint,
      workingConfig,
      diagnosticLog: logs
    };
  } else {
    addLog('Diagnostic complete - No working endpoint found');
    return {
      success: false,
      error: 'No working endpoint found after trying all combinations',
      diagnosticLog: logs
    };
  }
}