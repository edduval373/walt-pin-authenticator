import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { transmissionLogger, TransmissionLog } from "@/lib/transmission-logger";


// Error boundary to catch React errors
class LogViewerErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error?: Error}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('LogViewer Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded">
          <h3 className="text-red-800 font-bold">Display Error</h3>
          <p className="text-red-700">Unable to display logs. Clearing storage...</p>
          <Button onClick={() => {
            localStorage.removeItem('transmission_logs');
            window.location.reload();
          }} className="mt-2">
            Clear Logs & Reload
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

interface TransmissionLogViewerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TransmissionLogViewer({ isOpen, onClose }: TransmissionLogViewerProps) {
  const [logs, setLogs] = useState<TransmissionLog[]>([]);
  const [stats, setStats] = useState<any>({});

  useEffect(() => {
    if (isOpen) {
      setLogs(transmissionLogger.getAllLogs());
      setStats(transmissionLogger.getStats());
    }
  }, [isOpen]);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString()
    };
  };

  const handleClearLogs = () => {
    if (confirm('Are you sure you want to clear all transmission logs?')) {
      transmissionLogger.clearLogs();
      setLogs([]);
      setStats(transmissionLogger.getStats());
    }
  };

  if (!isOpen) return null;

  return (
    <LogViewerErrorBoundary>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-indigo-600 text-white p-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Transmission Log</h2>
            <Button 
              onClick={onClose}
              variant="ghost" 
              className="text-white hover:bg-indigo-700"
            >
              ✕
            </Button>
          </div>
          
          {/* Stats */}
          <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
            <div className="text-center">
              <div className="font-bold">{stats.total}</div>
              <div className="opacity-90">Total</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-green-200">{stats.successful}</div>
              <div className="opacity-90">Success</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-red-200">{stats.failed}</div>
              <div className="opacity-90">Failed</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-blue-200">{stats.imageUploads}</div>
              <div className="opacity-90">Images</div>
            </div>
            <div className="text-center">
              <div className="font-bold">{stats.successRate}%</div>
              <div className="opacity-90">Success Rate</div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[calc(90vh-200px)] bg-gray-50">
          {logs.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <div className="text-6xl mb-4 opacity-50">📋</div>
              <p className="text-gray-700 font-medium">No transmission logs yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => {
                const { date, time } = formatTimestamp(log.timestamp);
                return (
                  <div 
                    key={log.id}
                    className="border border-gray-300 rounded-lg p-4 bg-white shadow-sm"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`px-2 py-1 rounded text-xs font-semibold ${
                            log.status === 'success' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {log.status === 'success' ? 'SUCCESS' : 'FAILED'}
                          </div>
                          
                          <div>
                            <div className="font-semibold">
                              {log.type === 'health_check' ? 'Health Check' : log.imageTitle}
                            </div>
                            <div className="text-sm text-gray-600">
                              {date} at {time}
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-sm">
                          <div className="mb-2">
                            <span className="font-bold text-black">Endpoint:</span> 
                            <span className="text-blue-600 font-mono text-sm ml-2">{log.endpoint || 'N/A'}</span>
                          </div>
                          
                          {log.sessionId && (
                            <div className="mb-2">
                              <span className="font-bold text-black">Session ID:</span> 
                              <span className="text-purple-600 font-mono text-sm ml-2">{log.sessionId}</span>
                            </div>
                          )}
                          
                          {log.apiKey && (
                            <div className="mb-2">
                              <span className="font-bold text-black">API Key:</span> 
                              <span className="text-orange-600 font-mono text-sm ml-2">{log.apiKey.substring(0, 15)}...</span>
                            </div>
                          )}
                          
                          {log.headers && (
                            <div className="mb-2">
                              <span className="font-bold text-black">Headers:</span> 
                              <div className="text-gray-700 font-mono text-xs ml-2 mt-1">
                                {Object.entries(log.headers).map(([key, value]) => (
                                  <div key={key} className="mb-1">
                                    <span className="text-blue-600">{key}:</span> <span className="text-green-600">{value}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          <div className="mb-2">
                            <span className="font-bold text-black">Details:</span> 
                            <span className="text-black ml-2">{log.details}</span>
                          </div>
                          
                          {log.rawRequest && (
                            <div className="mb-2">
                              <span className="font-bold text-black">Raw Request:</span>
                              <pre className="text-xs font-mono bg-gray-100 p-2 mt-1 border rounded overflow-x-auto whitespace-pre-wrap text-blue-700">{log.rawRequest}</pre>
                            </div>
                          )}
                          
                          {log.rawResponse && (
                            <div className="mb-2">
                              <span className="font-bold text-black">Raw Response:</span>
                              <pre className="text-xs font-mono bg-gray-100 p-2 mt-1 border rounded overflow-x-auto whitespace-pre-wrap text-blue-700">{log.rawResponse}</pre>
                            </div>
                          )}
                          
                          {log.errorMessage && (
                            <div className="mb-2 text-red-900 bg-red-100 p-2 rounded border border-red-300">
                              <span className="font-bold">Error:</span> {log.errorMessage}
                            </div>
                          )}
                          
                          {log.responseData && (
                            <div className="mt-3">
                              <span className="font-bold text-black">Response:</span>
                              <pre className="text-xs bg-black text-lime-300 p-3 rounded mt-1 overflow-x-auto border">
                                {typeof log.responseData === 'string' 
                                  ? log.responseData 
                                  : JSON.stringify(log.responseData, null, 2)
                                }
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-right text-xs text-gray-500">
                        #{log.imageNumber > 0 ? log.imageNumber : 'HC'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t bg-gray-50 p-4 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {logs.length} total transmissions
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={handleClearLogs}
              variant="outline"
              size="sm"
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              Clear Logs
            </Button>
            <Button onClick={onClose} size="sm">
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  </LogViewerErrorBoundary>
  );
}