import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

/**
 * Component for viewing the logs of actual API requests sent to the Master Server
 */
export default function ApiRequestLogger() {
  const [logs, setLogs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<string>('requests');
  const [expanded, setExpanded] = useState(false);

  // Load logs from sessionStorage on component mount
  useEffect(() => {
    loadLogs();
  }, []);

  // Function to load logs from sessionStorage
  const loadLogs = () => {
    try {
      // Get API request logs
      const requestLogsJson = sessionStorage.getItem('apiRequestLogs');
      const requestLogs = requestLogsJson ? JSON.parse(requestLogsJson) : [];
      
      // Get API response logs
      const responseLogsJson = sessionStorage.getItem('apiResponseLogs');
      const responseLogs = responseLogsJson ? JSON.parse(responseLogsJson) : [];
      
      // Get error logs
      const errorLogsJson = sessionStorage.getItem('apiErrorLogs');
      const errorLogs = errorLogsJson ? JSON.parse(errorLogsJson) : [];
      
      // Combine all logs with timestamps
      setLogs([
        ...requestLogs.map((log: any) => ({ ...log, type: 'request' })),
        ...responseLogs.map((log: any) => ({ ...log, type: 'response' })),
        ...errorLogs.map((log: any) => ({ ...log, type: 'error' }))
      ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
    } catch (error) {
      console.error("Error loading logs:", error);
    }
  };

  // Function to clear all logs
  const clearLogs = () => {
    sessionStorage.removeItem('apiRequestLogs');
    sessionStorage.removeItem('apiResponseLogs');
    sessionStorage.removeItem('apiErrorLogs');
    setLogs([]);
  };

  // Show only request logs if on requests tab
  const filteredLogs = activeTab === 'requests' 
    ? logs.filter(log => log.type === 'request')
    : activeTab === 'responses'
    ? logs.filter(log => log.type === 'response')
    : logs.filter(log => log.type === 'error');

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-semibold">Master Server API Logs</CardTitle>
          <div className="space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={loadLogs}
            >
              Refresh
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={clearLogs}
            >
              Clear Logs
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? "Minimize" : "Expand"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="requests" onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="requests">Requests</TabsTrigger>
            <TabsTrigger value="responses">Responses</TabsTrigger>
            <TabsTrigger value="errors">Errors</TabsTrigger>
          </TabsList>
          
          <ScrollArea className={`border rounded-md p-4 ${expanded ? 'h-[500px]' : 'h-[200px]'}`}>
            {filteredLogs.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                No {activeTab} logs available. Use the app to capture pin images and process them.
              </div>
            ) : (
              <div className="space-y-4">
                {filteredLogs.map((log, index) => (
                  <div key={index} className="border rounded p-3 text-sm">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>{new Date(log.timestamp).toLocaleString()}</span>
                      <span className="capitalize">{log.type}</span>
                    </div>
                    
                    {log.type === 'request' && (
                      <>
                        <div className="mb-2">
                          <span className="font-semibold">URL:</span> {log.url}
                        </div>
                        <div className="mb-2">
                          <span className="font-semibold">Method:</span> {log.method}
                        </div>
                        <div className="mb-2">
                          <span className="font-semibold">Headers:</span>
                          <pre className="bg-gray-100 p-2 rounded text-xs mt-1 overflow-auto">
                            {JSON.stringify(log.headers, null, 2)}
                          </pre>
                        </div>
                        <div>
                          <span className="font-semibold">Body:</span>
                          <pre className="bg-gray-100 p-2 rounded text-xs mt-1 overflow-auto" style={{ maxHeight: '400px' }}>
                            {JSON.stringify(log.body, null, 2)}
                          </pre>
                          <div className="mt-2 flex justify-end">
                            <button 
                              className="text-xs text-white bg-blue-600 px-2 py-1 rounded hover:bg-blue-700"
                              onClick={() => {
                                const el = document.createElement('textarea');
                                el.value = JSON.stringify(log.body, null, 2);
                                document.body.appendChild(el);
                                el.select();
                                document.execCommand('copy');
                                document.body.removeChild(el);
                                alert('The complete API request body has been copied to clipboard');
                              }}
                            >
                              Copy Complete Request
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                    
                    {log.type === 'response' && (
                      <>
                        <div className="mb-2">
                          <span className="font-semibold">Status:</span> {log.status}
                        </div>
                        <div>
                          <span className="font-semibold">Response Body:</span>
                          <pre className="bg-gray-100 p-2 rounded text-xs mt-1 overflow-auto max-h-60">
                            {JSON.stringify(log.data, null, 2)}
                          </pre>
                        </div>
                      </>
                    )}
                    
                    {log.type === 'error' && (
                      <>
                        <div className="mb-2">
                          <span className="font-semibold">Error:</span> {log.message}
                        </div>
                        {log.details && (
                          <div>
                            <span className="font-semibold">Details:</span>
                            <pre className="bg-gray-100 p-2 rounded text-xs mt-1 overflow-auto">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </Tabs>
      </CardContent>
    </Card>
  );
}